require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
  console.error('JWT_SECRET is missing or too short (min 24 chars). Set it in backend/.env');
  process.exit(1);
}

const app = express();
// Render/Railway/etc. sit behind a proxy. Needed so rate limiting sees each user's real IP.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// CLIENT_URL: comma-separated list of website origins (no trailing slash). "*" wildcards are allowed, e.g. https://my-app-*.vercel.app
// The Android app (Capacitor) always sends one of the two built-in origins below, so they are allowed without any setup.
const normalize = (s) => s.trim().replace(/\/+$/, '').toLowerCase();
const MOBILE_APP_ORIGINS = ['https://localhost', 'capacitor://localhost'];
const allowedOrigins = [
  ...(process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(normalize).filter(Boolean),
  ...MOBILE_APP_ORIGINS,
];
const originAllowed = (origin) =>
  allowedOrigins.some((rule) => {
    if (!rule.includes('*')) return rule === origin;
    const escaped = rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+');
    return new RegExp(`^${escaped}$`).test(origin);
  });

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (originAllowed(origin.toLowerCase())) return cb(null, true);
      console.warn(`CORS blocked origin: ${origin} (allowed: ${allowedOrigins.join(', ')})`);
      cb(null, false); // reject without throwing, so the API does not answer with a 500
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  })
);
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Uploaded certificate files are NOT served statically; Phase 4 serves them through an authenticated route.
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));
const rateLimit = require('express-rate-limit');
// Per-IP. A college network shares one IP across many students, so keep this high (override with RATE_LIMIT_MAX).
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: Number(process.env.RATE_LIMIT_MAX) || 6000, standardHeaders: true, legacyHeaders: false }));

const data = require('./routes/studentData');
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/meta', require('./routes/metaRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/skills', data.skillsRouter);
app.use('/api/technologies', data.technologiesRouter);
app.use('/api/certificates', data.certificatesRouter);
app.use('/api/projects', data.projectsRouter);
app.use('/api/activities', data.activitiesRouter);
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/career', require('./routes/careerRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => require('./services/seedJobRoles')().catch((e) => console.error('Job role sync failed:', e.message)))
  .then(() => {
    const store = require('./services/fileStorage').isConfigured() ? 'Cloudinary' : 'MongoDB (set CLOUDINARY_* variables to use Cloudinary instead)';
    console.log(`Certificate files are stored in: ${store}`);
    if (process.env.NODE_ENV === 'production' && store !== 'Cloudinary') console.warn('WARNING: certificate files are filling your MongoDB free tier. Configure Cloudinary.');
  })
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
