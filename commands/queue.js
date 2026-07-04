const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    description: 'Show the current music queue',
    slashOptions: [
        { name: 'page', type: 'integer', description: 'Page number to view', required: false, min: 1 },
    ],
    async execute(message, args, client) {
        // If args provided and not a page number, treat as "add to queue" (like !play)
        if (args.length && isNaN(args[0])) {
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) {
                return message.reply('❌ You need to be in a voice channel to add songs!');
            }

            let query = args.join(' ');

            // Strip playlist params from YouTube URLs
            try {
                const url = new URL(query);
                if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                    url.searchParams.delete('list');
                    url.searchParams.delete('index');
                    url.searchParams.delete('start_radio');
                    query = url.toString();
                }
            } catch {
                // Not a URL — search query
            }

            try {
                await message.reply(`🔍 Adding to queue: **${query}**...`);
                await client.distube.play(voiceChannel, query, {
                    member: message.member,
                    textChannel: message.channel,
                    message,
                });
            } catch (error) {
                console.error(`❌ Queue add error in guild ${message.guild.id}:`, error);
                message.reply(`❌ Could not add that song.\n**Error:** \`${error.message}\``).catch(() => { });
            }
            return;
        }

        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing in the queue right now!');
        }

        const currentSong = queue.songs[0];
        const upcomingSongs = queue.songs.slice(1);

        // Build queue list with pagination (show max 10 songs)
        let queueList = '';
        const maxDisplay = 10;
        const page = parseInt(args[0]) || 1;
        const start = (page - 1) * maxDisplay;
        const end = start + maxDisplay;
        const totalPages = Math.ceil(upcomingSongs.length / maxDisplay) || 1;

        if (upcomingSongs.length > 0) {
            const displaySongs = upcomingSongs.slice(start, end);
            queueList = displaySongs
                .map((song, i) => `**${start + i + 1}.** [${song.name}](${song.url}) - \`${song.formattedDuration}\``)
                .join('\n');
        } else {
            queueList = 'No upcoming songs';
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.music)
            .setTitle('🎶 Music Queue')
            .setDescription(
                `**Now Playing:**\n🎵 [${currentSong.name}](${currentSong.url}) - \`${currentSong.formattedDuration}\`\n\n` +
                `**Up Next:**\n${queueList}`
            )
            .setFooter({
                text: `Page ${page}/${totalPages} • ${queue.songs.length} song(s) in queue • Total: ${queue.formattedDuration}`,
            })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
