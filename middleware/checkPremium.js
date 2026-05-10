const Premium = require('../database/models/premium');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Middleware: Check if guild has active premium.
 * Returns true if OK, sends error reply and returns false if not.
 * 
 * @param {Message} message
 * @param {string} featureName - Name of the premium feature being accessed
 */
async function checkPremium(message, featureName = 'this feature') {
    if (Premium.isActive(message.guild.id)) {
        return true;
    }

    const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('⭐ Premium Feature')
        .setDescription(
            `**${featureName}** เป็นฟีเจอร์สำหรับ Premium เท่านั้น!\n\n` +
            `ใช้ \`${config.prefix}premium\` เพื่อดูข้อมูล Premium`
        )
        .addFields(
            { name: '💎 Premium Benefits', value: [
                '• 🎛️ Audio Filters ทั้งหมด (15 ตัว)',
                '• 📋 Queue ไม่จำกัด (500+ เพลง)',
                '• 🔊 คุณภาพเสียง 320kbps',
                '• 🕐 24/7 Mode',
                '• ⚙️ Custom Prefix',
                '• 📜 Song History',
            ].join('\n') }
        )
        .setTimestamp();

    await message.reply({ embeds: [embed] }).catch(() => { });
    return false;
}

module.exports = checkPremium;
