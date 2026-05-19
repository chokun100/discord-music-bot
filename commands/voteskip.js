const { EmbedBuilder } = require('discord.js');
const config = require('../config');

// Track votes per guild
const voteMap = new Map();

module.exports = {
    name: 'voteskip',
    aliases: ['vs', 'vskip'],
    description: 'Vote to skip the current song (needs 50%+ of VC members)',
    requireVoice: true,
    cooldown: 5,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        const voiceChannel = message.member.voice.channel;
        const realMembers = voiceChannel.members.filter(m => !m.user.bot).size;
        const required = Math.ceil(realMembers / 2);

        // If only 1-2 people, just skip directly
        if (realMembers <= 2) {
            try {
                if (queue.songs.length <= 1) {
                    await queue.stop();
                    return message.reply('⏭️ Skipped! No more songs in the queue.');
                }
                await queue.skip();
                voteMap.delete(message.guildId);
                return message.react('⏭️').catch(() => { });
            } catch (error) {
                return message.reply('❌ Could not skip the song.');
            }
        }

        // Initialize vote set for this guild if not exists
        if (!voteMap.has(message.guildId)) {
            voteMap.set(message.guildId, new Set());
        }

        const votes = voteMap.get(message.guildId);
        
        // Check if user already voted
        if (votes.has(message.author.id)) {
            return message.reply(`❌ คุณโหวตไปแล้ว! (${votes.size}/${required} votes)`);
        }

        // Add vote
        votes.add(message.author.id);

        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🗳️ Vote Skip')
            .setDescription(
                `${message.author} โหวต skip!\n\n` +
                `📊 **${votes.size}/${required}** votes needed`
            )
            .setTimestamp();

        // Check if enough votes
        if (votes.size >= required) {
            try {
                if (queue.songs.length <= 1) {
                    await queue.stop();
                    voteMap.delete(message.guildId);
                    embed.setTitle('⏭️ Vote Skip — Passed!')
                        .setColor(config.colors.success)
                        .setDescription(`ได้รับ ${votes.size}/${required} votes — Skipped! No more songs.`);
                    return message.reply({ embeds: [embed] });
                }

                await queue.skip();
                voteMap.delete(message.guildId);
                embed.setTitle('⏭️ Vote Skip — Passed!')
                    .setColor(config.colors.success)
                    .setDescription(`ได้รับ ${votes.size}/${required} votes — Skipping!`);
            } catch (error) {
                voteMap.delete(message.guildId);
                return message.reply('❌ Could not skip the song.');
            }
        }

        message.reply({ embeds: [embed] });
    },

    // Export for clearing votes on song change
    clearVotes(guildId) {
        voteMap.delete(guildId);
    },
};
