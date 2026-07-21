const { reply } = require('../utils/embed');
const { createEmbed } = require('../utils/embed');

module.exports = {
    name: 'remove',
    aliases: ['rm', 'delete'],
    description: 'Remove a song from the queue by position — e.g. /remove 3',
    requireVoice: true,
    requireDJ: true,
    slashOptions: [
        { name: 'position', type: 'integer', description: 'Queue position to remove', required: true, min: 1 },
    ],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        if (!args.length) {
            return reply.error(message, 'ไม่ได้ระบุตำแหน่ง', 'ใส่ตำแหน่งเพลงที่ต้องการลบ\nตัวอย่าง: `!remove 3`');
        }

        const position = parseInt(args[0]);

        if (isNaN(position) || position < 1 || position >= queue.songs.length) {
            return reply.error(message, 'ตำแหน่งไม่ถูกต้อง', `ใช้ตัวเลขระหว่าง **1** ถึง **${queue.songs.length - 1}**`);
        }

        const removed = queue.songs.splice(position, 1)[0];

        reply.success(message, 'ลบเพลงแล้ว', `🗑️ ลบ **[${removed.name}](${removed.url})** ออกจากตำแหน่ง #${position}`);
    },
};
