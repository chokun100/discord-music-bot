const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'volume',
    aliases: ['vol', 'v'],
    description: 'Set or show the playback volume (1-150)',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        // No args = show current volume
        if (!args.length) {
            const bar = '█'.repeat(Math.round(queue.volume / 10)) + '░'.repeat(15 - Math.round(queue.volume / 10));
            const embed = new EmbedBuilder()
                .setColor(config.colors.music)
                .setTitle('🔊 Volume')
                .setDescription(`**${queue.volume}%**\n\`${bar}\``)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const volume = parseInt(args[0]);

        if (isNaN(volume) || volume < 1 || volume > 150) {
            return message.reply('❌ Volume must be between **1** and **150**!');
        }

        queue.setVolume(volume);

        const icon = volume > 100 ? '🔊' : volume > 50 ? '🔉' : '🔈';
        const bar = '█'.repeat(Math.round(volume / 10)) + '░'.repeat(15 - Math.round(volume / 10));

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(`${icon} Volume Set`)
            .setDescription(`**${volume}%**\n\`${bar}\``)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
