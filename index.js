const { Client, GatewayIntentBits, Collection, ActivityType, Events } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const ffmpegPath = require('ffmpeg-static');
const config = require('./config');
const loadCommands = require('./handlers/commandHandler');
const registerDistubeEvents = require('./events/distube');
const logger = require('./utils/logger');
const checkYtDlp = require('./utils/checkYtDlp');
const { wrapInteraction, extractArgs } = require('./utils/interactionWrapper');

// ─── Database & Middleware ──────────────────────────────────────────────────
const db = require('./database/db');
const GuildSettings = require('./database/models/guild');
const Premium = require('./database/models/premium');
const checkVoice = require('./middleware/checkVoice');
const checkDJ = require('./middleware/checkDJ');
const checkPremium = require('./middleware/checkPremium');

// ─── Cooldown System ────────────────────────────────────────────────────────
const cooldowns = new Map();

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
    savePreviousSongs: true,
    nsfw: false,
    plugins: [
        new YtDlpPlugin({
            update: false,
        }),
    ],
    // FFmpeg args for stable, smooth audio streaming
    // Handles YouTube CDN connection resets (error -10054) gracefully
    ffmpeg: {
        path: ffmpegPath,
        args: {
            global: {},
            input: {
                reconnect: '1',
                reconnect_streamed: '1',
                reconnect_on_network_error: '1',
                reconnect_on_http_error: '4xx,5xx',
                reconnect_delay_max: '5',
                analyzeduration: '0',
                probesize: '32768',
                rw_timeout: '10000000',       // 10s read/write timeout (microseconds)
            },
            output: {
                ar: '48000',
                ac: '2',
            },
        },
    },
});

// Register DisTube event handlers
registerDistubeEvents(client.distube);

// ─── Bot Ready Event ────────────────────────────────────────────────────────
client.once(Events.ClientReady, () => {
    logger.info('Bot', `Bot is ready! Logged in as ${client.user.tag}`);
    logger.info('Bot', `Serving ${client.guilds.cache.size} server(s)`);

    client.user.setActivity(config.activity.name, {
        type: ActivityType.Listening,
    });

    // Clean up expired premium entries on startup
    const cleaned = Premium.cleanExpired();
    if (cleaned > 0) {
        logger.info('Premium', `Cleaned ${cleaned} expired premium entries`);
    }
});

// ─── Message Command Handler ────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
    // Ignore bots and DMs
    if (message.author.bot) return;
    if (!message.guild) return;

    // Ignore if message starts with '/' to prevent conflict with Discord Native Slash Commands
    if (message.content.startsWith('/')) return;

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

    // Log command usage
    logger.logCommand(message, command.name, args);

    // ─── Cooldown Check ─────────────────────────────────────────────────
    const cooldownKey = `${message.author.id}-${command.name}`;
    const cooldownTime = command.cooldown || 3; // default 3 seconds
    const now = Date.now();

    if (cooldowns.has(cooldownKey)) {
        const expiresAt = cooldowns.get(cooldownKey);
        if (now < expiresAt) {
            const remaining = ((expiresAt - now) / 1000).toFixed(1);
            logger.debug('Cooldown', `${message.author.tag} blocked by cooldown on "${command.name}" (${remaining}s left)`);
            return message.reply(`⏳ รอ ${remaining} วินาที ก่อนใช้ \`${command.name}\` อีกครั้ง`).catch(() => { });
        }
    }
    cooldowns.set(cooldownKey, now + (cooldownTime * 1000));
    // Auto-cleanup cooldown after expiry
    setTimeout(() => cooldowns.delete(cooldownKey), cooldownTime * 1000);

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
        logger.error('Command', `Error executing "${command.name}" by ${message.author.tag} in guild ${message.guild.id}`, error);
        message.reply('❌ An error occurred while executing this command.').catch(() => { });
    }

    // Delete the user's command message to keep chat clean
    // Bot response (reply) will still show who triggered it
    setTimeout(() => {
        message.delete().catch(() => { });
    }, 1000);
});

// ─── Slash Command (Interaction) Handler ────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild) {
        return interaction.reply({ content: '❌ คำสั่งนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์เท่านั้น!', ephemeral: true });
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        return interaction.reply({ content: '❌ ไม่พบคำสั่งนี้!', ephemeral: true });
    }

    const wrappedMessage = wrapInteraction(interaction);
    const args = extractArgs(interaction);

    // Log command usage
    logger.logCommand(wrappedMessage, command.name, args);

    // ─── Cooldown Check ─────────────────────────────────────────────────
    const cooldownKey = `${interaction.user.id}-${command.name}`;
    const cooldownTime = command.cooldown || 3; // default 3 seconds
    const now = Date.now();

    if (cooldowns.has(cooldownKey)) {
        const expiresAt = cooldowns.get(cooldownKey);
        if (now < expiresAt) {
            const remaining = ((expiresAt - now) / 1000).toFixed(1);
            logger.debug('Cooldown', `${interaction.user.tag} blocked by cooldown on "${command.name}" (${remaining}s left)`);
            return interaction.reply({ content: `⏳ รอ ${remaining} วินาที ก่อนใช้ \`${command.name}\` อีกครั้ง`, ephemeral: true }).catch(() => { });
        }
    }
    cooldowns.set(cooldownKey, now + (cooldownTime * 1000));
    setTimeout(() => cooldowns.delete(cooldownKey), cooldownTime * 1000);

    // ─── Middleware Checks ───────────────────────────────────────────────
    if (command.requireVoice) {
        const ok = await checkVoice(wrappedMessage);
        if (!ok) return;
    }

    if (command.requireDJ) {
        const ok = await checkDJ(wrappedMessage);
        if (!ok) return;
    }

    if (command.premiumOnly) {
        const ok = await checkPremium(wrappedMessage, command.description);
        if (!ok) return;
    }

    // ─── Execute Command ─────────────────────────────────────────────────
    try {
        await command.execute(wrappedMessage, args, client);
    } catch (error) {
        logger.error('Command', `Error executing slash command "${command.name}" by ${interaction.user.tag} in guild ${interaction.guild.id}`, error);
        const errorMsg = '❌ An error occurred while executing this command.';
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMsg, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMsg, ephemeral: true });
            }
        } catch { }
    }
});

// ─── Auto-cleanup when bot is kicked/disconnected from voice ─────────────────
const idleTimers = new Map();

client.on('voiceStateUpdate', (oldState, newState) => {
    const botId = client.user.id;

    // --- Bot itself left voice ---
    if (oldState.member?.id === botId && oldState.channelId && !newState.channelId) {
        logger.info('Voice', `Bot disconnected from voice in guild ${oldState.guild.id}, cleaning up queue`);
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
            logger.info('Voice', `24/7 mode active in guild ${oldState.guild.id}, skipping idle timeout`);
            return;
        }

        // Start 5-minute idle timer — channel is empty
        if (!idleTimers.has(oldState.guild.id)) {
            logger.info('Voice', `Channel empty in guild ${oldState.guild.id}, starting 5-min idle timer`);
            const timer = setTimeout(() => {
                logger.info('Voice', `Idle timeout — disconnecting from guild ${oldState.guild.id}`);
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
    logger.error('Process', 'Uncaught Exception', error);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Process', 'Unhandled Rejection', reason instanceof Error ? reason : new Error(String(reason)));
});

// ─── Check yt-dlp version & auto-update ─────────────────────────────────────
checkYtDlp();

// ─── Login ──────────────────────────────────────────────────────────────────
client.login(config.token);
