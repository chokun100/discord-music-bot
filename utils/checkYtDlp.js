const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Path ของ yt-dlp binary ที่ plugin ใช้จริง
const PLUGIN_BIN_DIR = path.join(__dirname, '..', 'node_modules', '@distube', 'yt-dlp', 'bin');
const PLUGIN_BIN = path.join(PLUGIN_BIN_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

/**
 * ดึงเวอร์ชันจาก binary path ที่ระบุ
 * @param {string} binPath - path ของ binary หรือ command name
 * @returns {string|null} version string เช่น "2026.07.04" หรือ null ถ้าไม่พบ
 */
function getVersion(binPath) {
    try {
        return execSync(`"${binPath}" --version`, { encoding: 'utf8', timeout: 10000 }).trim();
    } catch {
        return null;
    }
}

/**
 * เปรียบเทียบ version string (format: YYYY.MM.DD)
 * @returns {number} -1 ถ้า a < b, 0 ถ้าเท่ากัน, 1 ถ้า a > b
 */
function compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const va = pa[i] || 0;
        const vb = pb[i] || 0;
        if (va < vb) return -1;
        if (va > vb) return 1;
    }
    return 0;
}

/**
 * เช็คเวอร์ชัน yt-dlp — เปรียบเทียบ plugin binary กับ system binary
 * ถ้า plugin เก่ากว่า → คัดลอก system binary มาทับอัตโนมัติ
 * ถ้าเวอร์ชันเท่ากัน → ข้ามไป ไม่ต้องทำอะไร
 * รันก่อน bot login — ถ้าอัพเดทไม่ได้ก็ให้บอทเริ่มทำงานต่อ (ไม่ block)
 */
function checkYtDlp() {
    try {
        // ─── 1. เช็ค System yt-dlp ──────────────────────────────────────
        const systemVersion = getVersion('yt-dlp');
        if (!systemVersion) {
            logger.warn('yt-dlp', 'System yt-dlp not found! Please install: winget install yt-dlp');
            return;
        }
        logger.info('yt-dlp', `System version: ${systemVersion}`);

        // ─── 2. เช็ค Plugin binary ─────────────────────────────────────
        const pluginVersion = getVersion(PLUGIN_BIN);

        if (!pluginVersion) {
            // Plugin binary ไม่มีหรือเสีย → คัดลอกจาก system
            logger.warn('yt-dlp', 'Plugin binary not found or broken — installing from system...');
            copySystemToPlugin();
            return;
        }
        logger.info('yt-dlp', `Plugin version: ${pluginVersion}`);

        // ─── 3. เปรียบเทียบ version ────────────────────────────────────
        const cmp = compareVersions(pluginVersion, systemVersion);

        if (cmp < 0) {
            // Plugin เก่ากว่า → อัพเดท
            logger.info('yt-dlp', `Plugin outdated! Updating: ${pluginVersion} → ${systemVersion}`);
            copySystemToPlugin();
        } else if (cmp === 0) {
            // เวอร์ชันเท่ากัน → OK
            logger.info('yt-dlp', `Plugin is up to date (${pluginVersion}) ✓`);
        } else {
            // Plugin ใหม่กว่า (ไม่น่าเกิด แต่ handle ไว้)
            logger.info('yt-dlp', `Plugin is newer than system (${pluginVersion} > ${systemVersion}) — OK`);
        }

        // ─── 4. เช็ค system yt-dlp update (optional) ───────────────────
        try {
            logger.info('yt-dlp', 'Checking for online updates...');
            const output = execSync('yt-dlp -U', { encoding: 'utf8', timeout: 60000 });

            if (output.includes('Updating to')) {
                const match = output.match(/Updating to ([\S]+)/);
                const newVersion = match ? match[1] : 'unknown';
                logger.info('yt-dlp', `System updated: ${systemVersion} → ${newVersion}`);

                // System อัพเดทแล้ว → คัดลอกตัวใหม่ให้ plugin ด้วย
                logger.info('yt-dlp', 'Syncing updated binary to plugin...');
                copySystemToPlugin();
            } else if (output.includes('is up to date') || output.includes('Latest version:')) {
                logger.info('yt-dlp', `System already latest (${systemVersion})`);
            }
        } catch {
            // เช็คออนไลน์ไม่ได้ — ไม่เป็นไร ใช้เวอร์ชันปัจจุบันต่อ
            logger.warn('yt-dlp', 'Online update check failed — using current version');
        }

    } catch (error) {
        // ถ้าเช็คหรืออัพเดทไม่ได้ — warn แต่ไม่หยุดบอท
        logger.warn('yt-dlp', `Version check failed: ${error.message}`);
        logger.warn('yt-dlp', 'Bot will continue with current yt-dlp version');
    }
}

/**
 * คัดลอก system yt-dlp binary → plugin bin directory
 */
function copySystemToPlugin() {
    try {
        // หา path ของ system yt-dlp
        const systemPath = execSync(
            process.platform === 'win32'
                ? 'where yt-dlp'
                : 'which yt-dlp',
            { encoding: 'utf8', timeout: 5000 }
        ).trim().split(/\r?\n/)[0]; // เอาบรรทัดแรก (กรณี where คืนหลาย path)

        if (!fs.existsSync(systemPath)) {
            logger.warn('yt-dlp', `System binary not found at: ${systemPath}`);
            return;
        }

        // สร้าง directory ถ้ายังไม่มี
        if (!fs.existsSync(PLUGIN_BIN_DIR)) {
            fs.mkdirSync(PLUGIN_BIN_DIR, { recursive: true });
        }

        // คัดลอก binary
        fs.copyFileSync(systemPath, PLUGIN_BIN);
        logger.info('yt-dlp', `Copied: ${systemPath} → ${PLUGIN_BIN}`);

        // ยืนยันเวอร์ชันหลังคัดลอก
        const newVersion = getVersion(PLUGIN_BIN);
        if (newVersion) {
            logger.info('yt-dlp', `Plugin updated successfully → ${newVersion} ✓`);
        }
    } catch (error) {
        logger.warn('yt-dlp', `Failed to copy binary: ${error.message}`);
        logger.warn('yt-dlp', 'Bot will continue with current plugin binary');
    }
}

module.exports = checkYtDlp;
