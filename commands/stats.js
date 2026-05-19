const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const GuildSettings = require('../database/models/guild');
const os = require('os');

module.exports = {
    name: 'stats',
    aliases: ['status', 'botinfo', 'info'],
    description: 'Show bot statistics and system info',
    async execute(message, args, client) {
        const uptime = formatUptime(client.uptime);
        const memUsage = process.memoryUsage();
        const guilds = client.guilds.cache.size;
        const users = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
        const channels = client.channels.cache.size;
        const activeQueues = client.distube.queues.size;

        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('📊 Momuxic — Bot Statistics')
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🤖 Bot', value: [
                    `**Name:** ${client.user.tag}`,
                    `**ID:** ${client.user.id}`,
                    `**Uptime:** ${uptime}`,
                ].join('\n'), inline: true },
                { name: '📡 Discord', value: [
                    `**Servers:** ${guilds.toLocaleString()}`,
                    `**Users:** ${users.toLocaleString()}`,
                    `**Channels:** ${channels.toLocaleString()}`,
                ].join('\n'), inline: true },
                { name: '🎵 Music', value: [
                    `**Active Queues:** ${activeQueues}`,
                    `**Commands:** ${client.commands.size}`,
                ].join('\n'), inline: true },
                { name: '💻 System', value: [
                    `**Memory:** ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(1)} MB`,
                    `**OS:** ${os.platform()} ${os.arch()}`,
                    `**Node.js:** ${process.version}`,
                ].join('\n'), inline: false },
                { name: '📦 Libraries', value: [
                    `**discord.js:** v${require('discord.js').version}`,
                    `**DisTube:** v${require('distube').version}`,
                ].join('\n'), inline: false }
            )
            .setFooter({ text: `Ping: ${client.ws.ping}ms • Prefix: ${GuildSettings.getPrefix(message.guild.id)}` })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}
