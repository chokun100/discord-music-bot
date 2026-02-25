const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Register all DisTube event handlers.
 * Each handler is per-guild safe — errors in one server never affect others.
 */
module.exports = function registerDistubeEvents(distube) {
    // ─── Now Playing ─────────────────────────────────────────────────────────
    distube.on('playSong', (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('🎵 Now Playing')
            .setDescription(`[${song.name}](${song.url})`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: '⏱️ Duration', value: `\`${song.formattedDuration}\``, inline: true },
                { name: '👤 Requested by', value: `${song.user}`, inline: true },
                { name: '🔊 Volume', value: `${queue.volume}%`, inline: true }
            )
            .setTimestamp();

        queue.textChannel?.send({ embeds: [embed] }).catch(() => { });
    });

    // ─── Song Added to Queue ─────────────────────────────────────────────────
    distube.on('addSong', (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('➕ Added to Queue')
            .setDescription(`[${song.name}](${song.url}) — \`${song.formattedDuration}\``)
            .addFields(
                { name: 'Position in queue', value: `#${queue.songs.length}`, inline: true },
                { name: 'Requested by', value: `${song.user}`, inline: true }
            )
            .setTimestamp();

        queue.textChannel?.send({ embeds: [embed] }).catch(() => { });
    });

    // ─── Playlist Added ──────────────────────────────────────────────────────
    distube.on('addList', (queue, playlist) => {
        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('📋 Playlist Added')
            .setDescription(
                `**${playlist.name}**\n` +
                `\`${playlist.songs.length}\` songs added to the queue`
            )
            .setTimestamp();

        queue.textChannel?.send({ embeds: [embed] }).catch(() => { });
    });

    // ─── Queue Finished ──────────────────────────────────────────────────────
    distube.on('finish', (queue) => {
        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🏁 Queue Finished')
            .setDescription('No more songs in the queue. Use `!play` to add more!')
            .setTimestamp();

        queue.textChannel?.send({ embeds: [embed] }).catch(() => { });
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    distube.on('disconnect', (queue) => {
        queue.textChannel?.send('👋 Disconnected from the voice channel.').catch(() => { });
    });

    // ─── Error Handler (per-guild isolated) ──────────────────────────────────
    distube.on('error', (channel, error) => {
        console.error(`❌ DisTube error in channel ${channel?.id}:`, error);

        const embed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle('❌ Playback Error')
            .setDescription(
                'An error occurred during playback. The bot will continue to work.\n' +
                'Try again or use `!report` to let us know about this issue.'
            )
            .setTimestamp();

        if (channel) {
            channel.send({ embeds: [embed] }).catch(() => { });
        }
    });
};
