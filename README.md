# Matematik Uzay Yarışı (Math Space Race) 🚀➕✖️

**Matematik Uzay Yarışı**, çocukların ve gençlerin matematik işlemlerini hızla çözerek yarıştığı, uzay temalı, gerçek zamanlı çok oyunculu (multiplayer) bir web oyunudur.

## 🌟 Özellikler

*   **Gerçek Zamanlı Multiplayer:** Socket.io ile anlık rakip eşleşmesi ve yarışma.
*   **Akıllı Bot Desteği:** Rakip bulunamadığında otomatik devreye giren ve gerçekçi bir deneyim sunan yapay zeka botu.
*   **Çeşitli Oyun Modları:** Toplama (+), Çıkarma (-), Çarpma (×), Bölme (÷) ve Karışık mod.
*   **Uzay Temalı Arayüz:** Sürükleyici görsel efektler ve uzay teması.
*   **Sıralama ve Puanlama:** Doğru cevaplarla puan toplama ve streak (üst üste doğru) bonusları.

## 🚀 Kurulum ve Çalıştırma

Bu projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

### Gereksinimler
*   Node.js (v14 veya üzeri)
*   npm veya yarn

### Adımlar

1.  Proje dosyalarını indirin:
    ```bash
    git clone https://github.com/MathHeroes/matematik-uzay-yarisi.git
    cd matematik-uzay-yarisi
    ```

2.  Bağımlılıkları yükleyin:
    ```bash
    npm install
    cd server
    npm install
    cd ..
    ```

3.  Geliştirme sunucularını başlatın (hem istemci hem sunucu):
    ```bash
    # Ana dizinde
    npm run dev
    
    # Yeni bir terminalde, sunucuyu başlatmak için:
    node server/index.js
    ```
    *Not: Genellikle `npm run dev` komutu, `concurrently` ile hem frontend hem backend'i aynı anda başlatacak şekilde yapılandırılmış olabilir. `package.json` scripts kısmını kontrol edebilirsiniz.*

4.  Tarayıcınızda oyunu görüntüleyin:
    `http://localhost:5173` adresine gidin.

## 🛠️ Teknolojiler

*   **Frontend:** React, Vite
*   **Backend:** Node.js, Express, Socket.io
*   **Paketleme:** Electron (Masaüstü sürümü için), Capacitor (Mobil odaklı geliştirmeler için)

## 📱 İletişim

Sorularınız veya geri bildirimleriniz için geliştirici ekibiyle iletişime geçebilirsiniz.

---
*İyi Eğlenceler ve Başarılar!* 🌌
