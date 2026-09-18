# 06 — Auto-assign captains during team generation

Status: needs-info
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
