const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const Premium = require('../database/models/premium');

module.exports = {
    name: 'premium',
    aliases: ['pro', 'upgrade', 'membership'],
    description: 'View premium subscription info and benefits',
    async execute(message, args, client) {
        const premiumInfo = Premium.get(message.guild.id);
        const tier = Premium.getTier(message.guild.id);

        if (premiumInfo) {
            // Guild has active premium
            const expiresAt = new Date(premiumInfo.expires_at);
            const daysLeft = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

            const embed = new EmbedBuilder()
                .setColor(0xFFD700) // Gold
                .setTitle(`${tier.emoji} ${tier.name} — Active`)
                .setDescription(`เซิร์ฟเวอร์นี้มี **${tier.name}** อยู่!`)
                .addFields(
                    { name: '📅 หมดอายุ', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R> (${expiresAt.toLocaleDateString('th-TH')})`, inline: true },
                    { name: '⏳ เหลืออีก', value: `${daysLeft} วัน`, inline: true },
                    { name: '👤 เปิดใช้โดย', value: `<@${premiumInfo.user_id}>`, inline: true },
                    { name: '\u200b', value: '\u200b' },
                    { name: '✅ สิทธิ์ที่ได้รับ', value: [
                        `• 🎛️ Audio Filters: **${tier.maxFilters} ตัว**`,
                        `• 📋 Queue: **${tier.maxQueue} เพลง**`,
                        `• 🔊 คุณภาพ: **${tier.quality}**`,
                        `• 🕐 24/7 Mode: **${tier.twentyFourSeven ? '✅' : '❌'}**`,
                        `• ⚙️ Custom Prefix: **${tier.customPrefix ? '✅' : '❌'}**`,
                        `• 📜 Song History: **${tier.songHistory ? '✅' : '❌'}**`,
                    ].join('\n') }
                )
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // No premium — show upgrade options
        const freeTier = Premium.FREE_TIER;
        const basicTier = Premium.TIERS.basic;

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('⭐ Momuxic Premium')
            .setDescription('อัพเกรดเซิร์ฟเวอร์ของคุณเพื่อปลดล็อคฟีเจอร์ทั้งหมด!')
            .addFields(
                { name: `${freeTier.emoji} Free (ปัจจุบัน)`, value: [
                    `• 🎛️ Audio Filters: **${freeTier.maxFilters} ตัว** (bassboost, nightcore, vaporwave)`,
                    `• 📋 Queue: **${freeTier.maxQueue} เพลง**`,
                    `• 🔊 คุณภาพ: **${freeTier.quality}**`,
                    `• 🕐 24/7 Mode: **❌**`,
                    `• ⚙️ Custom Prefix: **❌**`,
                ].join('\n'), inline: false },
                { name: '\u200b', value: '\u200b' },
                { name: `${basicTier.emoji} Basic Premium`, value: [
                    `• 🎛️ Audio Filters: **ทั้งหมด ${basicTier.maxFilters} ตัว**`,
                    `• 📋 Queue: **${basicTier.maxQueue} เพลง**`,
                    `• 🔊 คุณภาพ: **${basicTier.quality}**`,
                    `• 🕐 24/7 Mode: **✅**`,
                    `• ⚙️ Custom Prefix: **✅**`,
                    `• 📜 Song History: **✅**`,
                ].join('\n'), inline: false },
                { name: '\u200b', value: '\u200b' },
                { name: '💳 วิธีซื้อ', value: [
                    '**ติดต่อเราได้ที่:**',
                    config.supportServerInvite ? `🔗 [Support Server](${config.supportServerInvite})` : '',
                    config.ownerEmail ? `📧 ${config.ownerEmail}` : '',
                    '',
                    '*หรือใช้ `!support` เพื่อดูข้อมูลเพิ่มเติม*',
                ].filter(Boolean).join('\n') }
            )
            .setFooter({ text: 'Premium ช่วยสนับสนุนการพัฒนาบอท 💜' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
