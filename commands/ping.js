const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'ping',
    aliases: ['latency', 'pong'],
    description: 'Check bot latency and API response time',
    async execute(message, args, client) {
        const sent = await message.reply('🏓 Pinging...');
        const roundtrip = sent.createdTimestamp - message.createdTimestamp;
        const wsLatency = client.ws.ping;

        // Color based on latency
        let color = config.colors.success; // Green
        if (wsLatency > 200) color = config.colors.error; // Red
        else if (wsLatency > 100) color = config.colors.warning; // Yellow

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '📡 API Latency', value: `\`${wsLatency}ms\``, inline: true },
                { name: '⏱️ Round Trip', value: `\`${roundtrip}ms\``, inline: true },
                { name: '📊 Status', value: wsLatency < 100 ? '🟢 Excellent' : wsLatency < 200 ? '🟡 Good' : '🔴 High Latency', inline: true }
            )
            .setTimestamp();

        sent.edit({ content: null, embeds: [embed] });
    },
};
