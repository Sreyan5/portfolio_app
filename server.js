/**
 * ═══════════════════════════════════════════════════════════════
 *  SREYAN PORTFOLIO — Full-Stack Backend Server
 *  Express.js + JSON flat-file DB
 *  Run: npm start | node server.js
 *  Default: http://localhost:3000
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db', 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// ───── Ensure directories exist ─────
if (!fs.existsSync(path.join(__dirname, 'db'))) fs.mkdirSync(path.join(__dirname, 'db'));
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// ───── Middleware ─────
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (the portfolio HTML, uploads, etc.)
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(__dirname, {
  index: 'sreyan_portfolio.html'
}));

// ───── Database Helpers ─────
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('[DB] Read error:', e.message);
    return { portfolio: {}, certificates: [], messages: [], analytics: { totalVisits: 0, visitLog: [] } };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[DB] Write error:', e.message);
    return false;
  }
}

// ───── Auth middleware ─────
function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token) return res.status(401).json({ error: 'Unauthorized — no token' });

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');
    const db = readDB();
    const passHex = Buffer.from(pass).toString('hex');
    if (user === db.admin.username && passHex === db.admin.passwordHash) {
      next();
    } else {
      res.status(403).json({ error: 'Invalid credentials' });
    }
  } catch (e) {
    res.status(403).json({ error: 'Malformed token' });
  }
}

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API — No auth required
// ═══════════════════════════════════════════════════════════════

// GET /api/portfolio — Full portfolio data (for visitors)
app.get('/api/portfolio', (req, res) => {
  const db = readDB();
  res.json({
    portfolio: db.portfolio,
    certificates: db.certificates || []
  });
});

// GET /api/certificates — Just certificates
app.get('/api/certificates', (req, res) => {
  const db = readDB();
  res.json(db.certificates || []);
});

// POST /api/contact — Visitor sends a message
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const db = readDB();
  const entry = {
    id: 'm' + Date.now(),
    name: name.trim(),
    email: email.trim(),
    subject: (subject || '').trim(),
    message: message.trim(),
    date: new Date().toISOString(),
    read: false
  };
  db.messages.push(entry);
  writeDB(db);

  console.log(`[MSG] New message from ${name} <${email}>`);
  res.json({ success: true, message: 'Message sent successfully!' });
});

// POST /api/analytics/visit — Track page visit
app.post('/api/analytics/visit', (req, res) => {
  const db = readDB();
  if (!db.analytics) db.analytics = { totalVisits: 0, visitLog: [] };
  db.analytics.totalVisits++;
  db.analytics.lastVisit = new Date().toISOString();
  db.analytics.visitLog.push({
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'] || 'unknown',
    ip: req.ip || req.connection.remoteAddress
  });
  // Keep only last 500 visits
  if (db.analytics.visitLog.length > 500) {
    db.analytics.visitLog = db.analytics.visitLog.slice(-500);
  }
  writeDB(db);
  res.json({ visits: db.analytics.totalVisits });
});


// ═══════════════════════════════════════════════════════════════
//  ADMIN API — Auth required
// ═══════════════════════════════════════════════════════════════

// POST /api/admin/login — Verify credentials & return token
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const passHex = Buffer.from(password || '').toString('hex');

  if (username === db.admin.username && passHex === db.admin.passwordHash) {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    console.log(`[AUTH] Admin login: ${username}`);
    res.json({ success: true, token });
  } else {
    res.status(403).json({ error: 'Invalid credentials' });
  }
});

// GET /api/admin/messages — Get all visitor messages
app.get('/api/admin/messages', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.messages || []);
});

// DELETE /api/admin/messages/:id — Delete a message
app.delete('/api/admin/messages/:id', requireAuth, (req, res) => {
  const db = readDB();
  db.messages = (db.messages || []).filter(m => m.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// PATCH /api/admin/messages/:id/read — Mark message as read
app.patch('/api/admin/messages/:id/read', requireAuth, (req, res) => {
  const db = readDB();
  const msg = (db.messages || []).find(m => m.id === req.params.id);
  if (msg) { msg.read = true; writeDB(db); }
  res.json({ success: true });
});

// PUT /api/admin/portfolio — Update portfolio content
app.put('/api/admin/portfolio', requireAuth, (req, res) => {
  const db = readDB();
  const updates = req.body;

  // Deep merge portfolio fields
  if (updates.hero) db.portfolio.hero = { ...db.portfolio.hero, ...updates.hero };
  if (updates.sidebar) db.portfolio.sidebar = { ...db.portfolio.sidebar, ...updates.sidebar };
  if (updates.skills) db.portfolio.skills = updates.skills;
  if (updates.projects) db.portfolio.projects = updates.projects;
  if (updates.timeline) db.portfolio.timeline = updates.timeline;
  if (updates.blog) db.portfolio.blog = updates.blog;

  writeDB(db);
  console.log('[ADMIN] Portfolio updated');
  res.json({ success: true });
});

// ── Certificates CRUD ──
app.post('/api/admin/certificates', requireAuth, (req, res) => {
  const db = readDB();
  const cert = {
    id: 'c' + Date.now(),
    title: req.body.title || '',
    issuer: req.body.issuer || '',
    date: req.body.date || '',
    icon: req.body.icon || '🏆',
    badge: req.body.badge || 'CERT',
    img: req.body.img || ''
  };
  db.certificates.push(cert);
  writeDB(db);
  console.log(`[CERT] Added: ${cert.title}`);
  res.json({ success: true, certificate: cert });
});

app.delete('/api/admin/certificates/:id', requireAuth, (req, res) => {
  const db = readDB();
  db.certificates = (db.certificates || []).filter(c => c.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// GET /api/admin/analytics — View site analytics
app.get('/api/admin/analytics', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.analytics || { totalVisits: 0, visitLog: [] });
});

// POST /api/admin/upload — Upload an image file
app.post('/api/admin/upload', requireAuth, (req, res) => {
  const { filename, data } = req.body; // data = base64 encoded image
  if (!data) return res.status(400).json({ error: 'No image data' });

  try {
    const ext = (filename || 'img.png').split('.').pop();
    const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const filePath = path.join(UPLOADS_DIR, name);
    fs.writeFileSync(filePath, buffer);
    const url = `/uploads/${name}`;
    console.log(`[UPLOAD] Saved: ${url}`);
    res.json({ success: true, url });
  } catch (e) {
    res.status(500).json({ error: 'Upload failed: ' + e.message });
  }
});

// POST /api/admin/export — Export full DB as download
app.get('/api/admin/export', requireAuth, (req, res) => {
  const db = readDB();
  res.setHeader('Content-Disposition', 'attachment; filename=portfolio_backup.json');
  res.setHeader('Content-Type', 'application/json');
  res.json(db);
});


// ═══════════════════════════════════════════════════════════════
//  Serve the portfolio as root
// ═══════════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'sreyan_portfolio.html'));
});


// ═══════════════════════════════════════════════════════════════
//  Start server
// ═══════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════╗');
  console.log('  ║  SREYAN PORTFOLIO SERVER — v3.0.0             ║');
  console.log('  ║  Status: SYSTEM_ONLINE                       ║');
  console.log(`  ║  URL: http://localhost:${PORT}                   ║`);
  console.log('  ║  Admin: Ctrl+Shift+A on the site             ║');
  console.log('  ║  API:   /api/portfolio                       ║');
  console.log('  ╚═══════════════════════════════════════════════╝');
  console.log('');
});
