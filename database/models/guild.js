const db = require('../db');

// ─── Prepared Statements (cached for performance) ───────────────────────────
const stmts = {
    get: db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?'),
    upsert: db.prepare(`
        INSERT INTO guild_settings (guild_id, prefix, dj_role_id, default_volume, twenty_four_seven, max_queue_length, updated_at)
        VALUES (@guild_id, @prefix, @dj_role_id, @default_volume, @twenty_four_seven, @max_queue_length, datetime('now'))
        ON CONFLICT(guild_id) DO UPDATE SET
            prefix = @prefix,
            dj_role_id = @dj_role_id,
            default_volume = @default_volume,
            twenty_four_seven = @twenty_four_seven,
            max_queue_length = @max_queue_length,
            updated_at = datetime('now')
    `),
    setPrefix: db.prepare(`
        INSERT INTO guild_settings (guild_id, prefix, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(guild_id) DO UPDATE SET prefix = ?, updated_at = datetime('now')
    `),
    setDJRole: db.prepare(`
        INSERT INTO guild_settings (guild_id, dj_role_id, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(guild_id) DO UPDATE SET dj_role_id = ?, updated_at = datetime('now')
    `),
    setVolume: db.prepare(`
        INSERT INTO guild_settings (guild_id, default_volume, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(guild_id) DO UPDATE SET default_volume = ?, updated_at = datetime('now')
    `),
    set247: db.prepare(`
        INSERT INTO guild_settings (guild_id, twenty_four_seven, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(guild_id) DO UPDATE SET twenty_four_seven = ?, updated_at = datetime('now')
    `),
    setMaxQueue: db.prepare(`
        INSERT INTO guild_settings (guild_id, max_queue_length, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(guild_id) DO UPDATE SET max_queue_length = ?, updated_at = datetime('now')
    `),
    delete: db.prepare('DELETE FROM guild_settings WHERE guild_id = ?'),
};

// ─── Default Settings ───────────────────────────────────────────────────────
const DEFAULTS = {
    prefix: require('../../config').prefix || '!',
    dj_role_id: null,
    default_volume: 50,
    twenty_four_seven: 0,
    max_queue_length: 50,
};

// ─── Guild Model ────────────────────────────────────────────────────────────
const GuildSettings = {
    /**
     * Get guild settings (returns defaults if not found)
     */
    get(guildId) {
        const row = stmts.get.get(guildId);
        if (!row) {
            return { guild_id: guildId, ...DEFAULTS };
        }
        return row;
    },

    /**
     * Get the prefix for a guild
     */
    getPrefix(guildId) {
        const row = stmts.get.get(guildId);
        return row?.prefix || DEFAULTS.prefix;
    },

    /**
     * Set the prefix for a guild
     */
    setPrefix(guildId, prefix) {
        stmts.setPrefix.run(guildId, prefix, prefix);
    },

    /**
     * Set the DJ role for a guild
     */
    setDJRole(guildId, roleId) {
        stmts.setDJRole.run(guildId, roleId, roleId);
    },

    /**
     * Get the DJ role ID for a guild
     */
    getDJRole(guildId) {
        const row = stmts.get.get(guildId);
        return row?.dj_role_id || null;
    },

    /**
     * Set default volume for a guild
     */
    setVolume(guildId, volume) {
        stmts.setVolume.run(guildId, volume, volume);
    },

    /**
     * Set 24/7 mode for a guild
     */
    set247(guildId, enabled) {
        const val = enabled ? 1 : 0;
        stmts.set247.run(guildId, val, val);
    },

    /**
     * Check if 24/7 mode is enabled
     */
    is247(guildId) {
        const row = stmts.get.get(guildId);
        return row?.twenty_four_seven === 1;
    },

    /**
     * Set max queue length for a guild
     */
    setMaxQueue(guildId, maxLength) {
        stmts.setMaxQueue.run(guildId, maxLength, maxLength);
    },

    /**
     * Delete guild settings (when bot is removed)
     */
    delete(guildId) {
        stmts.delete.run(guildId);
    },
};

module.exports = GuildSettings;
