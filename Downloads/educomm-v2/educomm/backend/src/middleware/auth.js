'use strict';
const jwt = require('jsonwebtoken');
const db = require('../services/db');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db.queryOne(
      'SELECT id, name, email, role, status, is_muted, muted_until FROM users WHERE id = ?',
      [payload.id]
    );
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status !== 'approved') return res.status(403).json({ error: 'Account not approved yet' });

    req.user = user;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
