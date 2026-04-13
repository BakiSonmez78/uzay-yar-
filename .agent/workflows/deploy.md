---
description: Web'i derle, Firebase'e deploy et, Android AAB oluştur - tek komutla Google Play'e hazır
---

# /deploy - Tam Deploy Akışı

Bu workflow web build + Firebase deploy + Android AAB oluşturma işlemlerini sırasıyla yapar.

## Adımlar

// turbo-all

1. **Web Build** - Vite ile production build oluştur
```
npm run build
```

2. **Firebase Deploy** - Web versiyonunu canlıya al
```
firebase deploy --only hosting
```

3. **Capacitor Sync** - Web dosyalarını Android projesine kopyala
```
npx cap sync android
```

4. **Android AAB Build** - İmzalı AAB oluştur (Google Play formatı)
```
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; C:\Users\Baki\.gemini\antigravity\playground\vacant-orion\android\gradlew.bat bundleRelease
```
Cwd: `C:\Users\Baki\.gemini\antigravity\playground\vacant-orion\android`

5. **Sonuç** - AAB dosyasının konumunu ve boyutunu göster
```
$aab = "C:\Users\Baki\.gemini\antigravity\playground\vacant-orion\android\app\build\outputs\bundle\release\app-release.aab"; Write-Host "AAB: $aab"; Write-Host "Boyut: $([math]::Round((Get-Item $aab).Length / 1MB, 1)) MB"
```

## Çıktı

AAB dosyası şurada oluşur:
```
android\app\build\outputs\bundle\release\app-release.aab
```

## Google Play'e Yükleme (manuel)

1. https://play.google.com/console aç
2. Uygulamayı seç → Release → Production
3. "Create new release" → app-release.aab yükle
4. Release notes yaz → Publish

## Notlar

- Keystore: `android/astromath.jks`
- Keystore'u KESİNLİKLE yedekle, kaybedersen güncelleme yükleyemezsin
- Web versiyonu: https://math-games-6c136.web.app
