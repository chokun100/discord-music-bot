const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const GuildSettings = require('../database/models/guild');

module.exports = {
    name: '247',
    aliases: ['twentyfourseven', 'stay', 'nonstop'],
    description: 'Toggle 24/7 mode — bot stays in voice channel permanently (Premium)',
    premiumOnly: true,
    requireVoice: true,
    async execute(message, args, client) {
        const guildId = message.guild.id;
        const current = GuildSettings.is247(guildId);
        const newState = !current;

        GuildSettings.set247(guildId, newState);

        const embed = new EmbedBuilder()
            .setColor(newState ? config.colors.success : config.colors.error)
            .setTitle(newState ? '🕐 24/7 Mode — Enabled' : '🕐 24/7 Mode — Disabled')
            .setDescription(
                newState
                    ? 'บอทจะอยู่ใน Voice Channel ตลอดเวลา แม้ไม่มีคนอยู่!\nบอทจะไม่ disconnect จาก idle timeout'
                    : 'บอทจะ disconnect อัตโนมัติเมื่อ Voice Channel ว่าง (5 นาที)'
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
