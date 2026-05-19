const config = require('../config');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'play',
    aliases: ['p'],
    description: 'Play a song from YouTube URL or search term',
    requireVoice: true,
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply('❌ You need to be in a voice channel to play music!');
        }

        // Check bot permissions in the voice channel
        const permissions = voiceChannel.permissionsFor(client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
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

        // Clean up any stale queue/connection before playing
        try {
            const staleQueue = client.distube.getQueue(message.guild.id);
            if (staleQueue) {
                const botVoice = message.guild.members.me?.voice;
                if (!botVoice?.channelId) {
                    // Bot is NOT in voice but a queue exists — it's stale, clear it
                    console.log(`🧹 Clearing stale queue for guild ${message.guild.id}`);
                    try { staleQueue.stop(); } catch { }
                }
            }
        } catch { }

        // Also destroy any orphaned voice connection
        try {
            const oldConn = getVoiceConnection(message.guild.id, client.user.id);
            const botVoice = message.guild.members.me?.voice;
            if (oldConn && !botVoice?.channelId) {
                console.log(`🧹 Destroying orphaned voice connection for guild ${message.guild.id}`);
                oldConn.destroy();
            }
        } catch { }

        try {
            await message.reply(`🔍 Searching for: **${query}**...`);
            await client.distube.play(voiceChannel, query, {
                member: message.member,
                textChannel: message.channel,
                message,
            });
        } catch (error) {
            if (error.errorCode === 'VOICE_CONNECT_FAILED') {
                // Clean up and retry once
                console.log(`⚠️ VOICE_CONNECT_FAILED — cleaning up and retrying...`);
                try {
                    const q = client.distube.getQueue(message.guild.id);
                    if (q) q.stop();
                } catch { }
                try {
                    const conn = getVoiceConnection(message.guild.id, client.user.id);
                    if (conn) conn.destroy();
                } catch { }

                try {
                    await client.distube.play(voiceChannel, query, {
                        member: message.member,
                        textChannel: message.channel,
                        message,
                    });
                    return; // Retry succeeded
                } catch (retryError) {
                    console.error(`❌ Retry also failed:`, retryError);
                    message.reply('❌ Could not connect to the voice channel. Please try again.').catch(() => { });
                    return;
                }
            }
            console.error(`❌ Play error in guild ${message.guild.id}:`, error);
            message.reply(`❌ Could not play that song.\n**Error:** \`${error.message}\``).catch(() => { });
        }
    },
};
