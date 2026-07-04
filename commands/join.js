module.exports = {
    name: 'join',
    aliases: ['j', 'connect'],
    description: 'Join your current voice channel',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply('❌ You need to be in a voice channel first!');
        }

        // Check bot permissions in the voice channel
        const permissions = voiceChannel.permissionsFor(client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return message.reply('❌ บอทไม่มีสิทธิ์ **Connect** หรือ **Speak** ใน Voice Channel นี้!');
        }

        // Check if bot is already in the same channel
        const botVoice = message.guild.members.me?.voice;
        if (botVoice?.channelId === voiceChannel.id) {
            return message.reply('✅ I\'m already in your voice channel!');
        }

        try {
            // Use DisTube's voice manager so it stays compatible with !play
            await client.distube.voices.join(voiceChannel);
            message.reply(`🔊 Joined **${voiceChannel.name}**!`);
        } catch (error) {
            console.error(`❌ Join error in guild ${message.guild.id}:`, error);
            message.reply('❌ Failed to join the voice channel.').catch(() => { });
        }
    },
};
