const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'disconnect',
    aliases: ['dc', 'kick', 'leave'],
    description: 'Disconnect the bot from the voice channel',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;

        // Check if bot is in a voice channel in this guild
        const connection = getVoiceConnection(message.guild.id, client.user.id);

        if (!connection) {
            return message.reply('❌ I\'m not in any voice channel!');
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
        message.reply('👋 Disconnected from the voice channel!');
    },
};
