const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { reply } = require('../utils/embed');

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
            return reply.error(message, 'ไม่มีเพลงกำลังเล่น', 'ใช้ `!play` เพื่อเริ่มเล่นเพลง');
        }

        const voiceChannel = message.member.voice.channel;
        const realMembers = voiceChannel.members.filter(m => !m.user.bot).size;
        const required = Math.ceil(realMembers / 2);

        // If only 1-2 people, just skip directly
        if (realMembers <= 2) {
            try {
                if (queue.songs.length <= 1) {
                    await queue.stop();
                    return reply.success(message, 'ข้ามเพลงแล้ว', 'ไม่มีเพลงถัดไปในคิว — หยุดเล่นแล้ว');
                }
                await queue.skip();
                voteMap.delete(message.guildId);
                return reply.success(message, 'ข้ามเพลงแล้ว', '⏭️ ข้ามไปยังเพลงถัดไป');
            } catch (error) {
                return reply.error(message, 'ข้ามเพลงไม่ได้', 'เกิดข้อผิดพลาดในการข้ามเพลง');
            }
        }

        // Initialize vote set for this guild if not exists
        if (!voteMap.has(message.guildId)) {
            voteMap.set(message.guildId, new Set());
        }

        const votes = voteMap.get(message.guildId);
        
        // Check if user already voted
        if (votes.has(message.author.id)) {
            return reply.warn(message, 'โหวตไปแล้ว', `คุณได้โหวตข้ามเพลงไปแล้ว! (${votes.size}/${required} เสียง)`);
        }

        // Add vote
        votes.add(message.author.id);

        const embed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🗳️ โหวตข้ามเพลง (Vote Skip)')
            .setDescription(
                `${message.author} ได้ลงคะแนนโหวตข้ามเพลง!\n\n` +
                `📊 ต้องการอีก **${votes.size}/${required}** เสียง`
            )
            .setTimestamp();

        // Check if enough votes
        if (votes.size >= required) {
            try {
                if (queue.songs.length <= 1) {
                    await queue.stop();
                    voteMap.delete(message.guildId);
                    embed.setTitle('⏭️ โหวตผ่าน — ข้ามเพลงแล้ว!')
                        .setColor(config.colors.success)
                        .setDescription(`ได้รับครบ ${votes.size}/${required} เสียง — ข้ามเพลงแล้ว! ไม่มีเพลงถัดไป`);
                    return message.reply({ embeds: [embed] });
                }

                await queue.skip();
                voteMap.delete(message.guildId);
                embed.setTitle('⏭️ โหวตผ่าน — ข้ามเพลงแล้ว!')
                    .setColor(config.colors.success)
                    .setDescription(`ได้รับครบ ${votes.size}/${required} เสียง — ข้ามไปยังเพลงถัดไป!`);
            } catch (error) {
                voteMap.delete(message.guildId);
                return reply.error(message, 'ข้ามเพลงไม่ได้', 'เกิดข้อผิดพลาดในการข้ามเพลง');
            }
        }

        message.reply({ embeds: [embed] });
    },

    // Export for clearing votes on song change
    clearVotes(guildId) {
        voteMap.delete(guildId);
    },
};
