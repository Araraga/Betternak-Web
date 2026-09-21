import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'betternak2026';

// PostgreSQL Database Connection Config
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'betternak',
  password: process.env.DB_PASSWORD || 'betternak2026',
  database: process.env.DB_NAME || 'betternak',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
};

const pool = new Pool(dbConfig);
let isPostgresReady = false;

const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const WEBSITE_PUBLIC_CONTENT = path.join(__dirname, '..', 'betternak-website', 'public', 'content.json');
const WEBSITE_DIST_CONTENT = path.join(__dirname, '..', 'betternak-website', 'dist', 'content.json');
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

// Initialize PostgreSQL Database Schema & Auto-seed
async function initDatabase() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS site_content (
          id SERIAL PRIMARY KEY,
          key VARCHAR(64) UNIQUE NOT NULL,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Check if table has data
      const checkRes = await client.query("SELECT COUNT(*) FROM site_content WHERE key = 'content';");
      const count = parseInt(checkRes.rows[0].count, 10);
      if (count === 0 && fs.existsSync(DATA_FILE)) {
        console.log('[PostgreSQL] Table site_content is empty, auto-seeding from content.json...');
        const initial = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        await client.query(
          `INSERT INTO site_content (key, data, updated_at) VALUES ('content', $1, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;`,
          [initial]
        );
        console.log('[PostgreSQL] Seed complete. Content permanently stored in PostgreSQL.');
      }
      isPostgresReady = true;
      console.log(`[PostgreSQL] Connected successfully to database: ${dbConfig.database} as user: ${dbConfig.user}`);
    } finally {
      client.release();
    }
  } catch (err) {
    isPostgresReady = false;
    console.warn('[PostgreSQL] Connection warning:', err.message);
    console.warn('[PostgreSQL] Admin API will safely fallback to local content.json.');
  }
}
initDatabase();

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

function readLocalContentFile() {
  if (!fs.existsSync(DATA_FILE)) return { error: 'content.json not found' };
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    return { error: 'Invalid JSON in content.json' };
  }
}

function writeLocalContentFile(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
  try {
    if (fs.existsSync(path.dirname(WEBSITE_PUBLIC_CONTENT))) {
      fs.writeFileSync(WEBSITE_PUBLIC_CONTENT, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (e) {}
  try {
    if (fs.existsSync(path.dirname(WEBSITE_DIST_CONTENT))) {
      fs.writeFileSync(WEBSITE_DIST_CONTENT, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (e) {}
}

async function getContent() {
  try {
    const res = await pool.query("SELECT data, updated_at FROM site_content WHERE key = 'content' LIMIT 1;");
    if (res.rows.length > 0 && res.rows[0].data) {
      return { data: res.rows[0].data, source: 'postgresql', updatedAt: res.rows[0].updated_at };
    }
  } catch (err) {
    console.warn('[PostgreSQL] Read fallback:', err.message);
  }
  return { data: readLocalContentFile(), source: 'json_file', updatedAt: null };
}

async function saveContent(data) {
  let dbSaved = false;
  let dbError = null;

  try {
    await pool.query(
      `INSERT INTO site_content (key, data, updated_at) VALUES ('content', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;`,
      [data]
    );
    dbSaved = true;
  } catch (err) {
    dbError = err.message;
    console.error('[PostgreSQL] Save error:', err.message);
  }

  // Always write to local backup JSON as well so static builds have an updated copy
  writeLocalContentFile(data);

  return { dbSaved, dbError };
}

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  postgres: isPostgresReady ? 'connected' : 'offline',
  time: new Date().toISOString()
}));

app.get('/api/db-status', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const timeRes = await client.query('SELECT NOW() as time, current_database(), current_user;');
      const contentRes = await client.query("SELECT updated_at FROM site_content WHERE key = 'content' LIMIT 1;");
      res.json({
        success: true,
        status: 'connected',
        database: timeRes.rows[0].current_database,
        user: timeRes.rows[0].current_user,
        serverTime: timeRes.rows[0].time,
        contentUpdatedAt: contentRes.rows[0] ? contentRes.rows[0].updated_at : null
      });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, status: 'error', message: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = Buffer.from(`${ADMIN_PASSWORD}:${new Date().toDateString()}`).toString('base64');
    return res.json({ success: true, token });
  }
  res.status(401).json({ success: false, message: 'Password salah!' });
});

app.get('/api/content', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const result = await getContent();
    res.json({
      success: true,
      data: result.data,
      source: result.source,
      updatedAt: result.updatedAt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/content', async (req, res) => {
  try {
    const newContent = req.body;
    if (!newContent || typeof newContent !== 'object') {
      return res.status(400).json({ success: false, message: 'Data tidak valid' });
    }
    const result = await saveContent(newContent);
    res.json({
      success: true,
      message: result.dbSaved
        ? 'Konten berhasil disimpan permanen ke database PostgreSQL Betternak!'
        : 'Konten tersimpan ke file cadangan (PostgreSQL sedang offline)',
      data: newContent,
      postgresSaved: result.dbSaved
    });
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
