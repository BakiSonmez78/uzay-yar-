# 🎮 Matematik Uzay Yarışı - Android AAB Hazır!

## ✅ Tamamlanan İşlemler

1. ✅ Capacitor kuruldu
2. ✅ Android platformu yapılandırıldı
3. ✅ App ID güncellendi: `com.yazgames.mathrace`
4. ✅ App Name güncellendi: "Matematik Uzay Yarışı"
5. ✅ Web assets senkronize edildi
6. ✅ Android build dosyaları hazır

## 🚀 AAB Oluşturma (Hızlı Yol)

### Komut Satırından (Önerilen):

```bash
cd android
./gradlew bundleRelease
```

AAB dosyası: `android/app/build/outputs/bundle/release/app-release.aab`

### Android Studio ile:

```bash
npx cap open android
```

Sonra: **Build** → **Generate Signed Bundle / APK** → **Android App Bundle**

## 📋 Keystore Oluştur (İlk Kez)

```bash
cd android/app
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Şifreyi kaydet!** Kaybedersen uygulamayı güncelleyemezsin.

## ⚙️ Signing Config (android/gradle.properties)

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=ŞİFRENİZ
MYAPP_RELEASE_KEY_PASSWORD=ŞİFRENİZ
```

## 📱 Google Play Store

1. [Play Console](https://play.google.com/console) hesabı aç ($25)
2. Yeni uygulama oluştur
3. AAB dosyasını yükle
4. Store listing doldur
5. Yayınla!

## 🔄 Güncelleme İçin

```bash
# 1. Web build
npm run build

# 2. Android sync
npx cap sync android

# 3. Version artır (android/app/build.gradle)
# versionCode 2, versionName "1.1"

# 4. AAB oluştur
cd android
./gradlew bundleRelease
```

## 📖 Detaylı Rehber

Tüm detaylar için: `ANDROID_AAB_GUIDE.md`

## ⚠️ Önemli

- Keystore'u yedekle!
- Her güncelleme için version code artır
- Release build'i test et
- Google Play Console'da test track kullan

---

**Hazır!** Artık Google Play Store'a yükleyebilirsin 🎉
