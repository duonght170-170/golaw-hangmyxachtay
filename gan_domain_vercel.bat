@echo off
chcp 65001 >nul
title Huong Dan Cau Hinh DNS Vercel
cd /d "%~dp0"

echo ==========================================================
echo   KIEM TRA BAN GHI DNS CHO HANGMYXACHTAY.INFO.VN
echo ==========================================================
echo.

call npx -y vercel domains inspect hangmyxachtay.info.vn

echo.
echo ==========================================================
echo   THONG SO DNS CHUAN DE TRO VE VERCEL:
echo   1. Neu la Ten Mien Chinh (hangmyxachtay.info.vn):
echo      - Loai (Type):  A
echo      - Ten (Host):   @
echo      - Gia tri (IP): 76.76.21.21
echo.
echo   2. Neu co them ban ghi www (www.hangmyxachtay.info.vn):
echo      - Loai (Type):  CNAME
echo      - Ten (Host):   www
echo      - Gia tri:      cname.vercel-dns.com
echo ==========================================================
echo.
pause
