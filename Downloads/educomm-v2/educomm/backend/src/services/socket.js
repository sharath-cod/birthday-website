'use strict';
const jwt = require('jsonwebtoken');
const db = require('./db');

const onlineUsers = new Map(); // userId -> { socketId, name, role }

function initSocket(io) {
  // Socket auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.queryOne('SELECT id, name, role, status FROM users WHERE id = ?', [payload.id]);
      if (!user || user.status !== 'approved') return next(new Error('Not approved'));
      socket.user = user;
      next();
    } catch (e) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const { id, name, role } = socket.user;
    onlineUsers.set(id, { socketId: socket.id, name, role });

    // Update last_seen
    await db.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [id]);

    // Broadcast online status
    io.emit('user-online', { userId: id, name });

    // Join a channel room
    socket.on('join-channel', async ({ channelId }) => {
      const channel = await db.queryOne('SELECT * FROM channels WHERE id = ?', [channelId]);
      if (!channel) return;
      const canRead = JSON.parse(channel.can_read || '[]');
      if (!canRead.includes(socket.user.role) && !canRead.includes('all')) return;

      socket.join(`channel:${channelId}`);

      // Send recent message history (last 50)
      const messages = await db.query(`
        SELECT m.*, u.name as author_name, u.role as author_role, u.avatar as author_avatar
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.channel_id = ? AND m.is_deleted = 0
        ORDER BY m.created_at DESC LIMIT 50
      `, [channelId]);

      // Get reactions for these messages
      if (messages.length) {
        const ids = messages.map(m => m.id);
        const placeholders = ids.map(() => '?').join(',');
        const reactions = await db.query(
          `SELECT r.*, u.name as user_name FROM reactions r JOIN users u ON r.user_id = u.id WHERE r.message_id IN (${placeholders})`,
          ids
        );
        const reactionMap = {};
        for (const r of reactions) {
          if (!reactionMap[r.message_id]) reactionMap[r.message_id] = [];
          reactionMap[r.message_id].push(r);
        }
        for (const m of messages) m.reactions = reactionMap[m.id] || [];
      }

      socket.emit('channel-history', { channelId, messages: messages.reverse() });

      // Mark as read
      await db.query(
        'INSERT INTO message_reads (user_id, channel_id, last_read_at) VALUES (?,?,NOW()) ON DUPLICATE KEY UPDATE last_read_at=NOW()',
        [id, channelId]
      );
    });

    // Send a message
    socket.on('send-message', async (data) => {
      try {
        const { channelId, content, type = 'text', codeLang, replyTo } = data;
        if (!content || !channelId) return;

        // Check mute
        const user = await db.queryOne('SELECT is_muted, muted_until, status FROM users WHERE id = ?', [id]);
        if (user.status !== 'approved') return;
        if (user.is_muted) {
          if (!user.muted_until || new Date(user.muted_until) > new Date()) {
            socket.emit('error', { message: 'You are muted' });
            return;
          } else {
            await db.query('UPDATE users SET is_muted=0, muted_until=NULL WHERE id=?', [id]);
          }
        }

        // Check channel post permission
        const channel = await db.queryOne('SELECT * FROM channels WHERE id = ?', [channelId]);
        if (!channel) return;
        const canPost = JSON.parse(channel.can_post || '[]');
        if (!canPost.includes(socket.user.role) && !canPost.includes('all')) {
          socket.emit('error', { message: 'You cannot post in this channel' });
          return;
        }

        // Sanitize content (basic)
        const cleanContent = content.slice(0, 5000).replace(/<script[^>]*>.*?<\/script>/gi, '');

        const msgId = require('uuid').v4();
        await db.query(
          'INSERT INTO messages (id, channel_id, user_id, content, type, code_language, reply_to) VALUES (?,?,?,?,?,?,?)',
          [msgId, channelId, id, cleanContent, type, codeLang || null, replyTo || null]
        );

        const msg = await db.queryOne(
          `SELECT m.*, u.name as author_name, u.role as author_role, u.avatar as author_avatar
           FROM messages m JOIN users u ON m.user_id = u.id WHERE m.id = ?`,
          [msgId]
        );
        msg.reactions = [];

        io.to(`channel:${channelId}`).emit('new-message', msg);
      } catch (e) {
        console.error('[socket send-message]', e.message);
      }
    });

    // React to a message
    socket.on('react', async ({ messageId, emoji }) => {
      try {
        const allowed = ['❤️','👍','😂','🔥','👏','😮','😢','🚀'];
        if (!allowed.includes(emoji)) return;

        // Toggle reaction
        const existing = await db.queryOne(
          'SELECT id FROM reactions WHERE message_id=? AND user_id=? AND emoji=?',
          [messageId, id, emoji]
        );

        let action;
        if (existing) {
          await db.query('DELETE FROM reactions WHERE id=?', [existing.id]);
          action = 'removed';
        } else {
          await db.query(
            'INSERT INTO reactions (id, message_id, user_id, emoji) VALUES (?,?,?,?)',
            [require('uuid').v4(), messageId, id, emoji]
          );
          action = 'added';
        }

        // Get all reactions for this message
        const reactions = await db.query(
          'SELECT r.*, u.name as user_name FROM reactions r JOIN users u ON r.user_id = u.id WHERE r.message_id=?',
          [messageId]
        );

        // Broadcast to the channel
        const msg = await db.queryOne('SELECT channel_id FROM messages WHERE id=?', [messageId]);
        if (msg) {
          io.to(`channel:${msg.channel_id}`).emit('reaction-update', { messageId, reactions, action });
        }
      } catch (e) {
        console.error('[socket react]', e.message);
      }
    });

    // Typing indicators
    socket.on('typing-start', ({ channelId }) => {
      socket.to(`channel:${channelId}`).emit('typing-start', { userId: id, name });
    });
    socket.on('typing-stop', ({ channelId }) => {
      socket.to(`channel:${channelId}`).emit('typing-stop', { userId: id });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      onlineUsers.delete(id);
      await db.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [id]);
      io.emit('user-offline', { userId: id });
    });
  });
}

function getOnlineUsers() {
  return onlineUsers;
}

module.exports = { initSocket, getOnlineUsers };
