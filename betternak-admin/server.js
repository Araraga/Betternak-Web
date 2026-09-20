import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'betternak2026';

const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const WEBSITE_PUBLIC_CONTENT = path.join(__dirname, '..', 'betternak-website', 'public', 'content.json');
const WEBSITE_UPLOADS_DIR = path.join(__dirname, '..', 'betternak-website', 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(WEBSITE_UPLOADS_DIR)) {
  try { fs.mkdirSync(WEBSITE_UPLOADS_DIR, { recursive: true }); } catch (e) {}
}

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use('/uploads', express.static(UPLOADS_DIR));
const websiteAssetDir = path.join(__dirname, '..', 'betternak-website', 'asset');
if (fs.existsSync(websiteAssetDir)) {
  app.use('/asset', express.static(websiteAssetDir));
}
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    cb(null, `${cleanName}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg|glb|gltf/i;
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('Hanya file JPG, PNG, WebP, GIF, SVG, atau GLB yang diizinkan!'));
  }
});

function readContent() {
  if (!fs.existsSync(DATA_FILE)) return { error: 'content.json not found' };
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeContent(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  try {
    if (fs.existsSync(path.dirname(WEBSITE_PUBLIC_CONTENT))) {
      fs.writeFileSync(WEBSITE_PUBLIC_CONTENT, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (e) {}
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = Buffer.from(`${ADMIN_PASSWORD}:${new Date().toDateString()}`).toString('base64');
    return res.json({ success: true, token });
  }
  res.status(401).json({ success: false, message: 'Password salah!' });
});

app.get('/api/content', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ success: true, data: readContent() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/content', (req, res) => {
  try {
    const newContent = req.body;
    if (!newContent || typeof newContent !== 'object') {
      return res.status(400).json({ success: false, message: 'Data tidak valid' });
    }
    writeContent(newContent);
    res.json({ success: true, message: 'Konten berhasil disimpan!', data: newContent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file diunggah' });
    const fileUrl = `/uploads/${req.file.filename}`;
    try {
      if (fs.existsSync(WEBSITE_UPLOADS_DIR)) {
        fs.copyFileSync(req.file.path, path.join(WEBSITE_UPLOADS_DIR, req.file.filename));
      }
    } catch (e) {}
    res.json({ success: true, message: 'Upload sukses!', url: fileUrl, filename: req.file.filename, size: req.file.size });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR).map((name) => {
      const stats = fs.statSync(path.join(UPLOADS_DIR, name));
      return { filename: name, url: `/uploads/${name}`, size: stats.size, createdAt: stats.birthtime };
    });
    res.json({ success: true, files: files.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/images/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const target = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(target)) fs.unlinkSync(target);
    const webTarget = path.join(WEBSITE_UPLOADS_DIR, filename);
    if (fs.existsSync(webTarget)) { try { fs.unlinkSync(webTarget); } catch (e) {} }
    res.json({ success: true, message: 'File terhapus!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`[Betternak Admin] Running on port ${PORT}`));
