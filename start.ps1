Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "       Menjalankan Aplikasi JagaRaya AI            " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1/2] Menjalankan Server Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\python.exe main.py"

Write-Host "[2/2] Menjalankan Frontend (React + Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host " Aplikasi Berhasil Dijalankan!" -ForegroundColor Green
Write-Host " - Backend API & Docs : http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host " - Frontend Web App   : http://localhost:5173" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Green
