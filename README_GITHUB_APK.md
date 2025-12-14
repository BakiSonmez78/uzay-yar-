# GitHub Üzerinden Android APK Yükleme Rehberi

Bu rehber, projenizi GitHub'a yükleyip, GitHub Actions sayesinde otomatik olarak APK (Android Kurulum Dosyası) oluşturmanızı sağlar.

## 1. Hazırlık (Otomatik Yapıldı)
*   Bilgisayarınızın IP adresi (`192.168.1.59`) uygulamaya tanımlandı.
*   GitHub'da otomatik APK üretmesi için gerekli ayar dosyası (`.github/workflows/android.yml`) oluşturuldu.

## 2. GitHub'a Yükleme
Aşağıdaki komutları terminalde sırasıyla çalıştırın.
*(Eğer daha önce `git init` yaptıysanız bazıları hata verebilir, sorun değil, devam edin)*

```bash
git init
git add .
git commit -m "Android APK hazir"
git branch -M main
# Aşağıdaki linki KENDİ GitHub repo linkinizle değiştirin!
git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADINIZ.git
git push -u origin main
```

## 3. APK Dosyasını İndirme
Kodları GitHub'a yükledikten sonra:
1.  GitHub'daki proje sayfanıza gidin.
2.  Üst menüden **Actions** sekmesine tıklayın.
3.  Sol tarafta **Build Android APK** işleminin çalıştığını göreceksiniz (Sarı renkli döner).
4.  İşlem bitince (Yeşil tik olunca) üzerine tıklayın.
5.  Sayfanın en altında **Artifacts** bölümünde `app-debug` dosyasına tıklayarak indirin.
6.  İnen `.zip` dosyasını açın, içindeki `.apk` dosyasını telefonunuza atıp kurun.

## 4. Oyunu Oynama
*   Telefonunuzun ve bilgisayarınızın **aynı Wi-Fi** ağında olduğundan emin olun.
*   Bilgisayarınızda sunucunun açık olduğundan emin olun (`cd server` -> `node index.js`).
*   Telefondan oyunu açın, otomatik olarak bilgisayarınıza bağlanacaktır.
