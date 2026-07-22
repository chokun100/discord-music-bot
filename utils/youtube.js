/**
 * Utility functions for processing YouTube URLs and queries.
 */

/**
 * Clean YouTube URLs so that:
 * 1. Standard Playlists (list starting with PL, OLAK5, FL, CL, etc.) are automatically converted
 *    to dedicated playlist URLs (`https://www.youtube.com/playlist?list=...`) so that yt-dlp
 *    resolves the entire playlist properly regardless of whether the user copied a /playlist or a /watch link.
 * 2. YouTube Radio / Mix Playlists (list starting with RD, UL, or with start_radio=1) have their
 *    list/index params removed because YouTube Radio mixes generate endless stream loops that cause
 *    yt-dlp to freeze/hang indefinitely.
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
                    // Strip Radio/Mix params to prevent yt-dlp from hanging indefinitely
                    url.searchParams.delete('list');
                    url.searchParams.delete('index');
                    url.searchParams.delete('start_radio');
                    return url.toString();
                } else {
                    // Standard playlist ID (e.g. PL..., OLAK5..., CL..., FL...)
                    // Convert to dedicated /playlist URL so yt-dlp returns the playlist object (not just a single video)
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
};
