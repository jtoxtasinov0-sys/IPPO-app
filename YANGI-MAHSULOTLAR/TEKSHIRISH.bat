@echo off
chcp 65001 >nul
title IPPO - Yangi mahsulotlarni tekshirish
cd /d "%~dp0"
node tekshirish.js
echo.
pause
