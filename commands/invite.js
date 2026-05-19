const { EmbedBuilder, PermissionsBitField, OAuth2Scopes } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'invite',
    aliases: ['inv', 'addbot'],
    description: 'Get the invite link to add the bot to your server',
    async execute(message, args, client) {
        const inviteUrl = client.generateInvite({
            scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
            permissions: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AddReactions,
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.Speak,
                PermissionsBitField.Flags.ManageMessages,
            ],
        });

        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🤖 เชิญ Momuxic ไปเซิร์ฟเวอร์ของคุณ!')
            .setDescription(
                `คลิกลิงก์ด้านล่างเพื่อเพิ่มบอทไปยังเซิร์ฟเวอร์ของคุณ:\n\n` +
                `🔗 **[Invite Momuxic](${inviteUrl})**`
            )
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '✨ Features', value: [
                    '• 🎵 เล่นเพลงจาก YouTube',
                    '• 🎛️ Audio Filters (15 ตัว)',
                    '• 🎧 DJ Role System',
                    '• ⭐ Premium System',
                    '• 📜 Song History',
                ].join('\n') }
            )
            .setFooter({ text: 'ขอบคุณที่ใช้ Momuxic! 💜' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
