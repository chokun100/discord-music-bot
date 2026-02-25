const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'nowplaying',
    aliases: ['np', 'now'],
    description: 'Show the currently playing song',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue || !queue.songs.length) {
            return message.reply('❌ There is nothing playing right now!');
        }

        const song = queue.songs[0];

        // Build a simple progress bar
        const currentTime = queue.currentTime;
        const totalTime = song.duration;
        const progressBarLength = 20;
        const filledLength = Math.round((currentTime / totalTime) * progressBarLength);
        const progressBar =
            '▬'.repeat(filledLength) + '🔘' + '▬'.repeat(progressBarLength - filledLength);

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('🎵 Now Playing')
            .setDescription(`[${song.name}](${song.url})`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: 'Duration', value: `\`${queue.formattedCurrentTime} / ${song.formattedDuration}\``, inline: true },
                { name: 'Requested by', value: `${song.user}`, inline: true },
                { name: 'Progress', value: progressBar, inline: false }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
