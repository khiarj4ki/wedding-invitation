const API = '';

const fields = [
  'brideName','groomName','brideFullName','groomFullName',
  'brideFather','brideMother','groomFather','groomMother',
  'weddingDate','akadTime','akadEnd','resepsiTime','resepsiEnd',
  'venueName','venueAddress','city','mapsUrl','heroQuote'
];

async function loadSettings(){
  const res = await fetch(`${API}/api/settings`);
  const settings = await res.json();
  fields.forEach(f => {
    const el = document.getElementById(f);
    if(el) el.value = settings[f] || '';
  });
}

async function saveSettings(){
  const payload = {};
  fields.forEach(f => {
    const el = document.getElementById(f);
    if(el) payload[f] = el.value;
  });
  const res = await fetch(`${API}/api/admin/settings`, {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  const note = document.getElementById('saveNote');
  note.textContent = res.ok ? 'Tersimpan.' : 'Gagal menyimpan.';
  setTimeout(() => note.textContent = '', 2000);
}

function buildGuestLink(slug){
  return `${window.location.origin}/?tamu=${encodeURIComponent(slug)}`;
}

async function loadGuests(){
  const res = await fetch(`${API}/api/admin/guests`);
  const guests = await res.json();
  const box = document.getElementById('guestTable');
  box.innerHTML = guests.slice().reverse().map(g => `
    <div class="guest-row" data-id="${g.id}">
      <span class="g-name">${g.name}</span>
      <span class="g-link">${buildGuestLink(g.slug)}</span>
      <button class="copy-btn" onclick="copyLink('${buildGuestLink(g.slug)}', this)">Salin</button>
      <button class="del-btn" onclick="deleteGuest('${g.id}')">Hapus</button>
    </div>
  `).join('') || `<p class="hint">Belum ada tamu.</p>`;
}

function copyLink(url, btn){
  navigator.clipboard.writeText(url).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Tersalin';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1500);
  });
}

async function createGuests(){
  const raw = document.getElementById('guestNames').value;
  const names = raw.split('\n').map(s => s.trim()).filter(Boolean);
  if(!names.length) return;
  await fetch(`${API}/api/admin/guests`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ names })
  });
  document.getElementById('guestNames').value = '';
  loadGuests();
}

async function deleteGuest(id){
  await fetch(`${API}/api/admin/guests/${id}`, { method:'DELETE' });
  loadGuests();
}

async function loadWishes(){
  const res = await fetch(`${API}/api/rsvp`);
  const wishes = await res.json();
  const box = document.getElementById('wishAdminList');
  box.innerHTML = wishes.map(w => `
    <div class="wish-admin-item">
      <div class="wa-head"><span>${w.guestName}</span><span>${w.attendance}</span></div>
      <p class="wa-text">${w.message}</p>
      <p class="wa-date">${new Date(w.createdAt).toLocaleString('id-ID')}</p>
    </div>
  `).join('') || `<p class="hint">Belum ada ucapan masuk.</p>`;
}

loadSettings();
loadGuests();
loadWishes();
