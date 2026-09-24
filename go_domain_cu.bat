@echo off
chcp 65001 >nul
title Gan Ten Mien Vao Site Moi
cd /d "%~dp0"

echo ==========================================================
echo   DANG GAN TEN MIEN HANGMYXACHTAY.INFO.VN VAO SITE MOI...
echo ==========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$newHeaders = @{ 'Authorization' = 'Bearer nfp_yM4UkHWP1XfBqkcvSSVGCsfiReuhBsZ9f032'; 'Content-Type' = 'application/json' };" ^
  "$siteId = 'e2a6f617-edd5-4899-826c-fabe924605d4';" ^
  "$body = @{ custom_domain = 'hangmyxachtay.info.vn' } | ConvertTo-Json;" ^
  "try {" ^
  "    $res = Invoke-RestMethod -Uri ('https://api.netlify.com/api/v1/sites/' + $siteId) -Method Patch -Headers $newHeaders -Body $body;" ^
  "    Write-Host '[+] CHUC MUNG! GAN TEN MIEN THANH CONG 100%%!' -ForegroundColor Green;" ^
  "    Write-Host '    Website: https://hangmyxachtay.info.vn/' -ForegroundColor Yellow;" ^
  "    Write-Host '    Netlify da nhan ten mien va tu dong kich hoat SSL.' -ForegroundColor Green;" ^
  "} catch {" ^
  "    Write-Host '[-] Thu cach 2 qua PUT...' -ForegroundColor DarkGray;" ^
  "    try {" ^
  "        $res = Invoke-RestMethod -Uri ('https://api.netlify.com/api/v1/sites/' + $siteId) -Method Put -Headers $newHeaders -Body $body;" ^
  "        Write-Host '[+] GAN TEN MIEN THANH CONG 100%%!' -ForegroundColor Green;" ^
  "    } catch {" ^
  "        Write-Host '[-] Chi tiet: ' $_.Exception.Message -ForegroundColor Yellow;" ^
  "    }" ^
  "}"

echo.
echo ==========================================================
echo   XONG! Bam phim bat ky de dong cua so...
echo ==========================================================
pause
