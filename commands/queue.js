const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { reply } = require('../utils/embed');
const { cleanYoutubeUrl } = require('../utils/youtube');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    description: 'Show the current music queue',
    slashOptions: [
        { name: 'page', type: 'integer', description: 'Page number to view', required: false, min: 1 },
    ],
    async execute(message, args, client) {
        // If args provided and not a page number, treat as "add to queue" (like !play)
        if (args.length && isNaN(args[0])) {
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) {
                return reply.error(message, 'ไม่ได้อยู่ใน Voice Channel', 'คุณต้องอยู่ใน Voice Channel เพื่อเพิ่มเพลงเข้าคิว');
            }

            let query = cleanYoutubeUrl(args.join(' '));

            try {
                await reply.search(message, 'กำลังเพิ่มเข้าคิว', `🔍 **${query}**`);
                await client.distube.play(voiceChannel, query, {
                    member: message.member,
                    textChannel: message.channel,
                    message,
                });
            } catch (error) {
                console.error(`❌ Queue add error in guild ${message.guild.id}:`, error);
                reply.error(message, 'เพิ่มเพลงไม่ได้', `ไม่สามารถเพิ่มเพลงได้\n\`${error.message}\``).catch(() => { });
            }
            return;
        }

        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีคิวเพลง', 'ไม่มีเพลงอยู่ในคิวในขณะนี้');
        }

        const currentSong = queue.songs[0];
        const upcomingSongs = queue.songs.slice(1);

        // Build queue list with pagination (show max 10 songs)
        let queueList = '';
        const maxDisplay = 10;
        const page = parseInt(args[0]) || 1;
        const start = (page - 1) * maxDisplay;
        const end = start + maxDisplay;
        const totalPages = Math.ceil(upcomingSongs.length / maxDisplay) || 1;

        if (upcomingSongs.length > 0) {
            const displaySongs = upcomingSongs.slice(start, end);
            queueList = displaySongs
                .map((song, i) => `**${start + i + 1}.** [${song.name}](${song.url}) - \`${song.formattedDuration}\``)
                .join('\n');
        } else {
            queueList = 'ไม่มีเพลงถัดไป';
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('🎶 คิวเพลงปัจจุบัน')
            .setDescription(
                `**กำลังเล่น:**\n🎵 [${currentSong.name}](${currentSong.url}) - \`${currentSong.formattedDuration}\`\n\n` +
                `**รายการถัดไป:**\n${queueList}`
            )
            .setFooter({
                text: `หน้า ${page}/${totalPages} • ${queue.songs.length} เพลงในคิว • ความยาวรวม: ${queue.formattedDuration}`,
            })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
