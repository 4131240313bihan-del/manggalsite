/* === script.js
   Manajemen client-side (demo) untuk portal Manggala:
   - Menyimpan berita, pengumuman, materi, galeri, pesan ke localStorage (demo)
   - Render dinamis konten pada index.html
   - Simple UI helpers (tabs, mobile nav, scrolling)
*/

/* ---------- Utilities ---------- */
const JURUSAN = ['ASP','MKN','MAP'];

const uid = ()=> 'id-'+Math.random().toString(36).slice(2,9);
const save = (k, v)=> localStorage.setItem(k, JSON.stringify(v));
const load = (k, fallback)=> {
  try { const v = JSON.parse(localStorage.getItem(k)); return v===null?fallback:v; }
  catch(e) { return fallback; }
};

/* ---------- Init state & boot ---------- */
function initState(){
  // set year
  document.getElementById('curYear').textContent = new Date().getFullYear();

  // seed news if empty
  if(!localStorage.getItem('news')){
    save('news',[ 
      {id:uid(), title:'Rapat Angkatan - Persiapan Wisuda', date:'2025-09-20', excerpt:'Rapat koordinasi panitia wisuda dilaksanakan untuk menyusun timeline.', img:''},
      {id:uid(), title:'Bakti Sosial', date:'2025-08-15', excerpt:'Bakti sosial melibatkan anggota untuk kegiatan masyarakat.', img:''}
    ]);
  }

  if(!localStorage.getItem('announcements')) save('announcements', []);
  if(!localStorage.getItem('gallery')) save('gallery', []);
  if(!localStorage.getItem('membersCount')) save('membersCount', 112);
  if(!localStorage.getItem('eventsCount')) save('eventsCount', 14);

  // ensure jurusan buckets exist
  JURUSAN.forEach(j=>{
    if(!localStorage.getItem(`materials_${j}`)) save(`materials_${j}`, []);
    if(!localStorage.getItem(`announcements_${j}`)) save(`announcements_${j}`, []);
  });

  renderAll();
}

/* ---------- Render All ---------- */
function renderAll(){
  renderNews();
  renderAnnouncements();
  renderJurusanContent('ASP');
  renderGallery();
  updateProfileCounts();
  updateTopAnnouncement();
}

/* ---------- News ---------- */
function renderNews(){
  const grid = document.getElementById('newsGrid');
  const news = load('news', []);
  grid.innerHTML = '';
  if(news.length===0){
    grid.innerHTML = '<div class="muted">Belum ada berita.</div>';
    return;
  }
  news.forEach(n=>{
    const card = document.createElement('article');
    card.className = 'card';
    const imgHtml = n.img ? `<img class="news-image" src="${n.img}" alt="${n.title}">` : '';
    card.innerHTML = `
      ${imgHtml}
      <h4 style="margin:6px 0 6px">${escapeHtml(n.title)}</h4>
      <div class="news-meta">${escapeHtml(n.date)}</div>
      <p class="muted" style="margin-top:8px">${escapeHtml(n.excerpt)}</p>
    `;
    grid.appendChild(card);
  });
}

function seedSampleNews(){
  save('news', [
    {id:uid(), title:'Rapat Angkatan - Persiapan Wisuda', date:'2025-09-20', excerpt:'Rapat koordinasi panitia wisuda dilaksanakan untuk menyusun timeline dan pembagian tugas.', img:''},
    {id:uid(), title:'Bakti Sosial: Bersama untuk Masyarakat', date:'2025-08-15', excerpt:'Aksi bakti sosial melibatkan 50 anggota angkatan untuk membantu pembersihan dan donor darah.', img:''},
    {id:uid(), title:'Pertandingan Futsal Internal', date:'2025-07-08', excerpt:'Pertandingan persahabatan antar jurusan untuk meningkatkan sportivitas.', img:''}
  ]);
  renderNews();
  updateProfileCounts();
}

/* ---------- Announcements (global) ---------- */
function showAnnouncementForm(){ document.getElementById('annForm').classList.remove('hidden'); document.getElementById('annTitle').focus(); }
function hideAnnouncementForm(){ document.getElementById('annForm').classList.add('hidden'); }

function saveAnnouncement(){
  const t = document.getElementById('annTitle').value.trim();
  const d = document.getElementById('annDate').value || new Date().toISOString().slice(0,10);
  const b = document.getElementById('annBody').value.trim();
  if(!t || !b){ alert('Isi judul dan isi pengumuman.'); return; }
  const arr = load('announcements', []);
  arr.unshift({id:uid(), title:t, date:d, body:b});
  save('announcements', arr);
  document.getElementById('annTitle').value=''; document.getElementById('annBody').value='';
  hideAnnouncementForm();
  renderAnnouncements(); updateTopAnnouncement();
}

function renderAnnouncements(){
  const container = document.getElementById('annList');
  const arr = load('announcements', []);
  if(arr.length===0){ container.innerHTML = '<div class="muted">Belum ada pengumuman resmi.</div>'; return; }
  container.innerHTML = '';
  arr.forEach(a=>{
    const el = document.createElement('div'); el.style.padding='10px 0';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px">
        <strong>${escapeHtml(a.title)}</strong>
        <div class="small muted">${escapeHtml(a.date)}</div>
      </div>
      <div class="muted" style="margin-top:6px">${escapeHtml(a.body)}</div>
      <div style="margin-top:8px">
        <button class="btn btn-muted" onclick="deleteAnnouncement('${a.id}')">Hapus</button>
      </div>
    `;
    container.appendChild(el);
  });
}

function deleteAnnouncement(id){
  if(!confirm('Hapus pengumuman ini?')) return;
  let arr = load('announcements', []);
  arr = arr.filter(x=>x.id!==id);
  save('announcements', arr);
  renderAnnouncements();
  updateTopAnnouncement();
}

/* ---------- Jurusan (materials & jurusan announcements) ---------- */
/* ---------- Jurusan (materials & jurusan announcements) ---------- */
function switchTab(e, j){
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  e.target.classList.add('active');
  renderJurusanContent(j);
}

function renderJurusanContent(j){
  const container = document.getElementById('tabContent');
  container.innerHTML = '';

  // Dummy data per jurusan (bisa ditambah sesuai kebutuhan)
  const dummyMaterials = {
    ASP: [
      { name: "Modul Dasar ASP.pdf", url: "#" },
      { name: "Latihan Soal ASP.docx", url: "#" },
      { name: "Contoh Kasus ASP.xlsx", url: "#" },
      { name: "Ringkasan ASP.pptx", url: "#" }
    ],
    MKN: [
      { name: "Ringkasan Pajak.pdf", url: "#" },
      { name: "Contoh Kasus.xlsx", url: "#" },
      { name: "Tugas Pajak.docx", url: "#" }
    ],
    MAP: [
      { name: "Teori Akuntansi.pdf", url: "#" },
      { name: "Ebook Manajemen.pdf", url: "#" },
      { name: "Contoh Laporan.xlsx", url: "#" },
      { name: "Presentasi MAP.pptx", url: "#" }
    ]
  };

  const dummyAnns = {
    ASP: [
      { title: "Ujian Tengah Semester", body: "UTS akan dilaksanakan minggu depan, persiapkan materi bab 1-5." },
      { title: "Tugas Kelompok", body: "Kumpulkan laporan akhir paling lambat tanggal 20." },
      { title: "Quiz Mingguan", body: "Quiz online akan dibuka Jumat jam 19.00 WIB." },
      { title: "Praktikum", body: "Praktikum tambahan hari Sabtu jam 08.00 WIB." }
    ],
    MKN: [
      { title: "Praktikum Pajak", body: "Praktikum dimulai Senin depan, bawa laptop dan kalkulator." },
      { title: "Deadline Laporan", body: "Kumpulkan laporan praktikum pajak minggu ini." }
    ],
    MAP: [
      { title: "Pengumpulan Proposal", body: "Proposal penelitian dikumpulkan via email dosen pembimbing." },
      { title: "Seminar Kelas", body: "Akan diadakan seminar internal minggu depan." },
      { title: "UTS MAP", body: "UTS dijadwalkan tanggal 25, materi bab 1-6." }
    ]
  };

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div style="display:flex;gap:24px;flex-wrap:wrap">
      <div style="flex:1;min-width:280px">
        <h3>📂 Materi & Dokumen — ${j}</h3>
        <div id="materialsList_${j}" class="scroll-list"></div>
      </div>

      <div style="flex:1;min-width:280px">
        <h3>📢 Pengumuman Jurusan — ${j}</h3>
        <div id="jurAnnList_${j}" class="scroll-list"></div>
      </div>
    </div>
  `;
  container.appendChild(wrapper);

  // Render dummy materials
  const matList = document.getElementById(`materialsList_${j}`);
  (dummyMaterials[j] || []).forEach(m => {
    const item = document.createElement("div");
    item.className = "card small";
    item.style.flex = "0 0 200px"; // Lebar fix agar scroll bekerja
    item.style.marginRight = "12px";
    item.innerHTML = `📄 <a href="${m.url}" target="_blank">${m.name}</a>`;
    matList.appendChild(item);
  });

  // Render dummy announcements
  const annList = document.getElementById(`jurAnnList_${j}`);
  (dummyAnns[j] || []).forEach(a => {
    const item = document.createElement("div");
    item.className = "card";
    item.style.flex = "0 0 220px";
    item.style.marginRight = "12px";
    item.innerHTML = `<strong>${a.title}</strong><p class="muted">${a.body}</p>`;
    annList.appendChild(item);
  });
}


/* Jurusan-specific announcements */
function addJurAnn(j){
  const t = document.getElementById(`jurAnnTitle_${j}`).value.trim();
  const b = document.getElementById(`jurAnnBody_${j}`).value.trim();
  if(!t || !b){ alert('Isi judul & isi pengumuman jurusan.'); return; }
  const arr = load(`announcements_${j}`, []);
  arr.unshift({id:uid(), title:t, date:new Date().toISOString().slice(0,10), body:b});
  save(`announcements_${j}`, arr);
  document.getElementById(`jurAnnTitle_${j}`).value=''; document.getElementById(`jurAnnBody_${j}`).value='';
  renderJurAnnList(j);
}

function renderJurAnnList(j){
  const arr = load(`announcements_${j}`, []);
  const container = document.getElementById(`jurAnnList_${j}`);
  container.innerHTML = '';
  if(!arr || arr.length===0){ container.innerHTML = '<div class="muted">Belum ada pengumuman jurusan.</div>'; return; }
  arr.forEach(a=>{
    const el = document.createElement('div'); el.style.padding='8px 0';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between"><strong>${escapeHtml(a.title)}</strong><div class="small muted">${escapeHtml(a.date)}</div></div>
      <div class="muted">${escapeHtml(a.body)}</div>
      <div style="margin-top:8px"><button class="btn" onclick="deleteJurAnn('${j}','${a.id}')">Hapus</button></div>
    `;
    container.appendChild(el);
  });
}

function deleteJurAnn(j,id){
  if(!confirm('Hapus pengumuman?')) return;
  let arr = load(`announcements_${j}`, []);
  arr = arr.filter(x=>x.id!==id);
  save(`announcements_${j}`, arr);
  renderJurAnnList(j);
}

/* ---------- Gallery ---------- */
function renderGallery(){
  const g = load('gallery', []);
  const cont = document.getElementById('galleryGrid');
  cont.innerHTML = '';
  if(!g || g.length===0){ cont.innerHTML = '<div class="muted">Galeri kosong. (Demo)</div>'; return; }
  g.slice(0,12).forEach(img=>{
    const el = document.createElement('div');
    el.innerHTML = `<img src="${img.data}" alt="${escapeHtml(img.name)}"><div class="small muted" style="margin-top:6px">${escapeHtml(img.date)}</div>`;
    cont.appendChild(el);
  });
}

/* ---------- Contacts (local) ---------- */
function sendContact(){
  const n = document.getElementById('contactName').value.trim();
  const e = document.getElementById('contactEmail').value.trim();
  const m = document.getElementById('contactMessage').value.trim();
  if(!n || !m){ alert('Isi nama dan pesan.'); return; }
  const msgs = load('messages', []);
  msgs.unshift({id:uid(), name:n, email:e, message:m, date:new Date().toISOString()});
  save('messages', msgs);
  alert('Pesan terkirim. Terima kasih.');
  document.getElementById('contactName').value=''; document.getElementById('contactEmail').value=''; document.getElementById('contactMessage').value='';
}

function showContacts(){
  const msgs = load('messages', []);
  if(!msgs || msgs.length===0) return alert('Belum ada pesan.');
  let s = 'Pesan masuk:\\n\\n';
  msgs.forEach(m=>{
    s += `${m.date} — ${m.name} (${m.email || '-'})\\n${m.message}\\n----------------\\n`;
  });
  alert(s);
}

/* ---------- Small UI helpers ---------- */
function toggleMobileNav(){
  const el = document.getElementById('mobileNav');
  el.classList.toggle('hidden');
}

function scrollToSection(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.scrollIntoView({behavior:'smooth', block:'start'});
  document.getElementById('mobileNav').classList.add('hidden');
}

function openJurusan(j){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.j===j));
  renderJurusanContent(j);
  scrollToSection('jurusan');
}

/* ---------- Profile & Announcement top ---------- */
function updateProfileCounts(){
  const members = load('membersCount', 112);
  const events = load('eventsCount', 14);
  let files = 0;
  JURUSAN.forEach(j=>{
    files += (load(`materials_${j}`, []) || []).length;
  });
  document.getElementById('countMembers').textContent = members;
  document.getElementById('countEvents').textContent = events;
  document.getElementById('countFiles').textContent = files;
}

function updateTopAnnouncement(){
  const arr = load('announcements', []);
  const top = document.getElementById('topAnnouncement');
  top.textContent = arr.length ? `${arr[0].title} — ${arr[0].date}` : 'Belum ada pengumuman resmi.';
  document.getElementById('lastUpdated').textContent = arr.length ? arr[0].date : '-';
}

/* ---------- Sanitizer simple ---------- */
function escapeHtml(str = ''){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

/* ---------- Boot ---------- */
window.addEventListener('DOMContentLoaded', ()=>{
  initState();
  console.log('Portal Manggala siap — versi demo (localStorage).');
});
const hero = document.querySelector('.hero');
let current = 0;
let next = 1;

const heroImages = [
  'Assets/hero .jpg',
  'img/bg2.jpg',
  'img/bg3.jpg'
];

// Inisialisasi
hero.style.setProperty('--bg1', `url(${heroImages[current]})`);
hero.style.setProperty('--bg2', `url(${heroImages[next]})`);
hero.style.setProperty('--active', 1);

function changeHeroBackground() {
  const before = getComputedStyle(hero, '::before');
  const after = getComputedStyle(hero, '::after');

  // Swap background
  hero.style.setProperty('--bg2', `url(${heroImages[next]})`);

  // Trigger fade
  hero.classList.add('fade');
  setTimeout(() => {
    // Reset layer setelah transisi
    current = next;
    next = (next + 1) % heroImages.length;
    hero.style.setProperty('--bg1', `url(${heroImages[current]})`);
    hero.classList.remove('fade');
  }, 1500);
}

// Ganti tiap 7 detik
setInterval(changeHeroBackground, 7000);
