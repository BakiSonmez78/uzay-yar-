# Android Emulator "Hello Android" Sorunu - Çözüm

## Sorun
Emulator açılıyor ama "Hello Android" yazısı kalıyor, oyun yüklenmiyor.

## Çözüm Adımları

### 1. Android Studio'da Sync
```
File → Sync Project with Gradle Files
```

### 2. Clean & Rebuild
```
Build → Clean Project
Build → Rebuild Project
```

### 3. Logcat Kontrol
Android Studio'da **Logcat** sekmesini aç ve şunları ara:
- "Error"
- "Exception"
- "Failed to load"

### 4. Web Assets Kontrol
Şu klasörde dosyalar var mı kontrol et:
```
android/app/src/main/assets/public/
```

Eğer boşsa:
```bash
npm run build
npx cap sync android
```

### 5. Cache Temizle
```
Build → Clean Project
File → Invalidate Caches / Restart → Invalidate and Restart
```

### 6. Emulator Yeniden Başlat
- Emulator'u kapat
- Android Studio'dan tekrar Run

### 7. Gerçek Cihazda Test Et
Emulator yerine gerçek Android telefonda test et:
1. Telefonda "Geliştirici Seçenekleri" aç
2. "USB Debugging" aç
3. USB ile bağla
4. Android Studio'da cihazı seç
5. Run

## Hata Ayıklama

### Logcat'te "net::ERR_FILE_NOT_FOUND" görüyorsan:
```bash
npm run build
npx cap copy android
```

### "Unable to load native-bridge" görüyorsan:
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Beyaz ekran görüyorsan:
`AndroidManifest.xml`'de internet izni var mı kontrol et:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## Son Çare
```bash
# Tüm build dosyalarını sil
cd android
./gradlew clean
cd ..

# Yeniden build
npm run build
npx cap sync android

# Android Studio'da Rebuild
Build → Rebuild Project
```
