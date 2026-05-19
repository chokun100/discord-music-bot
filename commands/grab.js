const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'grab',
    aliases: ['save', 'savetrack'],
    description: 'Save the current song info to your DMs',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue || !queue.songs.length) {
            return message.reply('❌ There is nothing playing right now!');
        }

        const song = queue.songs[0];

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('💾 Saved Song')
            .setDescription(`[${song.name}](${song.url})`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: '⏱️ Duration', value: `\`${song.formattedDuration}\``, inline: true },
                { name: '👤 Requested by', value: `${song.user}`, inline: true },
                { name: '🏠 Server', value: message.guild.name, inline: true }
            )
            .setFooter({ text: `Saved from ${message.guild.name}` })
            .setTimestamp();

        try {
            await message.author.send({ embeds: [embed] });
            message.react('💾').catch(() => { });
            message.reply('💾 ส่งข้อมูลเพลงไปใน DM ของคุณแล้ว!').catch(() => { });
        } catch (error) {
            message.reply('❌ ไม่สามารถส่ง DM ได้! กรุณาเปิดรับ DM จากสมาชิกเซิร์ฟเวอร์').catch(() => { });
        }
    },
};
