const { reply } = require('../utils/embed');

module.exports = {
    name: 'move',
    aliases: ['mv'],
    description: 'Move a song in queue — e.g. /move 5 1',
    requireVoice: true,
    requireDJ: true,
    slashOptions: [
        { name: 'from', type: 'integer', description: 'Position of the song to move', required: true, min: 1 },
        { name: 'to', type: 'integer', description: 'New position', required: true, min: 1 },
    ],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        if (args.length < 2) {
            return reply.error(message, 'รูปแบบไม่ถูกต้อง', 'วิธีใช้: `!move <จากตำแหน่ง> <ไปยังตำแหน่ง>`\nตัวอย่าง: `!move 5 1` ย้ายเพลงลำดับ #5 ไปลำดับ #1');
        }

        const from = parseInt(args[0]);
        const to = parseInt(args[1]);
        const max = queue.songs.length - 1;

        if (isNaN(from) || isNaN(to) || from < 1 || from > max || to < 1 || to > max) {
            return reply.error(message, 'ตำแหน่งไม่ถูกต้อง', `ใช้ตัวเลขระหว่าง **1** ถึง **${max}**`);
        }

        if (from === to) {
            return reply.warn(message, 'ตำแหน่งเดิม', 'เพลงอยู่ที่ตำแหน่งนั้นอยู่แล้ว');
        }

        const [song] = queue.songs.splice(from, 1);
        queue.songs.splice(to, 0, song);

        reply.success(message, 'ย้ายตำแหน่งเพลงแล้ว', `↕️ ย้าย **[${song.name}](${song.url})** จากอันดับ #${from} ไปยังอันดับ #${to}`);
    },
};
