const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'lyrics',
    aliases: ['ly', 'words'],
    description: 'Search for song lyrics',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        // Determine search query
        let query;
        if (args.length) {
            query = args.join(' ');
        } else if (queue?.songs.length) {
            // Use current song name, clean it up for search
            query = queue.songs[0].name
                .replace(/\(.*?\)/g, '')   // Remove parentheses content
                .replace(/\[.*?\]/g, '')   // Remove brackets content
                .replace(/official.*?(video|audio|mv)/gi, '') // Remove "Official Video" etc.
                .replace(/lyrics/gi, '')
                .replace(/MV/gi, '')
                .trim();
        } else {
            return message.reply('❌ ไม่มีเพลงกำลังเล่น! ใช้: `!lyrics <ชื่อเพลง>`');
        }

        try {
            const searchMsg = await message.reply(`🔍 กำลังค้นหาเนื้อเพลง: **${query}**...`);

            // Use a free lyrics API
            const response = await fetch(`https://lyrist.vercel.app/api/${encodeURIComponent(query)}`);

            if (!response.ok) {
                return searchMsg.edit('❌ ไม่พบเนื้อเพลงนี้ ลองค้นหาด้วยชื่อเพลงอื่น');
            }

            const data = await response.json();

            if (!data.lyrics) {
                return searchMsg.edit('❌ ไม่พบเนื้อเพลงนี้ ลองค้นหาด้วยชื่อเพลงอื่น');
            }

            // Truncate lyrics if too long for Discord embed (max 4096 chars)
            let lyrics = data.lyrics;
            const maxLength = 3800;
            if (lyrics.length > maxLength) {
                lyrics = lyrics.substring(0, maxLength) + '\n\n... **(เนื้อเพลงยาวเกินไป ตัดทอนแล้ว)**';
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.music)
                .setTitle(`🎤 ${data.title || query}`)
                .setDescription(lyrics)
                .setFooter({
                    text: `🎵 ${data.artist || 'Unknown Artist'} • Powered by Lyrist`,
                })
                .setTimestamp();

            if (data.image) {
                embed.setThumbnail(data.image);
            }

            await searchMsg.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error(`❌ Lyrics error:`, error);
            message.reply('❌ เกิดข้อผิดพลาดในการค้นหาเนื้อเพลง ลองอีกครั้ง').catch(() => { });
        }
    },
};
