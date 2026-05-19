const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const GuildSettings = require('../database/models/guild');
const Premium = require('../database/models/premium');

module.exports = {
    name: 'help',
    aliases: ['h', 'commands'],
    description: 'Show all available commands',
    async execute(message, args, client) {
        const commands = client.commands;
        const prefix = GuildSettings.getPrefix(message.guild.id);
        const isPremium = Premium.isActive(message.guild.id);

        // Group commands by category
        const musicCmds = ['play', 'search', 'skip', 'voteskip', 'stop', 'pause', 'resume', 'queue', 'nowplaying', 'seek', 'forward', 'rewind', 'volume', 'loop', 'shuffle', 'remove', 'clear', 'playtop', 'move', 'skipto', 'previous', 'replay', 'autoplay', 'filter', 'lyrics', 'grab'];
        const voiceCmds = ['join', 'disconnect'];
        const settingsCmds = ['setdj', 'setprefix', '247'];
        const utilityCmds = ['help', 'ping', 'invite', 'support', 'report', 'stats', 'premium', 'history'];

        const formatCmd = (name) => {
            const cmd = commands.get(name);
            if (!cmd) return null;
            const aliases = cmd.aliases?.length ? ` (${cmd.aliases.map(a => `\`${a}\``).join(', ')})` : '';
            const premiumBadge = cmd.premiumOnly ? ' ⭐' : '';
            const djBadge = cmd.requireDJ ? ' 🎧' : '';
            return `\`${prefix}${cmd.name}\`${aliases}${premiumBadge}${djBadge} — ${cmd.description}`;
        };

        const musicList = musicCmds.map(formatCmd).filter(Boolean).join('\n');
        const voiceList = voiceCmds.map(formatCmd).filter(Boolean).join('\n');
        const settingsList = settingsCmds.map(formatCmd).filter(Boolean).join('\n');
        const utilityList = utilityCmds.map(formatCmd).filter(Boolean).join('\n');

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('📖 Momuxic Commands')
            .setDescription(
                `Prefix: \`${prefix}\` • ${commands.size} commands\n` +
                `${isPremium ? '⭐ **Premium Active**' : '🆓 Free Tier'}\n\n` +
                `🎧 = ต้องใช้ DJ Role | ⭐ = Premium Only`
            )
            .addFields(
                { name: '🎵 Music', value: musicList || 'None' },
                { name: '🔊 Voice', value: voiceList || 'None' },
                { name: '⚙️ Settings', value: settingsList || 'None' },
                { name: '🛠️ Utility', value: utilityList || 'None' },
            )
            .setFooter({ text: `Prefix: ${prefix} • ใช้ ${prefix}premium เพื่อดูสิทธิ์ Premium` })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
