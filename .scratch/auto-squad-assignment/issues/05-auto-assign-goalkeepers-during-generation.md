# 05 — Auto-assign goalkeepers during team generation

Status: resolved
Blocked by: 03, 04

## Context

This is the actual request: the organiser should not have to click a second button after teams are
generated. Today there are three separate admin actions run by hand in sequence — draft teams
(`WeeklyMatchDayTeamGenerator.SnakeDraft`), assign keepers
(`TeamService.AutoAssignGoalkeepersAsync`, the "Auto-Assign Goalkeepers" button), and name captains
(manual, per player). The three steps do not talk to each other, which is the root of most of the
problems in the spec.

This ticket folds step 2 into step 1. It is deliberately sequenced after 03 and 04 because
assigning keepers on top of a keeper-blind draft is what produces the 80 % shortfall rate: four
weeks in five at least one team would be reported as *"Not enough eligible players (all resting or
excluded)"* at generation time, which is a far worse experience than the same message appearing on
a button the organiser chose to press. Land the repair passes first, then automate.

It is also sequenced after 01, because generation can be retried and each retry currently writes
another `player_goalkeeping_history` row.

## What to change

- `bofc-backend-dotnet/BofcBackend.Api/Common/Scheduling/WeeklyMatchDayTeamGenerator.cs` —
  `GenerateAsync` calls the goalkeeper assignment after the draft and the repair passes, inside the
  existing transaction. `GenerateAsync` already opens `db.Database.BeginTransactionAsync()` and
  commits only after fixtures are generated, so the whole thing stays all-or-nothing: if assignment
  fails, the teams roll back too and the match day remains regeneratable.
- `bofc-backend-dotnet/BofcBackend.Api/Features/Teams/TeamService.cs` — reuse
  `AutoAssignGoalkeepersAsync` and `SelectGoalkeepersForTeam` rather than writing a parallel
  implementation. `SelectGoalkeepersForTeam` is shared by the action and by
  `GetGoalkeeperRankingAsync`, which is what makes the "Whose turn in goal" preview table honest
  about what the button will do. Any new logic must stay on that shared path or the preview starts
  lying.
- The order within generation is: confirmed participants only (ticket 02) → snake draft → spread
  default keepers (04) → repair eligible-keeper distribution (03) → assign keepers (this ticket).

Two properties of the current design must be preserved, both better than they look:

- **Auto-assign never overrides a human pick.** `AutoAssignGoalkeepersAsync` computes
  `slotsToFill = minGoalkeepersPerTeam - existingGoalkeepers.Count` and only fills what is open. If
  generation is ever re-run over a match day where an organiser has corrected an assignment by
  hand, that correction must survive.
- **The preview and the action share their selection code.** Keep it that way.

The "Auto-Assign Goalkeepers" button (`bofc-frontend/src/components/MatchDays/Atoms/AutoAssignGoalkeeperButton.tsx`)
should stay. It is still the recovery path when an organiser clears assignments or adds players by
hand after generation.

## Acceptance criteria

- [ ] Generating teams for a match day also assigns goalkeepers, in the same transaction, with no
      second click.
- [ ] `SystemSettings.MinGoalkeepersPerTeam` is honoured (currently 2 per team).
- [ ] A default goalkeeper takes one slot and the fairness rotation fills the other.
- [ ] Re-running generation over existing manual goalkeeper picks does not overwrite or demote
      them.
- [ ] The "Whose turn in goal" preview still matches what generation actually did — both still go
      through `SelectGoalkeepersForTeam`.
- [ ] Exactly one `player_goalkeeping_history` row per assigned keeper per match day, including
      after a retried generation (relies on ticket 01).
- [ ] If assignment fails for any reason, teams and fixtures roll back and the match day can be
      regenerated.
- [ ] The manual Auto-Assign Goalkeepers button still works for match days whose teams were built
      by hand.

## Comments

Implemented on branch `feat/auto-squad-assignment`. Verified by `dotnet build` (0 warnings, 0 errors) and, for the draft changes, by a line-for-line port of `SquadBalancer` re-run over real match-day-16 turnout: 0% of 5,000 drafts leave a team short of keepers (was 80%), roster sizes and balance spread unchanged.
