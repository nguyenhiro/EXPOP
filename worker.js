/**
 * worker.js - Web Worker for background processing.
 * Handles heavy tasks like filtering large arrays to keep the UI responsive.
 */

self.onmessage = function(e) {
    const { list, query, platform } = e.data;

    if (!list) {
        postMessage([]);
        return;
    }

    let filtered = list;

    if (platform && platform !== 'all') {
        filtered = filtered.filter(v => v.platform === platform);
    }

    if (query) {
        filtered = filtered.filter(v => v.title.toLowerCase().includes(query.toLowerCase()));
    }

    // Post the filtered results back to the main thread
    postMessage(filtered);
};