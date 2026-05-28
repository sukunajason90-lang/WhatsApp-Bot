const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const logger = require('./utils/logger');
const config = require('./config/config');
const commandHandler = require('./utils/commandHandler');
const database = require('./utils/database');
const fs = require('fs');
const path = require('path');

// Importer les commandes
const helpCommand = require('./commands/help');
const aiCommand = require('./commands/ai');
const gamesCommand = require('./commands/games');
const musicCommand = require('./commands/music');
const videoCommand = require('./commands/video');
const stickerCommand = require('./commands/sticker');
const adminCommand = require('./commands/admin');
const mediaVaultCommand = require('./commands/media-vault');

let sock;

async function startup() {
  logger.info('Démarrage du bot WhatsApp...');

  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: logger
  });

  sock.ev.on('creds.update', saveCreds);

  // Événement de connexion
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('QR Code généré - Scannez avec votre téléphone');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        startup();
      } else {
        logger.info('Connexion fermée - Veuillez vous reconnecter');
      }
    } else if (connection === 'open') {
      logger.info('✅ Bot connecté avec succès!');
    }
  });

  // Événement de messages
  sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];

    if (!message.message) return;

    // Ignorer les messages du bot lui-même
    if (message.key.fromMe) return;

    try {
      const text = message.message?.conversation || 
                  message.message?.extendedTextMessage?.text || '';

      logger.info(`Message reçu: ${text.substring(0, 50)}`);

      // Ajouter l'utilisateur à la base de données
      const userId = message.key.participant || message.key.remoteJid;
      const pushName = message.pushName || 'Unknown';
      await database.addUser(userId, pushName);

      // Ajouter le groupe à la base de données si c'est un groupe
      if (message.key.remoteJid.includes('@g.us')) {
        const groupMetadata = await sock.groupMetadata(message.key.remoteJid);
        await database.addGroup(message.key.remoteJid, groupMetadata.subject);
      }

      // Intercepter les médias en vue unique (Vault System)
      await mediaVaultCommand.interceptViewOnceMedia(message, sock, userId);

      // Vérifier si c'est une commande
      if (!commandHandler.isCommand(text)) return;

      const parsed = commandHandler.parseCommand(text);
      if (!parsed) return;

      // Exécuter la commande
      const cmd = commandHandler.getCommand(parsed.command);
      if (cmd) {
        await cmd.execute(message, sock, parsed.fullArgs);
      } else {
        await sock.sendMessage(message.key.remoteJid, {
          text: config.messages.invalidCommand
        });
      }

    } catch (error) {
      logger.error('Erreur traitement message:', error);
      await sock.sendMessage(message.key.remoteJid, {
        text: `${config.messages.error}\n\n${error.message}`
      });
    }
  });

  // Enregistrer les commandes
  registerCommands();
}

function registerCommands() {
  logger.info('Enregistrement des commandes...');

  commandHandler.register('help', helpCommand.execute, {
    description: helpCommand.description,
    usage: helpCommand.usage
  });

  commandHandler.register('menu', helpCommand.execute, {
    description: 'Alias pour help',
    usage: '.menu'
  });

  commandHandler.register('ai', aiCommand.execute, {
    description: aiCommand.description,
    usage: aiCommand.usage
  });

  commandHandler.register('gpt', aiCommand.execute, {
    description: 'Alias pour AI',
    usage: '.gpt [question]'
  });

  commandHandler.register('games', gamesCommand.execute, {
    description: gamesCommand.description,
    usage: gamesCommand.usage
  });

  commandHandler.register('tictactoe', gamesCommand.execute, {
    description: 'Jeu Morpion vs Bot',
    usage: '.tictactoe'
  });

  commandHandler.register('trivia', gamesCommand.execute, {
    description: 'Trivia - Questions',
    usage: '.trivia'
  });

  commandHandler.register('hangman', gamesCommand.execute, {
    description: 'Jeu du Pendu',
    usage: '.hangman'
  });

  commandHandler.register('play', musicCommand.execute, {
    description: musicCommand.description,
    usage: musicCommand.usage
  });

  commandHandler.register('song', musicCommand.execute, {
    description: 'Alias pour play',
    usage: '.song [nom]'
  });

  commandHandler.register('ytmp4', videoCommand.execute, {
    description: videoCommand.description,
    usage: videoCommand.usage
  });

  commandHandler.register('youtube', videoCommand.execute, {
    description: 'Alias pour ytmp4',
    usage: '.youtube [URL]'
  });

  commandHandler.register('sticker', stickerCommand.execute, {
    description: stickerCommand.description,
    usage: stickerCommand.usage
  });

  commandHandler.register('simage', stickerCommand.execute, {
    description: 'Convertir sticker en image',
    usage: '.simage (en répondant à un sticker)'
  });

  commandHandler.register('admin', adminCommand.execute, {
    description: adminCommand.description,
    usage: adminCommand.usage,
    isAdmin: true
  });

  commandHandler.register('ban', adminCommand.execute, {
    description: 'Bannir un utilisateur',
    usage: '.ban @user [raison]',
    isAdmin: true
  });

  commandHandler.register('kick', adminCommand.execute, {
    description: 'Expulser un utilisateur',
    usage: '.kick @user',
    isAdmin: true
  });

  commandHandler.register('warn', adminCommand.execute, {
    description: 'Avertir un utilisateur',
    usage: '.warn @user [raison]',
    isAdmin: true
  });

  commandHandler.register('vv', mediaVaultCommand.execute, {
    description: mediaVaultCommand.description,
    usage: mediaVaultCommand.usage
  });

  logger.info('✅ Commandes enregistrées');
}

// Démarrer le bot
startup().catch(err => {
  logger.error('Erreur lors du démarrage:', err);
  process.exit(1);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejection non gérée:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Exception non capturée:', error);
  process.exit(1);
});
