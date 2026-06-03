const fetch = require('node-fetch');

async function lyricsCommand(sock, chatId, query, message) {
    if (!query) {
        await sock.sendMessage(chatId, { 
            text: '🔍 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 need the song name to get the lyrics! Usage: *lyrics <song name>*'
        },{ quoted: message });
        return;
    }

    try {
        // Use api.vreden.my.id and return only the raw lyrics text
        const apiUrl = `https://api.vreden.my.id/api/lyrics?query=${encodeURIComponent(query)}`;
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
            const errText = await res.text();
            throw errText;
        }
        
        const data = await res.json();

        const lyrics = data && data.result && data.result.lyrics ? data.result.lyrics : null;
        if (!lyrics) {
            await sock.sendMessage(chatId, {
                text: `❌ Sorry, I couldn't find any lyrics for "${songTitle}".`
            },{ quoted: message });
            return;
        }

        const maxChars = 4096;
        const output = lyrics.length > maxChars ? lyrics.slice(0, maxChars - 3) + '...' : lyrics;

        await sock.sendMessage(chatId, { text: output }, { quoted: message });
    } catch (error) {
        console.error('Error in lyrics command:', error);
        await sock.sendMessage(chatId, { 
            text: `❌ An error occurred while fetching the lyrics for "${songTitle}".`
        },{ quoted: message });
    }
}

module.exports = { lyricsCommand };
