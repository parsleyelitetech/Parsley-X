const settings = require('../settings');
const fs = require('fs');
const { Vcard } = require('../lib/Parsley');
const { getUptime } = require('../lib/runtime');
const path = require('path');

const readMore = String.fromCharCode(8206).repeat(4001);

async function helpCommand(sock, chatId, message) {
    try {
        // Send reaction first
        await sock.sendMessage(chatId, {
            react: { text: '〽️', key: message.key }
        });

        // Access helper functions from global (set by index.js)
        const {
            COMMAND_CATEGORIES,
            getPrefixes,
            getRAMUsage,
            getPlatform,
            getTotalCommands,
            getPushname,
            formatCommands
        } = global.menuHelpers;

        // Get all dynamic values
        const pushname = getPushname(message);
        const uptime = getUptime();
        const ramUsage = getRAMUsage();
        const platform = getPlatform();
        const totalCommands = getTotalCommands();

        const Parsley = `
┎━❑ ${settings.botName} ❑━⋅⊶
┃➸╭─────────
┃❑│▸ 👤 *ᴜꜱᴇʀ :* *@${pushname}*
┃❑│▸ 👑 *ᴏᴡɴᴇʀ :* ${settings.botOwner}
┃❑│▸ 📦 *ᴠᴇʀꜱɪᴏɴ :* ${settings.version}
┃❑│▸ 📚 *ᴄᴍᴅꜱ :* ${totalCommands}
┃❑│▸ 🌍 *ᴛɪᴍᴇᴢᴏɴᴇ :* ${settings.timezone}
┃❑│▸ 🔋 *ᴜᴘᴛɪᴍᴇ :* ${uptime}
┃❑│▸ 💻 *ʜᴏꜱᴛ :* ${platform}
┃❑│▸ ⚙️ *ᴍᴏᴅᴇ :* ${settings.commandMode}
┃❑│▸ 📈 ʀᴀᴍusage: ${ramUsage.text} (${ramUsage.percentage}%)
┃➸╰─────────
┖━━━━━━━━━━━━⋅⊶
${readMore}
┎ ❑ *𝐌𝐀𝐈𝐍 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.GENERAL)}
┖━━━━━━━━━⋅⊶

┎ ❑ *𝐀𝐍𝐈𝐌𝐄 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.ANIME)}
┖━━━━━━━━━━⋅⊶

┎ ❑ *𝐆𝐑𝐎𝐔𝐏 𝐌𝐄𝐍𝐔* ❑ 
${formatCommands(COMMAND_CATEGORIES.ADMIN)}
┖━━━━━━━━━⋅⊶

┎ ❑ *𝐎𝐖𝐍𝐄𝐑 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.OWNER)}
┖━━━━━━━━━⋅⊶

┎ ❑ *𝐈𝐌𝐀𝐆𝐄 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.IMAGE_STICKER)}
┖━━━━━━━━━⋅⊶  

┎ ❑ *𝐒𝐓𝐈𝐂𝐊𝐄𝐑 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.PIES)}
┖━━━━━━━━━⋅⊶

┎ ❑ *𝐆𝐀𝐌𝐄 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.GAME)}
┖━━━━━━━━━⋅⊶

┎ ❑ *𝐀𝐈 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.AI)}
┖━━━━━━━━━⋅⊶

┎ ❑ *𝐅𝐔𝐍 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.FUN)}
┖━━━━━━━━━⋅⊶

┎ ❑ *𝐓𝐄𝐗𝐓 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.TEXTMAKER)}
┖━━━━━━━━━⋅⊶

┎ ❑ *𝐃𝐋 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.DOWNLOADER)}
┖━━━━━━━━━⋅⊶

┎ ❑ *𝐌𝐈𝐒𝐂 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.MISC)}
┖━━━━━━━━━⋅⊶

┎ ❑ *𝐎𝐓𝐇𝐄𝐑 𝐌𝐄𝐍𝐔* ❑
${formatCommands(COMMAND_CATEGORIES.GITHUB)}
┖━━━━━━━━━⋅⊶

> POWERED BY 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏`;

        const imagePath = path.join(__dirname, '../assets/Menu.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: Parsley,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363424947896379@newsletter',
                        newsletterName: 'P-Elite Technologies',
                        serverMessageId: -1
                    }
                }
            }, { quoted: Vcard });
            
            // 2️⃣ Send WORKING audio (Opus encoded .ogg) - tested December 2025
        await sock.sendMessage(chatId, {
            audio: { 
                url: "./menu.mp3"   // ← NEW 100% WORKING VOICE
            },
            mimetype: "audio/mpeg",
            ptt: false,                                 // false = normal voice message (shows waveform)
            waveform: [0, 25, 50, 80, 100, 80, 50, 25, 10, 0, 10, 25, 40, 60, 80, 90, 80, 60, 40, 20, 0]
        }, { quoted: message });
            
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: MoonXmd,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363424947896379@newsletter',
                        newsletterName: 'P-Elite',
                        serverMessageId: -1
                    } 
                }
            });
        }
    } catch (error) {
        console.error('Error in menu command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ An error occurred while displaying the menu. Please try again later.' 
        });
    }
}

module.exports = helpCommand;