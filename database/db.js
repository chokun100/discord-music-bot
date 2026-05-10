const Database = require('better-sqlite3');
const path = require('path');

// ─── SQLite Database Connection ─────────────────────────────────────────────
const DB_PATH = path.join(__dirname, '..', 'data', 'momuxic.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema Initialization ──────────────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        prefix TEXT DEFAULT '!',
        dj_role_id TEXT DEFAULT NULL,
        default_volume INTEGER DEFAULT 50,
        twenty_four_seven INTEGER DEFAULT 0,
        max_queue_length INTEGER DEFAULT 50,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS premium (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        tier TEXT DEFAULT 'basic',
        expires_at TEXT NOT NULL,
        payment_method TEXT DEFAULT 'manual',
        transaction_id TEXT DEFAULT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS song_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        song_name TEXT NOT NULL,
        song_url TEXT NOT NULL,
        duration INTEGER DEFAULT 0,
        played_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_premium_guild ON premium(guild_id);
    CREATE INDEX IF NOT EXISTS idx_premium_expires ON premium(expires_at);
    CREATE INDEX IF NOT EXISTS idx_history_guild ON song_history(guild_id);
`);

console.log('✅ Database initialized');

module.exports = db;
