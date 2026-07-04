const { EmbedBuilder } = require('discord.js');
const config = require('../config');

const modeNames = ['Off', '🔂 Song', '🔁 Queue'];

module.exports = {
    name: 'loop',
    aliases: ['repeat', 'lp'],
    description: 'Toggle repeat mode: off → song → queue → off',
    requireVoice: true,
    requireDJ: true,
    slashOptions: [
        {
            name: 'mode', type: 'string', description: 'Repeat mode', required: false,
            choices: [
                { name: 'Off', value: 'off' },
                { name: 'Song', value: 'song' },
                { name: 'Queue', value: 'queue' },
            ],
        },
    ],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        // If user provides a specific mode
        let mode;
        if (args.length) {
            const input = args[0].toLowerCase();
            if (input === 'off' || input === '0') mode = 0;
            else if (input === 'song' || input === 'one' || input === '1') mode = 1;
            else if (input === 'queue' || input === 'all' || input === '2') mode = 2;
            else return message.reply('❌ Invalid mode! Use: `off`, `song`, or `queue`');
        } else {
            // Cycle: 0 → 1 → 2 → 0
            mode = (queue.repeatMode + 1) % 3;
        }

        queue.setRepeatMode(mode);

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('🔄 Repeat Mode')
            .setDescription(`Set to: **${modeNames[mode]}**`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
