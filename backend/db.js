// db.js
// Penyimpanan data sederhana berbasis file JSON.
// Untuk produksi dengan trafik tinggi, ganti lapisan ini dengan database
// sungguhan (PostgreSQL, MySQL, SQLite, dst) — bentuk fungsi di bawah
// sengaja dibuat mirip query DB supaya gampang diganti nanti.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

const DEFAULT_DB = {
  settings: {
    groomName: 'Raka Pratama',
    groomFullName: 'Raka Pratama, S.T.',
    groomFather: 'Bapak Sutrisno Hadi',
    groomMother: 'Ibu Wulandari',
    brideName: 'Cinta Amelia',
    brideFullName: 'Cinta Amelia, S.Psi.',
    brideFather: 'Bapak Hendra Gunawan',
    brideMother: 'Ibu Kartika Sari',
    weddingDate: '2026-09-12',
    akadTime: '08:00',
    akadEnd: '09:30',
    resepsiTime: '11:00',
    resepsiEnd: '14:00',
    venueName: 'Gedung Pertiwi Convention Hall',
    venueAddress: 'Jl. Melati Raya No. 21, Sleman',
    city: 'Yogyakarta',
    mapsUrl: 'https://maps.google.com/?q=Yogyakarta',
    loveStory: [
      { title: 'Pertama Berjumpa', date: '2019-02-14', text: 'Bertemu pertama kali di sebuah acara kampus, obrolan singkat yang ternyata membekas cukup lama.' },
      { title: 'Menjalin Kedekatan', date: '2020-06-01', text: 'Komunikasi yang semakin intens membawa kami pada keputusan untuk saling mengenal lebih jauh.' },
      { title: 'Lamaran', date: '2025-11-08', text: 'Restu dari kedua keluarga menjadi awal langkah kami menuju hari bahagia ini.' }
    ],
    bankAccounts: [
      { bank: 'Bank Mandiri', number: '1320006284864', name: 'Raka Pratama' },
      { bank: 'Bank BCA', number: '4560012345', name: 'Cinta Amelia' }
    ],
    heroQuote: 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan pasangan untukmu agar kamu merasa tenteram kepadanya.'
  },
  guests: [],
  rsvps: []
};

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ---------- Settings ----------
function getSettings() {
  return readDb().settings;
}

function updateSettings(partial) {
  const db = readDb();
  db.settings = { ...db.settings, ...partial };
  writeDb(db);
  return db.settings;
}

// ---------- Guests ----------
function slugify(name) {
  const base = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

function listGuests() {
  return readDb().guests;
}

function addGuest(name) {
  const db = readDb();
  const guest = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    slug: slugify(name),
    createdAt: new Date().toISOString()
  };
  db.guests.push(guest);
  writeDb(db);
  return guest;
}

function addGuestsBulk(names) {
  const db = readDb();
  const created = names.map((name) => ({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    slug: slugify(name),
    createdAt: new Date().toISOString()
  }));
  db.guests.push(...created);
  writeDb(db);
  return created;
}

function getGuestBySlug(slug) {
  return readDb().guests.find((g) => g.slug === slug) || null;
}

function deleteGuest(id) {
  const db = readDb();
  const before = db.guests.length;
  db.guests = db.guests.filter((g) => g.id !== id);
  writeDb(db);
  return db.guests.length < before;
}

// ---------- RSVP / Ucapan ----------
function listRsvps() {
  return readDb().rsvps.slice().reverse();
}

function addRsvp({ guestName, attendance, message }) {
  const db = readDb();
  const rsvp = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    guestName,
    attendance, // 'hadir' | 'tidak_hadir' | 'ragu'
    message,
    createdAt: new Date().toISOString()
  };
  db.rsvps.push(rsvp);
  writeDb(db);
  return rsvp;
}

function rsvpSummary() {
  const rsvps = readDb().rsvps;
  return {
    total: rsvps.length,
    hadir: rsvps.filter((r) => r.attendance === 'hadir').length,
    tidak_hadir: rsvps.filter((r) => r.attendance === 'tidak_hadir').length,
    ragu: rsvps.filter((r) => r.attendance === 'ragu').length
  };
}

module.exports = {
  getSettings,
  updateSettings,
  listGuests,
  addGuest,
  addGuestsBulk,
  getGuestBySlug,
  deleteGuest,
  listRsvps,
  addRsvp,
  rsvpSummary
};
