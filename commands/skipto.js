const { reply } = require('../utils/embed');

module.exports = {
    name: 'skipto',
    aliases: ['st', 'jumpto'],
    description: 'Skip to a specific song in the queue — e.g. /skipto 5',
    requireVoice: true,
    requireDJ: true,
    slashOptions: [
        { name: 'position', type: 'integer', description: 'Queue position to skip to', required: true, min: 1 },
    ],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        if (!args.length) {
            return reply.error(message, 'ไม่ได้ระบุตำแหน่ง', 'ใส่ตำแหน่งเพลงที่ต้องการข้ามไป\nตัวอย่าง: `!skipto 3`');
        }

        const position = parseInt(args[0]);

        if (isNaN(position) || position < 1 || position >= queue.songs.length) {
            return reply.error(message, 'ตำแหน่งไม่ถูกต้อง', `ใช้ตัวเลขระหว่าง **1** ถึง **${queue.songs.length - 1}**`);
        }

        const target = queue.songs[position];
        await queue.jump(position);

        reply.success(message, 'ข้ามไปเพลง', `⏭️ กำลังเล่น: **[${target.name}](${target.url})**`);
    },
};
