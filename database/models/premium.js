const db = require('../db');

// ─── Prepared Statements ────────────────────────────────────────────────────
const stmts = {
    get: db.prepare('SELECT * FROM premium WHERE guild_id = ?'),
    getActive: db.prepare(`
        SELECT * FROM premium 
        WHERE guild_id = ? AND expires_at > datetime('now')
    `),
    upsert: db.prepare(`
        INSERT INTO premium (guild_id, user_id, tier, expires_at, payment_method, transaction_id, updated_at)
        VALUES (@guild_id, @user_id, @tier, @expires_at, @payment_method, @transaction_id, datetime('now'))
        ON CONFLICT(guild_id) DO UPDATE SET
            user_id = @user_id,
            tier = @tier,
            expires_at = @expires_at,
            payment_method = @payment_method,
            transaction_id = @transaction_id,
            updated_at = datetime('now')
    `),
    delete: db.prepare('DELETE FROM premium WHERE guild_id = ?'),
    getAllActive: db.prepare(`
        SELECT * FROM premium WHERE expires_at > datetime('now')
    `),
    cleanExpired: db.prepare(`
        DELETE FROM premium WHERE expires_at <= datetime('now')
    `),
};

// ─── Premium Tiers Config ───────────────────────────────────────────────────
const TIERS = {
    basic: {
        name: 'Basic Premium',
        emoji: '⭐',
        maxFilters: 15,       // All filters
        maxQueue: 500,
        quality: '320kbps',
        twentyFourSeven: true,
        customPrefix: true,
        songHistory: true,
        priority: 1,
    },
    pro: {
        name: 'Pro Premium',
        emoji: '💎',
        maxFilters: 15,
        maxQueue: 1000,
        quality: '320kbps',
        twentyFourSeven: true,
        customPrefix: true,
        songHistory: true,
        priority: 2,
    },
};

// Free tier limits
const FREE_TIER = {
    name: 'Free',
    emoji: '🆓',
    maxFilters: 3,
    maxQueue: 50,
    quality: '128kbps',
    twentyFourSeven: false,
    customPrefix: false,
    songHistory: false,
    priority: 0,
};

// ─── Premium Model ──────────────────────────────────────────────────────────
const Premium = {
    /**
     * Check if a guild has active premium
     */
    isActive(guildId) {
        const row = stmts.getActive.get(guildId);
        return !!row;
    },

    /**
     * Get premium info for a guild (null if no premium or expired)
     */
    get(guildId) {
        return stmts.getActive.get(guildId) || null;
    },

    /**
     * Get the tier config for a guild
     */
    getTier(guildId) {
        const row = stmts.getActive.get(guildId);
        if (!row) return FREE_TIER;
        return TIERS[row.tier] || TIERS.basic;
    },

    /**
     * Get raw record (even if expired)
     */
    getRaw(guildId) {
        return stmts.get.get(guildId) || null;
    },

    /**
     * Activate premium for a guild
     */
    activate(guildId, userId, tier = 'basic', durationDays = 30, paymentMethod = 'manual', transactionId = null) {
        // Calculate expiration
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        stmts.upsert.run({
            guild_id: guildId,
            user_id: userId,
            tier,
            expires_at: expiresAt.toISOString(),
            payment_method: paymentMethod,
            transaction_id: transactionId,
        });

        return {
            guild_id: guildId,
            tier,
            expires_at: expiresAt.toISOString(),
        };
    },

    /**
     * Deactivate premium for a guild
     */
    deactivate(guildId) {
        stmts.delete.run(guildId);
    },

    /**
     * Get all active premium guilds
     */
    getAllActive() {
        return stmts.getAllActive.all();
    },

    /**
     * Clean up expired premium entries
     */
    cleanExpired() {
        const result = stmts.cleanExpired.run();
        return result.changes;
    },

    // Export tier configs for reference
    TIERS,
    FREE_TIER,
};

module.exports = Premium;
