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

start "" "http://127.0.0.1:5173/index.html"
call npm run dev
pause
