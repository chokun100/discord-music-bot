const { reply } = require('../utils/embed');
const GuildSettings = require('../database/models/guild');

module.exports = {
    name: '247',
    aliases: ['twentyfourseven', 'stay', 'nonstop'],
    description: 'Toggle 24/7 mode — bot stays in voice channel permanently (Premium)',
    premiumOnly: true,
    requireVoice: true,
    async execute(message, args, client) {
        const guildId = message.guild.id;
        const current = GuildSettings.is247(guildId);
        const newState = !current;

        GuildSettings.set247(guildId, newState);

        if (newState) {
            reply.success(message, 'เปิดใช้งานโหมด 24/7', '🕐 บอทจะอยู่ใน Voice Channel ตลอดเวลาแม้ไม่มีคนอยู่ (ไม่ตัดการเชื่อมต่อจาก idle timeout)');
        } else {
            reply.info(message, 'ปิดใช้งานโหมด 24/7', 'บอทจะตัดการเชื่อมต่ออัตโนมัติเมื่อ Voice Channel ว่างเกิน 5 นาที');
        }
    },
};
