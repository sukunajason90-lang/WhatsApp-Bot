const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

module.exports = {
  name: 'ai',
  aliases: ['gpt', 'ask'],
  description: 'Chat avec l\'IA (GPT)',
  usage: '.ai [votre question]',
  
  async execute(message, sock, args) {
    try {
      if (args.length === 0) {
        return await sock.sendMessage(message.key.remoteJid, {
          text: '❌ Veuillez poser une question!\n\nUsage: .ai Quelle est la capital de la France?'
        });
      }

      const question = args.join(' ');
      
      // Afficher un message d'attente
      await sock.sendMessage(message.key.remoteJid, {
        text: '⏳ Je réfléchis...'
      });

      // Utiliser l'API OpenAI si disponible, sinon utiliser une API gratuite
      let response;
      
      if (config.openaiKey) {
        response = await callOpenAI(question);
      } else {
        response = await callFreeAI(question);
      }

      await sock.sendMessage(message.key.remoteJid, {
        text: `🤖 *IA*:\n\n${response}`
      });

    } catch (error) {
      logger.error('Erreur AI:', error);
      await sock.sendMessage(message.key.remoteJid, {
        text: `❌ Erreur: ${error.message}`
      });
    }
  }
};

async function callOpenAI(question) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Tu es un assistant WhatsApp utile et amical.' },
        { role: 'user', content: question }
      ],
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${config.openaiKey}`
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    logger.error('Erreur OpenAI:', error);
    throw new Error('Impossible de contacter OpenAI');
  }
}

async function callFreeAI(question) {
  try {
    // Réponse simple sans API externe
    const genericResponse = `Je suis une version gratuite de l'IA. \n\nVotre question: ${question}\n\nVeuillez configurer une clé OpenAI pour des réponses plus précises.`;
    
    return genericResponse;
  } catch (error) {
    return 'Erreur: Impossible de contacter l\'IA. Veuillez configurer une clé OpenAI.';
  }
}
