/**
 * Middleware: Check if user is in the same voice channel as the bot.
 * Returns true if OK, sends error reply and returns false if not.
 */
async function checkVoice(message) {
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
        await message.reply('❌ คุณต้องอยู่ใน Voice Channel ก่อน!').catch(() => { });
        return false;
    }

    // Check if bot is in a voice channel and user is in the same one
    const botVoice = message.guild.members.me?.voice;
    if (botVoice?.channelId && botVoice.channelId !== voiceChannel.id) {
        await message.reply(`❌ คุณต้องอยู่ใน Voice Channel เดียวกับบอท! (<#${botVoice.channelId}>)`).catch(() => { });
        return false;
    }

    return true;
}

module.exports = checkVoice;
