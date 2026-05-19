const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'clear',
    aliases: ['cq', 'clearqueue'],
    description: 'Clear all songs from the queue (keeps current song)',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        if (queue.songs.length <= 1) {
            return message.reply('❌ There are no upcoming songs to clear!');
        }

        const count = queue.songs.length - 1;
        queue.songs.splice(1); // Keep only the current song

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🗑️ Queue Cleared')
            .setDescription(`Removed **${count}** song(s) from the queue.\nNow playing: **${queue.songs[0].name}**`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
