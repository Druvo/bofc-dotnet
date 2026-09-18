# 07 — Flag a goalkeeper or captain who withdraws after generation

Status: ready-for-agent

## Context

Ticket 02 filters keeper and captain candidates to confirmed participants at the moment of
assignment. That closes the manual-add path, but it cannot close the timing gap: **participation is
point-in-time**. A player confirmed when teams are generated can withdraw afterwards, and nothing
re-checks. The `team_player` row survives the change of heart, and so does the goalkeeper or
captain designation on it.

Automation widens exactly this gap. Generation runs on a configured lead time before kickoff
(`MatchDaySchedulerBackgroundService` calls `WeeklyMatchDayTeamGenerator.GenerateAsync` once a
match day is within its lead time), and the window between "teams generated" and "match played" is
precisely when someone drops out. Assigning at generation therefore cannot be the whole story.

This has already happened. MD Kamrus Samad on match day 2 and Md. Akramul Hoque on match day 12
both had RSVP rows but were not confirmed, and MD Kamrus Samad was recorded as a goalkeeper for
match day 2 while not confirmed for it. Two rows out of every team-player row ever written, so the
current rate is low — but the organiser currently has no way to notice at all, and discovering it
at kickoff is the worst possible time.

There is also an open club question this ticket should not decide unilaterally:

> If a player withdraws after being assigned keeper, should their `player_goalkeeping_history` row
> be retracted?

The `player_goalkeeping_history` row is what feeds the fairness balance. Leaving it charges the
player a turn they never served, which quietly advantages them in later weeks. Retracting it is
what `RemoveGoalKeeperRoundAsync` already does when an organiser removes a keeper by hand. The safe
default for this ticket is to **flag, not act**: surface the withdrawal so the organiser reassigns,
which runs the existing removal path and retracts the row as a side effect of a human decision.

## What to change

- `bofc-backend-dotnet/BofcBackend.Api/Features/Teams/TeamService.cs` — the team and team-player
  responses that Team Building reads need a per-player "no longer confirmed" signal, derived by
  comparing `team.TeamPlayers` against `MatchDayParticipants` with `ParticipationStatus == true`
  for that match day. This is the same comparison ticket 02 introduces; reuse it rather than
  writing a second one.
- The signal matters most for a player who is a goalkeeper (`PlayingPosition == GOALKEEPER`) or a
  captain (`IsCaptain`), because those are the roles that leave a hole at kickoff. Flag any
  unconfirmed team player, but make the keeper and captain cases prominent.
- Frontend Team Building — `bofc-frontend/src/components/MatchDays/SingleMatchDay.tsx` and the
  squad views under `bofc-frontend/src/components/MatchDays/SquadLineup/` and
  `bofc-frontend/src/components/MatchDays/Atoms/TeamCard.tsx` / `PlayerCard.tsx`. Show the warning
  where the organiser is already looking, next to the affected player, not as a page-level banner
  that gets dismissed.
- `bofc-frontend/src/components/MatchDays/Atoms/GoalKeeperDrawer.tsx` shows the "Whose turn in
  goal" table; a withdrawn current goalkeeper should be visible there too.

Do not auto-reassign. An organiser may well know the player is coming anyway.

## Acceptance criteria

- [ ] A team player with no confirmed `MatchDayParticipant` row for that match day is flagged in
      Team Building.
- [ ] A flagged player who is the team's goalkeeper or captain is called out distinctly from a
      flagged outfield player.
- [ ] The flag appears without a regeneration — it reflects current RSVP state on every page load.
- [ ] Reassigning the role through the existing manual path clears the flag and, for a goalkeeper,
      retracts the `player_goalkeeping_history` row via `RemoveGoalKeeperRoundAsync` as it does
      today.
- [ ] Nothing is reassigned automatically.
- [ ] The open question about automatic history retraction is recorded rather than silently
      decided.
