@echo off
chcp 65001 >nul
title IPPO - Mini App (5173)
cd /d "%~dp0miniapp"
if not exist node_modules call npm install
start "" http://localhost:5173
call npm run dev
pause
