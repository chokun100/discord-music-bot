require('dotenv').config();

module.exports = {
    // Bot settings
    token: process.env.DISCORD_TOKEN,
    prefix: process.env.PREFIX || '!',

    // Support & reporting
    supportServerInvite: process.env.SUPPORT_SERVER_INVITE || '',
    bugReportChannelId: process.env.BUG_REPORT_CHANNEL_ID || '',
    ownerEmail: process.env.OWNER_EMAIL || '',

    // Bot owner ID (for admin commands like activating premium)
    ownerId: process.env.OWNER_ID || '',

    // Embed colors
    colors: {
        primary: 0x7289DA,   // Discord blurple
        success: 0x43B581,   // Green
        warning: 0xFAA61A,   // Yellow
        error: 0xF04747,     // Red
        music: 0xE91E63,     // Pink
        info: 0x5865F2,      // Indigo
        premium: 0xFFD700,   // Gold
    },

    // Premium — free tier filter whitelist
    freeFilters: ['bassboost', 'nightcore', 'vaporwave'],

    // Bot activity status
    activity: {
        name: '🎵 !play | !premium',
        type: 'LISTENING',
    },
};
