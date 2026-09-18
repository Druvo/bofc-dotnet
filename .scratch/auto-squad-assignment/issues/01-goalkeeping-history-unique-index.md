# 01 — Unique index on player_goalkeeping_history, and an idempotent TrackGoalKeeperRoundAsync

Status: resolved

## Context

`TrackGoalKeeperRoundAsync` reads a player's highest existing `RoundNumber` and then
unconditionally inserts a new `PlayerGoalkeepingHistory` row. Nothing checks whether a row for
this `(PlayerId, MatchDayId)` already exists. Assign a keeper, remove them, re-assign them — or
simply click Auto-Assign twice — and a second row appears with an incremented round number. That
is how Md Fahim Faez Abir came to have three rows for match day 15 alone.

The fairness math is not affected. `ComputeGoalkeeperBalancesAsync` projects
`(MatchDayId, PlayerId)` through `.Distinct()`, so duplicates were already being collapsed before
they reached the balance calculation. The damage is confined to the player-facing goalkeeping
history display and to `RoundNumber` itself.

This is first in the order because the automation in tickets 05 and 06 makes duplicates *more*
likely, not less: generation can be retried, and every retry currently re-writes history rows.

### Production data is already dirty — the migration must handle it

Three players still carry duplicate rows at rounds 2 and 3 for **match day 15**:

- Sheikh Mustafizur Rahman
- Md. Akramul Hoque
- Saniyat Al Ahmed

**A migration that simply adds a unique index will FAIL on production data.** The migration must
de-duplicate first — keep the lowest `id` per `(player_id, match_day_id)` and delete the rest —
and only then create the unique index. Do not reorder those two steps, and do not rely on the
index creation to tell you the data is clean.

## What to change

- `bofc-backend-dotnet/BofcBackend.Api/Data/Configurations/PlayerGoalkeepingHistoryConfiguration.cs`
  — add `builder.HasIndex(h => new { h.PlayerId, h.MatchDayId }).IsUnique()`. The configuration
  currently declares only the key, the column mappings and the two foreign keys.
- A new EF migration under `bofc-backend-dotnet/BofcBackend.Api/Migrations/`. Its `Up` must run
  raw SQL that deletes the duplicate rows (lowest `id` per `(player_id, match_day_id)` survives)
  **before** `CreateIndex(..., unique: true)`. `Down` drops the index; it cannot restore the
  deleted rows, and should not pretend to.
- `bofc-backend-dotnet/BofcBackend.Api/Features/Teams/TeamService.cs` — `TrackGoalKeeperRoundAsync`
  becomes a no-op when a row already exists for `(playerId, matchDayId)`. Check both the tracked
  change tracker entries and the database, because `AutoAssignGoalkeepersAsync` calls it in a loop
  and only saves once at the end, so a within-request duplicate would never be visible to a plain
  `AnyAsync` query.

The two halves are deliberately belt-and-braces: the guard in `TrackGoalKeeperRoundAsync` keeps
the common path clean, and the index makes the database refuse duplicates regardless of which
code path asks.

## Acceptance criteria

- [ ] `player_goalkeeping_history` has a unique index on `(player_id, match_day_id)`.
- [ ] The migration runs cleanly against a copy of current production data, with the three
      match-day-15 duplicates removed rather than causing a failure.
- [ ] The surviving row for each de-duplicated pair is the one with the lowest `id`.
- [ ] Calling `TrackGoalKeeperRoundAsync` twice for the same `(player, match day)` — in one
      request or across two — produces exactly one row and no exception.
- [ ] Running Auto-Assign Goalkeepers twice on the same match day leaves the history unchanged
      after the first run.
- [ ] Existing goalkeeper balance figures are unchanged after the migration (they were already
      de-duplicated by `.Distinct()`, so this is a regression check, not a fix).

## Comments

Implemented on branch `feat/auto-squad-assignment`. Verified by `dotnet build` (0 warnings, 0 errors) and, for the draft changes, by a line-for-line port of `SquadBalancer` re-run over real match-day-16 turnout: 0% of 5,000 drafts leave a team short of keepers (was 80%), roster sizes and balance spread unchanged.
