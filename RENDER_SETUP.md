# Render.com Backend Kurulumu (5 Dakika)

## Adım 1: Render'a Git
1. [render.com](https://render.com) - GitHub ile giriş yap
2. **New +** → **Web Service** seç

## Adım 2: Repo Seç
- GitHub reponuzu seçin: `BakiSonmez78/uzay-yar-`

## Adım 3: Ayarlar
- **Name**: `uzay-yarisi-backend`
- **Root Directory**: boş bırak
- **Build Command**: `npm install`
- **Start Command**: `node server/index.js`
- **Plan**: Free seçin

## Adım 4: Environment Variables (Önemli!)
"Advanced" kısmını aç ve şunu ekle:
- **Key**: `PORT`
- **Value**: `3001`

## Adım 5: Deploy
- **Create Web Service** butonuna bas
- 2-3 dakika bekle

## Adım 6: URL'i Kopyala
Deploy bitince sana şöyle bir URL verecek:
`https://uzay-yarisi-backend.onrender.com`

**BU URL'İ BANA YAPIŞTIRIR MISIN?**
