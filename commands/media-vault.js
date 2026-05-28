const database = require('../utils/database');
const logger = require('../utils/logger');

module.exports = {
  name: 'vv',
  aliases: ['vault', 'mediaVault'],
  description: 'Système Vault - Sauvegarde et gère les médias vue unique',
  usage: '.vv (voir les médias sauvegardés)',
  
  async execute(message, sock, args) {
    try {
      const action = args[0]?.toLowerCase() || 'view';
      const userId = message.key.participant || message.key.remoteJid;

      switch(action) {
        case 'view':
        case 'list':
          await viewVault(message, sock, userId);
          break;
        case 'save':
        case 'add':
          await saveToVault(message, sock, userId);
          break;
        case 'clear':
          await clearVault(message, sock, userId);
          break;
        default:
          await viewVault(message, sock, userId);
      }
    } catch (error) {
      logger.error('Erreur Vault:', error);
      await sock.sendMessage(message.key.remoteJid, {
        text: `❌ Erreur: ${error.message}`
      });
    }
  }
};

async function viewVault(message, sock, userId) {
  try {
    const mediaList = await database.getMediaVault(userId);

    if (mediaList.length === 0) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: '📁 *Vault Media*\n\n❌ Aucun média sauvegardé'
      });
    }

    let vaultText = `📁 *Vault Media System*\n\n`;
    vaultText += `Vous avez ${mediaList.length} média(s) sauvegardé(s):\n\n`;

    mediaList.forEach((media, index) => {
      const date = new Date(media.createdAt).toLocaleDateString('fr-FR');
      vaultText += `${index + 1}. ${media.mediaType.toUpperCase()}\n`;
      vaultText += `   📅 ${date}\n`;
      vaultText += `   👁️ Vues: ${media.viewedCount}\n\n`;
    });

    vaultText += `💡 Ces médias étaient en "vue unique" et ont été automatiquement sauvegardés.\n`;
    vaultText += `Pour envoyer un média en vue unique, utilisez la fonction native WhatsApp.`;

    await sock.sendMessage(message.key.remoteJid, { text: vaultText });
  } catch (error) {
    throw error;
  }
}

async function saveToVault(message, sock, userId) {
  try {
    // Vérifier si c'est une réponse avec un média
    let mediaMessage = null;
    let mediaType = null;

    if (message.message?.imageMessage) {
      mediaMessage = message.message.imageMessage;
      mediaType = 'image';
    } else if (message.message?.videoMessage) {
      mediaMessage = message.message.videoMessage;
      mediaType = 'video';
    } else if (message.message?.audioMessage) {
      mediaMessage = message.message.audioMessage;
      mediaType = 'audio';
    }

    if (!mediaMessage) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: '❌ Veuillez répondre à un média (image, vidéo, audio)'
      });
    }

    // Sauvegarder en base de données
    const chatId = message.key.remoteJid;
    const mediaUrl = `vault://${userId}/${Date.now()}`;

    // Sauvegarder en base de données
    const mediaId = await database.saveMedia(userId, chatId, mediaUrl, mediaType);

    await sock.sendMessage(message.key.remoteJid, {
      text: `✅ Média sauvegardé dans Vault!\n\nID: ${mediaId}\nType: ${mediaType}`
    });

    logger.info(`Média sauvegardé dans Vault: ${mediaId}`);
  } catch (error) {
    throw error;
  }
}

async function clearVault(message, sock, userId) {
  try {
    await sock.sendMessage(message.key.remoteJid, {
      text: '🗑️ Fonction de vidage du Vault bientôt disponible'
    });
  } catch (error) {
    throw error;
  }
}

// Middleware pour intercepter les médias en vue unique
async function interceptViewOnceMedia(message, sock, userId) {
  try {
    if (message.message?.viewOnceMessage) {
      const viewOnceMessage = message.message.viewOnceMessage.message;
      let mediaType = null;

      if (viewOnceMessage?.imageMessage) {
        mediaType = 'image';
      } else if (viewOnceMessage?.videoMessage) {
        mediaType = 'video';
      }

      if (mediaType) {
        const mediaUrl = `view-once://${userId}/${Date.now()}`;
        await database.saveMedia(userId, message.key.remoteJid, mediaUrl, mediaType);
        
        logger.info(`Média vue unique intercepté et sauvegardé: ${mediaType}`);
      }
    }
  } catch (error) {
    logger.error('Erreur interception médias vue unique:', error);
  }
}

module.exports.interceptViewOnceMedia = interceptViewOnceMedia;
