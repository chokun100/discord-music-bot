module.exports = {
    name: 'pause',
    aliases: [],
    description: 'Pause or resume the current song',
    requireVoice: true,
    requireDJ: true,
    async execute(message, args, client) {
        const queue = client.distube.getQueue(message.guildId);

        if (!queue) {
            return message.reply('❌ There is nothing playing right now!');
        }

        // Determine if called as !pause or !resume
        const commandUsed = message.content.slice(1).split(/ +/)[0].toLowerCase();

        try {
            if (queue.paused && commandUsed === 'resume') {
                queue.resume();
                message.react('▶️').catch(() => { });
                return message.reply('▶️ Resumed the music!');
            }

            if (!queue.paused && commandUsed === 'pause') {
                queue.pause();
                message.react('⏸️').catch(() => { });
                return message.reply('⏸️ Paused the music! Use `!resume` to continue.');
            }

            // Toggle behavior if using !pause when already paused (or vice versa)
            if (queue.paused) {
                queue.resume();
                message.react('▶️').catch(() => { });
                message.reply('▶️ Resumed the music!');
            } else {
                queue.pause();
                message.react('⏸️').catch(() => { });
                message.reply('⏸️ Paused the music! Use `!resume` to continue.');
            }
        } catch (error) {
            console.error(`❌ Pause/Resume error in guild ${message.guild.id}:`, error);
            message.reply('❌ Could not pause/resume the music.');
        }
    },
};
