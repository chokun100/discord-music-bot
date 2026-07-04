/**
 * Interaction Wrapper — ทำให้ interaction ดูเหมือน message object
 * เพื่อให้ command.execute() ที่มีอยู่ทำงานได้ทั้ง prefix และ slash commands
 */

/**
 * Wrap a ChatInputCommandInteraction to look like a Message
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {object} message-like object
 */
function wrapInteraction(interaction) {
    let _replied = false;
    let _deferred = false;
    let _replyMessage = null;

    const wrapped = {
        // ─── Core Properties ─────────────────────────────────────────
        guild: interaction.guild,
        guildId: interaction.guildId,
        member: interaction.member,
        channel: interaction.channel,
        channelId: interaction.channelId,
        createdTimestamp: interaction.createdTimestamp,

        // interaction.user → message.author
        author: interaction.user,

        // message.content reconstruction (for commands that use it)
        content: '',

        // ─── mentions (from options) ─────────────────────────────────
        mentions: {
            roles: {
                first() {
                    const roleOpt = interaction.options.getRole('role');
                    return roleOpt || null;
                },
            },
            users: {
                first() {
                    const userOpt = interaction.options.getUser('user');
                    return userOpt || null;
                },
            },
        },

        // ─── reply() ─────────────────────────────────────────────────
        // First call → interaction.reply(), subsequent calls → interaction.followUp()
        async reply(content) {
            try {
                if (!_replied && !_deferred) {
                    _replied = true;
                    await interaction.reply(content);
                    _replyMessage = await interaction.fetchReply();
                    return _replyMessage;
                } else {
                    const msg = await interaction.followUp(content);
                    return msg;
                }
            } catch (err) {
                // ถ้า reply ไม่ได้ (expired, already replied) ลอง followUp
                try {
                    const msg = await interaction.followUp(content);
                    return msg;
                } catch {
                    return null;
                }
            }
        },

        // ─── react() — no-op for slash commands ──────────────────────
        async react() {
            // Slash commands can't react, so no-op
            return null;
        },

        // ─── delete() — no-op for slash commands ─────────────────────
        async delete() {
            // Can't delete a slash command invocation
            return null;
        },

        // ─── Marker to identify this is a wrapped interaction ────────
        _isInteraction: true,
        _interaction: interaction,
    };

    return wrapped;
}

/**
 * Extract args array from slash command options
 * The order matches the slashOptions definition in each command
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {string[]}
 */
function extractArgs(interaction) {
    const args = [];
    const options = interaction.options.data;

    for (const opt of options) {
        if (opt.value !== undefined && opt.value !== null) {
            args.push(String(opt.value));
        }
    }

    return args;
}

module.exports = { wrapInteraction, extractArgs };
