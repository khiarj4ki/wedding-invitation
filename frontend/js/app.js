const API = '';

const hariNama = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const bulanNama = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatTanggalPanjang(dateStr) {
  if (!dateStr) return "Tanggal menyusul";
  const d = new Date(dateStr + "T00:00:00");
  return `${hariNama[d.getDay()]}, ${d.getDate()} ${bulanNama[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTanggalPendek(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${bulanNama[d.getMonth()]} ${d.getFullYear()}`;
}

let settingsCache = null;

async function fetchSettings() {
  const res = await fetch(`${API}/api/settings`);
  return res.json();
}

async function fetchGuestBySlug(slug) {
  try {
    const res = await fetch(`${API}/api/guest/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    return res.json();
  } catch (e) { return null; }
}

function renderCountdown(dateStr, timeStr) {
  const box = document.getElementById('countdown');
  if (!box) return;
  const target = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
  const now = new Date();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  box.innerHTML = `
    <div class="cd-box"><span class="cd-num">${days}</span><span class="cd-label">Hari</span></div>
    <div class="cd-box"><span class="cd-num">${hours}</span><span class="cd-label">Jam</span></div>
    <div class="cd-box"><span class="cd-num">${mins}</span><span class="cd-label">Menit</span></div>
    <div class="cd-box"><span class="cd-num">${secs}</span><span class="cd-label">Detik</span></div>
  `;
}

function renderTimeline(items) {
  const box = document.getElementById('timeline');
  if (!box) return;
  box.innerHTML = items.map((item, i) => `
    <div class="tl-item scroll-anim delay-${(i % 3) + 1}">
      <p class="tl-title">${item.title}</p>
      <p class="tl-date">${formatTanggalPendek(item.date)}</p>
      <p class="tl-text">${item.text}</p>
    </div>
  `).join('');
  initScrollAnimations(); // Re-init observer untuk elemen baru
}

function renderBankAccounts(accounts) {
  const box = document.getElementById('bankGrid');
  if (!box) return;
  box.innerHTML = accounts.map((acc, i) => `
    <div class="bank-card scroll-anim delay-${(i % 3) + 1}">
      <p class="bank-name">${acc.bank}</p>
      <p class="bank-number">${acc.number}</p>
      <p class="bank-holder">a.n. ${acc.name}</p>
    </div>
  `).join('');
  initScrollAnimations();
}

function attendanceLabel(val) {
  return { hadir: 'Akan Hadir', tidak_hadir: 'Tidak Hadir', ragu: 'Masih Ragu' }[val] || val;
}

function timeAgo(iso) {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function renderWishes() {
  const [wishes, summary] = await Promise.all([
    fetch(`${API}/api/rsvp`).then(r => r.json()),
    fetch(`${API}/api/rsvp/summary`).then(r => r.json())
  ]);

  document.getElementById('wishesSummary').innerHTML = `
    <div class="stat"><b>${summary.hadir}</b><span>Akan Hadir</span></div>
    <div class="stat"><b>${summary.ragu}</b><span>Masih Ragu</span></div>
    <div class="stat"><b>${summary.tidak_hadir}</b><span>Tidak Hadir</span></div>
  `;

  document.getElementById('wishesList').innerHTML = wishes.map(w => `
    <div class="wish-item">
      <div class="wish-head">
        <span class="wish-name">${w.guestName}</span>
        <span class="wish-tag">${attendanceLabel(w.attendance)}</span>
      </div>
      <p class="wish-text">${w.message}</p>
      <p class="wish-date">${timeAgo(w.createdAt)}</p>
    </div>
  `).join('') || `<p class="section-lead">Jadilah yang pertama mengirim doa & ucapan.</p>`;
}

function setupRsvpForm(defaultName) {
  const form = document.getElementById('rsvpForm');
  const nameInput = document.getElementById('rsvpName');
  const slugInput = document.getElementById('rsvpSlug');
  const paxField = document.getElementById('paxField');

  if (defaultName) nameInput.value = defaultName;

  const attendanceRadios = form.querySelectorAll('input[name="attendance"]');
  attendanceRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'tidak_hadir' || e.target.value === 'ragu') {
        paxField.classList.add('hidden');
      } else {
        paxField.classList.remove('hidden');
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = document.getElementById('formNote');
    const attendance = form.querySelector('input[name="attendance"]:checked').value;
    const paxVal = form.querySelector('input[name="pax"]:checked')?.value || 1;

    const payload = {
      slug: slugInput.value,
      guestName: nameInput.value.trim(),
      attendance: attendance,
      pax: parseInt(paxVal),
      message: document.getElementById('rsvpMessage').value.trim()
    };

    try {
      const res = await fetch(`${API}/api/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }

      document.getElementById('rsvpMessage').value = '';
      note.style.color = "var(--gold)";
      note.textContent = 'Terima kasih, konfirmasi kehadiran sudah tersimpan.';
      renderWishes();
    } catch (err) {
      note.style.color = "#d98a8a";
      note.textContent = err.message || 'Gagal mengirim RSVP, silakan coba lagi.';
    }
  });
}

// =========================================
// INTERSECTION OBSERVER UTK ANIMASI SCROLL
// =========================================
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // observer.unobserve(entry.target); // Buka komen ini jika ingin animasi hanya jalan 1x (tidak berulang saat scroll atas/bawah)
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.scroll-anim').forEach(el => observer.observe(el));
}

// =========================================
// INISIALISASI HALAMAN
// =========================================
async function init() {
  const settings = await fetchSettings();
  settingsCache = settings;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('tamu');
  let guestName = 'Bapak/Ibu/Saudara/i';
  let guestSession = 1;

  if (slug) {
    const guest = await fetchGuestBySlug(slug);
    if (guest) {
      guestName = guest.name;
      guestSession = guest.session || 1;
      document.getElementById('rsvpSlug').value = slug;
    }
  }

  // Cover
  document.getElementById('coverNames').innerHTML = `${settings.brideName.split(' ')[0]} & ${settings.groomName.split(' ')[0]}`;
  document.getElementById('coverGuestName').textContent = guestName;

  // Hero & Session Badge
  document.getElementById('heroNames').innerHTML = `${settings.brideName.split(' ')[0]} <span>&</span> ${settings.groomName.split(' ')[0]}`;
  document.getElementById('heroQuote').textContent = settings.heroQuote || '';

  const heroBadge = document.getElementById('heroBadge');
  if (heroBadge) {
    heroBadge.textContent = `RESEPSI - SESI ${guestSession}`;
    heroBadge.classList.remove('hidden');
  }

  // Set Countdown untuk Sesi 1
  renderCountdown(settings.weddingDate, settings.sesi1Time);
  setInterval(() => renderCountdown(settings.weddingDate, settings.sesi1Time), 1000);

  // Mempelai
  document.getElementById('brideFullName').textContent = settings.brideFullName;
  document.getElementById('brideParents').innerHTML = `${settings.brideFather} & ${settings.brideMother}`;
  document.getElementById('brideAvatar').textContent = settings.brideName.charAt(0);
  document.getElementById('groomFullName').textContent = settings.groomFullName;
  document.getElementById('groomParents').innerHTML = `${settings.groomFather} & ${settings.groomMother}`;
  document.getElementById('groomAvatar').textContent = settings.groomName.charAt(0);

  // Cerita
  renderTimeline(settings.loveStory || []);

  // Acara (Render sesuai sesi tamu)
  const eventGrid = document.getElementById('eventGrid');
  let sessionTime = '';
  let sessionEnd = '';
  let eventName = 'Resepsi Pernikahan';

  if (guestSession === 1) {
    eventName = 'Akad & Resepsi';
    sessionTime = settings.sesi1Time;
    sessionEnd = settings.sesi1End;
  } else if (guestSession === 2) {
    sessionTime = settings.sesi2Time;
    sessionEnd = settings.sesi2End;
  } else if (guestSession === 3) {
    sessionTime = settings.sesi3Time;
    sessionEnd = settings.sesi3End;
  }

  eventGrid.innerHTML = `
    <div class="event-card scroll-anim" style="grid-column: 1 / -1; text-align: center;">
      <p class="event-name">${eventName}</p>
      <p class="event-time">${sessionTime} - ${sessionEnd} WIB</p>
      <p class="event-date">${formatTanggalPanjang(settings.weddingDate)}</p>
      <p class="event-venue">${settings.venueName}</p>
    </div>
  `;

  // Lokasi
  document.getElementById('venueAddress').textContent = `${settings.venueAddress}, ${settings.city}`;
  document.getElementById('mapsLink').href = settings.mapsUrl;

  // Kado
  renderBankAccounts(settings.bankAccounts || []);

  // Footer
  document.getElementById('footerNames').innerHTML = `${settings.brideName.split(' ')[0]} & ${settings.groomName.split(' ')[0]}`;

  // RSVP
  setupRsvpForm(guestName === 'Bapak/Ibu/Saudara/i' ? '' : guestName);
  renderWishes();

  // Inisialisasi Audio & Transisi Buka Undangan
  const bgMusic = document.getElementById('bgMusic');
  const musicBtn = document.getElementById('musicBtn');

  document.getElementById('openBtn').addEventListener('click', () => {
    document.getElementById('cover').classList.add('hidden');
    document.getElementById('site').classList.remove('hidden');
    window.scrollTo(0, 0);

    // Play Musik
    if (bgMusic) {
      bgMusic.play().catch(e => console.log("User belum interaksi, audio diblokir."));
      musicBtn.classList.remove('hidden'); // Munculkan tombol musik
    }
  });

  // Logika Tombol Play/Pause Musik
  musicBtn.addEventListener('click', () => {
    if (bgMusic.paused) {
      bgMusic.play();
      musicBtn.classList.remove('paused');
    } else {
      bgMusic.pause();
      musicBtn.classList.add('paused');
    }
  });

  // Jalankan Animasi Scroll
  initScrollAnimations();
}

init();