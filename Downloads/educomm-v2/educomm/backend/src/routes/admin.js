'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../services/db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireRole('admin'));

// GET /api/admin/pending — list pending users
router.get('/pending', async (req, res) => {
  const users = await db.query(
    'SELECT id, name, email, role, created_at FROM users WHERE status = "pending" ORDER BY created_at ASC'
  );
  res.json({ users });
});

// GET /api/admin/users — all users
router.get('/users', async (req, res) => {
  const users = await db.query(
    'SELECT id, name, email, role, status, is_muted, muted_until, last_seen, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({ users });
});

// POST /api/admin/approve/:userId
router.post('/approve/:userId', async (req, res) => {
  const { userId } = req.params;
  await db.query('UPDATE users SET status = "approved" WHERE id = ?', [userId]);
  await db.query(
    'INSERT INTO audit_logs (id, action, actor_id, target_id, metadata) VALUES (?,?,?,?,?)',
    [uuidv4(), 'APPROVE_USER', req.user.id, userId, JSON.stringify({})]
  );

  // Emit socket event
  req.app.get('io')?.emit('user-approved', { userId });
  res.json({ message: 'User approved' });
});

// POST /api/admin/reject/:userId
router.post('/reject/:userId', async (req, res) => {
  const { userId } = req.params;
  await db.query('UPDATE users SET status = "rejected" WHERE id = ?', [userId]);
  await db.query(
    'INSERT INTO audit_logs (id, action, actor_id, target_id, metadata) VALUES (?,?,?,?,?)',
    [uuidv4(), 'REJECT_USER', req.user.id, userId, JSON.stringify({})]
  );
  res.json({ message: 'User rejected' });
});

// POST /api/admin/ban/:userId
router.post('/ban/:userId', async (req, res) => {
  const { userId } = req.params;
  await db.query('UPDATE users SET status = "banned" WHERE id = ?', [userId]);
  res.json({ message: 'User banned' });
});

// POST /api/admin/role/:userId
router.post('/role/:userId', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  if (!['student', 'teacher', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  await db.query(
    'INSERT INTO audit_logs (id, action, actor_id, target_id, metadata) VALUES (?,?,?,?,?)',
    [uuidv4(), 'CHANGE_ROLE', req.user.id, userId, JSON.stringify({ role })]
  );
  res.json({ message: 'Role updated' });
});

// POST /api/admin/mute/:userId
router.post('/mute/:userId', async (req, res) => {
  const { userId } = req.params;
  const { minutes = 60 } = req.body;
  const until = new Date(Date.now() + minutes * 60 * 1000);
  await db.query('UPDATE users SET is_muted = 1, muted_until = ? WHERE id = ?', [until, userId]);
  req.app.get('io')?.emit('user-muted', { userId, until });
  res.json({ message: `User muted for ${minutes} minutes` });
});

// POST /api/admin/unmute/:userId
router.post('/unmute/:userId', async (req, res) => {
  const { userId } = req.params;
  await db.query('UPDATE users SET is_muted = 0, muted_until = NULL WHERE id = ?', [userId]);
  res.json({ message: 'User unmuted' });
});

// GET /api/admin/audit — audit log
router.get('/audit', async (req, res) => {
  const logs = await db.query(
    `SELECT al.*, u.name as actor_name, t.name as target_name
     FROM audit_logs al
     LEFT JOIN users u ON al.actor_id = u.id
     LEFT JOIN users t ON al.target_id = t.id
     ORDER BY al.created_at DESC LIMIT 200`
  );
  res.json({ logs });
});

// GET /api/admin/channels — manage channels
router.get('/channels', async (req, res) => {
  const channels = await db.query('SELECT * FROM channels');
  res.json({ channels });
});

// POST /api/admin/channels — create channel
router.post('/channels', async (req, res) => {
  const { name, description, type, canPost, canRead } = req.body;
  const id = uuidv4();
  await db.query(
    'INSERT INTO channels (id, name, description, type, can_post, can_read, created_by) VALUES (?,?,?,?,?,?,?)',
    [id, name, description, type || 'general', JSON.stringify(canPost || ['student','teacher','admin']), JSON.stringify(canRead || ['student','teacher','admin']), req.user.id]
  );
  res.status(201).json({ message: 'Channel created', id });
});

module.exports = router;
