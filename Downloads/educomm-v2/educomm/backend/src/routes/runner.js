'use strict';
const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const db = require('../services/db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Stricter rate limit for code runner (prevent abuse)
const runLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Too many code runs, slow down.' }
});

// Piston API (free, no key needed: https://emkc.org/api/v2/piston)
const PISTON = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston';

// Language map: user-friendly name → Piston language + version
const LANGUAGE_MAP = {
  python: { language: 'python', version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  java: { language: 'java', version: '15.0.2' },
  c: { language: 'c', version: '10.2.0' },
  cpp: { language: 'c++', version: '10.2.0' },
  go: { language: 'go', version: '1.16.2' },
  rust: { language: 'rust', version: '1.50.0' },
  ruby: { language: 'ruby', version: '3.0.1' },
  php: { language: 'php', version: '8.0.2' },
  bash: { language: 'bash', version: '5.1.0' },
  kotlin: { language: 'kotlin', version: '1.5.0' },
  swift: { language: 'swift', version: '5.3.3' },
  r: { language: 'r', version: '4.1.1' },
};

// GET /api/runner/languages
router.get('/languages', requireAuth, async (req, res) => {
  try {
    const { data } = await axios.get(`${PISTON}/runtimes`, { timeout: 5000 });
    res.json({ languages: Object.keys(LANGUAGE_MAP), runtimes: data });
  } catch {
    res.json({ languages: Object.keys(LANGUAGE_MAP) });
  }
});

// POST /api/runner/execute
router.post('/execute', requireAuth, runLimit, async (req, res) => {
  try {
    const { code, language, stdin = '' } = req.body;
    if (!code || !language) return res.status(400).json({ error: 'code and language required' });
    
    const lang = LANGUAGE_MAP[language.toLowerCase()];
    if (!lang) return res.status(400).json({ error: `Unsupported language: ${language}` });

    // Code length limit
    if (code.length > 50000) return res.status(400).json({ error: 'Code too long (max 50KB)' });

    const { data } = await axios.post(`${PISTON}/execute`, {
      language: lang.language,
      version: lang.version,
      files: [{ content: code }],
      stdin,
      args: [],
      compile_timeout: 10000,
      run_timeout: 10000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    }, { timeout: 30000 });

    const result = {
      language,
      stdout: data.run?.stdout || '',
      stderr: data.run?.stderr || data.compile?.stderr || '',
      code: data.run?.code ?? 0,
      signal: data.run?.signal || null,
    };

    // Audit log
    await db.query(
      'INSERT INTO audit_logs (id, action, actor_id, metadata) VALUES (?,?,?,?)',
      [uuidv4(), 'CODE_RUN', req.user.id, JSON.stringify({ language, codeLen: code.length })]
    );

    res.json(result);
  } catch (e) {
    if (e.code === 'ECONNABORTED') return res.status(504).json({ error: 'Code runner timeout' });
    console.error('[runner]', e.message);
    res.status(500).json({ error: 'Code execution failed', detail: e.message });
  }
});

module.exports = router;
