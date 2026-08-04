@echo off
:: Runs the .NET backend (BofcBackend.Api) on http://localhost:9191
:: Requires: .NET 8 SDK (dotnet --version)
cd /d "%~dp0bofc-backend-dotnet\BofcBackend.Api"
dotnet run
