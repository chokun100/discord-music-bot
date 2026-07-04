const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'rewind',
    aliases: ['rw', 'rew'],
    description: 'Rewind by seconds — e.g. /rewind 10',
    requireVoice: true,
    requireDJ: true,
    slashOptions: [
        { name: 'seconds', type: 'integer', description: 'Seconds to rewind (default 10)', required: false, min: 1 },
    ],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        const seconds = parseInt(args[0]) || 10;
        const newTime = Math.max(0, queue.currentTime - seconds);

        queue.seek(newTime);

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('⏪ Rewind')
            .setDescription(`ย้อนกลับ **${seconds}** วินาที`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
