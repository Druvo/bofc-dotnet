# 08 — Rotate team order so the extra player does not always land on the same team

Status: ready-for-agent

## Context

With 22 players across 4 teams, two teams get 6 players and two get 5. `SnakeDraft` deals in a
fixed serpentine direction — `teamIndex` is `indexInRound` on even rounds and
`teamCount - 1 - indexInRound` on odd ones, with `teams` always in creation order — so the overflow
lands in the same place every single time.

Over 3,000 simulated drafts, **Team C received the extra player 3,000 times**. Never A, never B.
Rotating or shuffling the team order before dealing spreads it (A 1,522 / B 1,004 / C 474) at no
cost to balance: the mean and worst spread for "snake + rotated team order" are 0.800 and 0.800,
identical to the current snake.

Small thing, but it is the kind of thing players notice across a season. And now that teams are
named A-D rather than 1-4 (`TeamNaming.DefaultName`), "C is always a man up" is easier to spot,
not harder.

This ticket is independent of 03, 04 and 05 and can land in any order relative to them.

## What to change

- `bofc-backend-dotnet/BofcBackend.Api/Common/Scheduling/WeeklyMatchDayTeamGenerator.cs` —
  `SnakeDraft` currently indexes `teams` directly. Introduce a rotation or shuffle of the team
  order used for dealing, so the team that receives the overflow varies between match days.
- Rotate rather than shuffle if a deterministic, explainable sequence is preferred — for example,
  offset the starting team by the match day index so it advances by one each week. `SnakeDraft` is
  `static` and takes only `players` and `teams`, so a rotation offset has to be passed in from
  `GenerateAsync`; a shuffle can use `Random.Shared` as the rank-tie shuffle already does.
- Do not change the serpentine pattern itself. The snake is a good algorithm — the spec's
  simulations show the obvious "let the weakest team pick next" alternative is more than twice as
  bad — and this ticket is only about which team sits at which position when the deal starts.
- `Team.TeamName` still comes from `TeamNaming.DefaultName(i)` in creation order, so rotate the
  *dealing* order, not the names. Renaming teams would be confusing and would break nothing useful.

## Acceptance criteria

- [ ] Across repeated generations with an uneven player count, the team receiving the extra player
      varies rather than being the same team every time.
- [ ] Balance spread is unchanged — mean and worst stay at the current snake's figures.
- [ ] Team names remain `Team A`, `Team B`, ... in creation order.
- [ ] The serpentine deal pattern itself is unchanged.
- [ ] Roster size distribution is unchanged (still as even as the player count allows).
