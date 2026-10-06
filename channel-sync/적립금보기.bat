@echo off
chcp 65001 > nul
cd /d "%~dp0"
title 몽프루이 적립금 현황

echo.
echo  [1/3] 카페24에서 최근 적립금 내역을 받아오는 중입니다...
echo.
node src\points.js
echo.

echo  [2/3] 화면 띄우기를 시작합니다 (새 창이 하나 열립니다 - 닫지 마세요)
start "적립금 화면 - 닫으면 화면이 꺼집니다" cmd /k "npx --yes http-server . -p 8080 -c-1 -s"
timeout /t 3 > nul

echo  [3/3] 크롬으로 적립금 화면을 엽니다
start "" "http://localhost:8080/points.html"

echo.
echo  다 됐습니다. 이 창은 닫아도 됩니다.
timeout /t 5 > nul