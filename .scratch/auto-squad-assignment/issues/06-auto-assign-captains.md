# 06 — Auto-assign captains during team generation

Status: resolved
Blocked by: an unanswered club decision — see Context. Not a ticket dependency.

## Context

**This ticket is blocked and must not be implemented until the club answers the question below.**
The implementation difference between the options is about ten lines; the difference in what the
club experiences is large, and it should be a decision rather than an accident.

Captains are named entirely by hand today, per player, through `SaveOrUpdateTeamPlayerAsync` and
`UpdateTeamPlayerDetailsAsync` in Team Building. There is no automation at all.

The obvious rule — "assign the highest ranked player the captain" — has a consequence worth
surfacing before it ships. The club has **one** rank-1 player and **three** rank-2 players, and the
entire purpose of the snake draft is to put exactly one top-tier player on each team. Those two
facts combine badly. Simulated over 26 weeks:

| | |
|---|---|
| Distinct captains | **4** of 22 |
| Weeks captained, each | 26 of 26 |
| Players who never captain | 18 |

Shofiuddin, Abu Hossain, Md. Akramul Hoque and Abid Hasan Rashel would captain every match day,
permanently. Not most weeks — every week. A least-recently-captained tiebreak among tied
top-ranked players changes nothing, because the snake guarantees there are no ties to break: each
team gets exactly one of the top four.

### The open question

> Should captaincy rotate, or genuinely sit with the same four players every week?

Three options, in the order the spec suggests them:

1. **Highest rank, but not if they captained recently.** Pick the best-ranked player on the team
   who has not captained in the last N match days; fall back to the best-ranked if everyone is
   excluded. Keeps captaincy senior, spreads it across roughly 8-10 players, and mirrors the
   goalkeeper rotation the club already understands — one fairness idea, two uses. This is the
   spec's recommendation.
2. **Highest rank, full stop** — exactly as asked. Simple and predictable, and a legitimate choice
   if the club *wants* its four best players leading every week.
3. Rotate captaincy independently of rank, as a pure fairness queue.

A second open question affects the same code: **should a captain also be allowed to be a
goalkeeper?** Nothing currently prevents it, and with 2 keepers per team on a 5-man roster the odds
are not small. The spec's suggestion is that they should preferably not be the same player.

## What to change

Once the club has answered:

- `bofc-backend-dotnet/BofcBackend.Api/Common/Scheduling/WeeklyMatchDayTeamGenerator.cs` —
  `GenerateAsync` names one captain per team as the last step of generation, after goalkeepers are
  assigned (so the "captain is preferably not the keeper" rule has something to check against).
- `bofc-backend-dotnet/BofcBackend.Api/Features/Teams/TeamService.cs` — the existing captain
  bookkeeping is `RemoveCaptainStatusFromOtherPlayersAsync`, and `TeamPlayer.IsCaptain` is kept in
  step with `TeamPlayerRole.CAPTAIN`. Set both; do not set one and leave the other.
- Candidates must be confirmed participants of that match day (ticket 02). This is the same rule,
  applied at the captain step.
- If option 1 is chosen, captaincy history needs a source. There is no captain-history table
  equivalent to `player_goalkeeping_history`; the past-N-match-days lookup would have to come from
  historical `team_player` rows, or a new history table. Decide this when the option is confirmed.
- Never override a captain an organiser named by hand, for the same reason goalkeeper auto-assign
  does not.

## Acceptance criteria

- [ ] The club has answered whether captaincy rotates, and the answer is recorded in the spec.
- [ ] The club has answered whether a captain may also be a goalkeeper.
- [ ] Every team generated has exactly one captain.
- [ ] Captains are confirmed participants of that match day.
- [ ] A manually named captain survives a regeneration.
- [ ] `IsCaptain` and `TeamPlayerRole` agree on every row written.

## Decision

The club settled this: captaincy rotates. The rule is a random draw, per team, from a senior
pool defined as **every active player ranked 3 or better** - thirteen players today.

Expressed as a rank threshold rather than "the top twelve" because rank is a tier, not a
running order: a headcount cut would have to break a tie between players the club has declared
equal, and would break it on player id. A threshold excludes nobody arbitrarily and keeps
meaning the same thing as the squad changes.

Simulated over 400 seasons of 26 weeks with turnout varying (22 of 30 each week):

| | Highest-rank rule | Random from rank <= 3 |
|---|---|---|
| Distinct captains | 13 of 30 | 13 of 30 |
| Busiest player's share of all captaincies | 18.5 % | **8.6 %** |
| Teams with nobody from the pool | n/a | **0.00 %** |

The pool is drawn from the whole active club rather than from the night's turnout: it expresses
who the club considers senior, which does not change with who happened to RSVP. Turnout then
decides which of them are available to captain that week.

Correction to the figure in spec.md: the "4 distinct captains, 26 weeks of 26" result assumed
the *same* 22 players every week. With turnout varying, the highest-rank rule reaches 13
distinct captains but still concentrates them more than twice as heavily as the rule adopted
here. The conclusion stands; the mechanism is concentration rather than a hard lock.

## Comments

Implemented on branch `feat/auto-squad-assignment`. Runs automatically at the end of team
generation and is exposed at `POST /team/matchday/{matchDayId}/auto-assign-captains` for a
manual re-run. Fills only empty posts - an organiser's own pick is never replaced. Candidates
are confirmed participants only. `dotnet build` clean.

Left open deliberately: nothing stops the captain also being a goalkeeper. Raised twice, not
yet answered, and not worth guessing at.
