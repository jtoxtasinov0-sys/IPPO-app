@echo off
chcp 65001 >nul
title IPPO - Production build
cd /d "%~dp0miniapp"
if not exist node_modules call npm install
call npm run build
cd /d "%~dp0admin"
if not exist node_modules call npm install
call npm run build
echo.
echo Tayyor: miniapp\dist va admin\dist papkalari.
echo Eslatma: Vercel buni o'zi qiladi, bu faqat tekshirish uchun.
pause
