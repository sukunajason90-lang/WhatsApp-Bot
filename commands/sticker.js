const Jimp = require('jimp');
const logger = require('../utils/logger');

module.exports = {
  name: 'sticker',
  aliases: ['simage'],
  description: 'Convertit une image en sticker',
  usage: '.sticker (en répondant à une image)',
  
  async execute(message, sock, args) {
    try {
      // Vérifier si c'est une réponse à un message
      if (!message.message?.imageMessage && !message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
        return await sock.sendMessage(message.key.remoteJid, {
          text: '❌ Veuillez répondre à une image!\n\nUsage: Répondez à une image avec .sticker'
        });
      }

      await sock.sendMessage(message.key.remoteJid, {
        text: '⏳ Conversion en cours...'
      });

      // Récupérer l'image
      let imageMessage = message.message?.imageMessage || 
                        message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

      if (!imageMessage) {
        return await sock.sendMessage(message.key.remoteJid, {
          text: '❌ Impossible de récupérer l\'image'
        });
      }

      // Télécharger l'image
      const buffer = await sock.downloadMediaMessage(imageMessage);

      // Convertir en sticker
      const stickerBuffer = await convertToSticker(buffer);

      // Envoyer le sticker
      await sock.sendMessage(message.key.remoteJid, {
        sticker: stickerBuffer
      });

    } catch (error) {
      logger.error('Erreur sticker:', error);
      await sock.sendMessage(message.key.remoteJid, {
        text: `❌ Erreur: ${error.message}`
      });
    }
  }
};

async function convertToSticker(imageBuffer) {
  try {
    // Lire l'image avec Jimp
    let image = await Jimp.read(imageBuffer);

    // Redimensionner à 512x512 (taille standard Whatsapp sticker)
    image.resize(512, 512, Jimp.RESIZE_BEZIER);

    // Retourner le buffer PNG
    return await image.getBuffer('image/png');
  } catch (error) {
    logger.error('Erreur conversion sticker:', error);
    // Retourner le buffer original si la conversion échoue
    return imageBuffer;
  }
}
