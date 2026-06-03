/*==================================

  DEVELOPED BY YOUNGBOY 🇿🇼 


================================*/

const fs = require('fs')
if (fs.existsSync('.env')) require('dotenv').config({ path: __dirname+'/.env' })

const settings = {

//====== DONT CHANGE =============//
  packname: process.env.packname || 'Mr ParsleyIncTech',
  
  
  author: process.env.authour || '𝙿𝙰𝚁𝚂𝙻𝙴𝚈',
  
//======= BOT SETTINGS ============//

  SESSION_ID: process.env.SESSION_ID || '',
  

  botName: process.env.botName || "𝙿𝙰𝚁𝚂𝙻𝙴𝚈 𝕏",
  
  
  commandMode: process.env.commandMode || "private",
  
  
  timezone: process.env.timezone || "Africa/Harare",
  
  
  botOwner: process.env.botOwner || '𝙿𝙰𝚁𝚂𝙻𝙴𝚈 X',
  
  ownerNumber: process.env.ownerNumber || '263786690653',
  
  //======== ANTIEDIT SETTINGS ===========//
  antieditMode: process.env.antieditMode || "private", // "public" or "private"
  
  antieditEnabled: process.env.antieditEnabled || true, // true or false
  
  
  // Examples: '.' or ['.', '!', '#', '$']
  Prefix: process.env.Prefix ? (process.env.Prefix.includes(',') ? process.env.Prefix.split(',') : process.env.Prefix) : ['.', '!', '#', '$'],
  
  
  
  
//======== DONT CHANGE ===========//
  giphyApiKey: process.env.giphyApiKey || 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  
  
  maxStoreMessages: process.env.maxStoreMessages || 20, 
  
  
  storeWriteInterval: process.env.storeWriteInterval || 10000,
  
  
  description: process.env.description || "ADVANCED W.A BOT DEVELOPED BY KEITH TECH",
  
  version: process.env.version || "1.0.0",
  
  updateZipUrl: process.env.updateZipUrl "https://github.com/mruniquehacker/Knightbot-MD/archive/refs/heads/main.zip",
  
};

module.exports = settings;