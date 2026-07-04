const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const Premium = require('../database/models/premium');

// Available audio filters from DisTube
const FILTERS = {
    'bassboost':  { name: 'Bass Boost',  emoji: '🔊' },
    'nightcore':  { name: 'Nightcore',   emoji: '🌙' },
    'vaporwave':  { name: 'Vaporwave',   emoji: '🌊' },
    '3d':         { name: '3D Audio',    emoji: '🎧' },
    'echo':       { name: 'Echo',        emoji: '🔁' },
    'flanger':    { name: 'Flanger',     emoji: '🌀' },
    'karaoke':    { name: 'Karaoke',     emoji: '🎤' },
    'tremolo':    { name: 'Tremolo',     emoji: '〰️' },
    'phaser':     { name: 'Phaser',      emoji: '🔮' },
    'reverse':    { name: 'Reverse',     emoji: '⏪' },
    'surround':   { name: 'Surround',    emoji: '🔈' },
    'earwax':     { name: 'Earwax',      emoji: '👂' },
    'gate':       { name: 'Gate',        emoji: '🚪' },
    'haas':       { name: 'Haas',        emoji: '🎵' },
    'mcompand':   { name: 'Mcompand',    emoji: '📊' },
};

module.exports = {
    name: 'filter',
    aliases: ['fx', 'effect', 'filters'],
    description: 'Toggle audio filters — e.g. /filter bassboost',
    requireVoice: true,
    requireDJ: true,
    slashOptions: [
        {
            name: 'name', type: 'string', description: 'Filter name', required: false,
            choices: [
                { name: 'Bass Boost', value: 'bassboost' },
                { name: 'Nightcore', value: 'nightcore' },
                { name: 'Vaporwave', value: 'vaporwave' },
                { name: '3D Audio', value: '3d' },
                { name: 'Echo', value: 'echo' },
                { name: 'Flanger', value: 'flanger' },
                { name: 'Karaoke', value: 'karaoke' },
                { name: 'Tremolo', value: 'tremolo' },
                { name: 'Phaser', value: 'phaser' },
                { name: 'Reverse', value: 'reverse' },
                { name: 'Surround', value: 'surround' },
                { name: 'Earwax', value: 'earwax' },
                { name: 'Gate', value: 'gate' },
                { name: 'Haas', value: 'haas' },
                { name: 'Mcompand', value: 'mcompand' },
                { name: 'Off (Clear All)', value: 'off' },
            ],
        },
    ],
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        const isPremium = Premium.isActive(message.guild.id);
        const freeFilters = config.freeFilters || ['bassboost', 'nightcore', 'vaporwave'];

        // No args = show available filters and active ones
        if (!args.length) {
            const active = queue.filters.names;
            const list = Object.entries(FILTERS)
                .map(([key, val]) => {
                    const isActive = active.includes(key);
                    const isFree = freeFilters.includes(key);
                    const lockIcon = (!isPremium && !isFree) ? '🔒' : '';
                    return `${val.emoji} \`${key}\` — ${val.name} ${isActive ? '✅' : ''} ${lockIcon}`;
                })
                .join('\n');

            const embed = new EmbedBuilder()
                .setColor(config.colors.music)
                .setTitle('🎛️ Audio Filters')
                .setDescription(list)
                .setFooter({ text: `Usage: !filter <name> | Active: ${active.length > 0 ? active.join(', ') : 'none'}${!isPremium ? ' | 🔒 = Premium Only' : ''}` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        const filterName = args[0].toLowerCase();

        // Special: "off" or "clear" removes all filters
        if (filterName === 'off' || filterName === 'clear' || filterName === 'reset') {
            queue.filters.clear();
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🎛️ Filters Cleared')
                .setDescription('All audio filters have been removed.')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        if (!FILTERS[filterName]) {
            const available = Object.keys(FILTERS).map(f => `\`${f}\``).join(', ');
            return message.reply(`❌ Unknown filter! Available: ${available}`);
        }

        // Premium check for non-free filters
        if (!isPremium && !freeFilters.includes(filterName)) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('🔒 Premium Filter')
                .setDescription(
                    `**${FILTERS[filterName].name}** เป็น filter สำหรับ Premium เท่านั้น!\n\n` +
                    `🆓 Filter ฟรี: ${freeFilters.map(f => `\`${f}\``).join(', ')}\n\n` +
                    `ใช้ \`!premium\` เพื่อดูข้อมูล Premium`
                )
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // Toggle filter
        const isActive = queue.filters.has(filterName);
        if (isActive) {
            queue.filters.remove(filterName);
        } else {
            queue.filters.add(filterName);
        }

        const filter = FILTERS[filterName];
        const embed = new EmbedBuilder()
            .setColor(isActive ? config.colors.error : config.colors.success)
            .setTitle(`${filter.emoji} ${filter.name} ${isActive ? 'Disabled' : 'Enabled'}`)
            .setDescription(`Active filters: ${queue.filters.names.length > 0 ? queue.filters.names.map(f => `\`${f}\``).join(', ') : 'none'}`)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
