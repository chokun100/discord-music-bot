const { reply } = require('../utils/embed');

module.exports = {
    name: 'resume',
    aliases: ['unpause', 'r'],
    description: 'Resume the paused song',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        if (!queue.paused) {
            return reply.info(message, 'กำลังเล่นอยู่แล้ว', '▶️ เพลงกำลังเล่นอยู่แล้ว');
        }

        queue.resume();
        reply.success(message, 'เล่นต่อแล้ว', '▶️ เล่นเพลงต่อจากที่หยุดไว้');
    },
};
