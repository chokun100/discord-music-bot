module.exports = {
    name: 'skip',
    aliases: ['s', 'next'],
    description: 'Skip the current song',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        try {
            if (queue.songs.length <= 1) {
                await queue.stop();
                return message.reply('⏭️ Skipped! No more songs in the queue.');
            }

            await queue.skip();
            message.react('⏭️').catch(() => { });
        } catch (error) {
            console.error(`❌ Skip error in guild ${message.guild.id}:`, error);
            message.reply('❌ Could not skip the song.');
        }
    },
};
