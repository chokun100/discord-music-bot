const { reply } = require('../utils/embed');

module.exports = {
    name: 'seek',
    aliases: [],
    description: 'Jump to a specific timestamp — e.g. /seek 1:30',
    requireVoice: true,
    requireDJ: true,
    slashOptions: [
        { name: 'timestamp', type: 'string', description: 'Timestamp (e.g. 1:30 or 90)', required: true },
    ],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        if (!args.length) {
            return reply.error(message, 'ไม่ได้ระบุเวลา', 'ใส่เวลาที่ต้องการข้ามไป\nตัวอย่าง: `!seek 1:30` หรือ `!seek 90`');
        }

        // Parse timestamp: supports "90" (seconds), "1:30" (m:s), "1:30:00" (h:m:s)
        const parts = args[0].split(':').map(Number);
        let seconds;

        if (parts.some(isNaN)) {
            return reply.error(message, 'รูปแบบเวลาไม่ถูกต้อง', 'ใช้รูปแบบ `1:30` หรือ `90`');
        }

        if (parts.length === 1) seconds = parts[0];
        else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
        else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else return reply.error(message, 'รูปแบบเวลาไม่ถูกต้อง', 'ใช้รูปแบบ `1:30` หรือ `90`');

        if (seconds < 0 || seconds >= queue.songs[0].duration) {
            return reply.error(message, 'เวลาเกินขอบเขต', `ใส่เวลาระหว่าง \`0:00\` ถึง \`${queue.songs[0].formattedDuration}\``);
        }

        queue.seek(seconds);

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timestamp = `${mins}:${secs.toString().padStart(2, '0')}`;

        reply.music(message, 'ข้ามไปยังเวลา', `⏩ ข้ามไป **${timestamp}** ใน **${queue.songs[0].name}**`);
    },
};
