const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const Premium = require('../database/models/premium');

module.exports = {
    name: 'activate',
    aliases: ['addpremium', 'givepremium'],
    description: 'Activate premium for a server (Bot Owner only)',
    async execute(message, args, client) {
        // Bot owner only
        if (message.author.id !== config.ownerId) {
            return message.reply('❌ เฉพาะเจ้าของบอทเท่านั้นที่ใช้คำสั่งนี้ได้!');
        }

        if (args.length < 1) {
            return message.reply(
                '❌ Usage:\n' +
                '`!activate <guild_id> [days] [tier]`\n' +
                '`!activate this [days] [tier]` — activate for this server\n' +
                '`!activate list` — show all active premium servers\n' +
                '`!activate remove <guild_id>` — remove premium\n\n' +
                'Tiers: `basic`, `pro` | Default: 30 days, basic'
            );
        }

        const subcommand = args[0].toLowerCase();

        // List all active premium
        if (subcommand === 'list') {
            const actives = Premium.getAllActive();
            if (actives.length === 0) {
                return message.reply('📋 ไม่มี server ที่มี Premium อยู่');
            }

            const list = actives.map((p, i) => {
                const expires = new Date(p.expires_at);
                const daysLeft = Math.ceil((expires - Date.now()) / (1000 * 60 * 60 * 24));
                return `**${i + 1}.** Guild: \`${p.guild_id}\` | Tier: \`${p.tier}\` | เหลือ: ${daysLeft} วัน`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor(config.colors.premium)
                .setTitle('📋 Active Premium Servers')
                .setDescription(list)
                .setFooter({ text: `${actives.length} server(s)` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // Remove premium
        if (subcommand === 'remove' || subcommand === 'deactivate') {
            const targetGuild = args[1];
            if (!targetGuild) {
                return message.reply('❌ ระบุ Guild ID! `!activate remove <guild_id>`');
            }
            Premium.deactivate(targetGuild);
            return message.reply(`✅ ลบ Premium ของ Guild \`${targetGuild}\` แล้ว`);
        }

        // Activate premium
        const guildId = subcommand === 'this' ? message.guild.id : args[0];
        const days = parseInt(args[1]) || 30;
        const tier = args[2]?.toLowerCase() || 'basic';

        if (!['basic', 'pro'].includes(tier)) {
            return message.reply('❌ Tier ต้องเป็น `basic` หรือ `pro`');
        }

        const result = Premium.activate(guildId, message.author.id, tier, days, 'manual', null);

        const embed = new EmbedBuilder()
            .setColor(config.colors.premium)
            .setTitle('⭐ Premium Activated!')
            .setDescription(`เปิดใช้ **${Premium.TIERS[tier].emoji} ${Premium.TIERS[tier].name}** สำเร็จ!`)
            .addFields(
                { name: 'Guild ID', value: `\`${guildId}\``, inline: true },
                { name: 'Tier', value: tier, inline: true },
                { name: 'Duration', value: `${days} วัน`, inline: true },
                { name: 'Expires', value: new Date(result.expires_at).toLocaleDateString('th-TH'), inline: true },
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
