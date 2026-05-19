const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'previous',
    aliases: ['prev', 'back'],
    description: 'Play the previous song',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        try {
            await queue.previous();
            message.react('⏮️').catch(() => { });
        } catch (error) {
            // DisTube throws if there's no previous song
            if (error.message?.includes('previous') || error.errorCode === 'NO_PREVIOUS') {
                return message.reply('❌ ไม่มีเพลงก่อนหน้า!');
            }
            console.error(`❌ Previous error in guild ${message.guild.id}:`, error);
            message.reply('❌ ไม่สามารถเล่นเพลงก่อนหน้าได้');
        }
    },
};
