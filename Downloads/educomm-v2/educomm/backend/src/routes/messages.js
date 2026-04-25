'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../services/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// DELETE /api/messages/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await db.queryOne('SELECT * FROM messages WHERE id = ?', [id]);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    // Only author or admin can delete
    if (msg.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot delete this message' });
    }

    await db.query('UPDATE messages SET is_deleted = 1 WHERE id = ?', [id]);

    // Notify channel via socket
    req.app.get('io')?.to(`channel:${msg.channel_id}`).emit('message-deleted', { messageId: id });

    await db.query(
      'INSERT INTO audit_logs (id, action, actor_id, target_id, metadata) VALUES (?,?,?,?,?)',
      [uuidv4(), 'DELETE_MESSAGE', req.user.id, id, JSON.stringify({ channelId: msg.channel_id })]
    );

    res.json({ message: 'Message deleted' });
  } catch (e) {
    console.error('[messages/delete]', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/messages/:id — edit message
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });

    const msg = await db.queryOne('SELECT * FROM messages WHERE id = ?', [id]);
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (msg.user_id !== req.user.id) return res.status(403).json({ error: 'Cannot edit this message' });

    await db.query(
      'UPDATE messages SET content = ?, edited_at = NOW() WHERE id = ?',
      [content.slice(0, 5000), id]
    );

    req.app.get('io')?.to(`channel:${msg.channel_id}`).emit('message-edited', { messageId: id, content });
    res.json({ message: 'Message edited' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
