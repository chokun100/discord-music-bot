const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'move',
    aliases: ['mv'],
    description: 'Move a song in queue — e.g. !move 5 1',
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        if (args.length < 2) {
            return message.reply('❌ Usage: `!move <from> <to>`\nExample: `!move 5 1` moves song #5 to position #1');
        }

        const from = parseInt(args[0]);
        const to = parseInt(args[1]);
        const max = queue.songs.length - 1;

        if (isNaN(from) || isNaN(to) || from < 1 || from > max || to < 1 || to > max) {
            return message.reply(`❌ Positions must be between **1** and **${max}**`);
        }

        if (from === to) {
            return message.reply('❌ Song is already at that position!');
        }

        const [song] = queue.songs.splice(from, 1);
        queue.songs.splice(to, 0, song);

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('↕️ Song Moved')
            .setDescription(`Moved **[${song.name}](${song.url})** from #${from} to #${to}`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
