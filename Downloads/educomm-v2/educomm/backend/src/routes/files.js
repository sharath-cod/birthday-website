'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const db = require('../services/db');
const github = require('../services/github');

const router = express.Router();

// POST /api/files/save — save file to GitHub with version history
router.post('/save', requireAuth, async (req, res) => {
  try {
    const { filename, content, language } = req.body;
    if (!filename || content === undefined) return res.status(400).json({ error: 'filename and content required' });
    if (content.length > 500000) return res.status(400).json({ error: 'File too large (max 500KB)' });

    // Sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    const githubPath = `users/${req.user.id}/${safeName}`;

    // Check if file exists (for SHA)
    const existing = await db.queryOne(
      'SELECT id, github_sha FROM code_files WHERE user_id=? AND filename=?',
      [req.user.id, safeName]
    );

    // Save to GitHub
    const ghResult = await github.saveFile(
      githubPath,
      content,
      `${req.user.name}: save ${safeName}`,
      existing?.github_sha || undefined
    );

    const newSha = ghResult.content.sha;

    if (existing) {
      await db.query(
        'UPDATE code_files SET github_sha=?, size=?, updated_at=NOW() WHERE id=?',
        [newSha, content.length, existing.id]
      );
    } else {
      await db.query(
        'INSERT INTO code_files (id, user_id, filename, language, github_path, github_sha, size) VALUES (?,?,?,?,?,?,?)',
        [uuidv4(), req.user.id, safeName, language || null, githubPath, newSha, content.length]
      );
    }

    res.json({ message: 'File saved', filename: safeName, sha: newSha });
  } catch (e) {
    console.error('[files/save]', e.message);
    res.status(500).json({ error: 'Failed to save file', detail: e.message });
  }
});

// GET /api/files — list user's files
router.get('/', requireAuth, async (req, res) => {
  const files = await db.query(
    'SELECT id, filename, language, size, updated_at FROM code_files WHERE user_id=? ORDER BY updated_at DESC',
    [req.user.id]
  );
  res.json({ files });
});

// GET /api/files/:filename — get file content
router.get('/:filename', requireAuth, async (req, res) => {
  const { filename } = req.params;
  const record = await db.queryOne(
    'SELECT * FROM code_files WHERE user_id=? AND filename=?',
    [req.user.id, filename]
  );
  if (!record) return res.status(404).json({ error: 'File not found' });

  const file = await github.getFile(record.github_path);
  if (!file) return res.status(404).json({ error: 'File not found on GitHub' });

  res.json({ filename: record.filename, content: file.content, language: record.language, sha: file.sha });
});

// GET /api/files/:filename/history — version history
router.get('/:filename/history', requireAuth, async (req, res) => {
  const { filename } = req.params;
  const record = await db.queryOne(
    'SELECT * FROM code_files WHERE user_id=? AND filename=?',
    [req.user.id, filename]
  );
  if (!record) return res.status(404).json({ error: 'File not found' });

  const history = await github.getFileHistory(record.github_path);
  res.json({ history });
});

// DELETE /api/files/:filename
router.delete('/:filename', requireAuth, async (req, res) => {
  const { filename } = req.params;
  await db.query('DELETE FROM code_files WHERE user_id=? AND filename=?', [req.user.id, filename]);
  res.json({ message: 'File deleted from records (GitHub history preserved)' });
});

module.exports = router;
