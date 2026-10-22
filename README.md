# BOFC — .NET stack

BOFC platform running on the **.NET backend**

## Layout

- `bofc-backend-dotnet/` — ASP.NET Core 8 Web API (`BofcBackend.Api`), port 9191.
  EF Core (SQL Server) owns the schema via its own migrations.
- `bofc-frontend/` — React/Ant Design frontend
  backend, unmodified. Dev proxy forwards `/api/*` to `localhost:9191`.
- `run-backend.cmd` / `run-frontend.cmd` — start each half.

## Prerequisites

- **.NET 8 SDK** (`dotnet --version`)
- **Node.js + npm**
- **SQL Server** reachable at the connection string in
  `bofc-backend-dotnet/BofcBackend.Api/appsettings.Development.json`
  (defaults to `localhost`, database `bofc_football`, Windows/Trusted
  auth). Run `dotnet ef database update` from `BofcBackend.Api/` to apply
  the EF Core migrations (`InitialCreate`, `RenameSkypeIdToTeamsId`).

## Run it

```bash
run-backend.cmd
run-frontend.cmd
```

Start the backend first. Frontend opens at `http://localhost:3000`;
backend Swagger UI at `http://localhost:9191/swagger`.

## Config

Dev credentials (DB connection string, JWT signing secret, default
superadmin password) are baked into
`bofc-backend-dotnet/BofcBackend.Api/appsettings.Development.json` for
convenience — same values as the Java backend's `application.yml`. For any
non-local deployment, override via environment variables instead
(`ConnectionStrings__Default`, `Jwt__Secret`, `Player__DefaultPassword`,
`Player__SuperAdminEmail`) rather than editing that file.

## Login

- Email: `zhdruvo@gmail.com`
- Password: `Bjit@123#` (default password / SUPERADMIN role)

## Status

Feature-complete route port of the Java backend (Auth, Accounting, Auction —
including a hand-rolled SockJS+STOMP server at `/ws/auction` for live
bidding, Matches, Rounds, Statistics, Storage, etc.) — see Swagger for the
full API surface. Known-fixed issue: `Tournament.VenueId` was missing its
EF Core column mapping (`venue_id`), which broke any tournament/venue join
(dashboard, tournament list, participant status) — fixed in
`Data/Configurations/TournamentConfiguration.cs`. Treat this as an
in-progress migration reference, not a finished drop-in replacement —
verify each feature area against the Java backend before relying on it.
