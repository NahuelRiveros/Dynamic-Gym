@echo off
title GYM SERVER

echo Iniciando servidor...

cd /d "C:\GymLocal\servidor"

start cmd /k "npm run dev"

timeout /t 5 /nobreak > nul

start http://localhost:3001