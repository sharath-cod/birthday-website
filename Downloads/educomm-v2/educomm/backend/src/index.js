'use strict';
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes     = require('./routes/auth');
const adminRoutes    = require('./routes/admin');
const runnerRoutes   = require('./routes/runner');
const filesRoutes    = require('./routes/files');
const channelsRoutes = require('./routes/channels');
const messagesRoutes = require('./routes/messages');
const { requireAuth } = require('./middleware/auth');
const { initSocket }  = require('./services/socket');

const app    = express();
const server = http.createServer(app);

// ── Security Middleware ───────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '2mb' }));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://localhost:8080',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Socket.io ────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
});
initSocket(io);
app.set('io', io);

// ── Routes ───────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString(), version: '2.0.0' })
);

app.use('/api/auth',     authRoutes);
app.use('/api/admin',    requireAuth, adminRoutes);
app.use('/api/runner',   requireAuth, runnerRoutes);
app.use('/api/files',    requireAuth, filesRoutes);
app.use('/api/channels', requireAuth, channelsRoutes);
app.use('/api/messages', requireAuth, messagesRoutes);

// ── Global Error Handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ EduComm v2 backend on port ${PORT}`);
  console.log(`   DB:       ${process.env.DB_HOST}/${process.env.DB_NAME}`);
  console.log(`   GitHub:   ${process.env.GITHUB_ORG}/${process.env.GITHUB_REPO}`);
  console.log(`   Frontend: ${process.env.FRONTEND_URL}`);
});
