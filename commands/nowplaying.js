const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'nowplaying',
    aliases: ['np', 'now'],
    description: 'Show the currently playing song',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue || !queue.songs.length) {
            return message.reply('❌ ไม่มีเพลงที่กำลังเล่นอยู่ขณะนี้');
        }

        const song = queue.songs[0];

        // Build a styled progress bar
        const currentTime = queue.currentTime;
        const totalTime = song.duration;
        const progressBarLength = 16;
        const filledLength = totalTime > 0 ? Math.round((currentTime / totalTime) * progressBarLength) : 0;
        const progressBar =
            '▬'.repeat(Math.max(0, filledLength)) + '🔘' + '▬'.repeat(Math.max(0, progressBarLength - filledLength));

        const queuedSongsCount = queue.songs.length - 1;
        const nextSong = queue.songs[1];

        let nextSongText = 'ไม่มี (ไม่มีเพลงต่อในคิว)';
        if (nextSong) {
            const nextTitle = nextSong.name.length > 50 ? `${nextSong.name.substring(0, 47)}...` : nextSong.name;
            nextSongText = `[${nextTitle}](${nextSong.url}) \`[${nextSong.formattedDuration}]\``;
        }

        let queueStatusText = 'ไม่มีเพลงรออยู่ในคิว';
        if (queuedSongsCount > 0) {
            queueStatusText = `\`${queuedSongsCount}\` เพลงรออยู่ • ความยาวรวม \`${queue.formattedDuration}\``;
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('🎵 Now Playing (กำลังเล่น)')
            .setDescription(`[**${song.name}**](${song.url})`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: '⏱️ เวลา', value: `\`${queue.formattedCurrentTime} / ${song.formattedDuration}\``, inline: true },
                { name: '👤 ขอโดย', value: `${song.user}`, inline: true },
                { name: '🔊 เสียง', value: `\`${queue.volume}%\``, inline: true },
                { name: '▶️ เล่นไปแล้ว', value: `${progressBar}`, inline: false },
                { name: '⏭️ เพลงถัดไป (Next Up)', value: nextSongText, inline: false },
                { name: '📜 สถานะคิว', value: queueStatusText, inline: false }
            )
            .setFooter({ text: `คิวรวมทั้งหมด: ${queue.songs.length} เพลง • Momuxic` })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
