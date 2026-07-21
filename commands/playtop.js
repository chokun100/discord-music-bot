const config = require('../config');
const { getVoiceConnection } = require('@discordjs/voice');
const { reply } = require('../utils/embed');

module.exports = {
    name: 'playtop',
    aliases: ['pt', 'ptop'],
    description: 'Add a song to the top of the queue (plays next)',
    requireVoice: true,
    requireDJ: true,
    slashOptions: [
        { name: 'query', type: 'string', description: 'YouTube URL or search term', required: true },
    ],
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return reply.error(message, 'ไม่ได้อยู่ใน Voice Channel', 'คุณต้องอยู่ใน Voice Channel เพื่อเล่นเพลง');
        }

        if (!args.length) {
            return reply.error(message, 'ไม่ได้ระบุเพลง', 'กรุณาใส่ URL หรือชื่อเพลง\nUsage: `!playtop <URL or search>`');
        }

        let query = args.join(' ');

        // Strip playlist params from YouTube URLs
        try {
            const url = new URL(query);
            if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                url.searchParams.delete('list');
                url.searchParams.delete('index');
                url.searchParams.delete('start_radio');
                query = url.toString();
            }
        } catch { }

        try {
            await reply.search(message, 'กำลังแทรกขึ้นบนสุดของคิว', `🔍 **${query}**`);
            await client.distube.play(voiceChannel, query, {
                member: message.member,
                textChannel: message.channel,
                message,
                position: 1, // Insert at position 1 (right after current song)
            });
        } catch (error) {
            console.error(`❌ Playtop error:`, error);
            reply.error(message, 'เพิ่มเพลงไม่ได้', `ไม่สามารถเพิ่มเพลงได้\n\`${error.message}\``).catch(() => { });
        }
    },
};
