const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'remove',
    aliases: ['rm', 'delete'],
    description: 'Remove a song from the queue by position — e.g. !remove 3',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        if (!args.length) {
            return message.reply('❌ Provide the position to remove! e.g. `!remove 3`');
        }

        const position = parseInt(args[0]);

        if (isNaN(position) || position < 1 || position >= queue.songs.length) {
            return message.reply(`❌ Invalid position! Use a number between **1** and **${queue.songs.length - 1}**`);
        }

        const removed = queue.songs.splice(position, 1)[0];

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🗑️ Removed from Queue')
            .setDescription(`Removed **[${removed.name}](${removed.url})** from position #${position}`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
