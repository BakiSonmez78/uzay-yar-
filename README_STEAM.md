# Steam İçin Hazırlık ve Yükleme Rehberi

Oyununuz artık Steam platformuna yüklenebilir bir masaüstü uygulaması (Windows .exe) olarak yapılandırıldı.

## 1. Uygulamayı Paketleme (Build)

Oyununuzu `.exe` formatına dönüştürmek için şu komutu çalıştırın:

```bash
npm run electron:build
```

Bu işlem tamamlandığında, `dist_electron` klasörü içinde kurulum dosyasını (`Matematik Yarışması Setup 0.0.0.exe`) bulacaksınız.

## 2. Steamworks Ayarları

Steam'e oyun yüklemek için [Steamworks Partner](https://partner.steamgames.com/) hesabınız olması gerekir.

1.  **Uygulama Oluşturun**: Steamworks panelinde yeni bir uygulama oluşturun ve bir **App ID** alın.
2.  **Depot Ayarları**: SteamPipe > Depots bölümünde yeni bir depot oluşturun.
3.  **Yükleme**:
    *   `dist_electron/win-unpacked` klasöründeki içeriği (veya setup dosyasını değil, oyunun kurulu halini) Steam'e yüklemeniz önerilir.
    *   Genellikle `win-unpacked` klasörünü yükleyip, çalıştırılabilir dosya olarak `Matematik Yarışması.exe`'yi seçersiniz.

## 3. Çok Oyunculu (Multiplayer) Notu

Oyun şu anda **yerel sunucu** (Localhost) ile çalışacak şekilde paketlendi.
*   **Tek Oyunculu / Bot Modu**: Oyunu açtığınızda 5 saniye içinde rakip bulunamazsa otomatik olarak bir **Bot** (Robot 🤖) gelir. Bu sayede oyun tek başına oynanabilir.
*   **Gerçek Online**: Eğer arkadaşlarınızla internet üzerinden oynamak istiyorsanız, `server` klasöründeki kodları bir bulut sunucusuna (AWS, Heroku, DigitalOcean vb.) yüklemeniz ve `desktop/main.js` içindeki sunucu adresini güncellemeniz gerekir.

## 4. Test Etme

Geliştirme aşamasında oyunu masaüstü modunda test etmek için:

```bash
npm run electron:dev
```
