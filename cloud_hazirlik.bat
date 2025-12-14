@echo off
echo ==========================================
echo   Matematik Uzay Yarisi - Cloud Hazirlik
echo ==========================================
echo.

echo 1. Git Kimligi Ayarlaniyor...
git config --global user.email "oyuncu@uzayyarisi.com"
git config --global user.name "Gelistirici"

echo.
echo 2. Git Deposu Baslatiliyor...
git init

echo.
echo 3. Dosyalar Ekleniyor...
git add .

echo.
echo 4. Versiyon Kaydediliyor (Commit)...
git commit -m "Cloud Run icin hazir"

echo.
echo ==========================================
echo   ISLEM TAMAM!
echo ==========================================
echo Simdi GitHub'a yuklemek icin haziriz.
echo Lutfen rehberdeki "GitHub'a Push" adimina gecin.
pause
