/**
 * Utility functions for processing YouTube URLs and queries.
 */

const { execFile } = require('child_process');
const path = require('path');

// yt-dlp binary — same one the @distube/yt-dlp plugin uses
const YTDLP_BIN = path.join(__dirname, '..', 'node_modules', '@distube', 'yt-dlp', 'bin',
    process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

/**
 * Check if a query URL is a YouTube Radio / Mix link.
 * These have list IDs starting with RD or UL, or include start_radio=1.
 *
 * @param {string} query - URL or search term
 * @returns {boolean}
 */
function isRadioMixUrl(query) {
    if (!query || typeof query !== 'string') return false;
    try {
        const url = new URL(query);
        if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
            const listParam = url.searchParams.get('list') || '';
            return listParam.startsWith('RD') || listParam.startsWith('UL') || url.searchParams.has('start_radio');
        }
    } catch { }
    return false;
}

/**
 * Resolve a YouTube Radio Mix URL to a limited list of individual video URLs.
 * Runs yt-dlp with --playlist-end to avoid hanging on the infinite Radio Mix stream.
 *
 * @param {string} query - YouTube URL with Radio Mix list parameter
 * @param {number} limit - Maximum number of songs to resolve (default: 5)
 * @returns {Promise<{name: string, urls: string[]}>}
 */
function resolveRadioMix(query, limit = 5) {
    return new Promise((resolve, reject) => {
        const args = [
            query,
            '--dump-single-json',
            '--flat-playlist',
            '--playlist-end', String(limit),
            '--no-warnings',
            '--no-call-home',
        ];
        execFile(YTDLP_BIN, args, { timeout: 30000 }, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(stderr || error.message));
            }
            try {
                const data = JSON.parse(stdout);
                if (data.entries && data.entries.length > 0) {
                    const urls = data.entries
                        .map(e => e.url || e.webpage_url)
                        .filter(Boolean);
                    resolve({
                        name: data.title || 'Radio Mix',
                        urls,
                    });
                } else {
                    resolve({ name: 'Radio Mix', urls: [] });
                }
            } catch (e) {
                reject(new Error(`Failed to parse yt-dlp output: ${e.message}`));
            }
        });
    });
}

/**
 * Clean YouTube URLs:
 * - Standard Playlists (PL..., OLAK5...) → convert to /playlist?list=... so yt-dlp loads full playlist
 * - Radio / Mix (RD..., UL...) → strip list param (handled separately via resolveRadioMix)
 * - Single videos → pass through unchanged
 *
 * @param {string} query - URL or search term
 * @returns {string} Cleaned URL or original query
 */
function cleanYoutubeUrl(query) {
    if (!query || typeof query !== 'string') return query;

    try {
        const url = new URL(query);
        if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
            const listParam = url.searchParams.get('list');

            if (listParam) {
                const isRadioOrMix = listParam.startsWith('RD') ||
                    listParam.startsWith('UL') ||
                    url.searchParams.has('start_radio');

                if (isRadioOrMix) {
                    // Strip Radio/Mix params — caller should use resolveRadioMix instead
                    url.searchParams.delete('list');
                    url.searchParams.delete('index');
                    url.searchParams.delete('start_radio');
                    return url.toString();
                } else {
                    // Standard playlist → convert to dedicated /playlist URL
                    return `https://www.youtube.com/playlist?list=${encodeURIComponent(listParam)}`;
                }
            }
            return url.toString();
        }
    } catch {
        // Not a valid URL — search query
    }

    return query;
}

module.exports = {
    cleanYoutubeUrl,
    isRadioMixUrl,
    resolveRadioMix,
};
