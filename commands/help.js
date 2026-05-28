const config = require('../config/config');
const commandHandler = require('../utils/commandHandler');

module.exports = {
  name: 'help',
  description: 'Affiche le menu d\'aide',
  usage: '.help ou .menu',
  
  async execute(message, sock) {
    const commands = commandHandler.getAllCommands();
    
    let helpText = `
╔════════════════════════════════════╗
   🤖 *${config.botName}*
   Prefix: *${config.prefix}*
╚════════════════════════════════════╝

📋 *Commandes disponibles:*

`;

    const categories = {
      'Général': [],
      'IA': [],
      'Jeux': [],
      'Musique & Vidéo': [],
      'Média': [],
      'Admin': []
    };

    // Catégoriser les commandes
    commands.forEach(cmd => {
      const cmdName = `${config.prefix}${cmd.name}`;
      
      if (cmd.name === 'ai' || cmd.name === 'gpt') {
        categories['IA'].push(`  ➤ ${cmdName} - ${cmd.description}`);
      } else if (['tictactoe', 'trivia', 'hangman'].includes(cmd.name)) {
        categories['Jeux'].push(`  ➤ ${cmdName} - ${cmd.description}`);
      } else if (['play', 'song', 'ytmp4'].includes(cmd.name)) {
        categories['Musique & Vidéo'].push(`  ➤ ${cmdName} - ${cmd.description}`);
      } else if (['sticker', 'simage', 'vv'].includes(cmd.name)) {
        categories['Média'].push(`  ➤ ${cmdName} - ${cmd.description}`);
      } else if (cmd.isAdmin) {
        categories['Admin'].push(`  ➤ ${cmdName} - ${cmd.description}`);
      } else {
        categories['Général'].push(`  ➤ ${cmdName} - ${cmd.description}`);
      }
    });

    // Ajouter les catégories au texte
    Object.entries(categories).forEach(([category, cmds]) => {
      if (cmds.length > 0) {
        helpText += `╔════════════════════════════════════╗\n`;
        helpText += `${category}:\n`;
        helpText += cmds.join('\n') + '\n';
        helpText += `╚════════════════════════════════════╝\n\n`;
      }
    });

    helpText += `
💡 Besoin d'aide? Tapez ${config.prefix}help [commande]
Exemple: ${config.prefix}help ai
`;

    await sock.sendMessage(message.key.remoteJid, {
      text: helpText
    });
  }
};
