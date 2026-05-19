const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const GuildSettings = require('../database/models/guild');

module.exports = {
    name: 'support',
    aliases: ['contact'],
    description: 'Get support info and links',
    async execute(message, args, client) {
        const prefix = GuildSettings.getPrefix(message.guild.id);
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
                    value: `Use \`${prefix}report <description>\` to send a bug report directly to our team!`,
                    inline: false,
                },
                {
                    name: '🎵 Music Commands',
                    value: [
                        `\`${prefix}play <URL or search>\` — Play a song`,
                        `\`${prefix}skip\` — Skip current song`,
                        `\`${prefix}stop\` — Stop & leave`,
                        `\`${prefix}queue\` — View queue`,
                        `\`${prefix}nowplaying\` — Current song info`,
                        `\`${prefix}pause\` / \`${prefix}resume\` — Pause/Resume`,
                    ].join('\n'),
                    inline: false,
                }
            )
            .setFooter({ text: 'Thank you for using our bot! 💜' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
