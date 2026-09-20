# Betternak Ecosystem (IoPakan Smart Feeder)

Ekosistem website dan sistem manajemen konten untuk **Betternak • IoPakan Smart Feeder**.

## 📁 Struktur Direktori Proyek

```
betternak/
├── betternak-website/       # Frontend 3D Showcase (Three.js + GSAP + Vite)
│   ├── public/              # 3D assets (iopakan.glb), Draco decoder, data
│   ├── src/                 # WebGL scene, animations, contentLoader
│   ├── asset/               # Real photography & documentation
│   └── dist/                # Production build
└── betternak-admin/         # Content & Asset Management Dashboard (Node.js + Express)
    ├── data/                # Dynamic content store (content.json)
    ├── public/              # Modern responsive Admin SPA & media uploads
    └── server.js            # Express API & asset management
```

## 🚀 Fitur Utama

1. **Betternak Website:**
   - Interactive 3D CAD viewer dengan eksplorasi anatomi 8 komponen IoPakan.
   - Simulasi fisika gravitasi dan pelet pakan (*Pellet cascade*).
   - Galeri dokumentasi perakitan dan implementasi kandang mitra.
   - Sinkronisasi kendali smartphone IoT.
   - Hydration data dinamis terhubung langsung ke Admin CMS.

2. **Betternak Admin Panel:**
   - Manajemen seluruh teks hero, slogan, deskripsi, dan badge garansi.
   - Manajemen anatomi komponen, fitur, dan masalah klasik peternak (morph words).
   - Galeri dokumentasi: upload foto, edit judul, tag, keterangan, dan hapus foto.
   - Spesifikasi teknis dinamis (tambah, edit, dan hapus parameter mesin).
   - Pengaturan WhatsApp interaktif, pesan pemesanan otomatis, alamat, dan kontak.
   - Media Library & File Manager untuk upload gambar dan aset 3D.

## 🔐 Kredensial Default Admin
- **Password:** `betternak2026`

## 🛠️ Instalasi & Menjalankan Lokal

### 1. Menjalankan Website:
```bash
cd betternak-website
npm install
npm run dev
```

### 2. Menjalankan Admin Panel:
```bash
cd betternak-admin
npm install
npm start
```
Admin akan aktif di `http://localhost:3002`.
