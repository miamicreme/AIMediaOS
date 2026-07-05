@echo off
setlocal enabledelayedexpansion

title AIMediaOS Startup

echo.
echo ========================================
echo   AIMediaOS Startup
echo ========================================
echo.

REM Move to the folder where this BAT file lives.
cd /d "%~dp0"

echo Current folder:
echo %CD%
echo.

REM Confirm Node.js exists.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not on PATH.
  echo Install Node.js 20 LTS, then run this file again.
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Node detected: %NODE_VERSION%

REM Confirm pnpm exists. Try Corepack first, then npm global install fallback.
where pnpm >nul 2>nul
if errorlevel 1 (
  echo.
  echo pnpm not found. Trying Corepack activation...
  corepack enable
  corepack prepare pnpm@9.12.0 --activate
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo.
  echo Corepack did not expose pnpm. Trying npm global install...
  npm install -g pnpm
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERROR: pnpm still not available.
  echo Open PowerShell as Administrator and run:
  echo corepack enable
  echo corepack prepare pnpm@9.12.0 --activate
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VERSION=%%i
echo pnpm detected: %PNPM_VERSION%
echo.

REM Pull latest code when this is a Git repository.
if exist ".git" (
  echo Checking current branch...
  git branch --show-current
  echo.
  echo Pulling latest code...
  git pull
  echo.
) else (
  echo WARNING: .git folder not found. Skipping git pull.
  echo.
)

REM Install dependencies.
echo Installing dependencies...
pnpm install
if errorlevel 1 (
  echo.
  echo ERROR: pnpm install failed.
  pause
  exit /b 1
)

echo.
echo Starting AIMediaOS...
echo.
echo When the server is ready, open:
echo http://localhost:3000
echo.
echo Press CTRL+C to stop the server.
echo.

pnpm --filter @aimediaos/web dev

echo.
echo AIMediaOS stopped.
pause
