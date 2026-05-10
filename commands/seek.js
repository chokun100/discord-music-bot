const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'seek',
    aliases: [],
    description: 'Jump to a specific timestamp — e.g. !seek 1:30',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        if (!args.length) {
            return message.reply('❌ Provide a timestamp! e.g. `!seek 1:30` or `!seek 90`');
        }

        // Parse timestamp: supports "90" (seconds), "1:30" (m:s), "1:30:00" (h:m:s)
        const parts = args[0].split(':').map(Number);
        let seconds;

        if (parts.some(isNaN)) {
            return message.reply('❌ Invalid timestamp format! Use `1:30` or `90`');
        }

        if (parts.length === 1) seconds = parts[0];
        else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
        else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else return message.reply('❌ Invalid timestamp format!');

        if (seconds < 0 || seconds >= queue.songs[0].duration) {
            return message.reply(`❌ Timestamp must be between \`0:00\` and \`${queue.songs[0].formattedDuration}\``);
        }

        queue.seek(seconds);

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timestamp = `${mins}:${secs.toString().padStart(2, '0')}`;

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('⏩ Seeked')
            .setDescription(`Jumped to **${timestamp}** in **${queue.songs[0].name}**`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
