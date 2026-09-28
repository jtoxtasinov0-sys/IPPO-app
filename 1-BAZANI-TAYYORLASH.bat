@echo off
chcp 65001 >nul
title IPPO - Bazani tayyorlash
cd /d "%~dp0backend"
echo [1/4] Kutubxonalar o'rnatilmoqda...
call npm install
echo [2/4] Prisma tayyorlanmoqda...
call npx prisma generate
echo [3/4] Baza jadvallari yaratilmoqda...
call npx prisma db push
echo [4/4] Boshlang'ich mahsulotlar qo'shilmoqda...
call npm run db:seed
echo.
echo Tayyor! Endi 2-BACKEND.bat ni oching.
pause
