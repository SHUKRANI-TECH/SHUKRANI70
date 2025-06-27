"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const logger_1 = __importDefault(require("@whiskeysockets/baileys/lib/Utils/logger"));
const logger = logger_1.default.child({});
logger.level = 'silent';
const pino = require("pino");
const boom_1 = require("@hapi/boom");
const conf = require("./set");
const axios = require("axios");
let fs = require("fs-extra");
let path = require("path");
const FileType = require('file-type');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
const { verifierEtatJid, recupererActionJid } = require("./bdd/antilien");
const { atbverifierEtatJid, atbrecupererActionJid } = require("./bdd/antibot");
let evt = require(__dirname + "/framework/zokou");
const { isUserBanned, addUserToBanList, removeUserFromBanList } = require("./bdd/banUser");
const { addGroupToBanList, isGroupBanned, removeGroupFromBanList } = require("./bdd/banGroup");
const { isGroupOnlyAdmin, addGroupToOnlyAdminList, removeGroupFromOnlyAdminList } = require("./bdd/onlyAdmin");
let { reagir } = require(__dirname + "/framework/app");
var session = conf.session.replace(/Toxic-MD-WHATSAPP-BOT;;;=>/g, "");
const prefixe = conf.PREFIXE;
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

async function authentification() {
    try {
        const authPath = __dirname + "/auth/creds.json";
        const sessionData = atob(session);
        if (!fs.existsSync(authPath) || session != "zokk") {
            console.log("Connecting...");
            await fs.writeFileSync(authPath, sessionData, "utf8");
        }
    } catch (e) {
        console.log("Invalid session: " + e);
        return;
    }
}
authentification();

const store = (0, baileys_1.makeInMemoryStore)({ logger: pino().child({ level: "silent", stream: "store" }) });

setTimeout(() => {
    async function main() {
        const { version } = await (0, baileys_1.fetchLatestBaileysVersion)();
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(__dirname + "/auth");
        const sockOptions = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['Toxic-MD', "Safari"],
            printQRInTerminal: true,
            markOnlineOnConnect: false,
            auth: {
                creds: state.creds,
                keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger),
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return undefined;
            },
        };
        const zk = (0, baileys_1.default)(sockOptions);
        store.bind(zk.ev);
        setInterval(() => { store.writeToFile("store.json"); }, 3000);

        zk.ev.on("messages.upsert", async (m) => {
            const { messages } = m;
            const ms = messages[0];
            if (!ms.message) return;

            const decodeJid = (jid) => {
                if (!jid) return jid;
                if (/:\d+@/gi.test(jid)) {
                    let decode = (0, baileys_1.jidDecode)(jid) || {};
                    return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
                }
                return jid;
            };

            var mtype = (0, baileys_1.getContentType)(ms.message);
            var texte = mtype == "conversation" ? ms.message.conversation :
                        mtype == "imageMessage" ? ms.message.imageMessage?.caption :
                        mtype == "videoMessage" ? ms.message.videoMessage?.caption :
                        mtype == "extendedTextMessage" ? ms.message?.extendedTextMessage?.text :
                        mtype == "buttonsResponseMessage" ? ms?.message?.buttonsResponseMessage?.selectedButtonId :
                        mtype == "listResponseMessage" ? ms.message?.listResponseMessage?.singleSelectReply?.selectedRowId :
                        mtype == "messageContextInfo" ? (ms?.message?.buttonsResponseMessage?.selectedButtonId || ms.message?.listResponseMessage?.singleSelectReply?.selectedRowId || ms.text) : "";
            var origineMessage = ms.key.remoteJid;
            var idBot = decodeJid(zk.user.id);
            var servBot = idBot.split('@')[0];

            const verifGroupe = origineMessage?.endsWith("@g.us");
            var infosGroupe = verifGroupe ? await zk.groupMetadata(origineMessage) : "";
            var nomGroupe = verifGroupe ? infosGroupe.subject : "";
            var msgRepondu = ms.message.extendedTextMessage?.contextInfo?.quotedMessage;
            var auteurMsgRepondu = decodeJid(ms.message?.extendedTextMessage?.contextInfo?.participant);
            var mr = ms.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            var utilisateur = mr ? mr : msgRepondu ? auteurMsgRepondu : "";
            var auteurMessage = verifGroupe ? (ms.key.participant || ms.participant) : origineMessage;
            if (ms.key.fromMe) {
                auteurMessage = idBot;
            }

            var membreGroupe = verifGroupe ? ms.key.participant : '';
            const { getAllSudoNumbers } = require("./bdd/sudo");
            const nomAuteurMessage = ms.pushName;
            const dj = '25573350309';
            const dj2 = '255773350309';
            const sudo = await getAllSudoNumbers();
            const superUserNumbers = [servBot, dj, dj2, conf.NUMERO_OWNER].map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net");
            const allAllowedNumbers = superUserNumbers.concat(sudo);
            const superUser = allAllowedNumbers.includes(auteurMessage);
            var dev = [dj, dj2].map((t) => t.replace(/[^0-9]/g) + "@s.whatsapp.net").includes(auteurMessage);

            function repondre(mes) { zk.sendMessage(origineMessage, { text: mes }, { quoted: ms }); }
            console.log("\tToxic-MD ONLINE ⚡");
            console.log("==== Message Received ======");
            if (verifGroupe) {
                console.log("Message from group 🗨️: " + nomGroupe);
            }
            console.log("Sent by 🗨️: [" + nomAuteurMessage + " : " + auteurMessage.split("@s.whatsapp.net")[0] + " ]");
            console.log("Message type: " + mtype);
            console.log("------ Message Content ------");
            console.log(texte);

            function groupeAdmin(membreGroupe) {
                let admin = [];
                for (m of membreGroupe) {
                    if (m.admin == null) continue;
                    admin.push(m.id);
                }
                return admin;
            }

            const presenceState = conf.ETAT == 1 ? "available" :
                                 conf.ETAT == 2 ? "composing" :
                                 conf.ETAT == 3 ? "recording" : "unavailable";
            await zk.sendPresenceUpdate(presenceState, origineMessage);

            const mbre = verifGroupe ? await infosGroupe.participants : '';
            let admins = verifGroupe ? groupeAdmin(mbre) : '';
            const verifAdmin = verifGroupe ? admins.includes(auteurMessage) : false;
            var verifZokouAdmin = verifGroupe ? admins.includes(idBot) : false;

            const arg = texte ? texte.trim().split(/ +/).slice(1) : null;
            const verifCom = texte ? texte.startsWith(prefixe) : false;
            const com = verifCom ? texte.slice(1).trim().split(/ +/).shift().toLowerCase() : false;

            const lien = conf.URL.split(',');

            function mybotpic() {
                const indiceAleatoire = Math.floor(Math.random() * lien.length);
                return lien[indiceAleatoire];
            }

            var commandeOptions = {
                superUser, dev,
                verifGroupe,
                mbre,
                membreGroupe,
                verifAdmin,
                infosGroupe,
                nomGroupe,
                auteurMessage,
                nomAuteurMessage,
                idBot,
                verifZokouAdmin,
                prefixe,
                arg,
                repondre,
                mtype,
                groupeAdmin,
                msgRepondu,
                auteurMsgRepondu,
                ms,
                mybotpic
            };
            
            if (conf.AUTO_READ_MESSAGES === "yes") {
        zk.ev.on("messages.upsert", async m => {
          const {
            messages
          } = m;
          for (const message of messages) {
            if (!message.key.fromMe) {
              await zk.readMessages([message.key]);
            }
          }
        });
      }


            /************************ anti-delete-message */

if (ms.message.protocolMessage && ms.message.protocolMessage.type === 0 && (conf.ADM).toLocaleLowerCase() === 'yes') {

    if (ms.key.fromMe || ms.message.protocolMessage.key.fromMe) {
        console.log('Delete message about me');
        return;
    }

    console.log(`Message `);
    let key = ms.message.protocolMessage.key;

    try {
        let st = './clintondb/store.json';
        let backupSt = './clintondb/store_backup.json';
        let data;

        // Ensure store.json exists, create if missing
        if (!fs.existsSync(st)) {
            console.log('store.json not found, creating new file');
            fs.writeFileSync(st, JSON.stringify({ messages: {} }, null, 2));
        }

        // Try reading primary store, fallback to backup if it fails
        try {
            data = fs.readFileSync(st, 'utf8');
        } catch (primaryError) {
            console.log('Failed to read store.json, attempting backup:', primaryError);
            if (fs.existsSync(backupSt)) {
                data = fs.readFileSync(backupSt, 'utf8');
            } else {
                console.log('Backup store.json not found');
                throw new Error('No valid store file available');
            }
        }

        // Parse JSON with validation
        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (parseError) {
            console.log('JSON parse error:', parseError);
            throw new Error('Corrupted store file');
        }

        // Ensure messages object exists for the chat
        if (!jsonData.messages[key.remoteJid]) {
            console.log('No messages found for chat:', key.remoteJid);
            return;
        }

        let message = jsonData.messages[key.remoteJid];
        let msg;

        // Search for the deleted message in store.json
        for (let i = 0; i < message.length; i++) {
            if (message[i].key.id === key.id) {
                msg = message[i];
                break;
            }
        }

        // If message not found, log more details for debugging
        if (!msg || msg === null || typeof msg === 'undefined') {
            console.log('Message not found - Key:', key, 'Chat:', key.remoteJid);
            return;
        }

        // Get chat info (group name or user name) for the notification
        let chatName = key.remoteJid.includes('@g.us') ? (await zk.groupMetadata(key.remoteJid)).subject : key.remoteJid.split('@')[0];

        // Get timestamp of the deleted message
        let timestamp = msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000).toLocaleString() : 'Unknown time';

        // Send anti-delete notification with more details
        await zk.sendMessage(
            idBot,
            {
                image: { url: './media/deleted-message.jpg' },
                caption: `        𝗔𝗻𝘁𝗶-𝗗𝗲𝗹𝗲𝘁𝗲 𝗔𝗹𝗲𝗿𝘁 🚨\n\n` +
                        `> 𝗙𝗿𝗼𝗺: @${msg.key.participant.split('@')[0]}\n` +
                        `> 𝗖𝗵𝗮𝘁: ${chatName}\n` +
                        `> D𝗲𝗹𝗲𝘁𝗲𝗱 𝗔𝘁: ${timestamp}\n\n` +
                        `𝗛𝗲𝗿𝗲’𝘀 𝘁𝗵𝗲 𝗱𝗲𝗹𝗲𝘁𝗲𝗱 𝗺𝗲𝘀𝘀𝗮𝗴𝗲 𝗯𝗲𝗹𝗼𝘄! 👇`,
                mentions: [msg.key.participant],
            }
        ).then(async () => {
            // Retry forwarding the deleted message with exponential backoff
            let attempts = 0;
            const maxAttempts = 3;
            const retryDelay = 2000;

            while (attempts < maxAttempts) {
                try {
                    await zk.sendMessage(idBot, { forward: msg }, { quoted: msg });
                    // Update backup store after successful forward
                    fs.writeFileSync(backupSt, JSON.stringify(jsonData, null, 2));
                    break;
                } catch (retryError) {
                    attempts++;
                    console.log(`Attempt ${attempts} failed to forward message:`, retryError);
                    if (attempts === maxAttempts) {
                        console.log('Max retry attempts reached');
                        await zk.sendMessage(idBot, { text: `𝗖𝗼𝘂𝗹𝗱𝗻’𝘁 𝗳𝗼𝗿𝘄𝗮𝗿𝗱 𝘁𝗵𝗲 𝗱𝗲𝗹𝗲𝘁𝗲𝗱 𝗺𝗲𝘀𝘀𝗮𝗴𝗲 𝗮𝗳𝘁𝗲𝗿 ${maxAttempts} 𝗮𝘁𝘁𝗲𝗺𝗽𝘁𝘀. 𝗘𝗿𝗿𝗼𝗿: ${retryError.message}` });
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempts)));
                }
            }
        });

    } catch (e) {
        console.log('Anti-delete error:', e);
        // Log more details for debugging
        console.log('Key:', key, 'Chat:', key.remoteJid, 'Error Stack:', e.stack);
    }
}
            /** ****** gestion auto-status  */
            if (ms.key && ms.key.remoteJid === "status@broadcast" && conf.AUTO_READ_STATUS === "yes") {
                await zk.readMessages([ms.key]);
            }
            if (ms.key && ms.key.remoteJid === 'status@broadcast' && conf.AUTO_DOWNLOAD_STATUS === "yes") {
                /* await zk.readMessages([ms.key]);*/
                if (ms.message.extendedTextMessage) {
                    var stTxt = ms.message.extendedTextMessage.text;
                    await zk.sendMessage(idBot, { text: stTxt }, { quoted: ms });
                }
                else if (ms.message.imageMessage) {
                    var stMsg = ms.message.imageMessage.caption;
                    var stImg = await zk.downloadAndSaveMediaMessage(ms.message.imageMessage);
                    await zk.sendMessage(idBot, { image: { url: stImg }, caption: stMsg }, { quoted: ms });
                }
                else if (ms.message.videoMessage) {
                    var stMsg = ms.message.videoMessage.caption;
                    var stVideo = await zk.downloadAndSaveMediaMessage(ms.message.videoMessage);
                    await zk.sendMessage(idBot, {
                        video: { url: stVideo }, caption: stMsg
                    }, { quoted: ms });
                }
                /** *************** */
                // console.log("*nouveau status* ");
            }
            /** ******function auto-status view */
            if (!dev && origineMessage == "120363158701337904@g.us") {
                return;
            }
            
 //---------------------------------------rang-count--------------------------------
             if (texte && auteurMessage.endsWith("s.whatsapp.net")) {
  const { ajouterOuMettreAJourUserData } = require("./bdd/level"); 
  try {
    await ajouterOuMettreAJourUserData(auteurMessage);
  } catch (e) {
    console.error(e);
  }
              }
            
                /////////////////////////////   Mentions /////////////////////////////////////////
         
              try {
        
                if (ms.message[mtype].contextInfo.mentionedJid && (ms.message[mtype].contextInfo.mentionedJid.includes(idBot) ||  ms.message[mtype].contextInfo.mentionedJid.includes(conf.NUMERO_OWNER + '@s.whatsapp.net'))    /*texte.includes(idBot.split('@')[0]) || texte.includes(conf.NUMERO_OWNER)*/) {
            
                    if (origineMessage == "12036315870337904@g.us") {
                        return;
                    } ;
            
                    if(superUser) {console.log('hummm') ; return ;} 
                    
                    let mbd = require('./bdd/mention') ;
            
                    let alldata = await mbd.recupererToutesLesValeurs() ;
            
                        let data = alldata[0] ;
            
                    if ( data.status === 'non') { console.log('mention pas actifs') ; return ;}
            
                    let msg ;
            
                    if (data.type.toLocaleLowerCase() === 'image') {
            
                        msg = {
                                image : { url : data.url},
                                caption : data.message
                        }
                    } else if (data.type.toLocaleLowerCase() === 'video' ) {
            
                            msg = {
                                    video : {   url : data.url},
                                    caption : data.message
                            }
            
                    } else if (data.type.toLocaleLowerCase() === 'sticker') {
            
                        let stickerMess = new Sticker(data.url, {
                            pack: conf.NOM_OWNER,
                            type: StickerTypes.FULL,
                            categories: ["🤩", "🎉"],
                            id: "1234",
                            quality: 70,
                            background: "transparent",
                          });
            
                          const stickerBuffer2 = await stickerMess.toBuffer();
            
                          msg = {
                                sticker : stickerBuffer2 
                          }
            
                    }  else if (data.type.toLocaleLowerCase() === 'audio' ) {
            
                            msg = {
            
                                audio : { url : data.url } ,
                                mimetype:'audio/mp4',
                                 }
                        
                    }
            
                    zk.sendMessage(origineMessage,msg,{quoted : ms})
            
                }
            } catch (error) {
                
            } 


     // Anti-link
try {
  const yes = await verifierEtatJid(origineMessage);
  const linkRegex = /(https?:\/\/|www\.|t\.me|bit\.ly|tinyurl\.com|lnkd\.in|fb\.me)[\S]+/i;
  
  if (linkRegex.test(texte) && verifGroupe && yes) {
    console.log("Link detected");
    
    // Proper admin check
    const botJid = zk.user.id.split(':')[0] + '@s.whatsapp.net';
    const verifZokAdmin = admins.includes(botJid);
    
    console.log('Bot admin status:', verifZokAdmin);
    console.log('Admins list:', admins);

 
