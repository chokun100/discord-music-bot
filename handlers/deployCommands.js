/**
 * Deploy Slash Commands — รัน script นี้ครั้งเดียวเพื่อ register slash commands กับ Discord
 * 
 * Usage:
 *   node handlers/deployCommands.js          → deploy globally (ทุก server, รอ ~1 ชม.)
 *   node handlers/deployCommands.js <guildId> → deploy เฉพาะ guild (ใช้ได้ทันที)
 *   node handlers/deployCommands.js clear <guildId> → ลบคำสั่งของ guild นั้นทิ้ง (เพื่อใช้ Global ไม่ให้ซ้ำกัน)
 *   node handlers/deployCommands.js clear-global → ลบคำสั่ง Global ทิ้งทั้งหมด
 */
require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN;
const clientId = token.split('.')[0]; // Extract client ID from bot token (base64 encoded)
const clientIdDecoded = Buffer.from(clientId, 'base64').toString();

const arg1 = process.argv[2];
const arg2 = process.argv[3];

const rest = new REST({ version: '10' }).setToken(token);

// ─── Clear Mode ─────────────────────────────────────────────────────────────
if (arg1 === 'clear' || arg1 === 'clear-global') {
    (async () => {
        try {
            if (arg1 === 'clear') {
                if (!arg2) {
                    console.error('❌ ระบุ Guild ID ที่ต้องการลบคำสั่ง เช่น: node handlers/deployCommands.js clear 1476075465159741583');
                    process.exit(1);
                }
                console.log(`\n🗑️ Clearing slash commands for guild ${arg2}...`);
                await rest.put(Routes.applicationGuildCommands(clientIdDecoded, arg2), { body: [] });
                console.log(`✅ Successfully cleared guild commands for ${arg2}. Now only Global commands will show!`);
            } else if (arg1 === 'clear-global') {
                console.log(`\n🗑️ Clearing global slash commands...`);
                await rest.put(Routes.applicationCommands(clientIdDecoded), { body: [] });
                console.log(`✅ Successfully cleared all global commands.`);
            }
        } catch (error) {
            console.error('❌ Failed to clear commands:', error);
        }
    })();
    return;
}

const guildId = arg1; // Optional: deploy to specific guild

console.log(`🔧 Bot Client ID: ${clientIdDecoded}`);
console.log(`🎯 Deploy mode: ${guildId ? `Guild-specific (${guildId})` : 'Global (all servers)'}`);

// ─── Load Command Files ─────────────────────────────────────────────────────
const commandsDir = path.join(__dirname, '..', 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

const slashCommands = [];

for (const file of commandFiles) {
    try {
        const command = require(path.join(commandsDir, file));

        if (!command.name || !command.execute) {
            console.warn(`⚠️ Skipping ${file}: missing name or execute`);
            continue;
        }

        const builder = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description || `Use the ${command.name} command`);

        // Add options if defined
        if (command.slashOptions && Array.isArray(command.slashOptions)) {
            for (const opt of command.slashOptions) {
                switch (opt.type) {
                    case 'string':
                        builder.addStringOption(o => {
                            o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false);
                            if (opt.choices) o.addChoices(...opt.choices);
                            return o;
                        });
                        break;
                    case 'integer':
                        builder.addIntegerOption(o => {
                            o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false);
                            if (opt.min !== undefined) o.setMinValue(opt.min);
                            if (opt.max !== undefined) o.setMaxValue(opt.max);
                            if (opt.choices) o.addChoices(...opt.choices);
                            return o;
                        });
                        break;
                    case 'number':
                        builder.addNumberOption(o => {
                            o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false);
                            if (opt.min !== undefined) o.setMinValue(opt.min);
                            if (opt.max !== undefined) o.setMaxValue(opt.max);
                            return o;
                        });
                        break;
                    case 'boolean':
                        builder.addBooleanOption(o =>
                            o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false)
                        );
                        break;
                    case 'user':
                        builder.addUserOption(o =>
                            o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false)
                        );
                        break;
                    case 'role':
                        builder.addRoleOption(o =>
                            o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false)
                        );
                        break;
                    case 'channel':
                        builder.addChannelOption(o =>
                            o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false)
                        );
                        break;
                    default:
                        console.warn(`⚠️ Unknown option type "${opt.type}" in command "${command.name}"`);
                }
            }
        }

        slashCommands.push(builder.toJSON());
        console.log(`✅ Prepared: /${command.name}${command.slashOptions ? ` (${command.slashOptions.length} options)` : ''}`);
    } catch (error) {
        console.error(`❌ Failed to prepare ${file}:`, error.message);
    }
}

// ─── Deploy ─────────────────────────────────────────────────────────────────

(async () => {
    try {
        console.log(`\n🚀 Deploying ${slashCommands.length} slash command(s)...`);

        if (guildId) {
            // Guild-specific deploy (instant)
            await rest.put(
                Routes.applicationGuildCommands(clientIdDecoded, guildId),
                { body: slashCommands }
            );
            console.log(`✅ Successfully deployed ${slashCommands.length} commands to guild ${guildId}`);
        } else {
            // Global deploy (takes up to 1 hour to propagate)
            await rest.put(
                Routes.applicationCommands(clientIdDecoded),
                { body: slashCommands }
            );
            console.log(`✅ Successfully deployed ${slashCommands.length} commands globally`);
            console.log('⏳ Note: Global commands may take up to 1 hour to appear in all servers');
        }
    } catch (error) {
        console.error('❌ Failed to deploy slash commands:', error);
    }
})();
