const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'autoplay',
    aliases: ['ap'],
    description: 'Toggle autoplay (play related songs when queue ends)',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        const autoplay = queue.toggleAutoplay();

        const embed = new EmbedBuilder()
            .setColor(autoplay ? config.colors.success : config.colors.error)
            .setTitle(autoplay ? '✅ Autoplay Enabled' : '❌ Autoplay Disabled')
            .setDescription(
                autoplay
                    ? 'I\'ll play related songs when the queue ends!'
                    : 'I\'ll stop when the queue ends.'
            )
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
