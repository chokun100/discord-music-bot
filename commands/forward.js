const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'forward',
    aliases: ['ff', 'fwd'],
    description: 'Fast forward by seconds — e.g. /forward 10',
    requireVoice: true,
    requireDJ: true,
    slashOptions: [
        { name: 'seconds', type: 'integer', description: 'Seconds to fast forward (default 10)', required: false, min: 1 },
    ],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        const seconds = parseInt(args[0]) || 10;
        const newTime = queue.currentTime + seconds;

        if (newTime >= queue.songs[0].duration) {
            return message.reply(`❌ ไม่สามารถเลื่อนเกินความยาวเพลง! (${queue.songs[0].formattedDuration})`);
        }

        queue.seek(newTime);

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('⏩ Fast Forward')
            .setDescription(`เลื่อนไปข้างหน้า **${seconds}** วินาที`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
