@echo off
title RGN AI Uygulama Baslat
cd /d "%~dp0"

if not exist ".env" (
  copy ".env.example" ".env" >nul
)

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js bilgisayarinizda yok.
  echo Once Node.js LTS kurun: https://nodejs.org/
  echo Kurduktan sonra bu dosyayi tekrar acin.
  start https://nodejs.org/
  echo.
  pause
  exit /b 1
)

echo.
echo RGN AI hazirlaniyor...
echo Ilk acilista bagimliliklar indirilecegi icin internet gerekir.
echo.

call corepack enable
call corepack prepare pnpm@10.4.1 --activate

if not exist "node_modules" (
  echo Paketler yukleniyor...
  call pnpm install
  if errorlevel 1 (
    echo.
    echo Kurulum basarisiz oldu. Internet baglantinizi kontrol edin.
    pause
    exit /b 1
  )
)

echo.
echo Uygulama aciliyor: http://localhost:3000
start "" "http://localhost:3000"

set NODE_ENV=development
call pnpm exec tsx watch server/_core/index.ts
pause
