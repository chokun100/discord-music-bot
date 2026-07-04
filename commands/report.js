const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'report',
    aliases: ['bug', 'feedback'],
    description: 'Report a bug to the bot developers',
    slashOptions: [
        { name: 'issue', type: 'string', description: 'Detailed description of the bug (10-1000 chars)', required: true },
    ],
    async execute(message, args, client) {
        if (!args.length) {
            return message.reply(
                '❌ Please describe the bug!\nUsage: `!report <description of the bug>`'
            );
        }

        const description = args.join(' ');

        // Validate report length
        if (description.length < 10) {
            return message.reply('❌ Please provide a more detailed description (at least 10 characters).');
        }

        if (description.length > 1000) {
            return message.reply('❌ Report is too long! Please keep it under 1000 characters.');
        }

        // Check if the bug report channel is configured
        if (!config.bugReportChannelId) {
            return message.reply('❌ Bug reporting is not configured yet. Please contact the bot owner.');
        }

        try {
            // Find the bug report channel
            const reportChannel = await client.channels.fetch(config.bugReportChannelId).catch(() => null);

            if (!reportChannel) {
                console.error(`❌ Bug report channel not found: ${config.bugReportChannelId}`);
                return message.reply('❌ Could not send the report. The report channel is unavailable.');
            }

            // Create the report embed
            const reportEmbed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('🐛 New Bug Report')
                .setDescription(description)
                .addFields(
                    {
                        name: '👤 Reporter',
                        value: `${message.author.tag} (ID: ${message.author.id})`,
                        inline: true,
                    },
                    {
                        name: '🏠 Server',
                        value: `${message.guild.name} (ID: ${message.guild.id})`,
                        inline: true,
                    },
                    {
                        name: '📍 Channel',
                        value: `#${message.channel.name}`,
                        inline: true,
                    }
                )
                .setFooter({ text: `Report from ${message.guild.name}` })
                .setTimestamp();

            // Send to the report channel
            await reportChannel.send({ embeds: [reportEmbed] });

            // Confirm to the user
            const confirmEmbed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('✅ Bug Report Submitted!')
                .setDescription(
                    'Your report has been sent to our development team. Thank you for helping us improve!\n\n' +
                    `You can also join our [Support Server](${config.supportServerInvite}) for faster help.`
                )
                .setTimestamp();

            message.reply({ embeds: [confirmEmbed] });
        } catch (error) {
            console.error(`❌ Report error in guild ${message.guild.id}:`, error);
            message.reply('❌ Could not submit the bug report. Please try again later.');
        }
    },
};
