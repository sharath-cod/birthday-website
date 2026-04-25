'use strict';
const express = require('express');
const db = require('../services/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/channels — list all channels user can access
router.get('/', requireAuth, async (req, res) => {
  const channels = await db.query('SELECT * FROM channels ORDER BY created_at ASC');
  const accessible = channels.filter(c => {
    const canRead = JSON.parse(c.can_read || '[]');
    return canRead.includes(req.user.role) || canRead.includes('all');
  });

  // Unread counts per channel
  const counts = await db.query(
    `SELECT m.channel_id, COUNT(*) as unread
     FROM messages m
     LEFT JOIN message_reads mr ON mr.channel_id = m.channel_id AND mr.user_id = ?
     WHERE m.is_deleted = 0 AND (mr.last_read_at IS NULL OR m.created_at > mr.last_read_at)
     GROUP BY m.channel_id`,
    [req.user.id]
  );
  const unreadMap = {};
  for (const c of counts) unreadMap[c.channel_id] = c.unread;

  res.json({ channels: accessible.map(c => ({ ...c, unread: unreadMap[c.id] || 0 })) });
});

// GET /api/channels/:id/members — online members
router.get('/:id/members', requireAuth, async (req, res) => {
  const users = await db.query(
    `SELECT id, name, role, avatar, last_seen FROM users WHERE status='approved' ORDER BY name ASC`
  );
  const { getOnlineUsers } = require('../services/socket');
  const online = getOnlineUsers();
  const result = users.map(u => ({ ...u, online: online.has(u.id) }));
  res.json({ members: result });
});

module.exports = router;
