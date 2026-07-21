const { EmbedBuilder } = require('discord.js');
const config = require('../config');

// ─── Brand Constants ─────────────────────────────────────────────────────────
const BOT_NAME = 'Momuxic';
const ICONS = {
    success: '✅',
    error: '❌',
    warn: '⚠️',
    info: 'ℹ️',
    music: '🎵',
    search: '🔍',
    loading: '⏳',
};

// ─── Base Embed Builder ──────────────────────────────────────────────────────
/**
 * Create a styled embed with consistent branding.
 * @param {'success'|'error'|'warn'|'info'|'music'} type
 * @param {string} title
 * @param {string} [description]
 * @param {object} [options] - { footer, thumbnail, fields, timestamp }
 */
function createEmbed(type, title, description, options = {}) {
    const colorMap = {
        success: config.colors.success,
        error: config.colors.error,
        warn: config.colors.warning,
        info: config.colors.info,
        music: config.colors.music,
        premium: config.colors.premium,
        primary: config.colors.primary,
    };

    const embed = new EmbedBuilder()
        .setColor(colorMap[type] || config.colors.primary)
        .setTitle(`${ICONS[type] || ''} ${title}`)
        .setTimestamp();

    if (description) {
        embed.setDescription(description);
    }

    if (options.footer) {
        embed.setFooter({ text: options.footer });
    }

    if (options.thumbnail) {
        embed.setThumbnail(options.thumbnail);
    }

    if (options.fields && options.fields.length) {
        embed.addFields(options.fields);
    }

    return embed;
}

// ─── Reply Helpers ───────────────────────────────────────────────────────────
/**
 * All reply helpers follow the same signature:
 * reply.type(target, title, description?, options?)
 *
 * `target` can be a Message, Interaction, or TextChannel.
 */

async function sendEmbed(target, embed) {
    const payload = { embeds: [embed] };
    try {
        if (target.reply) {
            return await target.reply(payload);
        } else if (target.send) {
            return await target.send(payload);
        }
    } catch {
        // Silently fail if message can't be sent
    }
}

const reply = {
    /**
     * Success response (green)
     */
    success(target, title, description, options) {
        const embed = createEmbed('success', title, description, options);
        return sendEmbed(target, embed);
    },

    /**
     * Error response (red)
     */
    error(target, title, description, options) {
        const embed = createEmbed('error', title, description, options);
        return sendEmbed(target, embed);
    },

    /**
     * Warning response (yellow)
     */
    warn(target, title, description, options) {
        const embed = createEmbed('warn', title, description, options);
        return sendEmbed(target, embed);
    },

    /**
     * Info response (indigo)
     */
    info(target, title, description, options) {
        const embed = createEmbed('info', title, description, options);
        return sendEmbed(target, embed);
    },

    /**
     * Music response (pink)
     */
    music(target, title, description, options) {
        const embed = createEmbed('music', title, description, options);
        return sendEmbed(target, embed);
    },

    /**
     * Search/loading response
     */
    search(target, title, description, options) {
        const embed = createEmbed('info', title, description, options);
        return sendEmbed(target, embed);
    },

    /**
     * Custom embed (pass a pre-built EmbedBuilder)
     */
    custom(target, embed) {
        return sendEmbed(target, embed);
    },

    /**
     * Edit a previous message with an embed
     */
    async edit(targetMsg, type, title, description, options) {
        const embed = createEmbed(type, title, description, options);
        try {
            return await targetMsg.edit({ content: null, embeds: [embed] });
        } catch {
            // Message may have been deleted
        }
    },
};

// ─── Exports ─────────────────────────────────────────────────────────────────
module.exports = { createEmbed, reply, ICONS, BOT_NAME };
