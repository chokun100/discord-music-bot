const { reply } = require('../utils/embed');

module.exports = {
    name: 'previous',
    aliases: ['prev', 'back'],
    description: 'Play the previous song',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        try {
            await queue.previous();
            reply.success(message, 'เพลงก่อนหน้า', '⏮️ กำลังเล่นเพลงก่อนหน้า');
        } catch (error) {
            // DisTube throws if there's no previous song
            if (error.message?.includes('previous') || error.errorCode === 'NO_PREVIOUS') {
                return reply.error(message, 'ไม่มีเพลงก่อนหน้า', 'ไม่มีเพลงก่อนหน้าให้เล่น');
            }
            console.error(`❌ Previous error in guild ${message.guild.id}:`, error);
            reply.error(message, 'เกิดข้อผิดพลาด', 'ไม่สามารถเล่นเพลงก่อนหน้าได้');
        }
    },
};
