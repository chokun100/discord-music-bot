const { reply } = require('../utils/embed');

module.exports = {
    name: 'forward',
    aliases: ['ff', 'fwd'],
    description: 'Fast forward by seconds — e.g. /forward 10',
    requireVoice: true,
    requireDJ: true,
    slashOptions: [
        { name: 'seconds', type: 'integer', description: 'Seconds to fast forward (default 10)', required: false, min: 1 },
    ],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        const seconds = parseInt(args[0]) || 10;
        const newTime = queue.currentTime + seconds;

        if (newTime >= queue.songs[0].duration) {
            return reply.error(message, 'เลื่อนเวลาไม่ได้', `ไม่สามารถเลื่อนเกินความยาวเพลงได้! (${queue.songs[0].formattedDuration})`);
        }

        queue.seek(newTime);

        reply.success(message, 'กรอไปข้างหน้า', `⏩ เลื่อนไปข้างหน้า **${seconds}** วินาที`);
    },
};
