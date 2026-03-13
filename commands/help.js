const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'help',
    aliases: ['h', 'commands'],
    description: 'Show all available commands',
    async execute(message, args, client) {
        const commands = client.commands;

        // Group commands by category
        const musicCmds = ['play', 'skip', 'stop', 'pause', 'resume', 'queue', 'nowplaying', 'seek', 'volume', 'loop', 'shuffle', 'remove', 'playtop', 'move', 'skipto', 'autoplay', 'filter'];
        const voiceCmds = ['join', 'disconnect'];
        const utilityCmds = ['help', 'support', 'report'];

        const formatCmd = (name) => {
            const cmd = commands.get(name);
            if (!cmd) return null;
            const aliases = cmd.aliases?.length ? ` (${cmd.aliases.map(a => `\`${a}\``).join(', ')})` : '';
            return `\`!${cmd.name}\`${aliases} — ${cmd.description}`;
        };

        const musicList = musicCmds.map(formatCmd).filter(Boolean).join('\n');
        const voiceList = voiceCmds.map(formatCmd).filter(Boolean).join('\n');
        const utilityList = utilityCmds.map(formatCmd).filter(Boolean).join('\n');

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('📖 Momuxic Commands')
            .setDescription('Here are all available commands:')
            .addFields(
                { name: '🎵 Music', value: musicList || 'None' },
                { name: '🔊 Voice', value: voiceList || 'None' },
                { name: '🛠️ Utility', value: utilityList || 'None' },
            )
            .setFooter({ text: `Prefix: ${config.prefix} • ${commands.size} commands available` })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
