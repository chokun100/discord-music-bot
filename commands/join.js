const { reply } = require('../utils/embed');

module.exports = {
    name: 'join',
    aliases: ['j', 'connect'],
    description: 'Join your current voice channel',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return reply.error(message, 'ไม่ได้อยู่ใน Voice Channel', 'คุณต้องเชื่อมต่อใน Voice Channel ก่อนใช้คำสั่งนี้');
        }

        // Check bot permissions in the voice channel
        const permissions = voiceChannel.permissionsFor(client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return reply.error(message, 'ไม่มีสิทธิ์เข้าถึง', 'บอทไม่มีสิทธิ์ **Connect** หรือ **Speak** ใน Voice Channel นี้');
        }

        // Check if bot is already in the same channel
        const botVoice = message.guild.members.me?.voice;
        if (botVoice?.channelId === voiceChannel.id) {
            return reply.info(message, 'เชื่อมต่ออยู่แล้ว', `บอทอยู่ในช่อง **${voiceChannel.name}** อยู่แล้ว`);
        }

        try {
            // Use DisTube's voice manager so it stays compatible with !play
            await client.distube.voices.join(voiceChannel);
            reply.success(message, 'เข้าร่วมห้องเสียง', `🔊 เชื่อมต่อเข้า **${voiceChannel.name}** เรียบร้อยแล้ว`);
        } catch (error) {
            console.error(`❌ Join error in guild ${message.guild.id}:`, error);
            reply.error(message, 'ล้มเหลว', 'ไม่สามารถเชื่อมต่อ Voice Channel ได้').catch(() => { });
        }
    },
};
