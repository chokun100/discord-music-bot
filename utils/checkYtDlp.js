const { execSync } = require('child_process');
const logger = require('./logger');

/**
 * เช็คเวอร์ชัน yt-dlp และอัพเดทถ้าเก่า
 * รันก่อน bot login — ถ้าอัพเดทไม่ได้ก็ให้บอทเริ่มทำงานต่อ (ไม่ block)
 */
function checkYtDlp() {
    try {
        // ดึงเวอร์ชันปัจจุบัน
        const currentVersion = execSync('yt-dlp --version', { encoding: 'utf8', timeout: 10000 }).trim();
        logger.info('yt-dlp', `Current version: ${currentVersion}`);

        // เช็คว่ามี update มั้ย
        logger.info('yt-dlp', 'Checking for updates...');
        const output = execSync('yt-dlp -U', { encoding: 'utf8', timeout: 60000 });

        if (output.includes('Updating to')) {
            // มี update — ดึงเวอร์ชันใหม่
            const match = output.match(/Updating to (\S+)/);
            const newVersion = match ? match[1] : 'unknown';
            logger.info('yt-dlp', `Updated: ${currentVersion} → ${newVersion}`);
        } else if (output.includes('is up to date') || output.includes('Latest version:')) {
            // เวอร์ชันล่าสุดแล้ว
            const match = output.match(/Latest version: (\S+)/);
            if (match && match[1] === `stable@${currentVersion}`) {
                logger.info('yt-dlp', `Already up to date (${currentVersion})`);
            } else {
                logger.info('yt-dlp', `Up to date (${currentVersion})`);
            }
        } else {
            logger.info('yt-dlp', `Update check done — ${currentVersion}`);
        }
    } catch (error) {
        // ถ้าเช็คหรืออัพเดทไม่ได้ — warn แต่ไม่หยุดบอท
        logger.warn('yt-dlp', `Update check failed: ${error.message}`);
        logger.warn('yt-dlp', 'Bot will continue with current yt-dlp version');
    }
}

module.exports = checkYtDlp;
