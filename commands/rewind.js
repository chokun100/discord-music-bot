const { reply } = require('../utils/embed');

module.exports = {
    name: 'rewind',
    aliases: ['rw', 'rew'],
    description: 'Rewind by seconds — e.g. /rewind 10',
    requireVoice: true,
    requireDJ: true,
    slashOptions: [
        { name: 'seconds', type: 'integer', description: 'Seconds to rewind (default 10)', required: false, min: 1 },
    ],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        const seconds = parseInt(args[0]) || 10;
        const newTime = Math.max(0, queue.currentTime - seconds);

        queue.seek(newTime);

        reply.success(message, 'กรอย้อนกลับ', `⏪ ย้อนกลับ **${seconds}** วินาที`);
    },
};
