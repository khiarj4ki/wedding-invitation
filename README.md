# Undangan Pernikahan Digital — Backend + Frontend

Struktur proyek:

```
wedding-invitation/
├── backend/       Server API (Node.js + Express, penyimpanan JSON)
│   ├── server.js
│   ├── db.js
│   └── data/db.json     (dibuat otomatis saat pertama kali dijalankan)
└── frontend/      Halaman tamu (index.html) dan halaman admin (admin.html)
```

## Cara Menjalankan

1. Pastikan **Node.js** sudah terpasang (versi 18 ke atas).
2. Buka terminal di folder `backend`, lalu jalankan:
   ```
   cd backend
   npm install
   npm start
   ```
3. Server aktif di **http://localhost:3000**
   - Halaman tamu: `http://localhost:3000/`
   - Halaman admin: `http://localhost:3000/admin`

Frontend dilayani otomatis oleh server yang sama — tidak perlu server terpisah untuk frontend.

## Alur Pemakaian

1. Buka **halaman admin** → isi nama mempelai, tanggal, jam akad/resepsi, lokasi, dan cerita cinta → **Simpan Detail Acara**.
2. Tempel daftar nama tamu (satu nama per baris) → **Buat Link Sekaligus**.
3. Setiap tamu akan punya link unik, contoh:
   ```
   http://localhost:3000/?tamu=budi-dan-ani-bandung-js3x
   ```
   Salin dan kirim link ini ke tamu masing-masing lewat WhatsApp.
4. Saat tamu membuka link-nya, nama mereka otomatis muncul di cover undangan ("Kepada Yth. ...").
5. Tamu bisa mengisi konfirmasi kehadiran dan ucapan/doa di bagian bawah halaman — semua tersimpan di backend dan langsung tampil di wall ucapan serta di halaman admin.

## Menjadikannya Online (opsional)

Supaya tamu bisa membuka link dari mana saja (bukan cuma di komputer kamu), deploy folder `backend` (yang sudah menyertakan `frontend`) ke layanan hosting Node.js seperti Railway, Render, atau VPS, lalu arahkan domain kamu ke sana. Setelah online, ganti `localhost:3000` pada link tamu dengan domain kamu.

## Struktur Data (backend/data/db.json)

File ini dibuat otomatis dan berisi:
- `settings` — detail acara (nama mempelai, tanggal, lokasi, cerita cinta, rekening)
- `guests` — daftar tamu beserta slug/link personalnya
- `rsvps` — daftar ucapan & konfirmasi kehadiran

Untuk penggunaan produksi dengan banyak tamu, lapisan `db.js` bisa diganti dengan database sungguhan (PostgreSQL/MySQL/SQLite) tanpa mengubah `server.js`.

## Keamanan (penting sebelum dipakai publik)

Endpoint `/api/admin/*` saat ini **belum diproteksi password**. Sebelum dipakai secara nyata, tambahkan autentikasi sederhana (misalnya cek header token) di `server.js` agar orang lain tidak bisa mengubah detail acara atau menghapus tamu.
