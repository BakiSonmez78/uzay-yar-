@echo off
echo ==========================================
echo   Backend Guncelleme - GitHub Push
echo ==========================================
echo.

echo 1. Degisiklikleri ekleniyor...
git add server/index.js

echo.
echo 2. Commit yapiliyor...
git commit -m "Added tournament system to backend"

echo.
echo 3. GitHub'a gonderiliyor...
git push origin main

echo.
echo ==========================================
echo   TAMAMLANDI!
echo   Render otomatik guncelleyecek (1-2 dk)
echo ==========================================
pause
