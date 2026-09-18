# 03 — Goalkeeper-aware draft repair

Status: resolved

## Context

This is the single highest-value change in the spec.

`SelectGoalkeepersForTeam` picks keepers **from that team's own roster**. But `SnakeDraft`, which
built that roster, knows nothing about who is resting, who is excluded from the rotation, or who
is a default keeper. So a team can be dealt a roster with fewer than two eligible keepers on it,
and `AutoAssignGoalkeepersAsync` can only report *"Not enough eligible players (all resting or
excluded)."*

Simulated **5,000 times** against the real match day 16 turnout (22 players, 4 teams, 8 keeper
slots, 9 globally eligible keepers after the rest and exclusion rules):

| | Current draft | With a repair pass |
|---|---|---|
| Weeks where at least one team can't fill its keeper slots | **80.0 %** | **0.0 %** |
| Average slots left unfilled | 1.11 | 0.00 |
| Balance spread | 0.80 | 0.80 |

Shortfall distribution today: 0 slots short in 998 runs, 1 short in 2,586, 2 short in 1,280,
3 short in 136. Four weeks in five at least one team ends up short — not because the club lacks
eligible players, but because the draft scattered them badly. The repair costs nothing in balance
terms, which is why the spread column is unchanged.

The margin is genuinely thin and worth watching: match day 12 ran 8 eligible keepers for 8 slots,
exactly zero slack. The "rested for two match days after keeping goal" rule takes 10-13 players
out of a 22-player pool most weeks. Do **not** loosen it — it is the rule that stops the same
people going in goal repeatedly, and this repair solves the distribution problem without touching
it. But the system should say so when the pool is genuinely too thin, rather than silently leaving
a team short.

## What to change

- `bofc-backend-dotnet/BofcBackend.Api/Common/Scheduling/WeeklyMatchDayTeamGenerator.cs` —
  `GenerateAsync` gains a repair pass after `SnakeDraft` yields its assignments and before the
  `TeamPlayer` rows are saved. The algorithm: while some team is short of eligible keepers and
  another has a surplus, swap a surplus eligible player for the nearest-rank ineligible player on
  the short team. Nearest rank is what keeps the strength damage at or near zero.
- Eligibility currently lives in `TeamService.ComputeGoalkeeperBalancesAsync`, which is private and
  returns the `PlayerGoalkeeperBalance` record carrying `IsResting`, `IsExcluded` and
  `IsDefaultGoalkeeper`. The generator needs the same notion of eligible, computed from the same
  rules, so extract it to something both can call rather than reimplementing the rest and exclusion
  logic in a second place. Two copies of this rule will diverge.
- Slot accounting must follow the club's settled rule: a team carrying a `DefaultGoalkeeper` player
  needs **one** further eligible rotation player, not two, because the default keeper occupies one
  of the two slots. Count it that way or the repair will over-correct and pull eligible players
  away from teams that need them more. (Ticket 04 is what puts the default keepers where they
  belong in the first place.)
- Warn when the globally eligible keeper count is below the total number of slots. That is a real
  "the pool is too thin this week" signal and is not something the repair can fix.

The swap primitive written here is reused by tickets 04 and 09, so keep it separable from the
objective it is being applied to.

## Acceptance criteria

- [ ] After generation, no team has fewer eligible keeper candidates than its remaining keeper
      slots, whenever the club-wide eligible pool is large enough to make that possible.
- [ ] A team with a default goalkeeper is treated as needing one further eligible player, not two.
- [ ] Balance spread after the repair is no worse than before it, measured as the gap between the
      strongest and weakest team's average player strength (`11 - rank`).
- [ ] Replaying the match day 16 turnout many times produces a 0 % shortfall rate rather than 80 %.
- [ ] When the eligible pool is genuinely smaller than the slot count, generation reports it
      explicitly instead of leaving a team quietly short.
- [ ] Roster sizes are unchanged by the repair — it only ever swaps, never moves a player one way.

## Comments

Implemented on branch `feat/auto-squad-assignment`. Verified by `dotnet build` (0 warnings, 0 errors) and, for the draft changes, by a line-for-line port of `SquadBalancer` re-run over real match-day-16 turnout: 0% of 5,000 drafts leave a team short of keepers (was 80%), roster sizes and balance spread unchanged.
