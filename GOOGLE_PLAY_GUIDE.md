# Google Play Store Yayınlama Rehberi

## 📋 Gerekli Dökümanlar

### ✅ Hazır Olanlar:
- [x] Privacy Policy (PRIVACY_POLICY.md)
- [x] Terms of Service (TERMS_OF_SERVICE.md)
- [x] AAB Dosyası (oluşturulacak)

### 📝 Store Listing Bilgileri

#### Uygulama Başlığı:
```
Matematik Uzay Yarışı
```

#### Kısa Açıklama (80 karakter):
```
Online matematik yarışması! Arkadaşlarınla yarış, matematik öğren, eğlen!
```

#### Tam Açıklama:
```
🚀 Matematik Uzay Yarışı - Eğlenceli Matematik Öğrenme!

Matematik Uzay Yarışı ile matematik öğrenmek hiç bu kadar eğlenceli olmamıştı! Arkadaşlarınla online yarış, skorunu yükselt ve liderlik tablosunda zirveye çık!

✨ ÖZELLİKLER:
• 🎮 Online Çok Oyunculu Mod - Gerçek oyuncularla yarış
• 🤖 Bot Modu - Yapay zeka ile pratik yap
• 🏆 Liderlik Tablosu - En iyi skorları gör
• 📊 İstatistikler - İlerlemenizi takip edin
• 🎯 Farklı Zorluk Seviyeleri
• ⚡ Hızlı Eşleştirme Sistemi

🎓 EĞİTİM İÇERİĞİ:
• Toplama ve Çıkarma
• Çarpma ve Bölme
• Karma İşlemler
• Zaman Baskısı ile Hızlı Düşünme

🌟 NEDEN MATEMATİK UZAY YARIŞI?
• Tamamen ücretsiz
• Reklamsız deneyim
• Çocuklar için güvenli
• Eğitici ve eğlenceli
• Düzenli güncellemeler

👨‍👩‍👧‍👦 EBEVEYNLER İÇİN:
• Güvenli çevrimiçi ortam
• Kişisel bilgi toplanmaz
• Çocuk dostu içerik
• Eğitim odaklı

Hemen indir ve matematik macerasına başla! 🚀
```

#### Kategori:
```
Eğitim > Matematik
```

#### İçerik Derecelendirmesi:
```
Herkes (3+)
```

#### Etiketler:
```
matematik, eğitim, çocuk oyunları, öğrenme, yarışma, online oyun, matematik oyunu
```

## 🎨 Gerekli Görseller

### 1. Uygulama İkonu (512x512 PNG):
- Şemsiye ve matematik sembolleri
- Parlak renkler (mor, pembe, mavi)
- Şeffaf arka plan YOK

### 2. Feature Graphic (1024x500 PNG):
- "Matematik Uzay Yarışı" yazısı
- Oyun ekran görüntüsü
- Renkli ve çekici tasarım

### 3. Ekran Görüntüleri (En az 2, maks 8):
**Telefon (1080x1920 veya 1080x2340):**
- Ana menü ekranı
- Oyun ekranı
- Liderlik tablosu
- Sonuç ekranı

**Tablet (7" ve 10" - isteğe bağlı):**
- Aynı ekranlar tablet boyutunda

### 4. Promo Video (İsteğe Bağlı):
- YouTube linki
- 30-120 saniye
- Oynanış gösterimi

## 🔐 Uygulama İmzalama

### Keystore Oluştur:
```bash
cd android/app
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Önemli:** Keystore şifresini kaydet! Kaybedersen uygulamayı güncelleyemezsin.

### Keystore Bilgileri:
```
Dosya: my-release-key.keystore
Alias: my-key-alias
Şifre: [KAYDET!]
```

## 📱 AAB Oluşturma

### Android Studio'da:
1. **Build** → **Generate Signed Bundle / APK**
2. **Android App Bundle** seç
3. Keystore seç/oluştur
4. **release** build variant
5. **Finish**

### Dosya Konumu:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## 🚀 Google Play Console Adımları

### 1. Hesap Oluştur:
- https://play.google.com/console
- $25 tek seferlik ücret

### 2. Yeni Uygulama:
- **Create app** tıkla
- Başlık: "Matematik Uzay Yarışı"
- Dil: Türkçe
- Kategori: Oyun / Eğitim

### 3. Store Listing:
- Yukarıdaki bilgileri doldur
- Görselleri yükle
- Privacy Policy URL: (Firebase Hosting'e yükle)
- Contact email: bakisonmez78@gmail.com

### 4. App Content:
- **Privacy Policy:** PRIVACY_POLICY.md linkini ekle
- **Ads:** Hayır (reklam yok)
- **Content Rating:** Anketi doldur (Herkes 3+)
- **Target Audience:** 3-12 yaş
- **News App:** Hayır

### 5. Pricing & Distribution:
- **Free:** Evet
- **Countries:** Tüm ülkeler
- **Content Guidelines:** Kabul et

### 6. App Releases:
- **Production** → **Create new release**
- AAB dosyasını yükle
- Release notes yaz:
  ```
  İlk sürüm! 🎉
  - Online çok oyunculu matematik yarışması
  - Bot modu
  - Liderlik tablosu
  - Tamamen ücretsiz
  ```

### 7. Review & Publish:
- Tüm bölümleri tamamla
- **Start rollout to Production**
- İnceleme süreci: 1-7 gün

## 📊 Yayın Sonrası

### İzleme:
- Play Console → Statistics
- Kullanıcı yorumlarını takip et
- Crash raporlarını kontrol et

### Güncelleme:
1. Version code artır (build.gradle)
2. Yeni AAB oluştur
3. Play Console'a yükle

## ⚠️ Önemli Notlar

1. **Keystore'u yedekle!** Kaybedersen uygulamayı güncelleyemezsin
2. **Privacy Policy URL'i** Firebase Hosting'e yükle
3. **Test et!** Gerçek cihazda test et
4. **Sabırlı ol!** İnceleme 1-7 gün sürebilir

## 📞 Destek

Sorun olursa:
- Play Console Help Center
- Google Play Developer Support
- E-posta: bakisonmez78@gmail.com

---

**Başarılar!** 🎉
