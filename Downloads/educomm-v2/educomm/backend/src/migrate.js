/**
 * migrate.js — Run once to create all MySQL tables
 * Usage: node src/migrate.js
 */
require('dotenv').config();
const db = require('./services/db');

async function migrate() {
  console.log('🚀 Running EduComm database migrations...');

  const queries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('student','teacher','admin') DEFAULT 'student',
      status ENUM('pending','approved','rejected','banned') DEFAULT 'pending',
      avatar VARCHAR(500) DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      is_muted TINYINT(1) DEFAULT 0,
      muted_until DATETIME DEFAULT NULL,
      refresh_token TEXT DEFAULT NULL,
      last_seen DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_status (status),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Channels table (TEXT instead of JSON for MySQL 5.7 compat)
    `CREATE TABLE IF NOT EXISTS channels (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT DEFAULT NULL,
      type ENUM('general','announcement','question','code','private') DEFAULT 'general',
      can_post TEXT NOT NULL,
      can_read TEXT NOT NULL,
      created_by VARCHAR(36),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Messages table
    `CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) PRIMARY KEY,
      channel_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      type ENUM('text','code','file','system') DEFAULT 'text',
      code_language VARCHAR(50) DEFAULT NULL,
      code_output TEXT DEFAULT NULL,
      reply_to VARCHAR(36) DEFAULT NULL,
      is_deleted TINYINT(1) DEFAULT 0,
      edited_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_channel (channel_id),
      INDEX idx_user (user_id),
      INDEX idx_created (created_at),
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Reactions table
    `CREATE TABLE IF NOT EXISTS reactions (
      id VARCHAR(36) PRIMARY KEY,
      message_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      emoji VARCHAR(10) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_reaction (message_id, user_id, emoji),
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Code files table (metadata; actual files on GitHub)
    `CREATE TABLE IF NOT EXISTS code_files (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      language VARCHAR(50) DEFAULT NULL,
      github_path VARCHAR(500) DEFAULT NULL,
      github_sha VARCHAR(100) DEFAULT NULL,
      size INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Audit log table
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      actor_id VARCHAR(36) DEFAULT NULL,
      target_id VARCHAR(36) DEFAULT NULL,
      metadata TEXT DEFAULT NULL,
      ip_address VARCHAR(45) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_actor (actor_id),
      INDEX idx_action (action),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Message read receipts
    `CREATE TABLE IF NOT EXISTS message_reads (
      user_id VARCHAR(36) NOT NULL,
      channel_id VARCHAR(36) NOT NULL,
      last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, channel_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // Seed default channels
    `INSERT IGNORE INTO channels (id, name, description, type, can_post, can_read) VALUES
      (UUID(), 'general', 'General discussion for everyone', 'general', '["student","teacher","admin"]', '["student","teacher","admin"]'),
      (UUID(), 'announcements', 'Important announcements from admin', 'announcement', '["admin"]', '["student","teacher","admin"]'),
      (UUID(), 'questions', 'Ask questions, get answers', 'question', '["student","teacher","admin"]', '["student","teacher","admin"]'),
      (UUID(), 'code-runner', 'Share and run code snippets', 'code', '["student","teacher","admin"]', '["student","teacher","admin"]')`
  ];

  for (const q of queries) {
    try {
      await db.query(q);
      console.log('  ✅', q.slice(0, 60).replace(/\n/g, ' ') + '...');
    } catch (e) {
      console.error('  ❌', e.message);
    }
  }

  console.log('\n✅ Migration complete!');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
