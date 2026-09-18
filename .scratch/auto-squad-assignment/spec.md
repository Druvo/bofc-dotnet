# Automating squad assignment: goalkeepers, balance, and captains

Status: `research`

Research into folding goalkeeper assignment and captaincy into team generation, and into
whether the balance and rotation algorithms are actually doing their jobs.

Every number below comes from live production data (match days 1–16, 30 active players) or
from simulations run against the real match day 16 turnout. Scripts are in the session
scratchpad; the method is described inline so anything can be re-derived.

---

## Decisions taken

Settled by the club; the rest of this document assumes them.

1. **A default goalkeeper fills one slot, not both.** With `MinGoalkeepersPerTeam = 2`, a
   team carrying a `DefaultGoalkeeper` player has that player take one slot and the fairness
   rotation fills the other from the rest of that team's roster. A default keeper therefore
   reduces, but never removes, the team's rotation burden. (Finding 6)
2. **Captains and goalkeepers are drawn only from confirmed participants of that match day.**
   Team membership alone is not sufficient. This is not automatic today — see Finding 7.
3. **Captaincy rotates.** One captain per team, drawn at random from every active player ranked
   3 or better (thirteen players today). Not the best-ranked player on each roster — that rule
   concentrates captaincy on the same handful of people. (Finding 4, ticket 06)

---

## How it works today

Three separate admin actions, run in sequence by hand:

| Step | Trigger | Code |
|---|---|---|
| 1. Draft teams | `Generate Teams` button, or the weekly scheduler | `WeeklyMatchDayTeamGenerator.SnakeDraft` |
| 2. Assign keepers | `Auto-Assign Goalkeepers` button | `TeamService.AutoAssignGoalkeepersAsync` |
| 3. Name captains | Manual, per player, in Team Building | `TeamService.SaveOrUpdateTeamPlayerAsync` |

Step 1 sorts players into rank tiers (1 = strongest, ties shuffled), then deals them
serpentine — 1→2→3→4→4→3→2→1. Step 2 fills each team up to
`SystemSettings.MinGoalkeepersPerTeam` (currently **2**), preferring `DefaultGoalkeeper`
players and otherwise picking on a fairness balance. Step 3 has no automation at all.

**The three steps don't talk to each other.** That is the root of most of what follows.

### Club shape

| | |
|---|---|
| Active players | 30 |
| Ranks in use | 1–6 of 10 — distribution 2 / 4 / 6 / 7 / 6 / 5, nobody unranked |
| Typical turnout | 21–26 confirmed |
| Teams per match day | 3–4 (`ceil(turnout / 6)`) |
| Keeper slots per week | 6–8 (teams × 2) |
| `DefaultGoalkeeper` players | **1** — Md Fahim Faez Abir |
| Excluded from rotation | 3 |

---

## Finding 1 — the draft is goalkeeper-blind, and it shows

`SelectGoalkeepersForTeam` picks keepers **from that team's own roster**. But the draft
that built the roster knows nothing about who is resting, excluded, or a default keeper.
So a team can be dealt a roster with fewer than two eligible keepers on it, and auto-assign
can only shrug: *"Not enough eligible players (all resting or excluded)."*

Simulated 5,000 times on the real match day 16 turnout (22 players, 4 teams, 8 slots, 9
globally eligible keepers after the rest/exclusion rules):

| | Current draft | With a repair pass |
|---|---|---|
| Weeks where ≥1 team can't fill its keeper slots | **80.0 %** | **0.0 %** |
| Average slots left unfilled | 1.11 | 0.00 |
| Balance spread (see Finding 2) | 0.80 | 0.80 |

Shortfall distribution today: 0 slots short in 998 runs, 1 short in 2,586, 2 short in
1,280, 3 short in 136.

Read that first row carefully: **four weeks in five, at least one team ends up without its
full complement of keepers** — not because the club lacks eligible players, but because the
draft scattered them badly. And the repair costs *nothing* in balance terms.

The repair is not complicated. After the snake deals, while some team is short of eligible
keepers and another has a surplus, swap a surplus eligible player for a nearest-rank
ineligible one. Choosing the closest rank keeps the strength damage at or near zero — which
is why the spread column is unchanged.

**This is the single highest-value change in this document.**

### The margin is thin, and worth watching

Globally there were 9 eligible keepers for 8 slots. Match day 12 ran 8 eligible for 8 slots
— exactly zero slack. Replaying every match day as if it were being generated fresh:

| Match day | Turnout | Slots | Resting | Excluded | Eligible |
|---|---|---|---|---|---|
| 1 | 23 | 8 | 0 | 1 | 18 |
| 3 | 22 | 8 | 5 | 3 | 12 |
| 4 | 24 | 8 | 11 | 3 | 9 |
| 12 | 26 | 8 | 13 | 2 | **8** |
| 15 | 24 | 8 | 6 | 3 | 14 |
| 16 | 22 | 6 | 10 | 1 | 11 |

The "rested for two match days after keeping goal" rule is doing real work here — it takes
10–13 players out of a 22-player pool most weeks. My recommendation is **not** to loosen it.
It is the rule that stops the same people going in goal repeatedly, and the repair pass
solves the distribution problem without touching it. But the system should *say* when the
pool is genuinely too thin rather than silently leaving a team short, and it is worth a
warning when eligible count drops below slots.

---

## Finding 2 — balance is good, and four times better is cheap

Measuring spread as the gap between the strongest and weakest team's **average** player
strength (average, not total: with 22 players in 4 teams the rosters are necessarily 5/5/6/6,
and comparing totals just measures who got the extra body). Strength = `11 - rank`.

| Algorithm | Mean spread | Worst |
|---|---|---|
| Current snake | 0.800 | 0.800 |
| Snake + rotated team order | 0.800 | 0.800 |
| Greedy "weakest team picks next" | 1.816 | 1.867 |
| **Snake + swap refinement** | **0.200** | **0.200** |

Two things worth noting.

The obvious "improvement" — let the weakest team pick next — is **more than twice as bad as
what ships today**. Greedy balancing on running totals over-corrects early and can't recover.
Had this been implemented on intuition it would have made things worse. The snake is a good
algorithm and should stay.

Adding a bounded swap-refinement pass after the deal — repeatedly try swapping a player
between the strongest and weakest teams, keep the swap if the spread narrows — takes the
spread from 0.80 to 0.20 deterministically. It preserves roster sizes because it only ever
swaps. Both the current and the refined figures have zero variance across 3,000 runs, so
this is a real structural gain, not simulation noise.

**Built** (ticket 09). Measured in place, after the goalkeeper repairs and constrained not to
undo them, it holds at 0.200 mean and worst across 5,000 drafts with keeper cover unaffected.

Whether 0.80 → 0.20 is worth the code was a judgement call. It is roughly "one rank tier of
difference between the best and worst team" becoming "a quarter of one". The same swap
machinery is needed for the goalkeeper repair in Finding 1 anyway, so the marginal cost is
low once that exists.

---

## Finding 3 — the same teams always get the extra player

With 22 players across 4 teams, two teams get 6 players and two get 5. The serpentine
direction is fixed, so the overflow lands in the same place every single time.

Over 3,000 simulated drafts, **Team C received the extra player 3,000 times**. Never A,
never B. Rotating or shuffling the team order before dealing spreads it (A 1,522 / B 1,004 /
C 474) at no cost to balance.

Small thing, but it is the kind of thing players notice across a season — and now that teams
are named A–D rather than 1–4, "C is always a man up" is easier to spot, not harder.

---

## Finding 4 — captain-by-rank would freeze captaincy onto four players

This is the one place where the request as stated has a consequence worth surfacing before
it ships.

"Assign the highest ranked player the captain" is easy to implement. But the club has
**one** rank-1 player and **three** rank-2 players, and the snake draft's entire purpose is
to put exactly one top-tier player on each team. Those two facts combine badly.

Simulated over 26 weeks:

| | |
|---|---|
| Distinct captains | **4** of 22 |
| Weeks captained, each | 26 of 26 |
| Players who never captain | 18 |

Shofiuddin, Abu Hossain, Md. Akramul Hoque and Abid Hasan Rashel would captain **every match
day, permanently**. Not most weeks — every week. Nobody else ever would.

I also tried a least-recently-captained tiebreak among tied top-ranked players. It changes
nothing, because the snake guarantees there are no ties to break — each team gets exactly
one of the top four.

Three options, in the order I'd suggest them:

1. **Highest rank, but not if they captained recently.** Pick the best-ranked player on the
   team who hasn't captained in the last N match days; fall back to the best-ranked if
   everyone's excluded. Keeps captaincy senior, spreads it across maybe 8–10 players.
   Mirrors the goalkeeper rotation the club already understands, which is an argument in
   its favour — one fairness idea, two uses.
2. **Highest rank, full stop** — exactly as asked. Simple, predictable, and if the club
   *wants* its four best players leading every week, that is a legitimate choice. It just
   shouldn't be an accident.
3. Rotate captaincy independently of rank, as a pure fairness queue.

My recommendation is (1), but this is a club-culture question and the club should answer it,
not the algorithm. The implementation difference is about ten lines either way.

A related detail: the captain should probably not also be a goalkeeper. Nothing currently
prevents it, and with 2 keepers per team on a 5-man roster the odds aren't small.

---

## Finding 5 — `TrackGoalKeeperRoundAsync` has no idempotency guard

```csharp
var lastRoundInPreviousMatchDays = await db.PlayerGoalkeepingHistories
    .Where(h => h.PlayerId == playerId)
    .Select(h => (int?)h.RoundNumber)
    .MaxAsync() ?? 0;
// ... unconditionally:
db.PlayerGoalkeepingHistories.Add(new PlayerGoalkeepingHistory { ... RoundNumber = last + 1 ... });
```

Nothing checks whether a row already exists for this `(PlayerId, MatchDayId)`. Assign a
keeper, remove them, re-assign — or simply click Auto-Assign twice — and a second row
appears with an incremented round number. That is exactly how the round 4/5/6 rows deleted
earlier in this session came to exist: Md Fahim Faez Abir had three rows for match day 15
alone.

Three players still carry duplicate rows at rounds 2 and 3 on match day 15 (Sheikh Mustafizur
Rahman, Md. Akramul Hoque, Saniyat Al Ahmed).

**The fairness math is not affected** — `ComputeGoalkeeperBalancesAsync` selects
`(MatchDayId, PlayerId)` with `.Distinct()`, so duplicates were already being collapsed
before they reached the balance calculation. The damage is confined to the player-facing
history display and `RoundNumber` itself.

Worth fixing properly:

- A unique index on `(player_id, match_day_id)`, so the database refuses duplicates
  regardless of which code path asks.
- Make `TrackGoalKeeperRoundAsync` a no-op when a row already exists.
- Automating assignment (below) makes this *more* likely to bite, not less, since generation
  may be retried. Fix this before or alongside the automation, not after.

---

## Finding 6 — the default goalkeeper isn't as protected as it looks

`DefaultGoalkeeper` gets first claim on a team's open keeper slots, ahead of the balance
math. That part works. But because the draft is keeper-blind (Finding 1), two things can go
wrong:

- **Two default keepers on one team.** Then one of them plays outfield while another team has
  none. Today this cannot happen — the club has exactly one — but it is a latent trap the
  moment a second is added. Given the emphasis on this feature, a second is likely.
- **The default keeper doesn't turn up.** Fahim was absent from match day 16. Nothing breaks,
  but it means "the default keeper is always in goal" can't be relied on as an invariant;
  the rotation has to cover the gap, and it does.

The fix is the same repair pass: treat default keepers as a distribution constraint during the
draft — spread them one per team before anything else — rather than as a preference applied
afterwards.

**Settled:** a default keeper occupies **one** of the two slots, and the fairness rotation
fills the other from the rest of that team's roster — which is what the code already does.
So a default keeper reduces the rotation burden on their team by one slot per match day,
never removes it. Worth carrying into the repair pass in Finding 1: a team with a default
keeper needs **one** further eligible rotation player, not two, and the repair should count
it that way or it will over-correct and pull eligible players away from teams that need them
more.

---

## Finding 7 — "participants only" is not currently guaranteed

Captains and goalkeepers must come from the confirmed participants of that match day. Today
the goalkeeper path gets there by accident, and the accident has already failed once.

`AutoAssignGoalkeepersAsync` builds its candidate list from `team.TeamPlayers` — everyone on
a team — not from `MatchDayParticipants`. Those two sets are *usually* identical, because the
draft only ever pulls from confirmed participants. But they can diverge in two ways:

- An admin adds a player to a team by hand in Team Building, which does not consult RSVPs.
- A player RSVPs yes, gets drafted, then **withdraws**. The `team_player` row survives the
  change of heart.

Both have happened in production:

| Match day | Player | Had an RSVP row | Confirmed |
|---|---|---|---|
| 2 | MD Kamrus Samad | yes | **no** |
| 12 | Md. Akramul Hoque | yes | **no** |

And MD Kamrus Samad was **recorded as a goalkeeper for match day 2 while not confirmed for
it** — the exact failure this rule is meant to prevent, already in the data once.

Two only, out of every team-player row ever written, so this is a slow leak rather than a
flood. But automation raises the stakes: generation currently runs on a lead time before
kickoff, and the window between "teams generated" and "match played" is precisely when
someone drops out.

What this implies for the implementation:

- Filter candidates by confirmed participation, at both the goalkeeper and captain step.
  Cheap, and closes the manual-add path too.
- Participation is **point-in-time**. A player confirmed at generation can withdraw
  afterwards, and nothing re-checks. Assigning at generation therefore can't be the whole
  story — the Team Building page should flag a goalkeeper or captain who has since withdrawn,
  so the organiser can reassign rather than discovering it at kickoff.
- The `player_goalkeeping_history` row is what feeds the fairness balance. Writing one for a
  player who never turned up charges them a turn they did not serve, and quietly advantages
  them in later weeks. Worth considering whether withdrawal should retract the history row,
  not merely the assignment.

---

## Recommendation

Fold all three steps into generation, in this order, as one transaction:

```
0. Take confirmed participants only       (Finding 7 — the input to everything below)
1. Snake draft by rank                    (unchanged — it's good)
2. Spread default keepers one per team    (new)
3. Repair eligible-keeper distribution    (new — Finding 1, the big one)
   - a team with a default keeper needs 1 more eligible player, not 2
4. Swap-refine for balance                (new — Finding 2, optional)
5. Assign keepers                         (existing AutoAssignGoalkeepersAsync logic)
   - default keeper takes slot 1, rotation fills slot 2
6. Assign captains                        (new — Finding 4, needs a club decision)
   - confirmed participants only, and preferably not the keeper
```

Steps 2–4 are all the same swap primitive applied with different objectives, so they share
most of their code.

Two things to preserve from the current design, both of which are better than they look:

- **Auto-assign never overrides a human pick.** It only fills open slots. Automation must keep
  that property, or an organiser's manual correction gets stamped on by the next regeneration.
- **The preview and the action share `SelectGoalkeepersForTeam`,** so the "Whose turn in goal"
  table never lies about what the button will do. Any new logic should stay on that shared
  path.

### Suggested ticket order

| # | Change | Why first |
|---|---|---|
| 01 | Unique index + idempotent `TrackGoalKeeperRoundAsync` | Data integrity; automation makes duplicates more likely |
| 02 | Restrict keeper + captain candidates to confirmed participants | Correctness; already wrong once in production (Finding 7) |
| 03 | Goalkeeper-aware draft repair | 80 % → 0 % failure rate, no balance cost |
| 04 | Spread default keepers across teams | Latent bug today, real the moment a 2nd is added |
| 05 | Auto-assign keepers during generation | The actual request; safe once 01–04 land |
| 06 | Auto-assign captains | Needs the club's answer on rotation first |
| 07 | Flag a keeper/captain who withdraws after generation | The gap automation widens (Finding 7) |
| 08 | Rotate team order so overflow moves | Small, independent, cosmetic-but-noticed |
| 09 | Swap refinement for balance | Optional; 4× tighter, nice-to-have |

### Open questions for the club

1. ~~Should captaincy rotate?~~ **Answered:** it rotates — random draw from rank 3 or better.
2. Should a captain be allowed to also be a goalkeeper? Still open; nothing currently prevents it.
3. When the eligible-keeper pool is smaller than the number of slots, should generation
   fail loudly, or fill what it can and warn?
4. If a player withdraws after being assigned keeper, should their
   `player_goalkeeping_history` row be retracted? Leaving it charges them a turn they never
   served, and makes them *less* likely to be picked in the weeks after. (Finding 7)
