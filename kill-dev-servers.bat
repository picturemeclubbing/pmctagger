@echo off
echo ==========================================
echo Killing Common Dev Servers: Node, Vite, Tailwind, Eleventy, Express
echo ==========================================

:: Kill Node.js (used for Vite, Tailwind, Express, etc.)
taskkill /F /IM node.exe /T >nul 2>&1

:: Kill common terminal-based tools if separately detected
taskkill /F /IM cmd.exe /T >nul 2>&1
taskkill /F /IM powershell.exe /T >nul 2>&1

:: Kill any scripts with keywords (Eleventy, Tailwind, server.js, vite)
for /f "tokens=2 delims=," %%a in ('tasklist /v /fo csv ^| findstr /i "eleventy tailwind vite server.js watcher.js express"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo ✅ All known dev servers have been terminated.
pause
