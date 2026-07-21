const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { reply } = require('../utils/embed');

module.exports = {
    name: 'grab',
    aliases: ['save', 'savetrack'],
    description: 'Save the current song info to your DMs',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue || !queue.songs.length) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        const song = queue.songs[0];

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('💾 บันทึกข้อมูลเพลง')
            .setDescription(`[${song.name}](${song.url})`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: '⏱️ ความยาว', value: `\`${song.formattedDuration}\``, inline: true },
                { name: '👤 ขอโดย', value: `${song.user}`, inline: true },
                { name: '🏠 เซิร์ฟเวอร์', value: message.guild.name, inline: true }
            )
            .setFooter({ text: `บันทึกจาก ${message.guild.name}` })
            .setTimestamp();

        try {
            await message.author.send({ embeds: [embed] });
            message.react('💾').catch(() => { });
            reply.success(message, 'บันทึกสำเร็จ', 'ส่งข้อมูลเพลงไปใน DM ของคุณเรียบร้อยแล้ว!');
        } catch (error) {
            reply.error(message, 'ส่ง DM ไม่ได้', 'กรุณาเปิดรับ Direct Messages จากสมาชิกเซิร์ฟเวอร์ก่อน');
        }
    },
};
