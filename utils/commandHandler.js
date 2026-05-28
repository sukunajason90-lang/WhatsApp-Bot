const config = require('../config/config');
const logger = require('./logger');

class CommandHandler {
  constructor() {
    this.commands = new Map();
  }

  register(name, handler, options = {}) {
    this.commands.set(name, {
      handler,
      isAdmin: options.isAdmin || false,
      isOwner: options.isOwner || false,
      description: options.description || 'Pas de description',
      usage: options.usage || ''
    });
    logger.debug(`Commande enregistrée: ${name}`);
  }

  async execute(message, sock, args) {
    const commandName = args[0]?.toLowerCase();
    
    if (!commandName || !this.commands.has(commandName)) {
      return null;
    }

    const command = this.commands.get(commandName);
    
    try {
      await command.handler(message, sock, args.slice(1));
    } catch (error) {
      logger.error(`Erreur dans la commande ${commandName}:`, error);
      await sock.sendMessage(message.key.remoteJid, {
        text: `❌ Erreur: ${error.message}`
      });
    }
  }

  getCommand(name) {
    return this.commands.get(name);
  }

  getAllCommands() {
    return Array.from(this.commands.entries()).map(([name, cmd]) => ({
      name,
      ...cmd
    }));
  }

  isCommand(text) {
    return text.startsWith(config.prefix);
  }

  parseCommand(text) {
    if (!this.isCommand(text)) return null;
    
    const content = text.slice(config.prefix.length).trim();
    const parts = content.split(/\s+/);
    
    return {
      command: parts[0]?.toLowerCase(),
      args: parts.slice(1),
      fullArgs: parts
    };
  }
}

module.exports = new CommandHandler();
