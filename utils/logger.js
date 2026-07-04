const fs = require('fs');
const path = require('path');

// ─── Log Directory ──────────────────────────────────────────────────────────
const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// ─── Settings ───────────────────────────────────────────────────────────────
const MAX_LOG_DAYS = 7; // ลบ log เก่ากว่า 7 วัน

// ─── Color Codes (for console only) ─────────────────────────────────────────
const COLORS = {
    reset: '\x1b[0m',
    gray: '\x1b[90m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

// ─── Level Config ───────────────────────────────────────────────────────────
const LEVELS = {
    error: { label: 'ERROR', color: COLORS.red, icon: '❌' },
    warn: { label: 'WARN', color: COLORS.yellow, icon: '⚠️' },
    info: { label: 'INFO', color: COLORS.green, icon: 'ℹ️' },
    debug: { label: 'DEBUG', color: COLORS.gray, icon: '🔍' },
    command: { label: 'CMD', color: COLORS.cyan, icon: '⚡' },
    music: { label: 'MUSIC', color: COLORS.magenta, icon: '🎵' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').replace('Z', '');
}

function getDateString() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getLogFilePath(level) {
    const date = getDateString();
    // error ไปไฟล์แยก, ที่เหลือรวมกัน
    if (level === 'error') {
        return path.join(LOG_DIR, `error-${date}.log`);
    }
    return path.join(LOG_DIR, `bot-${date}.log`);
}

function formatForFile(level, category, message, extra) {
    const timestamp = getTimestamp();
    const cfg = LEVELS[level] || LEVELS.info;
    let line = `[${timestamp}] [${cfg.label}]`;
    if (category) line += ` [${category}]`;
    line += ` ${message}`;
    if (extra) {
        if (extra instanceof Error) {
            line += `\n  Stack: ${extra.stack}`;
        } else if (typeof extra === 'object') {
            line += `\n  Data: ${JSON.stringify(extra, null, 2)}`;
        } else {
            line += ` | ${extra}`;
        }
    }
    return line;
}

function formatForConsole(level, category, message) {
    const cfg = LEVELS[level] || LEVELS.info;
    const time = new Date().toLocaleTimeString('th-TH', { hour12: false });
    const coloredLevel = `${cfg.color}[${cfg.label}]${COLORS.reset}`;
    const categoryStr = category ? `${COLORS.gray}[${category}]${COLORS.reset} ` : '';
    return `${COLORS.gray}${time}${COLORS.reset} ${coloredLevel} ${categoryStr}${cfg.icon} ${message}`;
}

function writeToFile(level, formattedLine) {
    const filePath = getLogFilePath(level);
    try {
        fs.appendFileSync(filePath, formattedLine + '\n');
    } catch (err) {
        // ถ้าเขียนไฟล์ไม่ได้ ก็แค่ print error แล้วไปต่อ
        console.error(`[Logger] Failed to write log file: ${err.message}`);
    }
}

// ─── Main Log Function ──────────────────────────────────────────────────────

/**
 * @param {'info'|'warn'|'error'|'debug'|'command'|'music'} level
 * @param {string} category - เช่น 'DisTube', 'Voice', 'Play', 'Command'
 * @param {string} message
 * @param {Error|object|string} [extra] - ข้อมูลเพิ่มเติม (Error object, data, etc.)
 */
function log(level, category, message, extra) {
    // Console output
    const consoleLine = formatForConsole(level, category, message);
    if (level === 'error') {
        console.error(consoleLine);
        if (extra instanceof Error) {
            console.error(`  ${COLORS.red}Stack:${COLORS.reset}`, extra.stack);
        } else if (extra) {
            console.error(`  ${COLORS.red}Details:${COLORS.reset}`, extra);
        }
    } else if (level === 'warn') {
        console.warn(consoleLine);
    } else {
        console.log(consoleLine);
    }

    // File output (ทุก level เขียนลงไฟล์)
    const fileLine = formatForFile(level, category, message, extra);
    writeToFile(level, fileLine);

    // error level เขียนลง bot log ด้วย (เผื่อดูรวม)
    if (level === 'error') {
        writeToFile('info', fileLine);
    }
}

// ─── Shorthand Methods ──────────────────────────────────────────────────────

const logger = {
    info: (category, message, extra) => log('info', category, message, extra),
    warn: (category, message, extra) => log('warn', category, message, extra),
    error: (category, message, extra) => log('error', category, message, extra),
    debug: (category, message, extra) => log('debug', category, message, extra),
    command: (category, message, extra) => log('command', category, message, extra),
    music: (category, message, extra) => log('music', category, message, extra),

    /**
     * Log a command execution
     * @param {object} message - Discord message object
     * @param {string} commandName
     * @param {string[]} args
     */
    logCommand(message, commandName, args) {
        const guildName = message.guild?.name || 'DM';
        const guildId = message.guild?.id || 'N/A';
        const user = message.author.tag;
        const channel = message.channel?.name || 'unknown';
        log('command', commandName, `${user} in #${channel} (${guildName})`, {
            guildId,
            userId: message.author.id,
            args: args.join(' ') || '(none)',
        });
    },

    /**
     * Log DisTube music events
     * @param {string} event - เช่น 'playSong', 'addSong', 'error'
     * @param {string} guildId
     * @param {string} message
     * @param {object} [extra]
     */
    logMusic(event, guildId, message, extra) {
        log('music', `DisTube:${event}`, `[Guild:${guildId}] ${message}`, extra);
    },
};

// ─── Auto Cleanup (ลบ log เก่า) ─────────────────────────────────────────────

function cleanOldLogs() {
    try {
        const files = fs.readdirSync(LOG_DIR);
        const now = Date.now();
        const maxAge = MAX_LOG_DAYS * 24 * 60 * 60 * 1000;

        for (const file of files) {
            if (!file.endsWith('.log')) continue;
            const filePath = path.join(LOG_DIR, file);
            const stat = fs.statSync(filePath);
            if (now - stat.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                logger.info('Logger', `Deleted old log file: ${file}`);
            }
        }
    } catch (err) {
        console.error(`[Logger] Cleanup error: ${err.message}`);
    }
}

// Clean on startup
cleanOldLogs();
// Clean every 24 hours
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

module.exports = logger;
