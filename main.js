const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { getRandomJoke } = require('./commands/joke');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const logger = pino();

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    logger: logger,
    printQRInTerminal: false,
  });

  // Afficher le QR code
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Code QR - Scannez avec WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      let reason = new Statuses(lastDisconnect.error)?.payload?.type;
      let shouldReconnect = reason === DisconnectReason.loggedOut ? false : true;

      if (!shouldReconnect) {
        console.log('🔌 Connexion fermée. Redémarrage du bot...');
        setTimeout(() => startBot(), 3000);
      } else {
        console.log('⚠️ Tentative de reconnexion...');
        setTimeout(() => startBot(), 3000);
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connecté avec succès!');
    }
  });

  // Sauvegarder les credentials
  sock.ev.on('creds.update', saveCreds);

  // Recevoir les messages
  sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];

    if (!message.message) return;

    const sender = message.key.remoteJid;
    const messageText = message.message.conversation || message.message.extendedTextMessage?.text || '';
    const isGroup = sender.endsWith('@g.us');

    console.log(`📨 Message de ${sender}: ${messageText}`);

    // Commandes disponibles
    if (messageText.toLowerCase() === '!blague' || messageText.toLowerCase() === '!joke') {
      try {
        const joke = await getRandomJoke();
        await sock.sendMessage(sender, { text: `😂 ${joke}` });
      } catch (error) {
        await sock.sendMessage(sender, { text: '❌ Erreur lors de la récupération de la blague!' });
      }
    }

    if (messageText.toLowerCase() === '!aide' || messageText.toLowerCase() === '!help') {
      const helpText = `
🤖 *Commandes disponibles:*
• !blague ou !joke - Recevez une blague aléatoire 😂
• !aide ou !help - Affiche cette aide
      `;
      await sock.sendMessage(sender, { text: helpText });
    }
  });
}

startBot().catch(console.error);
