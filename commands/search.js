const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'search',
    aliases: ['find', 'lookup'],
    description: 'Search for a song and choose from results',
    requireVoice: true,
    cooldown: 10,
    slashOptions: [
        { name: 'query', type: 'string', description: 'Song name to search for', required: true },
    ],
    async execute(message, args, client) {
        if (!args.length) {
            return message.reply('❌ ใส่ชื่อเพลงที่ต้องการค้นหา!\nUsage: `!search <ชื่อเพลง>`');
        }

        const query = args.join(' ');

        try {
            const searchMsg = await message.reply(`🔍 กำลังค้นหา: **${query}**...`);

            const results = await client.distube.search(query, {
                limit: 5,
                type: 'video',
                safeSearch: true,
            });

            if (!results.length) {
                return searchMsg.edit('❌ ไม่พบผลลัพธ์! ลองคำค้นอื่น');
            }

            const resultList = results
                .map((song, i) => `**${i + 1}.** [${song.name}](${song.url}) — \`${song.formattedDuration}\``)
                .join('\n');

            const embed = new EmbedBuilder()
                .setColor(config.colors.music)
                .setTitle(`🔍 ผลการค้นหา: "${query}"`)
                .setDescription(resultList + '\n\n📝 พิมพ์ **1-5** เพื่อเลือก หรือ **cancel** เพื่อยกเลิก')
                .setFooter({ text: `จะหมดเวลาใน 30 วินาที` })
                .setTimestamp();

            await searchMsg.edit({ content: null, embeds: [embed] });

            // Wait for user response
            const filter = (m) =>
                m.author.id === message.author.id &&
                (/^[1-5]$/.test(m.content) || m.content.toLowerCase() === 'cancel');

            const collector = message.channel.createMessageCollector({
                filter,
                max: 1,
                time: 30000,
            });

            collector.on('collect', async (m) => {
                // Delete the selection message
                m.delete().catch(() => { });

                if (m.content.toLowerCase() === 'cancel') {
                    return searchMsg.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(config.colors.error)
                                .setTitle('❌ ยกเลิกการค้นหา')
                                .setTimestamp()
                        ],
                    });
                }

                const index = parseInt(m.content) - 1;
                const selected = results[index];

                const voiceChannel = message.member.voice.channel;
                if (!voiceChannel) {
                    return searchMsg.edit('❌ คุณต้องอยู่ใน Voice Channel!');
                }

                try {
                    await client.distube.play(voiceChannel, selected.url, {
                        member: message.member,
                        textChannel: message.channel,
                        message,
                    });
                    searchMsg.delete().catch(() => { });
                } catch (error) {
                    console.error('❌ Search play error:', error);
                    searchMsg.edit(`❌ ไม่สามารถเล่นเพลงนี้ได้`).catch(() => { });
                }
            });

            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    searchMsg.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(config.colors.warning)
                                .setTitle('⏰ หมดเวลา')
                                .setDescription('ไม่ได้เลือกเพลง — การค้นหาถูกยกเลิก')
                                .setTimestamp()
                        ],
                    }).catch(() => { });
                }
            });
        } catch (error) {
            console.error('❌ Search error:', error);
            message.reply('❌ เกิดข้อผิดพลาดในการค้นหา ลองอีกครั้ง').catch(() => { });
        }
    },
};
