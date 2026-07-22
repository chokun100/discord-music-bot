const config = require('../config');
const { getVoiceConnection } = require('@discordjs/voice');
const logger = require('../utils/logger');
const { reply } = require('../utils/embed');
const { cleanYoutubeUrl, isRadioMixUrl, resolveRadioMix } = require('../utils/youtube');

module.exports = {
    name: 'play',
    aliases: ['p'],
    description: 'Play a song from YouTube URL or search term',
    requireVoice: true,
    slashOptions: [
        { name: 'query', type: 'string', description: 'YouTube URL or search term', required: true },
    ],
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return reply.error(message, 'ไม่ได้อยู่ใน Voice Channel', 'คุณต้องอยู่ใน Voice Channel เพื่อเล่นเพลง');
        }

        // Check bot permissions in the voice channel
        const permissions = voiceChannel.permissionsFor(client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            logger.warn('Play', `Missing voice permissions in guild ${message.guild.id}, channel ${voiceChannel.id}`);
            return reply.error(message, 'ไม่มีสิทธิ์เข้าถึง', 'บอทไม่มีสิทธิ์ **Connect** หรือ **Speak** ใน Voice Channel นี้');
        }

        if (!args.length) {
            return reply.error(message, 'ไม่ได้ระบุเพลง', 'กรุณาใส่ URL หรือชื่อเพลง\nUsage: `!play <URL or search>`');
        }

        const rawQuery = args.join(' ');

        // ─── Radio Mix handling ─────────────────────────────────────────
        // Radio Mix (list=RD...) playlists are infinite and cause yt-dlp to hang
        // when DisTube tries to resolve them. We handle them separately by running
        // yt-dlp ourselves with --playlist-end to grab a limited number of songs,
        // then queue each individual video URL through distube.play().
        if (isRadioMixUrl(rawQuery)) {
            logger.music('Play', `Radio Mix detected: "${rawQuery}" by ${message.author.tag} in #${voiceChannel.name} (${message.guild.name})`);
            await reply.search(message, 'กำลังโหลด Radio Mix', '📻 กำลังดึงเพลง 5 เพลงจาก Radio Mix...');

            try {
                const mix = await resolveRadioMix(rawQuery, 5);

                if (!mix.urls.length) {
                    return reply.error(message, 'ไม่พบเพลง', 'ไม่สามารถดึงเพลงจาก Radio Mix นี้ได้');
                }

                logger.info('Play', `Radio Mix "${mix.name}" resolved: ${mix.urls.length} songs`);

                // Clean up stale connections before playing
                cleanupStaleConnections(client, message);

                // DisTube v5 validates options.message with isMessageInstance()
                const playOptions = {
                    member: message.member,
                    textChannel: message.channel,
                };
                if (!message._isInteraction) {
                    playOptions.message = message;
                }

                // Play all resolved songs — first one starts playing, rest go to queue
                for (const url of mix.urls) {
                    await client.distube.play(voiceChannel, url, playOptions);
                }

                logger.debug('Play', `Radio Mix queued ${mix.urls.length} songs for guild ${message.guild.id}`);
            } catch (error) {
                logger.error('Play', `Radio Mix failed for guild ${message.guild.id}: ${error.message}`, error);

                // Fallback: play just the single video (strip list param)
                const fallbackQuery = cleanYoutubeUrl(rawQuery);
                logger.info('Play', `Falling back to single video: "${fallbackQuery}"`);
                try {
                    const playOptions = { member: message.member, textChannel: message.channel };
                    if (!message._isInteraction) playOptions.message = message;
                    await client.distube.play(voiceChannel, fallbackQuery, playOptions);
                } catch (fallbackErr) {
                    logger.error('Play', `Fallback also failed: ${fallbackErr.message}`);
                    reply.error(message, 'เล่นเพลงไม่ได้', `ไม่สามารถเล่นเพลงนี้ได้\n\`${fallbackErr.message}\``).catch(() => { });
                }
            }
            return;
        }

        // ─── Normal flow (single video / standard playlist / search) ────
        let query = cleanYoutubeUrl(rawQuery);

        logger.music('Play', `Request: "${query}" by ${message.author.tag} in #${voiceChannel.name} (${message.guild.name})`);

        // Clean up stale connections
        cleanupStaleConnections(client, message);

        // DisTube v5 validates options.message with isMessageInstance()
        // Wrapped interactions are NOT real Discord.Message, so omit the field
        const playOptions = {
            member: message.member,
            textChannel: message.channel,
        };
        if (!message._isInteraction) {
            playOptions.message = message;
        }

        try {
            await reply.search(message, 'กำลังค้นหา', `🔍 **${query}**`);
            logger.debug('Play', `Calling distube.play() for guild ${message.guild.id}...`);

            await client.distube.play(voiceChannel, query, playOptions);

            logger.debug('Play', `distube.play() resolved successfully for guild ${message.guild.id}`);
        } catch (error) {
            if (error.errorCode === 'VOICE_CONNECT_FAILED' || error.errorCode === 'VOICE_ALREADY_CREATED') {
                // Clean up stale/non-DisTube connection and retry once
                logger.warn('Play', `${error.errorCode} in guild ${message.guild.id} — retrying...`);
                try {
                    const q = client.distube.getQueue(message.guild.id);
                    if (q) q.stop();
                } catch { }
                try {
                    const conn = getVoiceConnection(message.guild.id, client.user.id);
                    if (conn) conn.destroy();
                } catch { }
                // Also try without group ID (catches connections created by !join)
                try {
                    const conn2 = getVoiceConnection(message.guild.id);
                    if (conn2) conn2.destroy();
                } catch { }

                try {
                    await client.distube.play(voiceChannel, query, playOptions);
                    logger.info('Play', `Retry succeeded for guild ${message.guild.id}`);
                    return; // Retry succeeded
                } catch (retryError) {
                    logger.error('Play', `Retry also failed for guild ${message.guild.id}`, retryError);
                    reply.error(message, 'เชื่อมต่อไม่ได้', 'ไม่สามารถเชื่อมต่อ Voice Channel ได้ กรุณาลองใหม่อีกครั้ง').catch(() => { });
                    return;
                }
            }
            logger.error('Play', `Failed in guild ${message.guild.id}: ${error.message}`, error);
            reply.error(message, 'เล่นเพลงไม่ได้', `ไม่สามารถเล่นเพลงนี้ได้\n\`${error.message}\``).catch(() => { });
        }
    },
};

/**
 * Clean up stale queues and orphaned voice connections.
 * Extracted to avoid duplicating this block for Radio Mix vs normal flow.
 */
function cleanupStaleConnections(client, message) {
    try {
        const staleQueue = client.distube.getQueue(message.guild.id);
        if (staleQueue) {
            const botVoice = message.guild.members.me?.voice;
            if (!botVoice?.channelId) {
                logger.warn('Play', `Clearing stale queue for guild ${message.guild.id}`);
                try { staleQueue.stop(); } catch { }
            }
        }
    } catch { }

    try {
        const botVoice = message.guild.members.me?.voice;
        const oldConn = getVoiceConnection(message.guild.id, client.user.id);
        if (oldConn && !botVoice?.channelId) {
            logger.warn('Play', `Destroying orphaned voice connection for guild ${message.guild.id}`);
            oldConn.destroy();
        }
        const oldConn2 = getVoiceConnection(message.guild.id);
        if (oldConn2) {
            logger.warn('Play', `Destroying non-DisTube voice connection for guild ${message.guild.id}`);
            oldConn2.destroy();
        }
    } catch { }
}

