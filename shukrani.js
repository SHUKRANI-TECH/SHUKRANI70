import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import archiver from 'archiver';
import qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { makeWASocket, usePairingCode, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeInMemoryStore, useSingleFileAuthState } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Temporary data storage
let qrImage = '';
let pairingCode = '';
let sessionID = '';

// Create session folder
const sessionPath = path.join(__dirname, 'session');
await fs.ensureDir(sessionPath);

app.get('/', (req, res) => {
    res.send('✅ SHUKRANI Bot Pairing Site Active');
});

app.get('/pair', async (req, res) => {
    if (!qrImage && !pairingCode) {
        // Start Baileys connection
        const { state, saveState } = useSingleFileAuthState('./session/auth_info.json');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            printQRInTerminal: false,
            auth: state,
            generateHighQualityLinkPreview: true
        });

        sock.ev.on('connection.update', async ({ qr, pairingCode: pc }) => {
            if (qr) qrImage = await qrcode.toDataURL(qr);
            if (pc) {
                pairingCode = pc;
                sessionID = uuidv4();
            }
        });

        sock.ev.on('creds.update', saveState);

        // Delay 3s to allow QR generation
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    res.render('pair', {
        qrImage,
        pairingCode,
        sessionID
    });
});

app.get('/download/:id', async (req, res) => {
    if (req.params.id !== sessionID) return res.send('❌ Invalid session ID');

    const zipName = `session-${sessionID}.zip`;
    const outputPath = path.join(__dirname, zipName);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        res.download(outputPath, () => {
            fs.unlinkSync(outputPath); // Delete zip after sending
        });
    });

    archive.pipe(output);
    archive.directory('session/', false);
    await archive.finalize();
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
