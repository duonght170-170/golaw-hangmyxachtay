@echo off
chcp 65001 >nul
echo Dang khoi tao brain.db trong thu muc website...
python init_brain.py
if exist brain.db (
    echo [OK] Da tao thanh cong brain.db trong thu muc website!
) else (
    echo [LOI] Khong tao duoc brain.db.
)
pause
