const { reply } = require('../utils/embed');

module.exports = {
    name: 'autoplay',
    aliases: ['ap'],
    description: 'Toggle autoplay (play related songs when queue ends)',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        const autoplay = queue.toggleAutoplay();

        if (autoplay) {
            reply.success(message, 'เปิดใช้งาน Autoplay', 'บอทจะเล่นเพลงที่เกี่ยวข้องให้อัตโนมัติเมื่อคิวหมด!');
        } else {
            reply.info(message, 'ปิดใช้งาน Autoplay', 'บอทจะหยุดเล่นเมื่อคิวเพลงหมดลง');
        }
    },
};
