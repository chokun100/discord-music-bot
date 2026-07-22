const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const db = require('../database/db');
const Premium = require('../database/models/premium');
const logger = require('../utils/logger');
const { reply } = require('../utils/embed');

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

        logger.logMusic('playSong', queue.id,
            `Playing "${song.name}" [${song.formattedDuration}]`, {
            url: song.url,
            source: song.source,
            user: song.user?.tag || 'unknown',
            queueSize: queue.songs.length,
            volume: queue.volume,
        });

        const queuedSongsCount = queue.songs.length - 1;
        const nextSong = queue.songs[1];

        let nextSongText = 'ไม่มี (ไม่มีเพลงต่อในคิว)';
        if (nextSong) {
            const nextTitle = nextSong.name.length > 50 ? `${nextSong.name.substring(0, 47)}...` : nextSong.name;
            nextSongText = `[${nextTitle}](${nextSong.url}) \`[${nextSong.formattedDuration}]\``;
        }

        let queueStatusText = 'ไม่มีเพลงรออยู่ในคิว';
        if (queuedSongsCount > 0) {
            queueStatusText = `\`${queuedSongsCount}\` เพลงรออยู่ในคิว • ความยาวรวม \`${queue.formattedDuration}\``;
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('🎵 Now Playing (กำลังเล่น)')
            .setDescription(`[**${song.name}**](${song.url})`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: '⏱️ ความยาว', value: `\`${song.formattedDuration}\``, inline: true },
                { name: '👤 ขอโดย', value: `${song.user}`, inline: true },
                { name: '🔊 เสียง', value: `\`${queue.volume}%\``, inline: true },
                { name: '⏭️ เพลงถัดไป (Next Up)', value: nextSongText, inline: false },
                { name: '📜 สถานะคิว', value: queueStatusText, inline: false }
            )
            .setFooter({ text: `คิวรวมทั้งหมด: ${queue.songs.length} เพลง • Momuxic` })
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
        } catch (err) {
            logger.error('DisTube', `Failed to save song history in guild ${queue.id}`, err);
        }
    });

    // ─── Song Added to Queue ─────────────────────────────────────────────────
    distube.on('addSong', (queue, song) => {
        logger.logMusic('addSong', queue.id,
            `Added "${song.name}" [${song.formattedDuration}] — Queue #${queue.songs.length}`, {
            url: song.url,
            user: song.user?.tag || 'unknown',
        });

        const queuedSongsCount = queue.songs.length - 1;
        const nextSong = queue.songs[1];

        let nextSongText = 'ไม่มี';
        if (nextSong) {
            const nextTitle = nextSong.name.length > 50 ? `${nextSong.name.substring(0, 47)}...` : nextSong.name;
            nextSongText = `[${nextTitle}](${nextSong.url}) \`[${nextSong.formattedDuration}]\``;
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('➕ Added to Queue (เพิ่มเข้าคิวเรียบร้อย)')
            .setDescription(`[**${song.name}**](${song.url}) — \`${song.formattedDuration}\``)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: '📍 อันดับในคิว', value: `#${queue.songs.length}`, inline: true },
                { name: '👤 ขอโดย', value: `${song.user}`, inline: true },
                { name: '📜 เพลงรออยู่ในคิว', value: `\`${queuedSongsCount}\` เพลง`, inline: true },
                { name: '⏭️ เพลงถัดไป', value: nextSongText, inline: false }
            )
            .setFooter({ text: `คิวรวมทั้งหมด: ${queue.songs.length} เพลง • Momuxic` })
            .setTimestamp();

        queue.textChannel?.send({ embeds: [embed] }).catch(() => { });

        // Queue length enforcement
        const tier = Premium.getTier(queue.id);
        const maxQueue = tier.maxQueue || 50;
        if (queue.songs.length > maxQueue + 1) {
            // Remove the just-added song (last in queue)
            queue.songs.pop();
            logger.warn('DisTube', `Queue full in guild ${queue.id} (max ${maxQueue})`);
            if (queue.textChannel) {
                reply.warn(
                    queue.textChannel,
                    'คิวเต็มแล้ว!',
                    `คิวเต็มแล้ว (สูงสุด ${maxQueue} เพลง)${!Premium.isActive(queue.id) ? '\n⭐ อัพเกรด Premium เพื่อเพิ่มเป็น 500+ เพลง!' : ''}`
                ).catch(() => { });
            }
        }
    });

    // ─── Playlist Added ──────────────────────────────────────────────────────
    distube.on('addList', (queue, playlist) => {
        logger.logMusic('addList', queue.id,
            `Playlist "${playlist.name}" — ${playlist.songs.length} songs added`);

        const queuedSongsCount = queue.songs.length - 1;
        const nextSong = queue.songs[1];

        let nextSongText = 'ไม่มี';
        if (nextSong) {
            const nextTitle = nextSong.name.length > 50 ? `${nextSong.name.substring(0, 47)}...` : nextSong.name;
            nextSongText = `[${nextTitle}](${nextSong.url}) \`[${nextSong.formattedDuration}]\``;
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('📋 Playlist Added (เพิ่ม Playlist เข้าคิว)')
            .setDescription(
                `**[${playlist.name}](${playlist.url || playlist.songs[0]?.url})**\n` +
                `✅ เพิ่มแล้ว \`${playlist.songs.length}\` เพลง เข้าคิวเรียบร้อย`
            )
            .setThumbnail(playlist.thumbnail || playlist.songs[0]?.thumbnail)
            .addFields(
                { name: '📊 เพิ่มเข้ามา', value: `\`${playlist.songs.length}\` เพลง`, inline: true },
                { name: '📜 เพลงรอในคิวรวม', value: `\`${queuedSongsCount}\` เพลง (\`${queue.formattedDuration}\`)`, inline: true },
                { name: '⏭️ เพลงถัดไป', value: nextSongText, inline: false }
            )
            .setFooter({ text: `คิวรวมทั้งหมด: ${queue.songs.length} เพลง • Momuxic` })
            .setTimestamp();

        queue.textChannel?.send({ embeds: [embed] }).catch(() => { });
    });

    // ─── Queue Finished ──────────────────────────────────────────────────────
    distube.on('finish', (queue) => {
        logger.logMusic('finish', queue.id, 'Queue finished — no more songs');

        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🏁 Queue Finished')
            .setDescription('No more songs in the queue. Use `!play` to add more!')
            .setTimestamp();

        queue.textChannel?.send({ embeds: [embed] }).catch(() => { });
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    distube.on('disconnect', (queue) => {
        logger.logMusic('disconnect', queue.id, 'Disconnected from voice channel');
        if (queue.textChannel) {
            reply.info(queue.textChannel, 'ออกจากห้องเสียง', '👋 Disconnected from the voice channel.').catch(() => { });
        }
    });

    // ─── DisTube Debug (ffmpeg, yt-dlp internals) ────────────────────────────
    distube.on('debug', (msg) => {
        logger.debug('DisTube', msg);
    });

    distube.on('ffmpegDebug', (msg) => {
        // ข้าม progress log ที่ spam ทุก 0.5 วินาที (size=...time=...speed=...)
        if (/size=\s*\d+.*time=.*speed=/i.test(msg)) return;

        // spawn, exit, stream events → log เป็น debug เสมอ (ไม่ใช่ error แม้มีคำ "error" ใน arg name)
        if (/\[(process|stream|test)\]/.test(msg)) {
            logger.debug('FFmpeg', msg);
            return;
        }

        // error/warning จาก ffmpeg → log เป็น WARN
        if (/error|warn|fail|cannot|invalid|abort/i.test(msg)) {
            logger.warn('FFmpeg', msg);
        } else {
            // ffmpeg metadata, format info → log เป็น debug
            logger.debug('FFmpeg', msg);
        }
    });

    // ─── Error Handler (per-guild isolated) ──────────────────────────────────
    // DisTube v5 signature: (error, queue, song)
    distube.on('error', (error, queue, song) => {
        const guildId = queue?.id || 'unknown';
        const songInfo = song ? `"${song.name}" (${song.url})` : 'N/A';
        const errorCode = error?.errorCode || error?.code || 'UNKNOWN';

        logger.error('DisTube', `Playback error in guild ${guildId}`, {
            errorCode,
            message: error?.message,
            song: songInfo,
            queueSize: queue?.songs?.length || 0,
            stack: error?.stack,
        });

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

    logger.info('DisTube', 'All event handlers registered');
};
