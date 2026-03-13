const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'shuffle',
    aliases: ['sh', 'mix'],
    description: 'Shuffle the queue',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        if (queue.songs.length <= 2) {
            return message.reply('❌ Need at least 2 songs in the queue to shuffle!');
        }

        await queue.shuffle();

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🔀 Queue Shuffled')
            .setDescription(`Randomized **${queue.songs.length - 1}** songs in the queue!`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
