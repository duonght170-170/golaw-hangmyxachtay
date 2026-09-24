@echo off
chcp 65001 >nul
title CostcoHealth USA - Deploy len Vercel
cd /d "%~dp0"
set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"

echo ==========================================================
echo    DANG DEPLOY WEBSITE LEN VERCEL (NHANH - KHONG KHOA QUOTA)
echo ==========================================================
echo.
echo [1] Neu la lan dau tien, Vercel se yeu cau dang nhap qua trinh duyet.
echo [2] Cac cau hoi sau do ban chi can bam ENTER theo mac dinh.
echo.

call npx -y vercel --prod --yes

echo.
echo ==========================================================
echo    Deploy hoan tat! Bam phim bat ky de dong cua so...
echo ==========================================================
pause
