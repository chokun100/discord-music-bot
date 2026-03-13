const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'skipto',
    aliases: ['st', 'jumpto'],
    description: 'Skip to a specific position in the queue — e.g. !skipto 3',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        if (!args.length) {
            return message.reply('❌ Provide the queue position! e.g. `!skipto 3`');
        }

        const position = parseInt(args[0]);

        if (isNaN(position) || position < 1 || position >= queue.songs.length) {
            return message.reply(`❌ Position must be between **1** and **${queue.songs.length - 1}**`);
        }

        const target = queue.songs[position];
        await queue.jump(position);

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('⏭️ Skipped To')
            .setDescription(`Now playing: **[${target.name}](${target.url})**`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
