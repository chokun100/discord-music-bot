const { reply } = require('../utils/embed');

module.exports = {
    name: 'replay',
    aliases: ['restart', 'again'],
    description: 'Replay the current song from the beginning',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        queue.seek(0);

        reply.success(message, 'เล่นซ้ำ', `🔄 เริ่มเล่นใหม่: **${queue.songs[0].name}**`);
    },
};
