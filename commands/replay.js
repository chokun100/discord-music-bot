const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'replay',
    aliases: ['restart', 'again'],
    description: 'Replay the current song from the beginning',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        queue.seek(0);

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🔄 Replaying')
            .setDescription(`Restarted: **${queue.songs[0].name}**`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
