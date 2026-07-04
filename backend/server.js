const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===================== PUBLIC API =====================

app.get('/api/settings', (req, res) => {
  res.json(db.getSettings());
});

app.get('/api/guest/:slug', (req, res) => {
  const guest = db.getGuestBySlug(req.params.slug);
  if (!guest) {
    return res.status(404).json({ error: 'Link tamu tidak ditemukan.' });
  }
  res.json(guest);
});

app.get('/api/rsvp', (req, res) => {
  res.json(db.listRsvps());
});

app.get('/api/rsvp/summary', (req, res) => {
  res.json(db.rsvpSummary());
});

app.post('/api/rsvp', (req, res) => {
  const { slug, guestName, attendance, message, pax } = req.body;
  if (!guestName || !attendance || !message) {
    return res.status(400).json({ error: 'Nama, status kehadiran, dan ucapan wajib diisi.' });
  }
  if (!['hadir', 'tidak_hadir', 'ragu'].includes(attendance)) {
    return res.status(400).json({ error: 'Status kehadiran tidak valid.' });
  }

  // Penentuan Sesi & Validasi Pax
  const guest = db.getGuestBySlug(slug);
  const session = guest ? guest.session : 1;

  if (attendance === 'hadir') {
    const summary = db.rsvpSummary();
    const currentPax = summary[`sesi${session}`].pax;
    const requestedPax = parseInt(pax) || 1;

    if (currentPax + requestedPax > 200) {
      const sisa = 200 - currentPax;
      return res.status(400).json({ error: `Maaf, Sesi ${session} sudah penuh (Tersisa ${sisa} Pax).` });
    }
  }

  const rsvp = db.addRsvp({
    guestName,
    attendance,
    message,
    pax: attendance === 'hadir' ? parseInt(pax) : 0,
    session
  });
  res.status(201).json(rsvp);
});

// ===================== ADMIN API =====================

app.put('/api/admin/settings', (req, res) => {
  const updated = db.updateSettings(req.body || {});
  res.json(updated);
});

app.get('/api/admin/guests', (req, res) => {
  res.json(db.listGuests());
});

app.post('/api/admin/guests', (req, res) => {
  const { name, names, session } = req.body;
  if (Array.isArray(names) && names.length) {
    const created = db.addGuestsBulk(names.map((n) => n.trim()).filter(Boolean), session);
    return res.status(201).json(created);
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nama tamu wajib diisi.' });
  }
  const guest = db.addGuest(name.trim(), session);
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
});