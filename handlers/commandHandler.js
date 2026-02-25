const fs = require('fs');
const path = require('path');

/**
 * Dynamically loads all command files from the commands/ directory.
 * Each command file must export: { name, aliases?, description, execute() }
 *
 * To add a new command: just drop a .js file in commands/ — no other changes needed.
 */
module.exports = function loadCommands(client) {
    const commandsDir = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsDir).filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const command = require(path.join(commandsDir, file));

            if (!command.name || !command.execute) {
                console.warn(`⚠️ Skipping ${file}: missing "name" or "execute" export`);
                continue;
            }

            client.commands.set(command.name, command);
            console.log(`📦 Loaded command: ${command.name}`);
        } catch (error) {
            console.error(`❌ Failed to load command ${file}:`, error);
        }
    }

    console.log(`✅ Loaded ${client.commands.size} command(s) total`);
};
