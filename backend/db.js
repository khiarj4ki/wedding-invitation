const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

const DEFAULT_DB = {
  settings: {
    groomName: '',
    groomFullName: '',
    groomFather: '',
    groomMother: '',
    brideName: '',
    brideFullName: '',
    brideFather: '',
    brideMother: '',
    weddingDate: '',
    sesi1Time: '',
    sesi1End: '',
    sesi2Time: '',
    sesi2End: '',
    sesi3Time: '',
    sesi3End: '',
    venueName: '',
    venueAddress: '',
    city: '',
    mapsUrl: '',
    loveStory: [],
    bankAccounts: [],
    heroQuote: ''
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

function addGuest(name, session = 1) {
  const db = readDb();
  const guest = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    slug: slugify(name),
    session: parseInt(session),
    createdAt: new Date().toISOString()
  };
  db.guests.push(guest);
  writeDb(db);
  return guest;
}

function addGuestsBulk(names, session) {
  const db = readDb();
  const created = names.map((name) => ({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    slug: slugify(name),
    session: parseInt(session) || 1,
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

function addRsvp({ guestName, attendance, message, pax, session }) {
  const db = readDb();
  const rsvp = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    guestName,
    attendance,
    message,
    pax,
    session,
    createdAt: new Date().toISOString()
  };
  db.rsvps.push(rsvp);
  writeDb(db);
  return rsvp;
}

function rsvpSummary() {
  const rsvps = readDb().rsvps;
  const summary = {
    total: rsvps.length,
    hadir: 0,
    tidak_hadir: 0,
    ragu: 0,
    sesi1: { pax: 0 },
    sesi2: { pax: 0 },
    sesi3: { pax: 0 }
  };
  rsvps.forEach((r) => {
    summary[r.attendance]++;
    if (r.attendance === 'hadir' && r.session) {
      summary[`sesi${r.session}`].pax += parseInt(r.pax) || 0;
    }
  });
  return summary;
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