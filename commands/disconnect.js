const { getVoiceConnection } = require('@discordjs/voice');
const { reply } = require('../utils/embed');

module.exports = {
    name: 'disconnect',
    aliases: ['dc', 'kick', 'leave'],
    description: 'Disconnect the bot from the voice channel',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;

        // Check if bot is in a voice channel in this guild
        const connection = getVoiceConnection(message.guild.id, client.user.id);

        if (!connection) {
            return reply.error(message, 'ไม่ได้อยู่ใน Voice Channel', 'บอทไม่ได้อยู่ใน Voice Channel ใดๆ ในขณะนี้');
        }

        // Stop any playing queue first
        try {
            const queue = client.distube.getQueue(message.guild.id);
            if (queue) {
                queue.stop();
            }
        } catch {
            // No queue, that's fine
        }

        connection.destroy();
        reply.info(message, 'ออกจากห้องเสียงแล้ว', '👋 ออกจาก Voice Channel และล้างคิวเรียบร้อย');
    },
};
