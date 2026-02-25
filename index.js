const { Client, GatewayIntentBits, Collection, ActivityType, Events } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const config = require('./config');
const loadCommands = require('./handlers/commandHandler');
const registerDistubeEvents = require('./events/distube');

// NOTE: DAVE encryption disabled directly in node_modules/distube/dist/index.js
// This is a workaround for @discordjs/voice@0.19.x bug (GitHub #11419)

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
});

// ─── Message Command Handler ────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
    // Ignore bots and messages without the prefix
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Find command by name or alias
    const command =
        client.commands.get(commandName) ||
        client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`❌ Error executing command "${commandName}" in guild ${message.guild?.id}:`, error);
        message.reply('❌ An error occurred while executing this command.').catch(() => { });
    }
});

// ─── Auto-cleanup when bot is kicked/disconnected from voice ─────────────────
client.on('voiceStateUpdate', (oldState, newState) => {
    // Only care about the bot itself
    if (oldState.member?.id !== client.user.id) return;

    // Bot left a voice channel (was in one, now isn't)
    if (oldState.channelId && !newState.channelId) {
        console.log(`🧹 Bot disconnected from voice in guild ${oldState.guild.id}, cleaning up queue`);
        try {
            const queue = client.distube.getQueue(oldState.guild.id);
            if (queue) queue.stop();
        } catch { }
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
