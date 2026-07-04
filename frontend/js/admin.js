const API = '';

const fields = [
  'brideName', 'groomName', 'brideFullName', 'groomFullName',
  'brideFather', 'brideMother', 'groomFather', 'groomMother',
  'weddingDate',
  'sesi1Time', 'sesi1End', 'sesi2Time', 'sesi2End', 'sesi3Time', 'sesi3End',
  'venueName', 'venueAddress', 'city', 'mapsUrl', 'heroQuote'
];

async function loadSettings() {
  const res = await fetch(`${API}/api/settings`);
  const settings = await res.json();
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = settings[f] || '';
  });
}

async function saveSettings() {
  const payload = {};
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el) payload[f] = el.value;
  });
  const res = await fetch(`${API}/api/admin/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const note = document.getElementById('saveNote');
  note.textContent = res.ok ? 'Tersimpan.' : 'Gagal menyimpan.';
  setTimeout(() => note.textContent = '', 2000);
}

function buildGuestLink(slug) {
  // Otomatis diset untuk domain sesuai preferensimu
  return `https://undangan.khiarzaki.web.id/?tamu=${encodeURIComponent(slug)}`;
}

async function loadGuests() {
  const res = await fetch(`${API}/api/admin/guests`);
  const guests = await res.json();
  const box = document.getElementById('guestTable');
  box.innerHTML = guests.slice().reverse().map(g => `
    <div class="guest-row" data-id="${g.id}">
      <span class="g-name">${g.name} <span style="color:#C9A24B; font-size:10px; margin-left:6px;">(Sesi ${g.session || 1})</span></span>
      <span class="g-link">${buildGuestLink(g.slug)}</span>
      <button class="copy-btn" onclick="copyLink('${buildGuestLink(g.slug)}', this)">Salin</button>
      <button class="del-btn" onclick="deleteGuest('${g.id}')">Hapus</button>
    </div>
  `).join('') || `<p class="hint">Belum ada tamu.</p>`;
}

function copyLink(url, btn) {
  navigator.clipboard.writeText(url).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Tersalin';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1500);
  });
}

async function createGuests() {
  const raw = document.getElementById('guestNames').value;
  const session = document.getElementById('guestSession').value;
  const names = raw.split('\n').map(s => s.trim()).filter(Boolean);
  if (!names.length) return;

  await fetch(`${API}/api/admin/guests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names, session: parseInt(session) })
  });
  document.getElementById('guestNames').value = '';
  loadGuests();
}

async function deleteGuest(id) {
  await fetch(`${API}/api/admin/guests/${id}`, { method: 'DELETE' });
  loadGuests();
}

async function loadDashboard() {
  const res = await fetch(`${API}/api/rsvp/summary`);
  const summary = await res.json();

  document.getElementById('dashSesi1').textContent = `${summary.sesi1?.pax || 0} / 200 Pax`;
  document.getElementById('dashSesi2').textContent = `${summary.sesi2?.pax || 0} / 200 Pax`;
  document.getElementById('dashSesi3').textContent = `${summary.sesi3?.pax || 0} / 200 Pax`;
}

async function loadWishes() {
  const res = await fetch(`${API}/api/rsvp`);
  const wishes = await res.json();
  const box = document.getElementById('wishAdminList');
  box.innerHTML = wishes.map(w => `
    <div class="wish-admin-item">
      <div class="wa-head">
        <span>${w.guestName} (Sesi ${w.session || '-'})</span>
        <span>${w.attendance} ${w.attendance === 'hadir' ? '· ' + w.pax + ' Pax' : ''}</span>
      </div>
      <p class="wa-text">${w.message}</p>
      <p class="wa-date">${new Date(w.createdAt).toLocaleString('id-ID')}</p>
    </div>
  `).join('') || `<p class="hint">Belum ada ucapan masuk.</p>`;
}

function initAdmin() {
  loadSettings();
  loadGuests();
  loadWishes();
  loadDashboard();
}

initAdmin();