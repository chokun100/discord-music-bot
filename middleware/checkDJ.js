const GuildSettings = require('../database/models/guild');

/**
 * Middleware: Check if user has DJ role or is admin.
 * If no DJ role is set for the guild, everyone can use DJ commands.
 * Returns true if OK, sends error reply and returns false if not.
 */
async function checkDJ(message) {
    // Admins always bypass
    if (message.member.permissions.has('Administrator')) {
        return true;
    }

    const djRoleId = GuildSettings.getDJRole(message.guild.id);

    // No DJ role configured = everyone can use
    if (!djRoleId) {
        return true;
    }

    // Check if user has the DJ role
    if (message.member.roles.cache.has(djRoleId)) {
        return true;
    }

    // Also allow if user is the only person in the voice channel (solo listener)
    const voiceChannel = message.member.voice.channel;
    if (voiceChannel) {
        const realMembers = voiceChannel.members.filter(m => !m.user.bot).size;
        if (realMembers <= 1) {
            return true; // Solo listener can control freely
        }
    }

    await message.reply('❌ คุณต้องมี DJ Role เพื่อใช้คำสั่งนี้!').catch(() => { });
    return false;
}

module.exports = checkDJ;
