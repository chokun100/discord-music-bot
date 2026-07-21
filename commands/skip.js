const { reply } = require('../utils/embed');

module.exports = {
    name: 'skip',
    aliases: ['s', 'next'],
    description: 'Skip the current song',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        try {
            if (queue.songs.length <= 1) {
                await queue.stop();
                return reply.success(message, 'ข้ามเพลงแล้ว', 'ไม่มีเพลงถัดไปในคิว — หยุดเล่นแล้ว');
            }

            const skipped = queue.songs[0].name;
            await queue.skip();
            reply.success(message, 'ข้ามเพลงแล้ว', `⏭️ ข้าม **${skipped}**`);
        } catch (error) {
            console.error(`❌ Skip error in guild ${message.guild.id}:`, error);
            reply.error(message, 'ข้ามเพลงไม่ได้', 'เกิดข้อผิดพลาดในการข้ามเพลง');
        }
    },
};
