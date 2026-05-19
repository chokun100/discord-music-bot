const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

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
        const existing = getVoiceConnection(message.guild.id, client.user.id);
        if (existing && existing.joinConfig.channelId === voiceChannel.id) {
            return message.reply('✅ I\'m already in your voice channel!');
        }

        try {
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                group: client.user.id,
                daveEncryption: false,
            });

            message.reply(`🔊 Joined **${voiceChannel.name}**!`);
        } catch (error) {
            console.error(`❌ Join error in guild ${message.guild.id}:`, error);
            message.reply('❌ Failed to join the voice channel.').catch(() => { });
        }
    },
};
