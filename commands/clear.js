const { reply } = require('../utils/embed');

module.exports = {
    name: 'clear',
    aliases: ['cq', 'clearqueue'],
    description: 'Clear all songs from the queue (keeps current song)',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        if (queue.songs.length <= 1) {
            return reply.error(message, 'ไม่มีคิวถัดไป', 'ไม่มีเพลงถัดไปในคิวให้ล้าง');
        }

        const count = queue.songs.length - 1;
        queue.songs.splice(1); // Keep only current song

        reply.success(message, 'ล้างคิวเรียบร้อย', `🗑️ ลบ **${count}** เพลงออกจากคิวเรียบร้อยแล้ว\nกำลังเล่น: **${queue.songs[0].name}**`);
    },
};
