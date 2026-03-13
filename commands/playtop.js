const config = require('../config');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'playtop',
    aliases: ['pt', 'ptop'],
    description: 'Add a song to the top of the queue (plays next)',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply('❌ You need to be in a voice channel!');
        }

        if (!args.length) {
            return message.reply('❌ Provide a URL or search term!\nUsage: `!playtop <URL or search>`');
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
            await message.reply(`🔍 Adding to top: **${query}**...`);
            await client.distube.play(voiceChannel, query, {
                member: message.member,
                textChannel: message.channel,
                message,
                position: 1, // Insert at position 1 (right after current song)
            });
        } catch (error) {
            console.error(`❌ Playtop error:`, error);
            message.reply(`❌ Could not add that song.\n**Error:** \`${error.message}\``).catch(() => { });
        }
    },
};
