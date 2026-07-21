const { reply } = require('../utils/embed');

module.exports = {
    name: 'pause',
    aliases: [],
    description: 'Pause or resume the current song',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        // Determine if called as !pause or !resume
        const commandUsed = message.content.slice(1).split(/ +/)[0].toLowerCase();

        try {
            if (queue.paused && commandUsed === 'resume') {
                queue.resume();
                return reply.success(message, 'เล่นต่อแล้ว', '▶️ เล่นเพลงต่อจากที่หยุดไว้');
            }

            if (!queue.paused && commandUsed === 'pause') {
                queue.pause();
                return reply.info(message, 'หยุดชั่วคราว', '⏸️ หยุดเพลงชั่วคราว\nใช้ `!resume` เพื่อเล่นต่อ');
            }

            // Toggle behavior if using !pause when already paused (or vice versa)
            if (queue.paused) {
                queue.resume();
                reply.success(message, 'เล่นต่อแล้ว', '▶️ เล่นเพลงต่อจากที่หยุดไว้');
            } else {
                queue.pause();
                reply.info(message, 'หยุดชั่วคราว', '⏸️ หยุดเพลงชั่วคราว\nใช้ `!resume` เพื่อเล่นต่อ');
            }
        } catch (error) {
            console.error(`❌ Pause/Resume error in guild ${message.guild.id}:`, error);
            reply.error(message, 'เกิดข้อผิดพลาด', 'ไม่สามารถ Pause/Resume เพลงได้');
        }
    },
};
