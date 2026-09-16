@echo off
title JagaRaya Launcher
echo ===================================================
echo        Menjalankan Aplikasi JagaRaya AI
echo ===================================================
echo.
echo [1/2] Menjalankan Server Backend (FastAPI)...
start "JagaRaya Backend (Port 8000)" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe main.py"

echo [2/2] Menjalankan Frontend (React + Vite)...
start "JagaRaya Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo  Aplikasi Berhasil Dijalankan!
echo  - Backend API ^& Docs : http://127.0.0.1:8000/docs
echo  - Frontend Web App   : http://localhost:5173
echo ===================================================
echo.
timeout /t 5 >nul 2>&1
