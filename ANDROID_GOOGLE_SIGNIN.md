# Android Google Sign-In Kurulumu

## 🔥 Firebase Console Ayarları

Android uygulamasında Google Sign-In çalışması için Firebase Console'da bazı ayarlar yapmanız gerekiyor.

### 1️⃣ SHA-1 Fingerprint Alma

#### Debug Keystore için:
```bash
# Windows (PowerShell)
cd android
./gradlew signingReport

# Çıktıda "SHA1:" ile başlayan satırı bulun
# Örnek: SHA1: A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0
```

#### Release Keystore için (varsa):
```bash
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

---

### 2️⃣ Firebase Console'a SHA-1 Ekleme

1. **Firebase Console** açın: https://console.firebase.google.com
2. **Projenizi seçin** (`math-games-6c136`)
3. **⚙️ Project Settings** → **Your apps** bölümüne gidin
4. **Android app** (`com.yazgames.mathrace`) seçin
5. **Add fingerprint** butonuna tıklayın
6. **SHA-1 fingerprint**'i yapıştırın
7. **Save** tıklayın

---

### 3️⃣ google-services.json Güncelleme

SHA-1 ekledikten sonra:

1. Firebase Console'da **Download google-services.json** tıklayın
2. İndirilen dosyayı şu konuma kopyalayın:
   ```
   android/app/google-services.json
   ```
3. Eski dosyanın üzerine yazın

---

### 4️⃣ OAuth Client ID Kontrolü

1. **Google Cloud Console** açın: https://console.cloud.google.com
2. **APIs & Services** → **Credentials**
3. **OAuth 2.0 Client IDs** listesinde şunları kontrol edin:
   - ✅ **Web client** (Firebase tarafından otomatik oluşturulur)
   - ✅ **Android client** (SHA-1 ekledikten sonra otomatik oluşturulur)

---

### 5️⃣ Rebuild ve Test

```bash
# 1. Capacitor sync
npx cap sync android

# 2. Android Studio'da rebuild
Build → Rebuild Project

# 3. Uygulamayı çalıştır
Run → Run 'app'

# 4. Google Sign-In test et
```

---

## 🐛 Sorun Giderme

### Hata: "Developer Error" veya "Sign-in failed"
**Çözüm:**
- SHA-1 fingerprint'in doğru eklendiğinden emin olun
- `google-services.json` dosyasını yeniden indirip güncelleyin
- Android Studio'da **Invalidate Caches / Restart** yapın

### Hata: "App stopped" veya crash
**Çözüm:**
- `AndroidManifest.xml`'de OAuth redirect intent filter'ın eklendiğinden emin olun
- Logcat'te detaylı hata mesajını kontrol edin:
  ```
  adb logcat | grep -i "firebase\|auth\|google"
  ```

### Hata: "Network error" veya "Connection failed"
**Çözüm:**
- İnternet bağlantısını kontrol edin
- Firebase projesinin **Authentication** → **Sign-in method** → **Google** aktif olduğundan emin olun

---

## ✅ Başarılı Kurulum Kontrolü

Google Sign-In düzgün çalışıyorsa:

1. ✅ "Google ile Giriş Yap" butonu tıklanınca tarayıcı açılır
2. ✅ Google hesabı seçme ekranı görünür
3. ✅ Hesap seçildikten sonra uygulamaya geri döner
4. ✅ Kullanıcı adı ve email görünür
5. ✅ Oyuna başlanabilir

---

## 📝 Notlar

- **Debug build** için ayrı SHA-1
- **Release build** için ayrı SHA-1 gerekir
- Her ikisini de Firebase Console'a eklemelisiniz
- `google-services.json` her SHA-1 eklemesinden sonra yeniden indirilmeli

---

## 🆘 Yardım

Sorun devam ederse:
1. Logcat çıktısını kontrol edin
2. Firebase Console'da **Authentication** → **Users** bölümünde test kullanıcısı oluşturun
3. Google Cloud Console'da OAuth consent screen'i kontrol edin
