const config = require('../config');
const { getVoiceConnection } = require('@discordjs/voice');
const logger = require('../utils/logger');

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
            return message.reply('❌ You need to be in a voice channel to play music!');
        }

        // Check bot permissions in the voice channel
        const permissions = voiceChannel.permissionsFor(client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            logger.warn('Play', `Missing voice permissions in guild ${message.guild.id}, channel ${voiceChannel.id}`);
            return message.reply('❌ บอทไม่มีสิทธิ์ **Connect** หรือ **Speak** ใน Voice Channel นี้!');
        }

        if (!args.length) {
            return message.reply('❌ Please provide a YouTube URL or search term!\nUsage: `!play <URL or search>`');
        }

        let query = args.join(' ');

        // Strip &list= from YouTube Music URLs to avoid resolving entire playlists
        try {
            const url = new URL(query);
            if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                url.searchParams.delete('list');
                url.searchParams.delete('index');
                url.searchParams.delete('start_radio');
                query = url.toString();
            }
        } catch {
            // Not a URL — search query
        }

        logger.music('Play', `Request: "${query}" by ${message.author.tag} in #${voiceChannel.name} (${message.guild.name})`);

        // Clean up any stale queue/connection before playing
        try {
            const staleQueue = client.distube.getQueue(message.guild.id);
            if (staleQueue) {
                const botVoice = message.guild.members.me?.voice;
                if (!botVoice?.channelId) {
                    // Bot is NOT in voice but a queue exists — it's stale, clear it
                    logger.warn('Play', `Clearing stale queue for guild ${message.guild.id}`);
                    try { staleQueue.stop(); } catch { }
                }
            }
        } catch { }

        // Also destroy any orphaned voice connection (with or without group ID)
        try {
            const botVoice = message.guild.members.me?.voice;
            // Destroy connection with group ID
            const oldConn = getVoiceConnection(message.guild.id, client.user.id);
            if (oldConn && !botVoice?.channelId) {
                logger.warn('Play', `Destroying orphaned voice connection for guild ${message.guild.id}`);
                oldConn.destroy();
            }
            // Destroy connection without group ID (created by !join or other sources)
            const oldConn2 = getVoiceConnection(message.guild.id);
            if (oldConn2) {
                logger.warn('Play', `Destroying non-DisTube voice connection for guild ${message.guild.id}`);
                oldConn2.destroy();
            }
        } catch { }

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
            await message.reply(`🔍 Searching for: **${query}**...`);
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
                    message.reply('❌ Could not connect to the voice channel. Please try again.').catch(() => { });
                    return;
                }
            }
            logger.error('Play', `Failed in guild ${message.guild.id}: ${error.message}`, error);
            message.reply(`❌ Could not play that song.\n**Error:** \`${error.message}\``).catch(() => { });
        }
    },
};
