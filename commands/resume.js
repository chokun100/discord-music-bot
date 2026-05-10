const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'resume',
    aliases: ['r', 'unpause'],
    description: 'Resume paused playback',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        if (!queue.paused) {
            return message.reply('▶️ Music is already playing!');
        }

        queue.resume();

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('▶️ Resumed')
            .setDescription(`Resumed playing: **${queue.songs[0].name}**`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
