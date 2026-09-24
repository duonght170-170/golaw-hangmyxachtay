@echo off
chcp 65001 >nul
title CostcoHealth USA - Deploy to Netlify
cd /d "%~dp0"

echo ==========================================================
echo   DANG DONG GOI VA DEPLOY BAN MOI NHAT LEN NETLIFY...
echo ==========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"

echo.
echo ==========================================================
echo   Bam phim bat ky de dong cua so nay...
echo ==========================================================
pause
