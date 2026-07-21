const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config');
const GuildSettings = require('../database/models/guild');
const Premium = require('../database/models/premium');
const { reply } = require('../utils/embed');

module.exports = {
    name: 'setprefix',
    aliases: ['prefix'],
    description: 'Change the bot prefix for this server (Premium)',
    premiumOnly: true,
    slashOptions: [
        { name: 'prefix', type: 'string', description: 'New bot prefix (max 5 chars, no spaces)', required: false },
    ],
    async execute(message, args, client) {
        // Only admins can change prefix
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return reply.error(message, 'ไม่มีสิทธิ์ใช้งาน', 'เฉพาะ Admin เท่านั้นที่เปลี่ยน Prefix ได้!');
        }

        // No args = show current prefix
        if (!args.length) {
            const settings = GuildSettings.get(message.guild.id);
            const embed = new EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('⚙️ Prefix')
                .setDescription(`Prefix ปัจจุบัน: \`${settings.prefix}\``)
                .setFooter({ text: 'ใช้ !setprefix <new prefix> เพื่อเปลี่ยน' })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const newPrefix = args[0];

        // Validate prefix
        if (newPrefix.length > 5) {
            return reply.error(message, 'Prefix ยาวเกินไป', 'Prefix ต้องไม่ยาวเกิน 5 ตัวอักษร!');
        }

        if (newPrefix.includes(' ')) {
            return reply.error(message, 'Prefix ไม่ถูกต้อง', 'Prefix ต้องไม่มีช่องว่าง!');
        }

        GuildSettings.setPrefix(message.guild.id, newPrefix);

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('⚙️ เปลี่ยน Prefix แล้ว')
            .setDescription(`เปลี่ยน Prefix เป็น \`${newPrefix}\` เรียบร้อย!\n\nตัวอย่าง: \`${newPrefix}play\`, \`${newPrefix}skip\`, \`${newPrefix}help\``)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
