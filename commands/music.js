const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/config');

module.exports = {
  name: 'music',
  aliases: ['play', 'song'],
  description: 'Télécharge une chanson ou un clip',
  usage: '.play [nom de la chanson]',
  
  async execute(message, sock, args) {
    try {
      if (args.length === 0) {
        return await sock.sendMessage(message.key.remoteJid, {
          text: '❌ Veuillez spécifier le nom d\'une chanson!\n\nUsage: .play [nom de la chanson]'
        });
      }

      const songName = args.join(' ');
      
      await sock.sendMessage(message.key.remoteJid, {
        text: `⏳ Recherche de "${songName}"...`
      });

      // Utiliser une API de musique gratuite
      const results = await searchMusic(songName);

      if (results.length === 0) {
        return await sock.sendMessage(message.key.remoteJid, {
          text: `❌ Aucune chanson trouvée pour "${songName}"`
        });
      }

      // Afficher les résultats
      let resultText = `🎵 *Résultats pour "${songName}":*\n\n`;
      results.slice(0, 5).forEach((result, index) => {
        resultText += `${index + 1}. ${result.title}\n   Artiste: ${result.artist}\n\n`;
      });

      resultText += `Répondez avec le numéro (1-5) pour télécharger`;

      await sock.sendMessage(message.key.remoteJid, {
        text: resultText
      });

    } catch (error) {
      logger.error('Erreur musique:', error);
      await sock.sendMessage(message.key.remoteJid, {
        text: `❌ Erreur: ${error.message}`
      });
    }
  }
};

async function searchMusic(query) {
  try {
    // Résultats fictifs de démonstration
    return [
      { title: 'Song 1 - ' + query, artist: 'Artist 1' },
      { title: 'Song 2 - ' + query, artist: 'Artist 2' },
      { title: 'Song 3 - ' + query, artist: 'Artist 3' }
    ];
  } catch (error) {
    logger.warn('API de musique indisponible, retour de résultats fictifs');
    return [];
  }
}
