const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '@newsletter',
            newsletterName: 'KEITH TECH',
            serverMessageId: -1
        }
    }
};

async function tutorialCommand(sock, chatId, message) {
    try {
        const tutorialText = `

COMING SOON.....😔`;

        await sock.sendMessage(chatId, {
            text: tutorialText,
            ...channelInfo
        }, { quoted: message });

    } catch (error) {
        console.error('Error in tutorial command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *Failed to load tutorial!*\n\nPlease try again later.',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = tutorialCommand;