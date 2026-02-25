require('dotenv').config();

module.exports = {
    // Bot settings
    token: process.env.DISCORD_TOKEN,
    prefix: process.env.PREFIX || '!',

    // Support & reporting
    supportServerInvite: process.env.SUPPORT_SERVER_INVITE || '',
    bugReportChannelId: process.env.BUG_REPORT_CHANNEL_ID || '',
    ownerEmail: process.env.OWNER_EMAIL || '',

    // Embed colors
    colors: {
        primary: 0x7289DA,   // Discord blurple
        success: 0x43B581,   // Green
        warning: 0xFAA61A,   // Yellow
        error: 0xF04747,     // Red
        music: 0xE91E63,     // Pink
        info: 0x5865F2,      // Indigo
    },

    // Bot activity status
    activity: {
        name: '🎵 !play | !support',
        type: 'LISTENING',
    },
};
