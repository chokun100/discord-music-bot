const { Client, GatewayIntentBits, Collection, ActivityType, Events } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const config = require('./config');
const loadCommands = require('./handlers/commandHandler');
const registerDistubeEvents = require('./events/distube');

// ─── Database & Middleware ──────────────────────────────────────────────────
const db = require('./database/db');
const GuildSettings = require('./database/models/guild');
const Premium = require('./database/models/premium');
const checkVoice = require('./middleware/checkVoice');
const checkDJ = require('./middleware/checkDJ');
const checkPremium = require('./middleware/checkPremium');

// NOTE: DAVE encryption ENABLED in node_modules/distube/dist/index.js (daveEncryption: true)
// Requires @snazzah/davey package — Discord mandated DAVE protocol since March 2026

// ─── Create Discord Client ──────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
    ],
});

// ─── Initialize Command Collection ──────────────────────────────────────────
client.commands = new Collection();
loadCommands(client);

// ─── Initialize DisTube ─────────────────────────────────────────────────────
client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    plugins: [new YtDlpPlugin({ update: false })],
});

// Register DisTube event handlers
registerDistubeEvents(client.distube);

// ─── Bot Ready Event ────────────────────────────────────────────────────────
client.once(Events.ClientReady, () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`📡 Serving ${client.guilds.cache.size} server(s)`);

    client.user.setActivity(config.activity.name, {
        type: ActivityType.Listening,
    });

    // Clean up expired premium entries on startup
    const cleaned = Premium.cleanExpired();
    if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired premium entries`);
    }
});

// ─── Message Command Handler ────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
    // Ignore bots and DMs
    if (message.author.bot) return;
    if (!message.guild) return;

    // Get per-guild prefix (or default)
    const prefix = GuildSettings.getPrefix(message.guild.id);

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Find command by name or alias
    const command =
        client.commands.get(commandName) ||
        client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    // ─── Middleware Checks ───────────────────────────────────────────────
    // 1. Voice channel check
    if (command.requireVoice) {
        const ok = await checkVoice(message);
        if (!ok) return;
    }

    // 2. DJ role check
    if (command.requireDJ) {
        const ok = await checkDJ(message);
        if (!ok) return;
    }

    // 3. Premium check
    if (command.premiumOnly) {
        const ok = await checkPremium(message, command.description);
        if (!ok) return;
    }

    // ─── Execute Command ─────────────────────────────────────────────────
    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`❌ Error executing command "${commandName}" in guild ${message.guild?.id}:`, error);
        message.reply('❌ An error occurred while executing this command.').catch(() => { });
    }
});

// ─── Auto-cleanup when bot is kicked/disconnected from voice ─────────────────
const idleTimers = new Map();

client.on('voiceStateUpdate', (oldState, newState) => {
    const botId = client.user.id;

    // --- Bot itself left voice ---
    if (oldState.member?.id === botId && oldState.channelId && !newState.channelId) {
        console.log(`🧹 Bot disconnected from voice in guild ${oldState.guild.id}, cleaning up queue`);
        clearTimeout(idleTimers.get(oldState.guild.id));
        idleTimers.delete(oldState.guild.id);
        try {
            const queue = client.distube.getQueue(oldState.guild.id);
            if (queue) queue.stop();
        } catch { }
        return;
    }

    // --- Someone else left the bot's voice channel ---
    const botVoice = oldState.guild.members.me?.voice;
    if (!botVoice?.channelId) return;

    const channel = botVoice.channel;
    if (!channel) return;

    // Count real (non-bot) members in the channel
    const realMembers = channel.members.filter(m => !m.user.bot).size;

    if (realMembers === 0) {
        // Check if 24/7 mode is enabled for this guild
        if (GuildSettings.is247(oldState.guild.id)) {
            console.log(`🕐 24/7 mode active in guild ${oldState.guild.id}, skipping idle timeout`);
            return;
        }

        // Start 5-minute idle timer — channel is empty
        if (!idleTimers.has(oldState.guild.id)) {
            console.log(`⏱️ Voice channel empty in guild ${oldState.guild.id}, starting 5-min idle timer`);
            const timer = setTimeout(() => {
                console.log(`⏱️ Idle timeout — disconnecting from guild ${oldState.guild.id}`);
                try {
                    const queue = client.distube.getQueue(oldState.guild.id);
                    if (queue) queue.stop();
                } catch { }
                try {
                    const { getVoiceConnection } = require('@discordjs/voice');
                    const conn = getVoiceConnection(oldState.guild.id, botId);
                    if (conn) conn.destroy();
                } catch { }
                idleTimers.delete(oldState.guild.id);
            }, 5 * 60 * 1000); // 5 minutes
            idleTimers.set(oldState.guild.id, timer);
        }
    } else {
        // Someone joined — cancel the idle timer
        clearTimeout(idleTimers.get(oldState.guild.id));
        idleTimers.delete(oldState.guild.id);
    }
});

// ─── Global Error Handlers (prevents total crash) ───────────────────────────
process.on('uncaughtException', (error) => {
    console.error('⚠️ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Unhandled Rejection:', reason);
});

// ─── Login ──────────────────────────────────────────────────────────────────
client.login(config.token);
