const { reply } = require('../utils/embed');

module.exports = {
    name: 'stop',
    aliases: ['st0p'],
    description: 'Stop playing and leave the voice channel',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        try {
            await queue.stop();
            reply.success(message, 'หยุดเล่นเพลงแล้ว', '⏹️ หยุดเล่นและล้างคิวเรียบร้อย');
        } catch (error) {
            console.error(`❌ Stop error in guild ${message.guild.id}:`, error);
            reply.error(message, 'หยุดเพลงไม่ได้', 'เกิดข้อผิดพลาดในการหยุดเพลง');
        }
    },
};
