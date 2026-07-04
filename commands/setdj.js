const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config');
const GuildSettings = require('../database/models/guild');

module.exports = {
    name: 'setdj',
    aliases: ['djrole', 'dj'],
    description: 'Set or remove the DJ role for this server',
    requireDJ: false, // Don't require DJ to set DJ role (admin only)
    slashOptions: [
        { name: 'role', type: 'role', description: 'DJ Role to set (leave empty to show current)', required: false },
    ],
    async execute(message, args, client) {
        // Only admins can set DJ role
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ เฉพาะ Admin เท่านั้นที่ตั้ง DJ Role ได้!');
        }

        // No args = show current DJ role
        if (!args.length) {
            const djRoleId = GuildSettings.getDJRole(message.guild.id);
            if (djRoleId) {
                const role = message.guild.roles.cache.get(djRoleId);
                const embed = new EmbedBuilder()
                    .setColor(config.colors.info)
                    .setTitle('🎧 DJ Role')
                    .setDescription(`DJ Role ปัจจุบัน: ${role ? `<@&${djRoleId}>` : `ID: ${djRoleId} (ไม่พบ Role)`}`)
                    .setFooter({ text: 'ใช้ !setdj @role เพื่อเปลี่ยน หรือ !setdj off เพื่อปิด' })
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor(config.colors.info)
                    .setTitle('🎧 DJ Role')
                    .setDescription('ยังไม่ได้ตั้ง DJ Role — ทุกคนสามารถใช้คำสั่งเพลงได้')
                    .setFooter({ text: 'ใช้ !setdj @role เพื่อตั้ง DJ Role' })
                    .setTimestamp();
                return message.reply({ embeds: [embed] });
            }
        }

        const input = args[0].toLowerCase();

        // Remove DJ role
        if (input === 'off' || input === 'remove' || input === 'none' || input === 'clear') {
            GuildSettings.setDJRole(message.guild.id, null);
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🎧 DJ Role Removed')
                .setDescription('ลบ DJ Role แล้ว — ทุกคนสามารถใช้คำสั่งเพลงได้')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Parse role mention or ID
        const role = message.mentions.roles.first()
            || message.guild.roles.cache.get(args[0])
            || message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());

        if (!role) {
            return message.reply('❌ ไม่พบ Role นี้! ใช้: `!setdj @role` หรือ `!setdj <role name>`');
        }

        GuildSettings.setDJRole(message.guild.id, role.id);

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🎧 DJ Role Set')
            .setDescription(`ตั้ง DJ Role เป็น <@&${role.id}> แล้ว!\n\nเฉพาะคนที่มี Role นี้ (หรือ Admin) เท่านั้นที่ใช้คำสั่งควบคุมเพลงได้`)
            .addFields(
                { name: '🔒 คำสั่งที่ต้องใช้ DJ Role', value: '`skip`, `stop`, `pause`, `resume`, `shuffle`, `remove`, `move`, `skipto`, `filter`, `volume`, `loop`, `playtop`' }
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
