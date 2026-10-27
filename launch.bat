@echo off
cd /d "%~dp0"
echo Starting Local 835 document center...
echo Open http://localhost:3000
echo Click to enter the portal (sign-in service disabled).
echo.
npx --yes serve -l 3000
pause
