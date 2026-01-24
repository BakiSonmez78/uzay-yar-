# Android AAB (App Bundle) Oluşturma Rehberi

## ✅ Hazırlık Tamamlandı

Capacitor kurulumu yapıldı ve Android projesi senkronize edildi.

**App Bilgileri:**
- **App ID:** `com.yazgames.mathrace`
- **App Name:** Matematik Uzay Yarışı
- **Package:** Android App Bundle (AAB)

## 📱 AAB Oluşturma Adımları

### 1. Android Studio'yu Aç

```bash
npx cap open android
```

Bu komut Android Studio'yu açacak.

### 2. Build Variant Seç

Android Studio'da:
1. **Build** → **Select Build Variant**
2. **release** seçin

### 3. Keystore Oluştur (İlk Kez)

Eğer keystore yoksa:

```bash
cd android/app
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Önemli:** Şifreyi ve bilgileri kaydet!

### 4. Keystore Bilgilerini Ekle

`android/gradle.properties` dosyasına ekle:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=şifreniz
MYAPP_RELEASE_KEY_PASSWORD=şifreniz
```

### 5. build.gradle Güncelle

`android/app/build.gradle` dosyasında signing config ekle:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 6. AAB Oluştur

Android Studio'da:
1. **Build** → **Generate Signed Bundle / APK**
2. **Android App Bundle** seçin
3. **Next**
4. Keystore bilgilerini gir
5. **release** build variant seçin
6. **Finish**

Veya komut satırından:

```bash
cd android
./gradlew bundleRelease
```

### 7. AAB Dosyasını Bul

AAB dosyası şurada olacak:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## 🚀 Google Play Store'a Yükleme

1. [Google Play Console](https://play.google.com/console) 'a git
2. Yeni uygulama oluştur
3. AAB dosyasını yükle
4. Store listing bilgilerini doldur:
   - Başlık: Matematik Uzay Yarışı
   - Kısa açıklama: Online matematik yarışması oyunu
   - Tam açıklama: Arkadaşlarınla online matematik yarışı yap!
   - Ekran görüntüleri ekle
   - İkon ekle (512x512 PNG)
5. İçerik derecelendirmesi yap
6. Fiyatlandırma: Ücretsiz
7. Yayınla!

## 📋 Gereksinimler

- ✅ Android Studio kurulu olmalı
- ✅ Java JDK 11+ kurulu olmalı
- ✅ Google Play Developer hesabı ($25 tek seferlik ücret)

## 🎨 Uygulama İkonu

Uygulama ikonu için `android/app/src/main/res/` klasöründeki `mipmap-*` klasörlerine farklı boyutlarda ikon ekle:
- mipmap-mdpi: 48x48
- mipmap-hdpi: 72x72
- mipmap-xhdpi: 96x96
- mipmap-xxhdpi: 144x144
- mipmap-xxxhdpi: 192x192

## ⚠️ Önemli Notlar

1. **Keystore'u kaybet**: Uygulamayı güncelleyemezsin!
2. **Version Code**: Her yeni sürümde artır (`android/app/build.gradle`)
3. **Permissions**: Gerekli izinleri `AndroidManifest.xml`'e ekle
4. **Test Et**: Release build'i gerçek cihazda test et

## 🔄 Güncelleme İçin

1. `npm run build` - Web build
2. `npx cap sync android` - Android sync
3. Version code artır
4. AAB oluştur
5. Play Console'a yükle
