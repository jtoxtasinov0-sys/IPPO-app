@echo off
chcp 65001 >nul
title IPPO - Backend + Bot (5000)
cd /d "%~dp0backend"
if not exist node_modules call npm install
call npm run dev
pause
