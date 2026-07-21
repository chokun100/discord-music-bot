const { reply, createEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'shuffle',
    aliases: ['sh', 'mix'],
    description: 'Shuffle the queue',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        if (queue.songs.length <= 2) {
            return reply.error(message, 'เพลงไม่พอ', 'ต้องมีอย่างน้อย 2 เพลงในคิวเพื่อสุ่มเพลง');
        }

        await queue.shuffle();

        reply.success(message, 'สุ่มเพลงแล้ว', `🔀 สุ่ม **${queue.songs.length - 1}** เพลงในคิวเรียบร้อย`);
    },
};
