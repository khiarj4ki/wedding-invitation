// server.js
// Backend API untuk Undangan Pernikahan Digital.
//
// Menjalankan:
//   cd backend && npm install && npm start
// Server berjalan di http://localhost:3000
// Frontend statis (folder ../frontend) juga otomatis dilayani oleh server ini.

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===================== PUBLIC API (dipakai frontend tamu) =====================

// Ambil detail acara pernikahan (nama mempelai, tanggal, lokasi, cerita, dst)
app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

// Resolve link personal tamu: /api/guest/:slug -> { name }
app.get('/api/guest/:slug', (req, res) => {
  const guest = db.getGuestBySlug(req.params.slug);
  if (!guest) {
    return res.status(404).json({ error: 'Link tamu tidak ditemukan.' });
  }
  res.json(guest);
});

// Ambil daftar ucapan & doa (wall of wishes), terbaru dulu
app.get('/api/rsvp', (req, res) => {
  res.json(db.listRsvps());
});

// Ringkasan jumlah konfirmasi kehadiran
app.get('/api/rsvp/summary', (req, res) => {
  res.json(db.rsvpSummary());
});

// Kirim ucapan + konfirmasi kehadiran
app.post('/api/rsvp', (req, res) => {
  const { guestName, attendance, message } = req.body;
  if (!guestName || !attendance || !message) {
    return res.status(400).json({ error: 'Nama, status kehadiran, dan ucapan wajib diisi.' });
  }
  if (!['hadir', 'tidak_hadir', 'ragu'].includes(attendance)) {
    return res.status(400).json({ error: 'Status kehadiran tidak valid.' });
  }
  const rsvp = db.addRsvp({ guestName, attendance, message });
  res.status(201).json(rsvp);
});

// ===================== ADMIN API (dipakai admin.html) =====================
// Catatan: untuk penggunaan nyata, lindungi endpoint /api/admin/* dengan
// autentikasi (misalnya token/password) sebelum dipakai secara publik.

app.put('/api/admin/settings', (req, res) => {
  const updated = db.updateSettings(req.body || {});
  res.json(updated);
});

app.get('/api/admin/guests', (req, res) => {
  res.json(db.listGuests());
});

app.post('/api/admin/guests', (req, res) => {
  const { name, names } = req.body;
  if (Array.isArray(names) && names.length) {
    const created = db.addGuestsBulk(names.map((n) => n.trim()).filter(Boolean));
    return res.status(201).json(created);
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nama tamu wajib diisi.' });
  }
  const guest = db.addGuest(name.trim());
  res.status(201).json(guest);
});

app.delete('/api/admin/guests/:id', (req, res) => {
  const ok = db.deleteGuest(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Tamu tidak ditemukan.' });
  res.status(204).end();
});

// ===================== FRONTEND STATIS =====================
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✔ Server undangan berjalan di http://localhost:${PORT}`);
  console.log(`  Halaman tamu : http://localhost:${PORT}/`);
  console.log(`  Halaman admin: http://localhost:${PORT}/admin`);
});
