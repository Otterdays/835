@echo off
cd /d "%~dp0"
echo Starting Local 835 document center...
echo Open http://localhost:3000
echo Sign in with credentials from local.auth.json or your Mongo user.
echo.
npx --yes serve -l 3000
pause
