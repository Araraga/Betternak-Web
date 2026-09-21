// Betternak Admin Tab Renderers

function renderActiveTab() {
  const container = document.getElementById('tabsContainer');
  if (!container || !contentData) return;
  if (activeTab === 'tab-hero') renderHeroTab(container);
  else if (activeTab === 'tab-cards') renderCardsTab(container);
  else if (activeTab === 'tab-gallery') renderGalleryTab(container);
  else if (activeTab === 'tab-specs') renderSpecsTab(container);
  else if (activeTab === 'tab-contact') renderContactTab(container);
  else if (activeTab === 'tab-media') renderMediaTab(container);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str || '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderHeroTab(container) {
  const g = contentData.general || {};
  const h = contentData.hero || {};
  container.innerHTML = `
    <div class="glass-panel p-6 rounded-2xl space-y-5">
      <div class="border-b border-white/10 pb-3">
        <h2 class="text-xl font-bold font-display text-white">⚡ Hero &amp; Brand Identity</h2>
        <p class="text-xs text-slate-400">Pengaturan judul utama, logo teks, dan pembuka website.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Judul Tab Browser</label>
          <input type="text" id="inp-site-title" value="${escapeHtml(g.site_title||'')}" class="w-full px-3 py-2 rounded-xl glass-input text-sm">
        </div>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Badge Hero Atas</label>
          <input type="text" id="inp-hero-badge" value="${escapeHtml(h.badge||'')}" class="w-full px-3 py-2 rounded-xl glass-input text-sm">
        </div>
      </div>
      <div>
        <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Judul Utama Hero (H1)</label>
        <input type="text" id="inp-hero-title" value="${escapeHtml(h.title||'')}" class="w-full px-3 py-2 rounded-xl glass-input text-sm font-bold text-emerald-400">
      </div>
      <div>
        <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Deskripsi Hero</label>
        <textarea id="inp-hero-sub" rows="3" class="w-full px-3 py-2 rounded-xl glass-input text-sm">${escapeHtml(h.subtitle||'')}</textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Logo Image URL</label>
          <div class="flex gap-2">
            <input type="text" id="inp-logo-url" value="${escapeHtml(g.logo_url||'')}" class="flex-1 px-3 py-2 rounded-xl glass-input text-xs">
            <label class="px-3 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl cursor-pointer shrink-0">
              Upload
              <input type="file" class="hidden" id="upload-logo-inp" accept="image/*">
            </label>
          </div>
          <div class="mt-2 flex items-center gap-3">
            <img id="logo-preview-img" src="${escapeHtml(g.logo_url || '/asset/logoteksbetternak.png')}" class="h-8 max-w-[140px] object-contain bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10" onerror="this.src='/asset/logoteksbetternak.png'">
            <span class="text-[11px] text-slate-400 font-mono">Live Preview Logo</span>
          </div>
        </div>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Badge Ready Stock</label>
          <input type="text" id="inp-ready-badge" value="${escapeHtml(g.ready_badge||'')}" class="w-full px-3 py-2 rounded-xl glass-input text-xs">
        </div>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Badge Garansi</label>
          <input type="text" id="inp-warranty-badge" value="${escapeHtml(g.warranty_badge||'')}" class="w-full px-3 py-2 rounded-xl glass-input text-xs">
        </div>
      </div>
    </div>
  `;
  document.getElementById('upload-logo-inp').addEventListener('change', async (e) => {
    if (!e.target.files[0]) return;
    showToast('Mengunggah logo...');
    const res = await uploadFile(e.target.files[0]);
    if (res.success) {
      document.getElementById('inp-logo-url').value = res.url;
      const prev = document.getElementById('logo-preview-img');
      if (prev) prev.src = res.url;
      contentData.general = contentData.general || {};
      contentData.general.logo_url = res.url;
      showToast('Logo terunggah! Klik Simpan Semua untuk mengaktifkan.');
    } else {
      showToast('Gagal unggah: ' + (res.message || 'Error'), true);
    }
  });
  document.getElementById('inp-logo-url').addEventListener('input', (e) => {
    const prev = document.getElementById('logo-preview-img');
    if (prev) prev.src = e.target.value;
    contentData.general = contentData.general || {};
    contentData.general.logo_url = e.target.value;
  });
}

function renderCardsTab(container) {
  const sc = contentData.story_cards || {};
  const c1 = sc.card_1 || {};
  const c2 = sc.card_2 || {};
  const ca = sc.card_anti || { words: [] };

  container.innerHTML = `
    <div class="space-y-5">
      <div class="glass-panel p-6 rounded-2xl space-y-3">
        <h3 class="text-sm font-bold text-sky-400 font-display">01. Card Anatomi 8 Komponen (Sisi Kanan)</h3>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Judul Card</label>
          <input type="text" id="inp-c1-title" value="${escapeHtml(c1.title||'')}" class="w-full px-3 py-2 rounded-xl glass-input text-sm font-semibold">
        </div>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Deskripsi</label>
          <textarea id="inp-c1-sub" rows="2" class="w-full px-3 py-2 rounded-xl glass-input text-sm">${escapeHtml(c1.subtitle||'')}</textarea>
        </div>
      </div>

      <div class="glass-panel p-6 rounded-2xl space-y-3">
        <h3 class="text-sm font-bold text-amber-400 font-display">02. Card Silo 10kg &amp; Potongan Melintang (Sisi Kiri)</h3>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Judul Card</label>
          <input type="text" id="inp-c2-title" value="${escapeHtml(c2.title||'')}" class="w-full px-3 py-2 rounded-xl glass-input text-sm font-semibold">
        </div>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Deskripsi</label>
          <textarea id="inp-c2-sub" rows="2" class="w-full px-3 py-2 rounded-xl glass-input text-sm">${escapeHtml(c2.subtitle||'')}</textarea>
        </div>
      </div>

      <div class="glass-panel p-6 rounded-2xl space-y-3">
        <h3 class="text-sm font-bold text-emerald-400 font-display">03. Masalah Klasik Peternak (Morphing Words)</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${(ca.words || []).map((w, idx) => `
            <div class="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
              <label class="block text-[11px] font-mono text-emerald-400 uppercase">Kata Sorotan ${idx + 1}</label>
              <input type="text" id="inp-canti-w-${idx}" value="${escapeHtml(w.word||'')}" class="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-bold text-emerald-300">
              <label class="block text-[11px] font-mono text-slate-400 uppercase">Penjelasan</label>
              <textarea id="inp-canti-d-${idx}" rows="3" class="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs">${escapeHtml(w.desc||'')}</textarea>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderSpecsTab(container) {
  const specs = contentData.specs || [];
  container.innerHTML = `
    <div class="glass-panel p-6 rounded-2xl space-y-5">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h2 class="text-xl font-bold font-display text-white">⚙️ Spesifikasi Teknis</h2>
          <p class="text-xs text-slate-400">Daftar spesifikasi hardware dan kapabilitas mesin IoPakan.</p>
        </div>
        <button id="addSpecBtn" class="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl transition-all">
          + Tambah Spesifikasi
        </button>
      </div>
      <div class="space-y-3" id="specsList">
        ${specs.map((s, idx) => `
          <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-white/5" data-spec-idx="${idx}">
            <div class="w-1/3">
              <input type="text" class="spec-label w-full px-3 py-1.5 rounded-lg glass-input text-xs font-semibold" value="${escapeHtml(s.label||'')}" placeholder="Nama Parameter">
            </div>
            <div class="flex-1">
              <input type="text" class="spec-val w-full px-3 py-1.5 rounded-lg glass-input text-xs" value="${escapeHtml(s.value||'')}" placeholder="Nilai Spesifikasi">
            </div>
            <button class="remove-spec-btn text-slate-400 hover:text-rose-400 p-1.5 text-sm" title="Hapus">✕</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('addSpecBtn').addEventListener('click', () => {
    contentData.specs.push({ label: 'Parameter Baru', value: '-' });
    renderSpecsTab(container);
  });

  container.querySelectorAll('.remove-spec-btn').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      contentData.specs.splice(idx, 1);
      renderSpecsTab(container);
    });
  });
}
function renderGalleryTab(container) {
  const g = contentData.gallery || { items: [] };
  const q = g.quote || {};
  const s = g.stat || {};

  container.innerHTML = `
    <div class="space-y-5">
      <div class="glass-panel p-6 rounded-2xl space-y-4">
        <h2 class="text-xl font-bold font-display text-white">🖼️ Header Galeri &amp; Highlight</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Badge</label>
            <input type="text" id="inp-gal-badge" value="${escapeHtml(g.badge||'')}" class="w-full px-3 py-1.5 rounded-lg glass-input text-xs">
          </div>
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Judul</label>
            <input type="text" id="inp-gal-title" value="${escapeHtml(g.title_main||'')}" class="w-full px-3 py-1.5 rounded-lg glass-input text-xs font-bold">
          </div>
        </div>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Deskripsi</label>
          <textarea id="inp-gal-sub" rows="2" class="w-full px-3 py-1.5 rounded-lg glass-input text-xs">${escapeHtml(g.subtitle||'')}</textarea>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="p-3 rounded-xl bg-slate-900/50 border border-white/5 space-y-1.5">
            <label class="block text-[11px] font-mono text-cyan-400 uppercase">Kutipan Riset</label>
            <textarea id="inp-gal-qtext" rows="2" class="w-full px-2 py-1 rounded glass-input text-xs">${escapeHtml(q.text||'')}</textarea>
            <input type="text" id="inp-gal-qauth" value="${escapeHtml(q.author||'')}" class="w-full px-2 py-1 rounded glass-input text-xs text-slate-400">
          </div>
          <div class="p-3 rounded-xl bg-slate-900/50 border border-white/5 space-y-1.5">
            <label class="block text-[11px] font-mono text-emerald-400 uppercase">Statistik</label>
            <input type="text" id="inp-gal-snum" value="${escapeHtml(s.number||'')}" class="w-full px-2 py-1 rounded glass-input text-xs font-bold text-emerald-300">
            <input type="text" id="inp-gal-slabel" value="${escapeHtml(s.label||'')}" class="w-full px-2 py-1 rounded glass-input text-xs">
            <input type="text" id="inp-gal-ssub" value="${escapeHtml(s.sub||'')}" class="w-full px-2 py-1 rounded glass-input text-xs text-slate-400">
          </div>
        </div>
      </div>

      <div class="glass-panel p-6 rounded-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 class="text-sm font-bold text-white font-display">Daftar Foto Dokumentasi</h3>
          <button id="addGalItemBtn" class="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg">+ Tambah Foto</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="galleryItemsList">
          ${(g.items || []).map((item, idx) => `
            <div class="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2" data-gal-idx="${idx}">
              <div class="flex gap-2">
                <img src="${item.image}" class="w-16 h-16 object-cover rounded-lg border border-white/10 shrink-0 bg-slate-800" onerror="this.src='/asset/iopakan.png'">
                <div class="flex-1 space-y-1">
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-mono text-emerald-400 font-bold">#${item.num || idx + 1}</span>
                    <button class="remove-gal-btn text-rose-400 text-xs font-semibold" data-idx="${idx}">Hapus</button>
                  </div>
                  <label class="inline-block px-2 py-0.5 bg-white/5 border border-white/10 text-slate-200 text-[10px] rounded cursor-pointer">
                    Ganti Foto <input type="file" class="hidden change-gal-img-inp" data-idx="${idx}" accept="image/*">
                  </label>
                  <input type="text" class="gal-img-url w-full px-1.5 py-0.5 rounded glass-input text-[10px]" value="${escapeHtml(item.image||'')}">
                </div>
              </div>
              <input type="text" class="gal-tag w-full px-2 py-1 rounded glass-input text-xs font-mono text-sky-400" value="${escapeHtml(item.tag||'')}" placeholder="Tag">
              <input type="text" class="gal-title w-full px-2 py-1 rounded glass-input text-xs font-bold" value="${escapeHtml(item.title||'')}" placeholder="Judul">
              <textarea class="gal-desc w-full px-2 py-1 rounded glass-input text-xs" rows="2" placeholder="Deskripsi">${escapeHtml(item.desc||'')}</textarea>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.getElementById('addGalItemBtn').addEventListener('click', () => {
    saveCurrentTabInputs();
    contentData.gallery.items = contentData.gallery.items || [];
    contentData.gallery.items.push({
      id: Date.now(),
      num: String(contentData.gallery.items.length + 1).padStart(2, '0'),
      image: '/asset/iopakan.png',
      tag: 'Dokumentasi',
      title: 'Judul Baru',
      desc: 'Keterangan dokumentasi.'
    });
    renderGalleryTab(container);
  });

  container.querySelectorAll('.remove-gal-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      saveCurrentTabInputs();
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      contentData.gallery.items.splice(idx, 1);
      renderGalleryTab(container);
    });
  });

  container.querySelectorAll('.gal-img-url').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const card = e.target.closest('[data-gal-idx]');
      if (card) {
        const img = card.querySelector('img');
        if (img) img.src = e.target.value;
      }
    });
  });

  container.querySelectorAll('.change-gal-img-inp').forEach((inp) => {
    inp.addEventListener('change', async (e) => {
      if (!e.target.files[0]) return;
      saveCurrentTabInputs();
      const idx = parseInt(inp.getAttribute('data-idx'), 10);
      showToast('Mengunggah foto...');
      const res = await uploadFile(e.target.files[0]);
      if (res.success) {
        contentData.gallery.items[idx].image = res.url;
        renderGalleryTab(container);
        showToast('Foto berhasil diganti! Klik Simpan Semua untuk menerapkan.');
      } else {
        showToast('Gagal unggah: ' + (res.message || 'Error'), true);
      }
    });
  });
}

function renderContactTab(container) {
  const c = contentData.contact || {};
  const g = contentData.general || {};

  container.innerHTML = `
    <div class="glass-panel p-6 rounded-2xl space-y-4">
      <h2 class="text-xl font-bold font-display text-white">💬 Kontak, WhatsApp &amp; Footer</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Nomor WA</label>
          <input type="text" id="inp-wa-num" value="${escapeHtml(c.whatsapp_number||'')}" class="w-full px-3 py-1.5 rounded-lg glass-input text-xs font-mono text-emerald-400">
        </div>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Teks Tombol WA</label>
          <input type="text" id="inp-wa-btn-text" value="${escapeHtml(c.whatsapp_button_text||'')}" class="w-full px-3 py-1.5 rounded-lg glass-input text-xs">
        </div>
      </div>
      <div>
        <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Pesan WA Otomatis</label>
        <textarea id="inp-wa-msg" rows="2" class="w-full px-3 py-1.5 rounded-lg glass-input text-xs">${escapeHtml(c.whatsapp_message||'')}</textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Email</label>
          <input type="text" id="inp-contact-email" value="${escapeHtml(c.email||'')}" class="w-full px-3 py-1.5 rounded-lg glass-input text-xs">
        </div>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Alamat</label>
          <input type="text" id="inp-contact-addr" value="${escapeHtml(c.address||'')}" class="w-full px-3 py-1.5 rounded-lg glass-input text-xs">
        </div>
      </div>
      <div>
        <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Deskripsi Footer</label>
        <textarea id="inp-footer-desc" rows="2" class="w-full px-3 py-1.5 rounded-lg glass-input text-xs">${escapeHtml(g.footer_desc||'')}</textarea>
      </div>
      <div>
        <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Hak Cipta (Copyright)</label>
        <input type="text" id="inp-copyright" value="${escapeHtml(g.copyright||'')}" class="w-full px-3 py-1.5 rounded-lg glass-input text-xs text-slate-400">
      </div>
    </div>
  `;
}

async function renderMediaTab(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <div class="glass-panel p-6 rounded-2xl space-y-3">
        <h2 class="text-xl font-bold font-display text-white">📁 Upload Media &amp; Aset</h2>
        <div class="border-2 border-dashed border-white/15 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-colors">
          <p class="text-xs text-slate-400 mb-3">Upload gambar (PNG, JPG, WebP) atau model 3D (GLB).</p>
          <label class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer inline-block">
            Pilih File
            <input type="file" id="directUploadInp" class="hidden" accept="image/*,.glb,.gltf">
          </label>
        </div>
      </div>
      <div class="glass-panel p-6 rounded-2xl space-y-3">
        <h3 class="text-sm font-bold text-white font-display">Aset Terunggah</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" id="mediaGalleryList">
          <div class="col-span-full py-4 text-center text-xs text-slate-500">Memuat aset...</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('directUploadInp').addEventListener('change', async (e) => {
    if (!e.target.files[0]) return;
    showToast('Mengunggah...');
    const res = await uploadFile(e.target.files[0]);
    if (res.success) { showToast('Berhasil diunggah!'); loadMediaList(); }
    else showToast(res.message || 'Gagal', true);
  });
  loadMediaList();
}

async function loadMediaList() {
  const mount = document.getElementById('mediaGalleryList');
  if (!mount) return;
  try {
    const res = await fetch(`${API_BASE}/images`);
    const json = await res.json();
    if (json.success && json.files) {
      if (!json.files.length) { mount.innerHTML = '<div class="col-span-full text-xs text-slate-500 text-center">Belum ada file.</div>'; return; }
      mount.innerHTML = json.files.map(f => `
        <div class="p-2 rounded-xl bg-slate-900/60 border border-white/5 space-y-1 text-center">
          <div class="h-20 bg-slate-950 rounded flex items-center justify-center overflow-hidden">
            ${f.filename.endsWith('.glb') ? '🧊' : `<img src="${f.url}" class="w-full h-full object-cover">`}
          </div>
          <div class="text-[10px] truncate text-slate-300">${f.filename}</div>
          <div class="flex gap-1">
            <button class="flex-1 py-0.5 bg-white/5 text-[9px] rounded copy-url-btn" data-url="${f.url}">Salin Link</button>
            <button class="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] rounded del-media-btn" data-name="${f.filename}">✕</button>
          </div>
        </div>
      `).join('');
      mount.querySelectorAll('.copy-url-btn').forEach(b => b.addEventListener('click', () => {
        navigator.clipboard.writeText(b.getAttribute('data-url')); showToast('Link disalin!');
      }));
      mount.querySelectorAll('.del-media-btn').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Hapus file?')) return;
        await fetch(`${API_BASE}/images/${b.getAttribute('data-name')}`, { method: 'DELETE' });
        showToast('File dihapus'); loadMediaList();
      }));
    }
  } catch (e) { mount.innerHTML = '<div class="col-span-full text-xs text-rose-400 text-center">Gagal memuat aset.</div>'; }
}

function saveCurrentTabInputs() {
  if (!contentData) return;
  if (activeTab === 'tab-hero') {
    contentData.general = contentData.general || {};
    contentData.hero = contentData.hero || {};
    const st = document.getElementById('inp-site-title'); if (st) contentData.general.site_title = st.value;
    const lu = document.getElementById('inp-logo-url'); if (lu) contentData.general.logo_url = lu.value;
    const rb = document.getElementById('inp-ready-badge'); if (rb) contentData.general.ready_badge = rb.value;
    const wb = document.getElementById('inp-warranty-badge'); if (wb) contentData.general.warranty_badge = wb.value;
    const hb = document.getElementById('inp-hero-badge'); if (hb) contentData.hero.badge = hb.value;
    const ht = document.getElementById('inp-hero-title'); if (ht) contentData.hero.title = ht.value;
    const hs = document.getElementById('inp-hero-sub'); if (hs) contentData.hero.subtitle = hs.value;
  } else if (activeTab === 'tab-cards') {
    contentData.story_cards = contentData.story_cards || {};
    const c1t = document.getElementById('inp-c1-title'); if (c1t) contentData.story_cards.card_1.title = c1t.value;
    const c1s = document.getElementById('inp-c1-sub'); if (c1s) contentData.story_cards.card_1.subtitle = c1s.value;
    const c2t = document.getElementById('inp-c2-title'); if (c2t) contentData.story_cards.card_2.title = c2t.value;
    const c2s = document.getElementById('inp-c2-sub'); if (c2s) contentData.story_cards.card_2.subtitle = c2s.value;
    if (contentData.story_cards.card_anti && contentData.story_cards.card_anti.words) {
      contentData.story_cards.card_anti.words.forEach((w, idx) => {
        const ew = document.getElementById(`inp-canti-w-${idx}`); if (ew) w.word = ew.value;
        const ed = document.getElementById(`inp-canti-d-${idx}`); if (ed) w.desc = ed.value;
      });
    }
  } else if (activeTab === 'tab-gallery') {
    const gb = document.getElementById('inp-gal-badge'); if (gb) contentData.gallery.badge = gb.value;
    const gt = document.getElementById('inp-gal-title'); if (gt) contentData.gallery.title_main = gt.value;
    const gs = document.getElementById('inp-gal-sub'); if (gs) contentData.gallery.subtitle = gs.value;
    const gqt = document.getElementById('inp-gal-qtext'); if (gqt) contentData.gallery.quote.text = gqt.value;
    const gqa = document.getElementById('inp-gal-qauth'); if (gqa) contentData.gallery.quote.author = gqa.value;
    const gsn = document.getElementById('inp-gal-snum'); if (gsn) contentData.gallery.stat.number = gsn.value;
    const gsl = document.getElementById('inp-gal-slabel'); if (gsl) contentData.gallery.stat.label = gsl.value;
    const gss = document.getElementById('inp-gal-ssub'); if (gss) contentData.gallery.stat.sub = gss.value;
    const items = document.querySelectorAll('#galleryItemsList [data-gal-idx]');
    items.forEach(el => {
      const idx = parseInt(el.getAttribute('data-gal-idx'), 10);
      if (contentData.gallery.items[idx]) {
        const u = el.querySelector('.gal-img-url'); if (u) contentData.gallery.items[idx].image = u.value;
        const t = el.querySelector('.gal-tag'); if (t) contentData.gallery.items[idx].tag = t.value;
        const tit = el.querySelector('.gal-title'); if (tit) contentData.gallery.items[idx].title = tit.value;
        const d = el.querySelector('.gal-desc'); if (d) contentData.gallery.items[idx].desc = d.value;
      }
    });
  } else if (activeTab === 'tab-specs') {
    const rows = document.querySelectorAll('#specsList [data-spec-idx]');
    const newSpecs = [];
    rows.forEach(r => {
      const lbl = r.querySelector('.spec-label');
      const val = r.querySelector('.spec-val');
      if (lbl && val) newSpecs.push({ label: lbl.value, value: val.value });
    });
    contentData.specs = newSpecs;
  } else if (activeTab === 'tab-contact') {
    contentData.contact = contentData.contact || {};
    const wn = document.getElementById('inp-wa-num'); if (wn) contentData.contact.whatsapp_number = wn.value;
    const wb = document.getElementById('inp-wa-btn-text'); if (wb) contentData.contact.whatsapp_button_text = wb.value;
    const wm = document.getElementById('inp-wa-msg'); if (wm) contentData.contact.whatsapp_message = wm.value;
    const em = document.getElementById('inp-contact-email'); if (em) contentData.contact.email = em.value;
    const ad = document.getElementById('inp-contact-addr'); if (ad) contentData.contact.address = ad.value;
    const fd = document.getElementById('inp-footer-desc'); if (fd) contentData.general.footer_desc = fd.value;
    const cr = document.getElementById('inp-copyright'); if (cr) contentData.general.copyright = cr.value;
  }
}

