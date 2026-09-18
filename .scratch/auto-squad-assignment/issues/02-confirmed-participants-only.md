# 02 — Restrict goalkeeper and captain candidates to confirmed match-day participants

Status: resolved

## Context

The club has settled that captains and goalkeepers are drawn only from the confirmed participants
of that match day. Team membership alone is not sufficient. Today the goalkeeper path arrives at
that outcome by accident, and the accident has already failed once in production.

`AutoAssignGoalkeepersAsync` builds its candidate list from `teams.SelectMany(t => t.TeamPlayers)`
— everyone on a team — not from `MatchDayParticipants`. The two sets are *usually* identical,
because `WeeklyMatchDayTeamGenerator.GenerateAsync` only ever drafts from participants with
`ParticipationStatus == true`. They diverge in two ways: an admin adds a player to a team by hand
in Team Building, which does not consult RSVPs; or a player RSVPs yes, gets drafted, then
withdraws, leaving the `team_player` row behind.

Both have happened:

| Match day | Player | Had an RSVP row | Confirmed |
|---|---|---|---|
| 2 | MD Kamrus Samad | yes | **no** |
| 12 | Md. Akramul Hoque | yes | **no** |

MD Kamrus Samad was **recorded as a goalkeeper for match day 2 while not confirmed for it** — the
exact failure this rule exists to prevent, already sitting in the data. Two rows out of every
team-player row ever written, so this is a slow leak rather than a flood, but the automation in
tickets 05 and 06 raises the stakes: generation runs on a lead time before kickoff, and the window
between "teams generated" and "match played" is precisely when someone drops out.

Note the scope boundary. This ticket makes participation a filter at the point of assignment.
Participation is point-in-time, so a player confirmed at assignment can still withdraw afterwards;
ticket 07 covers surfacing that.

## What to change

- `bofc-backend-dotnet/BofcBackend.Api/Features/Teams/TeamService.cs`:
  - `AutoAssignGoalkeepersAsync` — intersect the team-player candidate set with the match day's
    confirmed participants (`db.MatchDayParticipants.Where(p => p.MatchDayId == matchDayId && p.ParticipationStatus)`)
    before it is passed to `ComputeGoalkeeperBalancesAsync`.
  - `SelectGoalkeepersForTeam` — an unconfirmed player must not be selectable. The cleanest place
    is the balance record: an unconfirmed player is not eligible, alongside resting and excluded.
    Reuse `PlayerGoalkeeperBalance.IsEligible` rather than adding a second filter at the call site,
    so the preview and the action cannot drift apart.
  - `GetGoalkeeperRankingAsync` shares `SelectGoalkeepersForTeam`, so it must report the new
    ineligibility with its own status value rather than silently showing the player as `ELIGIBLE`.
- `bofc-backend-dotnet/BofcBackend.Api/Common/Scheduling/WeeklyMatchDayTeamGenerator.cs` —
  `GenerateAsync` already filters on `ParticipationStatus`; no change needed, but the new shared
  "confirmed participants of this match day" query should be the one both paths use.

Keep the reason visible. `ComputeGoalkeeperBalancesAsync` already reports resting and excluded
players rather than dropping them, so an organiser can see *why* someone was skipped; unconfirmed
should behave the same way.

## Acceptance criteria

- [ ] A player on a team but without a confirmed `MatchDayParticipant` row is never auto-assigned
      as goalkeeper.
- [ ] The "Whose turn in goal" table shows such a player with a distinct ineligible status, not as
      `ELIGIBLE` and not omitted without explanation.
- [ ] A player who is confirmed behaves exactly as before — no change to balance figures or pick
      order for the ordinary case.
- [ ] The same confirmed-participant filter is applied to captain candidates (the rule is stated
      once and used by both paths).
- [ ] Replaying match day 2 would not select MD Kamrus Samad as goalkeeper.

## Comments

Implemented on branch `feat/auto-squad-assignment`. Verified by `dotnet build` (0 warnings, 0 errors) and, for the draft changes, by a line-for-line port of `SquadBalancer` re-run over real match-day-16 turnout: 0% of 5,000 drafts leave a team short of keepers (was 80%), roster sizes and balance spread unchanged.
