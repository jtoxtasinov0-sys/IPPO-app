@echo off
chcp 65001 >nul
title IPPO - Admin panel (5174)
cd /d "%~dp0admin"
if not exist node_modules call npm install
start "" http://localhost:5174
call npm run dev
pause
