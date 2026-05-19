const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const db = require('../database/db');
const Premium = require('../database/models/premium');

// Prepared statement for song history
const insertHistory = db.prepare(`
    INSERT INTO song_history (guild_id, user_id, song_name, song_url, duration)
    VALUES (?, ?, ?, ?, ?)
`);

// Import voteskip to clear votes on song change
let clearVotes;
try {
    clearVotes = require('../commands/voteskip').clearVotes;
} catch { clearVotes = () => { }; }

/**
 * Register all DisTube event handlers.
 * Each handler is per-guild safe — errors in one server never affect others.
 */
module.exports = function registerDistubeEvents(distube) {
    // ─── Now Playing ─────────────────────────────────────────────────────────
    distube.on('playSong', (queue, song) => {
        // Clear voteskip votes for this guild
        clearVotes(queue.id);
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

        // Record to song history
        try {
            insertHistory.run(
                queue.id, // guild ID
                song.user?.id || 'unknown',
                song.name,
                song.url,
                song.duration || 0
            );
        } catch { }
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

        // Queue length enforcement
        const tier = Premium.getTier(queue.id);
        const maxQueue = tier.maxQueue || 50;
        if (queue.songs.length > maxQueue + 1) {
            // Remove the just-added song (last in queue)
            queue.songs.pop();
            queue.textChannel?.send(
                `⚠️ Queue เต็มแล้ว! (สูงสุด ${maxQueue} เพลง)${!Premium.isActive(queue.id) ? '\n⭐ อัพเกรด Premium เพื่อเพิ่มเป็น 500+ เพลง!' : ''}`
            ).catch(() => { });
        }
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
    // DisTube v5 signature: (error, queue, song)
    distube.on('error', (error, queue) => {
        console.error(`❌ DisTube error in guild ${queue?.id}:`, error?.message || error);

        const embed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle('❌ Playback Error')
            .setDescription(
                'An error occurred during playback. The bot will continue to work.\n' +
                'Try again or use `!report` to let us know about this issue.'
            )
            .setTimestamp();

        queue?.textChannel?.send({ embeds: [embed] }).catch(() => { });
    });
};
