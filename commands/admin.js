const database = require('../utils/database');
const logger = require('../utils/logger');
const config = require('../config/config');

module.exports = {
  name: 'admin',
  aliases: ['ban', 'kick', 'mute', 'warn'],
  description: 'Commandes d\'administration du groupe',
  usage: '.ban @user, .kick @user, .warn @user',
  isAdmin: true,
  
  async execute(message, sock, args) {
    try {
      const action = args[0]?.toLowerCase();
      
      if (!action) {
        return await showAdminMenu(message, sock);
      }

      // Vérifier les droits admin
      const isAdmin = await checkIsAdmin(message, sock);
      if (!isAdmin) {
        return await sock.sendMessage(message.key.remoteJid, {
          text: config.messages.notAdmin
        });
      }

      switch(action) {
        case 'ban':
          await banUser(message, sock, args.slice(1));
          break;
        case 'kick':
          await kickUser(message, sock, args.slice(1));
          break;
        case 'mute':
          await muteUser(message, sock, args.slice(1));
          break;
        case 'warn':
          await warnUser(message, sock, args.slice(1));
          break;
        case 'warnings':
          await getWarnings(message, sock, args.slice(1));
          break;
        default:
          await showAdminMenu(message, sock);
      }
    } catch (error) {
      logger.error('Erreur admin:', error);
      await sock.sendMessage(message.key.remoteJid, {
        text: `❌ Erreur: ${error.message}`
      });
    }
  }
};

async function showAdminMenu(message, sock) {
  const menu = `
👮‍♂️ *Menu Administration*

╔════════════════════════════════════╗
.ban @user - Bannir un utilisateur
.kick @user - Expulser un utilisateur
.mute @user [minutes] - Rendre muet
.warn @user [raison] - Avertir
.warnings @user - Voir les avertissements
.antilink on/off - Bloquer les liens
.antibadword on/off - Bloquer les insultes
╚════════════════════════════════════╝

Exemple: .ban @jean Spam
`;
  await sock.sendMessage(message.key.remoteJid, { text: menu });
}

async function checkIsAdmin(message, sock) {
  try {
    const groupMetadata = await sock.groupMetadata(message.key.remoteJid);
    const senderJid = message.key.participant;
    
    const senderMember = groupMetadata.participants.find(p => p.id === senderJid);
    return senderMember?.admin !== null;
  } catch (error) {
    logger.error('Erreur vérification admin:', error);
    return false;
  }
}

async function banUser(message, sock, args) {
  try {
    if (!args[0]) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: '❌ Veuillez mentionner un utilisateur!\n\nUsage: .ban @user'
      });
    }

    const userId = args[0].replace(/[@\D]/g, '') + '@s.whatsapp.net';
    const reason = args.slice(1).join(' ') || 'Pas de raison';

    // Enregistrer le ban en base de données
    await database.addUser(userId, 'Banned');

    await sock.sendMessage(message.key.remoteJid, {
      text: `✅ ${args[0]} a été banni!\n\nRaison: ${reason}`
    });

    logger.info(`Utilisateur banni: ${userId}`);
  } catch (error) {
    throw error;
  }
}

async function kickUser(message, sock, args) {
  try {
    if (!args[0]) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: '❌ Veuillez mentionner un utilisateur!\n\nUsage: .kick @user'
      });
    }

    const userId = args[0].replace(/[@\D]/g, '') + '@s.whatsapp.net';
    
    await sock.groupParticipantsUpdate(message.key.remoteJid, [userId], 'remove');
    
    await sock.sendMessage(message.key.remoteJid, {
      text: `✅ ${args[0]} a été expulsé du groupe!`
    });
  } catch (error) {
    throw error;
  }
}

async function muteUser(message, sock, args) {
  try {
    if (!args[0]) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: '❌ Utilisation: .mute @user [minutes]'
      });
    }

    const minutes = parseInt(args[1]) || 1;
    await sock.sendMessage(message.key.remoteJid, {
      text: `🔇 ${args[0]} est rendu muet pour ${minutes} minute(s)!`
    });
  } catch (error) {
    throw error;
  }
}

async function warnUser(message, sock, args) {
  try {
    if (!args[0]) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: '❌ Utilisation: .warn @user [raison]'
      });
    }

    const userId = args[0].replace(/[@\D]/g, '') + '@s.whatsapp.net';
    const reason = args.slice(1).join(' ') || 'Pas de raison';

    await database.addWarning(userId, message.key.remoteJid, reason);

    await sock.sendMessage(message.key.remoteJid, {
      text: `⚠️ ${args[0]} a reçu un avertissement!\n\nRaison: ${reason}`
    });
  } catch (error) {
    throw error;
  }
}

async function getWarnings(message, sock, args) {
  try {
    if (!args[0]) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: '❌ Utilisation: .warnings @user'
      });
    }

    const userId = args[0].replace(/[@\D]/g, '') + '@s.whatsapp.net';
    const warnings = await database.getWarnings(userId, message.key.remoteJid);

    let warningsText = `⚠️ *Avertissements de ${args[0]}:*\n\n`;
    if (warnings.length === 0) {
      warningsText += 'Aucun avertissement';
    } else {
      warnings.forEach((w, i) => {
        warningsText += `${i + 1}. ${w.reason}\n   (${new Date(w.createdAt).toLocaleDateString()})\n\n`;
      });
    }

    await sock.sendMessage(message.key.remoteJid, { text: warningsText });
  } catch (error) {
    throw error;
  }
}
