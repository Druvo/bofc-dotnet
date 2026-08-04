@echo off
:: Runs the React frontend on http://localhost:3000 (proxies /api to :9191)
:: Requires: Node.js + npm
cd /d "%~dp0bofc-frontend"
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)
call npm start
