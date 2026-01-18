@echo off
echo ==========================================
echo   GitHub Adresi Duzeltiliyor...
echo ==========================================
echo.

echo 1. Yanlis adres siliniyor...
git remote remove origin

echo.
echo 2. Dogru adres ekleniyor: https://github.com/BakiSonmez78/uzay-yar-
git remote add origin https://github.com/BakiSonmez78/uzay-yar-

echo.
echo 3. Tekrar gonderiliyor...
git push -u origin main

echo.
echo ==========================================
echo   Tamamlandi. Simdi GitHub'i kontrol et.
echo ==========================================
pause
