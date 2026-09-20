// Betternak Admin Core Script
const BASE_PATH = window.location.pathname.startsWith('/betternak-admin') ? '/betternak-admin' : '';
const API_BASE = BASE_PATH + '/api';

let contentData = null;
let activeTab = 'tab-hero';

const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

function showToast(msg, isError = false) {
  toastMsg.textContent = msg;
  const inner = document.getElementById('toastInner');
  if (isError) {
    inner.className = 'flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border border-rose-500/30 bg-slate-900/95 text-rose-400 text-sm font-semibold';
    document.getElementById('toastIcon').textContent = '✕';
  } else {
    inner.className = 'flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-500/30 bg-slate-900/95 text-emerald-400 text-sm font-semibold';
    document.getElementById('toastIcon').textContent = '✓';
  }
  toast.classList.remove('opacity-0', 'translate-y-20', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-20', 'pointer-events-none');
  }, 3200);
}

// Auth Handling
function checkAuth() {
  const token = localStorage.getItem('betternak_admin_token');
  if (token) {
    loginModal.classList.add('hidden');
    loadContent();
  } else {
    loginModal.classList.remove('hidden');
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem('betternak_admin_token', data.token);
      loginModal.classList.add('hidden');
      loginError.classList.add('hidden');
      loadContent();
      showToast('Berhasil masuk ke panel admin!');
    } else {
      loginError.classList.remove('hidden');
    }
  } catch (err) {
    loginError.textContent = 'Gagal menghubungi server';
    loginError.classList.remove('hidden');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('betternak_admin_token');
  loginModal.classList.remove('hidden');
  showToast('Telah keluar dari sesi admin');
});

// Load Content from Server
async function loadContent() {
  try {
    const res = await fetch(`${API_BASE}/content`);
    const json = await res.json();
    if (json.success && json.data) {
      contentData = json.data;
      renderActiveTab();
    } else {
      showToast('Gagal memuat data konten', true);
    }
  } catch (err) {
    showToast('Error koneksi API: ' + err.message, true);
  }
}

// Tab Switching
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.getAttribute('data-tab');
    renderActiveTab();
  });
});

// Upload Helper
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });
  return await res.json();
}

// Save All Content
document.getElementById('saveAllBtn').addEventListener('click', async () => {
  if (!contentData) return;
  saveCurrentTabInputs();
  try {
    const saveBtn = document.getElementById('saveAllBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳ Menyimpan...</span>';

    const res = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentData)
    });
    const json = await res.json();
    if (json.success) {
      showToast('Seluruh perubahan berhasil disimpan & disinkronkan!');
    } else {
      showToast('Gagal menyimpan: ' + json.message, true);
    }
  } catch (err) {
    showToast('Gagal menyimpan: ' + err.message, true);
  } finally {
    const saveBtn = document.getElementById('saveAllBtn');
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>💾 Simpan Semua</span>';
  }
});

window.onload = checkAuth;
