# Android İçin GitHub ve Kurulum Rehberi

Bu proje artık Android uygulaması olarak derlenmeye hazırdır.

## 1. GitHub'a Yükleme

Projenizi GitHub'a yüklemek için şu adımları izleyin:

1.  GitHub'da yeni bir boş repo (repository) oluşturun.
2.  Bilgisayarınızda terminali açın ve proje klasörüne gidin.
3.  Şu komutları sırasıyla çalıştırın (Eğer git kuruluysa):

```bash
git init
git add .
git commit -m "İlk yükleme: Android ve Desktop destekli matematik oyunu"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADINIZ.git
git push -u origin main
```

*(Not: `KULLANICI_ADINIZ` ve `REPO_ADINIZ` kısımlarını kendi bilgilerinizle değiştirin.)*

## 2. Android Uygulaması Olarak Derleme (APK)

Bu projeyi Android telefonunuza yüklemek için bilgisayarınızda **Android Studio** kurulu olmalıdır.

1.  **Projeyi Hazırlayın**:
    Terminalde şu komutu çalıştırarak web kodlarını Android projesine kopyalayın:
    ```bash
    npm run build
    npx cap sync
    ```

2.  **Android Studio'yu Açın**:
    ```bash
    npx cap open android
    ```
    Bu komut Android Studio'yu açacaktır.

3.  **Çalıştırın veya APK Oluşturun**:
    *   Telefonunuzu USB ile bağlayın ve Android Studio'daki "Run" (Yeşil üçgen) butonuna basın.
    *   Veya üst menüden **Build > Build Bundle(s) / APK(s) > Build APK(s)** seçeneği ile APK dosyasını oluşturup arkadaşlarınıza gönderebilirsiniz.

## 3. Önemli Not: Sunucu Bağlantısı

Oyunun çok oyunculu (multiplayer) özelliği bir sunucuya ihtiyaç duyar.
*   Şu anki ayarlar **Localhost** (kendi bilgisayarınız) üzerinedir.
*   Telefonunuzdan oynarken bilgisayarınızdaki sunucuya bağlanmak için:
    1.  Bilgisayarınızın IP adresini bulun (Windows'ta `ipconfig` komutu ile, örn: `192.168.1.35`).
    2.  `src/App.jsx` dosyasını açın.
    3.  `getApiUrl` fonksiyonundaki IP adresini kendi IP adresinizle değiştirin.
    4.  Tekrar `npm run build` ve `npx cap sync` yapın.

Eğer oyunu Google Play Store'a yükleyecekseniz, sunucuyu (server klasörünü) bir bulut sunucusuna (Heroku, AWS, DigitalOcean vb.) yüklemeniz ve `src/App.jsx` içindeki adresi o sunucunun adresiyle güncellemeniz gerekir.
