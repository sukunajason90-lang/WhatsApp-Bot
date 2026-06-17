const { MessageMedia } = require('whatsapp-web.js');
const logger = require('../../utils/logger');

module.exports = {
  name: 'viewonce',
  description: 'Convertit un média en vue unique (visible une seule fois)',
  usage: '/viewonce (en répondant à un média)',
  execute: async (message, args, client) => {
    if (!message.hasQuotedMsg) {
      await message.reply('❌ Veuillez répondre à un média (photo, vidéo ou audio)');
      return;
    }

    const quotedMsg = await message.getQuotedMessage();
    if (!quotedMsg.hasMedia) {
      await message.reply('❌ Le message cité ne contient pas de média');
      return;
    }

    try {
      const media = await quotedMsg.downloadMedia();
      
      // Créer un nouveau message avec le média en vue unique
      const viewOnceMsg = new MessageMedia(
        media.mimetype, 
        media.data, 
        media.filename
      );
      
      // Envoyer le média avec la propriété viewOnce
      await client.sendMessage(message.from, viewOnceMsg, { 
        sendMediaAsDocument: false,
        sendAudioAsDocument: false,
        caption: '👁️ Vue unique - Visible une seule fois'
      });
      
      await message.reply('✅ Média convertit en vue unique!\n👁️ Le destinataire ne pourra le voir qu\'une fois');
      logger.info('Média converti en vue unique avec succès');
      
    } catch (error) {
      await message.reply(`❌ Erreur: ${error.message}\n💡 Astuce: Assurez-vous que le média est supporté`);
      logger.error(`Erreur viewonce: ${error.message}`);
    }
  }
};
