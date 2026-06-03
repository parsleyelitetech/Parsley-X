/*
 CODE BY YOUNGBOY 🇿🇼 
 */
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const os = require('os')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { getPrefixes, setPrefixes, addPrefix, removePrefix } = require('./lib/prefixManager')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { File } = require('megajs')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
    }
}, 60_000) // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log(chalk.yellow('⚠️  RAM too high (>400MB), restarting bot...'))
        process.exit(1) // Panel will auto-restart
    }
}, 30_000) // check every 30 seconds

let phoneNumber = `${settings.OwnerNumber}`
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏"
const prefix = `${settings.Prefix}`
global.themeemoji = ""
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Session directory setup
const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}

// SESSION ID FUNCTIONS
async function downloadSessionData() {
    try {
        await fs.promises.mkdir(sessionDir, { recursive: true });

        if (!fs.existsSync(credsPath)) {
            if (!settings.SESSION_ID) {
                console.log(chalk.yellow('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ⚠️  Session ID not found in settings!'));
                console.log(chalk.yellow('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ⚠️  Creds.json not found in session folder!'));
                console.log(chalk.cyan('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] 📱 Will use pairing code method instead...'));
                return false;
            }

            console.log(chalk.cyan('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] 📥 Downloading session data from SESSION_ID...'));
            console.log(chalk.cyan('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] 🔰 Downloading MEGA.nz session...'));
            
            // Remove "parsley~" prefix if present, otherwise use full SESSION_ID
            const megaFileId = settings.SESSION_ID.startsWith('') 
                ? settings.SESSION_ID.replace("", "") 
                : settings.SESSION_ID;

            try {
                const filer = File.fromURL(`https://mega.nz/file/${megaFileId}`);
                
                const sessionData = await new Promise((resolve, reject) => {
                    filer.download((err, data) => {
                        if (err) reject(err);
                        else resolve(data);
                    });
                });
                
                await fs.promises.writeFile(credsPath, sessionData);
                console.log(chalk.green('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ✅ MEGA session downloaded successfully!'));
                return true;
            } catch (megaError) {
                console.log(chalk.red('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ❌ Error downloading from MEGA:'), megaError.message);
                console.log(chalk.yellow('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ⚠️  Invalid MEGA file ID or file not accessible'));
                return false;
            }
        } else {
            console.log(chalk.green('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ✅ Using existing creds.json'));
            return true;
        }
    } catch (error) {
        console.error(chalk.red('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ❌ Error processing session data:'), error.message);
        return false;
    }
}

async function startXeonBotInc() {
    try {
        console.log(chalk.green('Connecting to 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ...'));
        console.log('');

        // Try to download session data first
        const sessionDownloaded = await downloadSessionData();

        let { version, isLatest } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(`./session`)
        const msgRetryCounterCache = new NodeCache()

        const XeonBotInc = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !pairingCode,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            retryRequestDelayMs: 10000,
            transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
            maxMsgRetryCount: 15,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
            emitOwnEvents: true,
            fireInitQueries: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: true,
            markOnlineOnConnect: true,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
        })

        // Save credentials when they update
        XeonBotInc.ev.on('creds.update', saveCreds)

        store.bind(XeonBotInc.ev)

        // Message handling
        XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
            try {
                const mek = chatUpdate.messages[0]
                if (!mek.message) return
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    await handleStatus(XeonBotInc, chatUpdate);
                    return;
                }
                if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                    const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                    if (!isGroup) return
                }
                if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

                if (XeonBotInc?.msgRetryCounterCache) {
                    XeonBotInc.msgRetryCounterCache.clear()
                }

                try {
                    await handleMessages(XeonBotInc, chatUpdate, true)
                } catch (err) {
                    console.error("[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] Error in handleMessages:", err)
                    if (mek.key && mek.key.remoteJid) {
                        await XeonBotInc.sendMessage(mek.key.remoteJid, {
                            text: '[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ❌ An error occurred while processing your message.',
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '120363424947896379@newsletter',
                                    newsletterName: '𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏',
                                    serverMessageId: -1
                                }
                            }
                        }).catch(console.error);
                    }
                }
            } catch (err) {
                console.error("[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] Error in messages.upsert:", err)
            }
        })

        XeonBotInc.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {}
                return decode.user && decode.server && decode.user + '@' + decode.server || jid
            } else return jid
        }

        XeonBotInc.ev.on('contacts.update', update => {
            for (let contact of update) {
                let id = XeonBotInc.decodeJid(contact.id)
                if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
            }
        })

        XeonBotInc.getName = (jid, withoutContact = false) => {
            id = XeonBotInc.decodeJid(jid)
            withoutContact = XeonBotInc.withoutContact || withoutContact
            let v
            if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
                v = store.contacts[id] || {}
                if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
            })
            else v = id === '0@s.whatsapp.net' ? {
                id,
                name: 'WhatsApp'
            } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
                XeonBotInc.user :
                (store.contacts[id] || {})
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
        }

        XeonBotInc.public = true
        XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

        // Handle pairing code - only if no session exists
        if (pairingCode && !XeonBotInc.authState.creds.registered) {
            if (useMobile) throw new Error('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] Cannot use pairing code')

            let phoneNumber
            if (!!global.phoneNumber) {
                phoneNumber = global.phoneNumber
            } else {
                phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] Please type your WhatsApp number\nFormat: 263xx (without + or spaces) : `)))
            }

            phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

            const pn = require('awesome-phonenumber');
            if (!pn('+' + phoneNumber).isValid()) {
                console.log(chalk.red('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ❌ Invalid phone number format!'));
                process.exit(1);
            }

            setTimeout(async () => {
                try {
                    let code = await XeonBotInc.requestPairingCode(phoneNumber)
                    code = code?.match(/.{1,4}/g)?.join("-") || code
                    
                    console.log('');
                    console.log(chalk.cyan('╔════════════════════════════════╗'));
                    console.log(chalk.cyan('║                                        ║'));
                    console.log(chalk.cyan('║       PAIRING CODE SYSTEM              ║'));
                    console.log(chalk.cyan('║                                        ║'));
                    console.log(chalk.cyan('╚════════════════════════════════╝'));
                    console.log('');
                    console.log(chalk.greenBright('  Your Pairing Code: ') + chalk.white.bold(code));
                    console.log('');
                    console.log(chalk.yellow('  📱 Enter this code in WhatsApp:'));
                    console.log(chalk.yellow('     1. Open WhatsApp'));
                    console.log(chalk.yellow('     2. Settings > Linked Devices'));
                    console.log(chalk.yellow('     3. Link a Device'));
                    console.log(chalk.yellow('     4. Enter the code above'));
                    console.log('');
                } catch (error) {
                    console.error(chalk.red('❌ Error requesting pairing code:'), error.message)
                }
            }, 3000)
        }

        // Connection handling with better reconnection logic
        XeonBotInc.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect, qr } = s
            
            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
                
                if (reason === DisconnectReason.badSession) {
                    console.log(chalk.red('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ❌ Bad Session File, Please Delete Session and Scan Again'));
                    process.exit(0);
                } else if (reason === DisconnectReason.connectionClosed) {
                    console.log(chalk.yellow('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ⚠️  Connection closed, reconnecting...'));
                    await delay(3000);
                    startXeonBotInc();
                } else if (reason === DisconnectReason.connectionLost) {
                    console.log(chalk.yellow('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ⚠️  Connection Lost from Server, reconnecting...'));
                    await delay(3000);
                    startXeonBotInc();
                } else if (reason === DisconnectReason.connectionReplaced) {
                    console.log(chalk.red('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ❌ Connection Replaced, Another New Session Opened'));
                    process.exit(1);
                } else if (reason === DisconnectReason.loggedOut) {
                    console.log(chalk.red('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ❌ Device Logged Out, Please Delete Session and Scan Again.'));
                    try {
                        rmSync('./session', { recursive: true, force: true });
                    } catch {}
                    process.exit(1);
                } else if (reason === DisconnectReason.restartRequired) {
                    console.log(chalk.yellow('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ⚠️  Restart Required, Restarting...'));
                    await delay(2000);
                    startXeonBotInc();
                } else if (reason === DisconnectReason.timedOut) {
                    console.log(chalk.yellow('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ⚠️  Connection TimedOut, Reconnecting...'));
                    await delay(3000);
                    startXeonBotInc();
                } else {
                    console.log(chalk.red(`[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ❌ Unknown DisconnectReason: ${reason}|${connection}`));
                    await delay(3000);
                    startXeonBotInc();
                }
            } else if (connection === 'open') {
                console.log('');
                console.log(chalk.green('      [ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] ✅ SUCCESSFULLY CONNECTED'));
                console.log('');
                console.log(chalk.cyan(''));
                console.log(chalk.cyan(''));
                console.log(chalk.cyan(''));
                console.log('');
                console.log(chalk.yellow(`
OWNER: ${XeonBotInc.user.id.split(':')[0]}

DATE: ${new Date().toLocaleDateString()}

TIME: ${new Date().toLocaleTimeString()}

VERSION: ${settings.version}`));
                console.log('');

                try {
                    const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
                    await XeonBotInc.sendMessage(botNumber, {
                        text: `
╔══════════════╗
║    *𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏*           
║ SUCCESSFULLY CONNECTED ✅       
║ ＰＲＥＦＩＸ: [ *${prefix}* ]            
╟──────────────╢
║ 🖇️ ＣＨＡＮＮＥＬ ＬＩＮＫ         
║ https://whatsapp.com/channel/0029VbCY2ZgADTO8NQkBnc2L              
╟──────────────╢
║ 🖇️ ＧＲＯＵＰ ＬＩＮＫ          
║ https://whatsapp.com/channel/0029VbCY2ZgADTO8NQkBnc2L                 
╠══════════════╣
║   *𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏*               
║          
╚══════════════╝`,
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363424947896379@newsletter',
                                newsletterName: '𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏',
                                serverMessageId: -1
                            }
                        }
                    });
                } catch (error) {
                    console.error(chalk.red('[ 𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏 ] Error sending connection message:'), error.message)
                }
            }
        })

        // Track recently-notified callers to avoid spamming messages
        const antiCallNotified = new Set();

        XeonBotInc.ev.on('call', async (calls) => {
            try {
                const { readState: readAnticallState } = require('./commands/anticall');
                const state = readAnticallState();
                if (!state.enabled) return;
                for (const call of calls) {
                    const callerJid = call.from || call.peerJid || call.chatId;
                    if (!callerJid) continue;
                    try {
                        try {
                            if (typeof XeonBotInc.rejectCall === 'function' && call.id) {
                                await XeonBotInc.rejectCall(call.id, callerJid);
                            } else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) {
                                await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject');
                            }
                        } catch {}

                        if (!antiCallNotified.has(callerJid)) {
                            antiCallNotified.add(callerJid);
                            setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                            await XeonBotInc.sendMessage(callerJid, { text: '📵 *Calls not allowed at the moment!*' });
                        }
                    } catch {}
                    setTimeout(async () => {
                        try { await XeonBotInc.updateBlockStatus(callerJid, 'block'); } catch {}
                    }, 800);
                }
            } catch (e) {}
        });

        XeonBotInc.ev.on('group-participants.update', async (update) => {
            await handleGroupParticipantUpdate(XeonBotInc, update);
        });

        XeonBotInc.ev.on('messages.upsert', async (m) => {
            if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
                await handleStatus(XeonBotInc, m);
            }
        });

        XeonBotInc.ev.on('status.update', async (status) => {
            await handleStatus(XeonBotInc, status);
        });

        XeonBotInc.ev.on('messages.reaction', async (status) => {
            await handleStatus(XeonBotInc, status);
        });

        return XeonBotInc
    } catch (error) {
        console.error(chalk.red('❌ Error:'), error.message)
        await delay(5000)
        startXeonBotInc()
    }
}

// Start the bot with error handling
startXeonBotInc().catch(error => {
    console.error(chalk.red('❌ Fatal error:'), error)
    process.exit(1)
})

process.on('uncaughtException', (err) => {
    console.error(chalk.red('Uncaught Exception:'), err)
})

process.on('unhandledRejection', (err) => {
    console.error(chalk.red('Unhandled Rejection:'), err)
})

// COMMAND CATEGORIES for menu
const COMMAND_CATEGORIES = {
    ADMIN: ['ʙᴀɴ', 'ᴘʀᴏᴍᴏᴛᴇ', 'ᴅᴇᴍᴏᴛᴇ', 'ᴍᴜᴛᴇ', 'ᴜɴᴍᴜᴛᴇ', 'ᴅᴇʟᴇᴛᴇ', 'ᴅᴇʟ', 'ᴋɪᴄᴋ', 'ᴡᴀʀɴɪɴɢꜱ', 'ᴡᴀʀɴ', 'ᴀɴᴛɪʟɪɴᴋ', 'ᴀɴᴛɪʙᴀᴅᴡᴏʀᴅ', 'ᴄʟᴇᴀʀ', 'ᴛᴀɢ', 'ᴛᴀɢᴀʟʟ', 'ᴛᴀɢɴᴏᴛᴀᴅᴍɪɴ', 'ʜɪᴅᴇᴛᴀɢ', 'ᴄʜᴀᴛʙᴏᴛ', 'ʀᴇꜱᴇᴛʟɪɴᴋ', 'ᴀɴᴛɪᴛᴀɢ', 'ᴡᴇʟᴄᴏᴍᴇ', 'ɢᴏᴏᴅʙʏᴇ', 'ꜱᴇᴛɢᴅᴇꜱᴄ', 'ꜱᴇᴛɢɴᴀᴍᴇ', 'ꜱᴇᴛɢᴘᴘ'],
    ANIME: ['ɴᴏᴍ', 'ᴘᴏᴋᴇ', 'ᴄʀʏ', 'ᴋɪꜱꜱ', 'ᴘᴀᴛ', 'ʜᴜɢ', 'ᴡɪɴᴋ', 'ꜰᴀᴄᴇᴘᴀʟᴍ', 'ɢᴀʀʟ', 'ᴡᴀɪꜰᴜ', 'ɴᴇᴋᴏ', 'ᴍᴇɢᴜᴍɪɴ', 'ᴍᴀɪᴅ', 'ᴀᴡᴏᴏ', 'ᴀɴɪᴍᴇɢɪʀʟ', 'ᴀɴɪᴍᴇ', 'ᴀɴɪᴍᴇ1', 'ᴀɴɪᴍᴇ2', 'ᴀɴɪᴍᴇ3', 'ᴀɴɪᴍᴇ4', 'ᴀɴɪᴍᴇ5', 'ᴅᴏɢ'],
OWNER: ['ᴍᴏᴅᴇ', 'ᴘʀᴇꜰɪx', 'ʙᴏᴛɪᴍɢ', 'ʙᴏᴛɴᴀᴍᴇ', 'ʙʟᴏᴄᴋ', 'ᴜɴʙʟᴏᴄᴋ', 'ᴄʟᴇᴀʀꜱᴇꜱꜱɪᴏɴ', 'ᴀɴᴛɪᴅᴇʟᴇᴛᴇ', 'ᴀɴᴛɪᴇᴅɪᴛ', 'ᴄʟᴇᴀʀᴛᴍᴘ', 'ᴜᴘᴅᴀᴛᴇ', 'ꜱᴇᴛᴛɪɴɢꜱ', 'ꜱᴇᴛᴘᴘ', 'ᴀᴜᴛᴏʀᴇᴀᴄᴛ', 'ᴀᴜᴛᴏꜱᴛᴀᴛᴜꜱ', 'ᴀᴜᴛᴏᴛʏᴘɪɴɢ', 'ᴀᴜᴛᴏʀᴇᴀᴅ', 'ᴀɴᴛɪᴄᴀʟʟ', 'ᴘᴍʙʟᴏᴄᴋᴇʀ', 'ꜱᴇᴛᴍᴇɴᴛɪᴏɴ', 'ᴍᴇɴᴛɪᴏɴ', 'ʟᴇᴀᴠᴇ'],

GENERAL: ['ᴍᴇɴᴜ', 'ᴘɪɴɢ', 'ᴀʟɪᴠᴇ', 'ᴛᴛꜱ', 'ᴏᴡɴᴇʀ', 'ᴊᴏᴋᴇ', 'Qᴜᴏᴛᴇ', 'ꜰᴀᴄᴛ', 'ᴡᴇᴀᴛʜᴇʀ', 'ɴᴇᴡꜱ', 'ᴀᴛᴛᴘ', 'ʟʏʀɪᴄꜱ', '8ʙᴀʟʟ', 'ɢʀᴏᴜᴘɪɴꜰᴏ', 'ꜱᴛᴀꜰꜰ', 'ᴀᴅᴍɪɴꜱ', 'ᴠᴠ', 'ᴛʀᴛ', 'ꜱꜱ', 'ᴊɪᴅ','ʙɪʙʟᴇ', 'ᴛɪɴʏ', 'ᴛɪɴʏᴜʀʟ', 'ꜱᴇɴᴅ', 'ᴜʀʟ', 'ɢᴇᴛᴘᴘ', 'ᴛᴜᴛᴏʀɪᴀʟ'],

    IMAGE_STICKER: ['ʙʟᴜʀ', 'ꜱɪᴍᴀɢᴇ', 'ꜱᴛɪᴄᴋᴇʀ', 'ʀᴇᴍᴏᴠᴇʙɢ', 'ʀᴇᴍɪɴɪ', 'ᴄʀᴏᴘ', 'ᴛɢꜱᴛɪᴄᴋᴇʀ', 'ᴍᴇᴍᴇ', 'ᴛᴀᴋᴇ', 'ᴇᴍᴏᴊɪᴍɪx', 'ɪɢꜱ', 'ɪɢꜱᴄ'],
    PIES: ['ᴘɪᴇꜱ', 'ᴄʜɪɴᴀ', 'ɪɴᴅᴏɴᴇꜱɪᴀ', 'ᴊᴀᴘᴀɴ', 'ᴋᴏʀᴇᴀ', 'ʜɪᴊᴀʙ'],
    GAME: ['ᴛɪᴄᴛᴀᴄᴛᴏᴇ', 'ʜᴀɴɢᴍᴀɴ', 'ɢᴜᴇꜱꜱ', 'ᴛʀɪᴠɪᴀ', 'ᴀɴꜱᴡᴇʀ', 'ᴛʀᴜᴛʜ', 'ᴅᴀʀᴇ'],
    AI: ['ɢᴘᴛ', 'ɢᴇᴍɪɴɪ', 'ɪᴍᴀɢɪɴᴇ', 'ꜰʟᴜx', 'ꜱᴏʀᴀ'],
    FUN: ['ᴄᴏᴍᴘʟɪᴍᴇɴᴛ', 'ɪɴꜱᴜʟᴛ', 'ꜰʟɪʀᴛ', 'ꜱʜᴀʏᴀʀɪ', 'ɢᴏᴏᴅɴɪɢʜᴛ', 'ʀᴏꜱᴇᴅᴀʏ', 'ᴄʜᴀʀᴀᴄᴛᴇʀ', 'ᴡᴀꜱᴛᴇᴅ', 'ꜱʜɪᴘ', 'ꜱɪᴍᴘ', 'ꜱᴛᴜᴘɪᴅ'],
    TEXTMAKER: ['ᴍᴇᴛᴀʟʟɪᴄ', 'ɪᴄᴇ', 'ꜱɴᴏᴡ', 'ɪᴍᴘʀᴇꜱꜱɪᴠᴇ', 'ᴍᴀᴛʀɪx', 'ʟɪɢʜᴛ', 'ɴᴇᴏɴ', 'ᴅᴇᴠɪʟ', 'ᴘᴜʀᴘʟᴇ', 'ᴛʜᴜɴᴅᴇʀ', 'ʟᴇᴀᴠᴇꜱ', '1917', 'ᴀʀᴇɴᴀ', 'ʜᴀᴄᴋᴇʀ', 'ꜱᴀɴᴅ', 'ʙʟᴀᴄᴋᴘɪɴᴋ', 'ɢʟɪᴛᴄʜ', 'ꜰɪʀᴇ'],
    DOWNLOADER: ['ᴘʟᴀʏ', 'ꜱᴏɴɢ', 'ꜱᴘᴏᴛɪꜰʏ', 'ᴀᴘᴋ', 'ᴀᴘᴘ', 'ɪɴꜱᴛᴀɢʀᴀᴍ', 'ꜰᴀᴄᴇʙᴏᴏᴋ', 'ᴛɪᴋᴛᴏᴋ', 'ᴠɪᴅᴇᴏ', 'ʏᴛᴍᴘ4'],
    MISC: ['ʜᴇᴀʀᴛ', 'ʜᴏʀɴʏ', 'ᴄɪʀᴄʟᴇ', 'ʟɢʙᴛ', 'ʟᴏʟɪᴄᴇ', 'ɪᴛꜱ-ꜱᴏ-ꜱᴛᴜᴘɪᴅ', 'ɴᴀᴍᴇᴄᴀʀᴅ', 'ᴏᴏɢᴡᴀʏ', 'ᴛᴡᴇᴇᴛ', 'ʏᴛᴄᴏᴍᴍᴇɴᴛ', 'ᴄᴏᴍʀᴀᴅᴇ', 'ɢᴀʏ', 'ɢʟᴀꜱꜱ', 'ᴊᴀɪʟ', 'ᴘᴀꜱꜱᴇᴅ', 'ᴛʀɪɢɢᴇʀᴇᴅ'],
    GITHUB: ['ꜱᴄʀɪᴘᴛ', 'ɢɪᴛᴄʟᴏɴᴇ', 'ᴄɪᴅ', 'ɪᴅ', 'ᴄʜᴀɴɴᴇʟɪᴅ', 'ᴠᴄᴀʀᴅ', 'ʀᴇᴘᴏ']
};

// Function to get RAM usage with visual bar
function getRAMUsage() {
    const totalRAM = os.totalmem();
    const freeRAM = os.freemem();
    const usedRAM = totalRAM - freeRAM;
    
    const usedMB = (usedRAM / 1024 / 1024).toFixed(2);
    const totalGB = (totalRAM / 1024 / 1024 / 1024).toFixed(2);
    const percentage = ((usedRAM / totalRAM) * 100).toFixed(1);
    
    const filledBlocks = Math.round((usedRAM / totalRAM) * 10);
    const emptyBlocks = 10 - filledBlocks;
    const bar = '█'.repeat(filledBlocks) + '▓'.repeat(emptyBlocks);
    
    return {
        bar: bar,
        text: `${usedMB} MB / ${totalGB} GB`,
        percentage: percentage
    };
}


// Function to detect platform
function getPlatform() {
    const env = process.env;
    
    if (env.DYNO || env.HEROKU_APP_DIR || env.HEROKU_SLUG_COMMIT) return 'Heroku';
    if (env.RAILWAY_ENVIRONMENT || env.RAILWAY_PROJECT_ID) return 'Railway';
    if (env.RENDER || env.RENDER_EXTERNAL_URL) return 'Render';
    if (env.KOYEB_PUBLIC_DOMAIN || env.KOYEB_APP_ID) return 'Koyeb';
    if (env.VERCEL || env.VERCEL_ENV || env.VERCEL_URL) return 'Vercel';
    if (env.REPL_ID || env.REPL_SLUG) return 'Replit';
  
  
    // Check if it's running on local/panel
    const hostname = os.hostname().toLowerCase();
    if (!env.CLOUD_PROVIDER && !env.DYNO && !env.VERCEL && !env.RENDER && 
        !env.RAILWAY_ENVIRONMENT && !env.KOYEB_PUBLIC_DOMAIN) {
        
        // Check for common local/panel indicators
        if (hostname.includes('vps') || hostname.includes('server') || 
            hostname.includes('panel') || hostname.includes('local')) {
            return 'Panel';
        }
    }
    
    // Fallback to OS detection
    const platform = os.platform();
    switch (platform) {
        case 'linux': 
            // Check if it's Android/Termux
            if (platform.includes('android') || env.TERMUX_VERSION) {
                return 'Termux';
            }
            return 'Linux';
        case 'win32': return 'Windows';
        case 'darwin': return 'MacOS';
        default: return 'Unknown';
    }
}


// Function to get total commands
function getTotalCommands() {
    return Object.values(COMMAND_CATEGORIES).reduce((total, commands) => total + commands.length, 0);
}

// Function to get pushname
function getPushname(message) {
    return message.pushName || message.key.participant?.split('@')[0] || 'No Name';
}

// Function to format commands for menu
function formatCommands(commands) {
    const prefixes = getPrefixes ? getPrefixes() : (Array.isArray(settings.Prefix) ? settings.Prefix : [settings.Prefix]);
    const primaryPrefix = prefixes[0];
    return commands.map(cmd => `*│▸* *${primaryPrefix}${cmd}*`).join('\n');
}

// Export helper functions
global.menuHelpers = {
    getPrefixes,
    COMMAND_CATEGORIES,
    getRAMUsage,
    getPlatform,
    getTotalCommands,
    getPushname,
    formatCommands
};

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})