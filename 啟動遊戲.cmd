@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please install Node.js, then run this file again.
  pause
  exit /b 1
)

if not exist "node_modules\vite" (
  echo Installing dependencies for the first run. Please wait...
  call npm install
  if errorlevel 1 (
    echo npm install failed. Please check your network connection and Node.js installation.
    pause
    exit /b 1
  )
)

set "GAME_URL=http://127.0.0.1:5174/index.html"
set "GAME_SERVER=scripts\tools\serve-game.mjs"

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri $env:GAME_URL -TimeoutSec 1; if ($r.StatusCode -ge 200) { exit 0 } } catch { exit 1 }"
if errorlevel 1 (
  start "Nindou2 Local Server" cmd /k "cd /d ""%~dp0"" && node ""%GAME_SERVER%"" --host 127.0.0.1 --port 5174"
  echo Starting local server...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline = (Get-Date).AddSeconds(15); do { try { $r = Invoke-WebRequest -UseBasicParsing -Uri $env:GAME_URL -TimeoutSec 1; if ($r.StatusCode -ge 200) { exit 0 } } catch {}; Start-Sleep -Milliseconds 100 } while ((Get-Date) -lt $deadline); exit 1"
  if errorlevel 1 (
    echo Timed out waiting for local server.
    pause
    exit /b 1
  )
)

start "" "%GAME_URL%"
