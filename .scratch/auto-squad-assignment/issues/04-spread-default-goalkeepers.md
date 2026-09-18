# 04 — Spread default goalkeepers one per team during the draft

Status: resolved

## Context

`Player.DefaultGoalkeeper` marks a player who only ever wants to play in goal.
`SelectGoalkeepersForTeam` gives those players first claim on a team's open keeper slots, ahead of
the fairness balance math. That part works correctly.

The problem is that the preference is applied *after* the draft, and the draft is keeper-blind. If
two default keepers land on the same team, one of them plays outfield while another team has none
— and `SelectGoalkeepersForTeam` handles that case by drawing at random among them for the
available slots, which is the right local behaviour but cannot fix a bad distribution it inherited.

Today the club has exactly **one** default goalkeeper (Md Fahim Faez Abir), so this cannot happen
yet. It is a latent trap that becomes real the moment a second is added, and given how much
emphasis the club puts on this flag, a second is likely.

A related point that is not a bug but bears on the design: the default keeper does not always turn
up — Fahim was absent from match day 16. Nothing breaks, because the rotation covers the gap, but
it means "the default keeper is always in goal" cannot be treated as an invariant anywhere in the
code.

The club has settled that a default keeper occupies **one** of the two slots
(`SystemSettings.MinGoalkeepersPerTeam` is currently 2) and the fairness rotation fills the other
from the rest of that team's roster — which is what `SelectGoalkeepersForTeam` already does. A
default keeper therefore reduces the team's rotation burden by one slot per match day; it never
removes it.

## What to change

- `bofc-backend-dotnet/BofcBackend.Api/Common/Scheduling/WeeklyMatchDayTeamGenerator.cs` —
  `GenerateAsync` treats default keepers as a distribution constraint during the draft rather than
  a preference applied afterwards: spread them one per team before the goalkeeper-eligibility
  repair from ticket 03 runs. Both passes use the same nearest-rank swap primitive, so this is a
  different objective over shared machinery, not new machinery.
- Ordering matters. Default-keeper spreading runs **first**, then the eligibility repair, because
  the repair's slot accounting depends on knowing which team has a default keeper (a team with one
  needs one further eligible player, not two).
- Default-keeper status comes from `Player.DefaultGoalkeeper`, the same source
  `TeamService.ComputeGoalkeeperBalancesAsync` reads. Use the shared eligibility helper extracted
  in ticket 03 rather than querying it separately.
- `SelectGoalkeepersForTeam` in `bofc-backend-dotnet/BofcBackend.Api/Features/Teams/TeamService.cs`
  needs no behavioural change — it already prefers default keepers and already handles the
  more-defaults-than-slots case. Leave it alone; this ticket is about what the draft hands it.

Only confirmed participants are draftable, so a default keeper who did not RSVP is simply not in
the pool and no team gets one. That is correct, and the rotation covers it.

## Acceptance criteria

- [ ] When the number of confirmed default keepers is less than or equal to the number of teams,
      no two of them end up on the same team.
- [ ] When there are more default keepers than teams, the excess distributes as evenly as
      possible rather than clustering.
- [ ] A team with a default keeper still has its second slot filled by the fairness rotation, not
      left open and not filled by the default keeper twice.
- [ ] Spreading default keepers does not worsen the balance spread.
- [ ] With the club's current single default keeper, generated teams are indistinguishable from
      today's behaviour apart from which team Fahim lands on.
- [ ] Roster sizes are unchanged — the spreading pass only swaps.

## Comments

Implemented on branch `feat/auto-squad-assignment`. Verified by `dotnet build` (0 warnings, 0 errors) and, for the draft changes, by a line-for-line port of `SquadBalancer` re-run over real match-day-16 turnout: 0% of 5,000 drafts leave a team short of keepers (was 80%), roster sizes and balance spread unchanged.
