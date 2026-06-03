const fetch = require('node-fetch');

async function gitcloneCommand(sock, chatId, message, userMessage) {
    try {
        // Extract the GitHub URL from the message
        const text = userMessage.slice(9).trim(); // Remove '.gitclone' prefix

        // Check if URL is provided
        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '❌ Please provide a GitHub link.\n\n*Example:* .gitclone https://github.com/HyHamz/HTD-V1'
            }, { quoted: message });
        }
    await sock.sendMessage(chatId, {
            react: { text: '⬇️', key: message.key }
        });
        
        // Check if it's a valid GitHub URL
        if (!text.includes('github.com')) {
            return await sock.sendMessage(chatId, {
                text: '❌ That doesn\'t look like a GitHub repository link!'
            }, { quoted: message });
        }

        // Send processing message
        await sock.sendMessage(chatId, {
            text: '⏳Please wait...'
        }, { quoted: message });

        // Extract user and repo from GitHub URL
        let regex1 = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;
        let match = text.match(regex1);
        
        if (!match) {
            return await sock.sendMessage(chatId, {
                text: '❌ Invalid GitHub URL format!'
            }, { quoted: message });
        }

        let [, user, repo] = match;
        repo = repo.replace(/.git$/, '');

        // Construct the zipball URL
        let url = `https://api.github.com/repos/${user}/${repo}/zipball`;

        // Get the filename from headers
        let response = await fetch(url, { method: 'HEAD' });
        
        if (!response.ok) {
            return await sock.sendMessage(chatId, {
                text: '❌ Failed to fetch repository. Make sure the repository exists and is public.'
            }, { quoted: message });
        }

        let contentDisposition = response.headers.get('content-disposition');
        let filename = contentDisposition ? 
            contentDisposition.match(/attachment; filename=(.*)/)[1] : 
            `${user}-${repo}.zip`;

        // Send the repository as a document
        await sock.sendMessage(chatId, {
            document: { url: url },
            fileName: filename,
            mimetype: 'application/zip',
            caption: `✅ *Repository Cloned Successfully!*\n\n📦 *Repo:* ${user}/${repo}\n📁 *File:* ${filename}`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in gitclone command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ An error occurred while cloning the repository. Please check the URL and try again.'
        }, { quoted: message });
    }
}

module.exports = gitcloneCommand;