# 09 — Swap refinement for team balance (optional)

Status: needs-triage

## Context

Balance today is good, and four times better is cheap. Whether it is worth the code is a judgement
call, which is why this ticket is last and marked for triage rather than handed straight to an
implementer.

Spread is measured as the gap between the strongest and weakest team's **average** player strength,
where strength is `11 - rank`. Average, not total: with 22 players in 4 teams the rosters are
necessarily 5/5/6/6, and comparing totals just measures who got the extra body.

| Algorithm | Mean spread | Worst |
|---|---|---|
| Current snake | 0.800 | 0.800 |
| Snake + rotated team order | 0.800 | 0.800 |
| Greedy "weakest team picks next" | 1.816 | 1.867 |
| **Snake + swap refinement** | **0.200** | **0.200** |

Two things worth noting before touching this.

The obvious "improvement" — letting the weakest team pick next — is **more than twice as bad as
what ships today**. Greedy balancing on running totals over-corrects early and cannot recover. Had
it been implemented on intuition it would have made things worse. The snake is a good algorithm and
should stay.

Adding a bounded swap-refinement pass after the deal — repeatedly try swapping a player between the
strongest and weakest teams, keep the swap if the spread narrows — takes the spread from 0.80 to
0.20 deterministically. It preserves roster sizes because it only ever swaps. Both the current and
the refined figures have zero variance across 3,000 runs, so this is a real structural gain, not
simulation noise.

In plain terms, 0.80 to 0.20 is "one rank tier of difference between the best and worst team"
becoming "a quarter of one". The marginal cost is low because the same swap machinery is needed for
the goalkeeper repair in ticket 03 anyway.

## What to change

- `bofc-backend-dotnet/BofcBackend.Api/Common/Scheduling/WeeklyMatchDayTeamGenerator.cs` —
  `GenerateAsync` gains a bounded swap-refinement pass after the draft and after the goalkeeper
  passes from tickets 04 and 03. Order matters: refining for balance must not undo the keeper
  distribution those passes established, so a candidate swap that would leave a team short of
  eligible keepers must be rejected even if it narrows the spread.
- Reuse the swap primitive introduced in ticket 03 rather than writing a second one. Steps 2, 3 and
  4 of the spec's recommended pipeline are the same primitive applied with different objectives.
- Bound the pass explicitly — a maximum iteration count, and a stop when no swap improves the
  spread. Do not let it run to convergence without a ceiling inside a request that also holds a
  database transaction open.
- `SnakeDraft` itself is unchanged. Do not replace it with a greedy allocator.

## Acceptance criteria

- [ ] Mean and worst balance spread drop from roughly 0.80 to roughly 0.20 on the match day 16
      turnout.
- [ ] Roster sizes are identical before and after refinement.
- [ ] No team ends the pass with fewer eligible keeper candidates than its remaining keeper slots —
      the ticket 03 invariant survives.
- [ ] The pass terminates within a bounded number of iterations on every input.
- [ ] `SnakeDraft` is unchanged.
- [ ] Triage decides whether the gain justifies the code before implementation begins.
