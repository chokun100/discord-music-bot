module.exports = {
    name: 'stop',
    aliases: ['st0p'],
    description: 'Stop playing and leave the voice channel',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        try {
            await queue.stop();
            message.reply('⏹️ Stopped the music and cleared the queue. Goodbye!');
        } catch (error) {
            console.error(`❌ Stop error in guild ${message.guild.id}:`, error);
            message.reply('❌ Could not stop the music.');
        }
    },
};
