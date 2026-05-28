const logger = require('../utils/logger');

module.exports = {
  name: 'video',
  aliases: ['ytmp4', 'youtube'],
  description: 'Télécharge une vidéo YouTube',
  usage: '.ytmp4 [lien YouTube]',
  
  async execute(message, sock, args) {
    try {
      if (args.length === 0) {
        return await sock.sendMessage(message.key.remoteJid, {
          text: '❌ Veuillez fournir un lien YouTube!\n\nUsage: .ytmp4 [URL YouTube]'
        });
      }

      const url = args[0];

      // Valider que c'est un lien YouTube
      if (!isValidYoutubeUrl(url)) {
        return await sock.sendMessage(message.key.remoteJid, {
          text: '❌ URL YouTube invalide!'
        });
      }

      await sock.sendMessage(message.key.remoteJid, {
        text: '⏳ Téléchargement en cours...'
      });

      await sock.sendMessage(message.key.remoteJid, {
        text: '✅ Téléchargement simulé\n\n📌 Note: Pour les vrais téléchargements, intégrez ytdl-core\n\nURL: ' + url
      });

    } catch (error) {
      logger.error('Erreur vidéo:', error);
      await sock.sendMessage(message.key.remoteJid, {
        text: `❌ Erreur: ${error.message}`
      });
    }
  }
};

function isValidYoutubeUrl(url) {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
  return youtubeRegex.test(url);
}
