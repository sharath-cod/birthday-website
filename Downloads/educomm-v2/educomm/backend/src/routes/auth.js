'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const db = require('../services/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Strict rate limit for auth routes
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, wait 15 minutes.' }
});

function signTokens(userId) {
  const access = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refresh = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { access, refresh };
}

// POST /api/auth/register
router.post('/register', authLimit, async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password min 8 characters' });
    if (!['student', 'teacher'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const exists = await db.queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    // Check if email is in admin list — auto-approve + set admin role
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(email.toLowerCase());
    const finalRole = isAdmin ? 'admin' : role;
    const status = isAdmin ? 'approved' : 'pending';

    await db.query(
      'INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?,?,?,?,?,?)',
      [id, name.trim(), email.toLowerCase(), hash, finalRole, status]
    );

    // Audit
    await db.query(
      'INSERT INTO audit_logs (id, action, actor_id, metadata) VALUES (?,?,?,?)',
      [uuidv4(), 'REGISTER', id, JSON.stringify({ email, role: finalRole, status })]
    );

    res.status(201).json({
      message: isAdmin ? 'Admin account created.' : 'Registration successful. Waiting for admin approval.',
      status,
      role: finalRole
    });
  } catch (e) {
    console.error('[register]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', authLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await db.queryOne(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.status === 'pending') return res.status(403).json({ error: 'Account pending approval', status: 'pending' });
    if (user.status === 'rejected') return res.status(403).json({ error: 'Account rejected', status: 'rejected' });
    if (user.status === 'banned') return res.status(403).json({ error: 'Account banned', status: 'banned' });

    const { access, refresh } = signTokens(user.id);
    await db.query('UPDATE users SET refresh_token = ?, last_seen = NOW() WHERE id = ?', [refresh, user.id]);

    await db.query(
      'INSERT INTO audit_logs (id, action, actor_id, metadata) VALUES (?,?,?,?)',
      [uuidv4(), 'LOGIN', user.id, JSON.stringify({ email })]
    );

    res.json({
      token: access,
      refreshToken: refresh,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (e) {
    console.error('[login]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await db.queryOne('SELECT * FROM users WHERE id = ? AND refresh_token = ?', [payload.id, refreshToken]);
    if (!user) return res.status(401).json({ error: 'Invalid refresh token' });

    const { access, refresh } = signTokens(user.id);
    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refresh, user.id]);

    res.json({ token: access, refreshToken: refresh });
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await db.queryOne(
    'SELECT id, name, email, role, status, avatar, bio, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json({ user });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  await db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
  res.json({ message: 'Logged out' });
});

module.exports = router;
