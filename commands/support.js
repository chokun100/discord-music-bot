const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'support',
    aliases: ['help', 'info'],
    description: 'Get support info and links',
    async execute(message) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🛠️ Support & Help')
            .setDescription('Need help or found a bug? Here are your options:')
            .addFields(
                {
                    name: '🔗 Support Server',
                    value: config.supportServerInvite
                        ? `[Join our Support Server](${config.supportServerInvite})`
                        : 'No support server configured',
                    inline: false,
                },
                {
                    name: '📧 Contact Email',
                    value: config.ownerEmail || 'No email configured',
                    inline: false,
                },
                {
                    name: '📝 Report a Bug',
                    value: 'Use `!report <description>` to send a bug report directly to our team!',
                    inline: false,
                },
                {
                    name: '🎵 Music Commands',
                    value: [
                        '`!play <URL or search>` — Play a song',
                        '`!skip` — Skip current song',
                        '`!stop` — Stop & leave',
                        '`!queue` — View queue',
                        '`!nowplaying` — Current song info',
                        '`!pause` / `!resume` — Pause/Resume',
                    ].join('\n'),
                    inline: false,
                }
            )
            .setFooter({ text: 'Thank you for using our bot! 💜' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
