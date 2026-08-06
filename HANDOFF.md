# Session Handoff — BOFC .NET/React app

Read this first in a new session to pick up exactly where this one left off.

## Project

- `D:\Projects\bofc-dotnet` — BOFC (football club) app, Java→ASP.NET Core 8 port + React frontend.
- Backend: `bofc-backend-dotnet\BofcBackend.Api` (.NET 8, EF Core, SQL Server, port **8080** in dev — NOT 9191, README is stale).
- Frontend: `bofc-frontend` (CRA/React, port **3000**).
- DB: SQL Server, `Server=localhost;Database=bofc_football;Trusted_Connection=True;` — **Windows auth, no password**. Use `sqlcmd -S localhost -d bofc_football -E -Q "..."  -W` for direct queries/fixes without needing app login.
- Run backend: `cd bofc-backend-dotnet\BofcBackend.Api && dotnet run` (or via Claude Browser `preview_start` with name `bofc-dotnet-backend`, config in `.claude/launch.json`).
- Run frontend: `cd bofc-frontend && npm start` (or `preview_start` name `bofc-dotnet-frontend`).
- **Hard constraint**: I can never type a password into any field/form/API call — not even a test password for a new account. If login is needed to verify something, the human must do it. Don't waste time trying to route around this.
- Known real users: `zhdruvo@gmail.com` (Zahid Hasan, ADMIN+SUPERADMIN) plus ~30 more real players (mix of PLAYER-only and ADMIN). No need to create test users — plenty already exist.
- A leftover **Service Worker** may be stuck in the user's real Chrome (`localhost:3000`) from an earlier production build (`serve-prod.js`) — it cache-first-serves old JS forever. If the user reports "stale/old UI after a code change," first ask them to check DevTools → Application → Service Workers → Unregister, then `Ctrl+Shift+R`. Our own dev server (`npm start`) never registers a SW itself (`serviceWorkerRegistration.ts` guards on `NODE_ENV==='production'`).

## What's been done this session (in order)

1. **Updated the graphify knowledge graph** (`/graphify`) — incremental update, scoped to `bofc-backend-dotnet` + `bofc-frontend` (excluded `tailadmin-template` vendor scaffold + 110 logo/icon images per user's choice). Had to redo it per-subfolder (each has its own `graphify-out/`) because the merged root graph uses a `repo::stem` ID scheme from an original multi-repo build — a first attempt with the wrong root created ghost-duplicate nodes; fixed by working in each subfolder then `graphify merge-graphs`.

2. **Jersey color moved from Team Building (fixed per-team) to per-match (Match section)** — club only owns 2 physical jerseys, teams swap match to match:
   - Backend: `Match.HomeJerseyColor`/`AwayJerseyColor` (nullable strings), `SystemSettings.JerseyColorA`/`JerseyColorB` (club-wide 2-color setting, defaults red/yellow), removed `Team.JerseyColor` entirely (migration `MoveJerseyColorToMatch`).
   - Frontend: `utils/jerseyColors.ts` (shared palette), removed color-picker from `TeamCard.tsx`, added a "Jersey Colors" card to Settings, added jersey pickers to `AddMatchModal.tsx`/`EditFixtureModal.tsx`, `SimpleMatchesPanel.tsx` reads jersey color straight from the fixture instead of a team lookup.
   - Decision (confirmed with user): auto-generated fixtures leave jersey color blank — organizer sets it per match afterward. The 3 example schedules the user pasted are NOT a consistent algorithmic pattern (checked — they contradict each other), so no auto-rotation logic was built, by design.

3. **Redesigned SimpleMatchesPanel fixture rows** — team-initial avatar circles + "vs"/score badge + centered date-venue line, per a screenshot the user provided, jersey dot kept alongside.

4. **Big audit → fixed real scheduling bug + UX overhaul + Settings restructure** (this was one large approved plan, fully executed):
   - **Fixed `FixtureGenerationService.GenerateFixturesAsync`**: it was computing each match's start time as `index * timeGapMinutes`, completely ignoring `matchDurationMinutes` — so "gap" was actually the full slot width, not the breather after a match ends. Now `slotMinutes = duration + gap`, matching the UI's own label. Added optional one-time break (`BreakAfterMatchNumber`/`BreakDurationMinutes`).
   - Added `MatchResponse.EndTime` (start + duration) end-to-end; `SimpleMatchesPanel` now shows a start–end range.
   - Rewrote `FixtureGenerationModal.tsx`: removed the misleading multi-"Add Date" UI (backend only ever read date #1 anyway!), replaced with a single start date/time + a **real computed per-match preview list** (mirrors the backend formula exactly, in `utils/tournamentCalculations.ts`'s `generateRoundRobinSchedule`). Disabled non-Round-Robin MatchDay types in the selector since the backend only ever generates round-robin regardless of what's picked (was a silent lie in the UI).
   - **Settings restructured**: "Change Password"/"Update Player Data" moved out of the header-dropdown modal (`SettingsModal.tsx`, now deleted) into `/settings` itself as a "My Account" section visible to every logged-in user. Everything else on that page (SMTP, notifications, auction, accounting, Next Match, Jersey Colors) stays admin/superadmin-only via `isAdmin()` — matches the backend's `SettingsController` which is already `[Authorize(Roles=AdminOrSuperAdmin)]` on every action. Sidebar link no longer `adminOnly`. Header's Settings button now `navigate("/settings")` instead of opening a modal.

5. **Fixed search-bar autofill bug**: header's global search `<input>` had no `autoComplete`, and neither did the new Email field in "Update Player Data" — Chrome was dumping the user's saved email into the search box. Fixed with explicit `autoComplete="off"` on search, and proper `type`/`autoComplete` (`email`/`name`/`tel`) on the profile fields.

6. **Fixed `/match-day` (sidebar "Next Match") showing a stale concluded MatchDay**: it called `GetCurrentMatchDayAsync` (`current-match-day` endpoint), which ONLY considers `IsWeeklyMatchDay=true` tournaments and falls back to the most recent PAST one when none qualify. Dashboard's own Next Match card uses the broader `GetMostRecentActiveTournamentAsync` (`next-active` endpoint, any tournament). Changed `MatchDayPage.tsx` to use `next-active` too, so both agree.

7. **Added Tournament duration + real-time effective status**: "Create MatchDay" form had no way to specify how long it runs, so a tournament whose date had passed still showed "UPCOMING" (the only auto-correction that existed was a slow 3x/day cron job with day-granularity, `TournamentStatusSchedulerBackgroundService`). Added `Tournament.DurationMinutes` (migration `AddDurationMinutesToTournament`, nullable, defaults to 90 when unset), added a Duration input to `CreateTournamentModal.tsx`, and rewrote `utils/utils.ts`'s `getEffectiveTournamentStatus(status, tournamentDate, durationMinutes)` to derive UPCOMING/ONGOING/CONCLUDED in real time from `now` vs `[start, start+duration)`, instead of trusting the raw DB field (CONCLUDED is still treated as a terminal, manually-set state). Updated all 4 call sites (`TournamentsPage`, `TournamentViewerPage`, `MatchCalendarWidget`, `LatestTournamentCard`) to pass the new field through.

Live test data created/left in the DB (via direct `sqlcmd`, not through the app):
- Tournament id **7** "Match Day — Aug 7, 2026" — 3 teams (Team A=26, B=27, C=28), match id 8 = old completed test match, matches **11/12/13** = freshly regenerated with the FIXED formula (13min duration/2min gap): 06:30–06:43, 06:45–06:58, 07:00–07:13.
- A tournament called "test" also exists, dated earlier (Aug 5 night) — became the real "next active" one at one point during testing.

## In progress / NOT started yet — approved plan waiting to execute

**Latest user request**: rename **"Tournament" → "MatchDay"** (and "Tournaments" → "MatchDays") EVERYWHERE — C# backend classes/files/namespaces, DB tables/columns, TypeScript frontend components/types/files/routes, literally everything. User explicitly chose (via AskUserQuestion):
- **Full rename including the physical DB schema** (not just code) — tables/columns get renamed via a real EF Core migration, not just C# mapped-under-the-hood.
- **One continuous pass**, no phased checkpoints back to the user mid-work.

I ran two Explore agents to build a full inventory (~143 backend files, ~117 frontend files) before this got interrupted. **The full approved plan — inventory, landmines, mechanical strategy, order of operations, verification steps — is saved at `C:\Users\DELL\.claude\plans\delightful-wibbling-hammock.md`.** That path may not be visible from a different login/account, so the complete plan text is reproduced below verbatim so it's self-contained.

Nothing has been changed yet for this rename — no files touched, no migration created. This is the very next thing to do.

<details>
<summary>Full approved rename plan (click to expand)</summary>

# Rename Tournament → MatchDay everywhere (backend, frontend, DB)

## Context

UI copy already says "MatchDay"/"MatchDays" in ~80% of places (Sidebar, headings, form
labels, toasts) — the underlying code, types, routes, and DB schema never caught up
and still say "Tournament" everywhere. The user wants the rename completed
consistently top-to-bottom: C# classes/files/namespaces, TS
components/types/files/routes, the DB tables and columns, and file names — confirmed
scope includes the physical database schema (not just code), done in one continuous
pass (not phased with checkpoints).

Full inventory taken via two Explore agents (backend + frontend):
- **Backend**: ~143 files. 5 entity classes + 2 enums to rename
  (`Tournament`, `TournamentParticipant`, `TournamentParticipantPlayer`,
  `TournamentPrize`, `TournamentRound`, `TournamentStatus`, `TournamentType`), 10
  entities with FK-only references, 5 EF configuration classes + 10 more with FK
  columns only, 4 controllers + ~10 more with tournament route segments, 8
  service/interface pairs, 2 feature folders (`Features/Tournaments/`,
  `Features/TournamentParticipants/`), 2 background services already named
  `Tournament...`, DI registrations in `Program.cs`, an exception class
  (`TournamentServiceException`), constants (`RestErrorMessageDetail.TournamentIsNotFound`
  etc.), and — critically — **raw interpolated SQL string literals** in
  `Features/Players/PlayerService.cs` (`CountConsecutiveMissedTournamentsBeforeCurrentAsync`)
  that reference the table/column names directly and bypass EF's compile-time safety net.
- **Frontend**: ~117 files. 24 files/folders with "Tournament" in the name, ~15
  TS interfaces, 2 RTK Query slice files with 15+ tournament endpoints each plus 5
  more slices with tournament-scoped endpoints, ~30 route/URL segments across
  `App.tsx`/`ContentComponent.tsx`/`Sidebar.tsx`/`MobileTabBar.tsx`, a persisted
  Redux slice key (`tournamentUI`), a `localStorage` key (`currentTournamentId`), and
  a `tournamentId` prop drilled through ~30 components across two separate tab-nested
  component trees.
- **Known landmines** (from the inventory, must be handled explicitly, not by blind
  find/replace):
  1. `tournament_participant_players` has a **composite primary key**
     (`tournament_id`, `player_id`) on an entity explicitly marked read-only/immutable.
  2. Two files are both named `tournamentTypes.ts` — `components/Tournaments/tournamentTypes.ts`
     (stale relic, now just holds unrelated `Player`/`Team`/`DropResult` types) and
     `state/features/tournaments/tournamentTypes.ts` (the real domain types). They must
     resolve to two DIFFERENT names, not collide.
  3. `state/features/auth/authSlice.ts` exports its RTK Query API under the copy-paste
     leftover name `tournamentsApi` — unrelated to tournaments, rename to `authApi`
     while in there so a stray `tournamentsApi` doesn't survive the rename confusingly.
  4. `components/Tournaments/TournamentsPage.tsx.tmp` is a stray untracked backup file,
     not imported anywhere — delete it, don't rename it.
  5. A `components/MatchDay/` folder (singular, holds only the redirect-resolving
     `MatchDayPage.tsx`) **already exists** — the renamed `components/Tournaments/`
     folder must land on a non-colliding name: `components/MatchDays/` (plural).
  6. Same collision risk backend-side is checked: no existing `Features/MatchDay*`
     folder, so `Features/Tournaments/` → `Features/MatchDays/` and
     `Features/TournamentParticipants/` → `Features/MatchDayParticipants/` are clean.
  7. DB table/column names must end up **snake_case** (`match_day`, `match_day_id`)
     and URL route segments **kebab-case** (`match-days`, `match-day-viewer`) — a
     blind identifier-style replace would wrongly produce `matchDay_id` or
     `matchDay-viewer`. These string-literal spots (EF `.ToTable()`/`.HasColumnName()`
     calls, `[Route(...)]` attributes, RTK Query URL template strings, CSS class
     names, the raw SQL in `PlayerService.cs`) need their own explicit fix-up pass
     using the inventory as a checklist — they are a minority of occurrences but the
     ones a mechanical rename gets wrong by default.

## Mechanical strategy

**Two-substitution rule for identifiers** (safe to bulk-apply across every backend
`.cs` file outside `Migrations/`, and every frontend `.ts`/`.tsx` file): replace the
literal substring `Tournament` → `MatchDay`, then separately `tournament` → `matchDay`,
case-sensitive, everywhere in an identifier/PascalCase/camelCase context. This
correctly handles `TournamentId`→`MatchDayId`, `tournamentId`→`matchDayId`,
`TournamentDate`→`MatchDayDate`, `Tournaments`→`MatchDays`, `ITournamentService`→
`IMatchDayService`, etc., because `tournamentId` is literally `tournament`+`Id` — the
substring swap composes correctly with no extra cases to hand-write.

**What that bulk pass gets WRONG and must be fixed up afterward, per the landmines
list above**: every DB string literal and every route/URL string literal, because
those need snake_case/kebab-case, not the camelCase the bulk pass produces. After the
bulk identifier pass, grep for remaining `matchDay_`/`matchDay-` artifacts (the
tell-tale sign the bulk pass touched a string literal it shouldn't have) plus the
specific known spots from the inventory (`TournamentConfiguration.cs` and siblings'
`.ToTable()`/`.HasColumnName()`, every `[Route(...)]`, `PlayerService.cs`'s raw SQL,
RTK Query URL templates, `.css`/`.module.css` class names) and correct each to proper
snake_case (DB) or kebab-case (routes/CSS).

**File/folder renames** happen via `git mv` (or plain move) so history is preserved,
done alongside the content edits in the same pass — not a separate step.

## Order of operations (still sequential internally, even without user checkpoints)

1. **Backend entities + enums + EF configurations** — rename `Tournament.cs` →
   `MatchDay.cs` and siblings, update every FK-referencing entity's `TournamentId`/
   `Tournament` nav property, update every `Data/Configurations/*.cs` (rename the 5
   Tournament-named ones, fix the `.ToTable("tournament")`→`.ToTable("match_day")`
   and every `.HasColumnName("tournament_...")`→`.HasColumnName("match_day_...")` /
   `"tournament_id"`→`"match_day_id"` string literal explicitly, including the
   composite-PK `tournament_participant_players` config), update `BofcDbContext.cs`'s
   `DbSet<>` properties.
2. **Backend services/interfaces/controllers/background services/DI** — rename
   `ITournamentService`/`TournamentService` and the other 7 pairs, `TournamentController`
   and the other 3, fix every `[Route("tournament...")]` attribute to kebab-case,
   rename `TournamentStatusSchedulerBackgroundService`, update `TournamentReminderBackgroundService`
   and `MatchDaySchedulerBackgroundService`'s internal `Tournament`-typed code, update
   `Program.cs` DI registrations, `TournamentServiceException`, `RestErrorMessageDetail`
   constants, and hand-fix the raw SQL literals in `PlayerService.cs`'s
   `CountConsecutiveMissedTournamentsBeforeCurrentAsync`.
3. **Rebuild backend** (`dotnet build`) and fix compile errors until clean —
   compile-time safety catches nearly everything except the string-literal spots
   already called out above.
4. **Generate + apply the EF Core migration**: with the C# model already renamed,
   `dotnet ef migrations add RenameTournamentToMatchDay` lets EF diff old vs. new
   model and auto-generate `RenameTable`/`RenameColumn`/drop-and-recreate-PK
   statements — including for the composite-PK table — rather than hand-writing raw
   SQL renames. Review the generated migration before applying (confirm it's
   renames, not drop+recreate, so existing rows survive), then `dotnet ef database
   update`. Do **not** touch historical migration files or let anything but `ef
   migrations add` regenerate `BofcDbContextModelSnapshot.cs`.
5. **Frontend types/slices/hooks/utils** — resolve the two colliding
   `tournamentTypes.ts` files first (rename the stale
   `components/Tournaments/tournamentTypes.ts` to `teamBuilderTypes.ts` matching its
   actual content; rename the real `state/features/tournaments/tournamentTypes.ts` to
   `state/features/matchDays/matchDayTypes.ts`), rename the `tournaments`/
   `tournamentTeam` slice files and folder, fix every RTK Query URL template string to
   kebab-case, rename `authSlice.ts`'s `tournamentsApi` → `authApi`, rename
   `tournamentUISlice.ts` and its Redux store key + persist whitelist entry, rename
   `useTournamentTeams.ts`/`useJoinTournament.ts`, `utils/tournamentCalculations.ts`,
   `utils/roleUtils.ts`'s `canManageTournaments`.
6. **Frontend components/routes/CSS** — rename `components/Tournaments/` →
   `components/MatchDays/` (and every file inside), `components/TournamentViewer/` →
   `components/MatchDayViewer/`, fix every route path in `App.tsx`/
   `ContentComponent.tsx`/`Sidebar.tsx`/`MobileTabBar.tsx` to kebab-case
   (`/tournaments`→`/match-days`, `/tournament-viewer`→`/match-day-viewer`, etc. —
   double-check none collides with the existing `/match-day` redirect route), rename
   CSS files and their kebab-case class names, delete the stray `.tmp` file, migrate
   the `localStorage` key (`currentTournamentId`→`currentMatchDayId`, reading the old
   key as a one-time fallback so existing browser state isn't silently dropped).
7. **Rebuild frontend** (webpack dev server recompile) and fix errors until clean.
8. **Restart both servers**, confirm clean compiles in console/logs.

## Verification

1. Backend: `dotnet build` clean, `dotnet ef migrations add` review + `dotnet ef
   database update` applied without error, restart `bofc-dotnet-backend` preview,
   confirm no startup errors.
2. Frontend: dev server compiles with no errors in console/`preview_logs`.
3. Spot-check the DB directly (already have `sqlcmd` Windows-auth access): confirm
   `match_day` table exists with prior rows intact (e.g. tournament id 7's data still
   present under its new name), and the renamed FK columns on `team`/`match` etc.
4. Since I still can't log in myself, ask the user to click through: MatchDays list
   page, MatchDay Viewer, Team Building, Dashboard's Next Match card, and Settings —
   confirm nothing 404s and no leftover "Tournament" text/errors appear.

</details>

## Other notes / preferences observed this session

- User runs in **caveman mode** (terse output) — that's a session/plugin setting, not something to replicate unless their new session also has it on.
- User tends to send big multi-part asks in one message (audit + fix + new feature all at once) — worth scoping/confirming with `AskUserQuestion` before a large mechanical change, which is exactly why this rename went through plan mode.
- Servers (`preview_start`) are tied to THIS session's Browser pane — a new session must re-run `preview_start` for both `bofc-dotnet-backend` and `bofc-dotnet-frontend` (configs already exist in `.claude/launch.json`).
