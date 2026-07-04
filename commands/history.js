const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const db = require('../database/db');

// Prepared statement for getting song history
const getHistory = db.prepare(`
    SELECT song_name, song_url, user_id, duration, played_at
    FROM song_history
    WHERE guild_id = ?
    ORDER BY played_at DESC
    LIMIT ?
`);

module.exports = {
    name: 'history',
    aliases: ['songhistory', 'recent'],
    description: 'Show recently played songs in this server (Premium)',
    premiumOnly: true,
    slashOptions: [
        { name: 'count', type: 'integer', description: 'Number of recent songs to show (max 25)', required: false, min: 1, max: 25 },
    ],
    async execute(message, args, client) {
        const limit = Math.min(parseInt(args[0]) || 10, 25);
        const songs = getHistory.all(message.guild.id, limit);

        if (!songs.length) {
            return message.reply('❌ ยังไม่มีประวัติเพลงในเซิร์ฟเวอร์นี้!');
        }

        const list = songs.map((s, i) => {
            const mins = Math.floor(s.duration / 60);
            const secs = s.duration % 60;
            const duration = `${mins}:${secs.toString().padStart(2, '0')}`;
            return `**${i + 1}.** [${s.song_name}](${s.song_url}) — \`${duration}\` • <@${s.user_id}>`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('📜 Song History')
            .setDescription(list)
            .setFooter({ text: `แสดง ${songs.length} เพลงล่าสุด • ใช้ !history <จำนวน> เพื่อดูมากขึ้น` })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
