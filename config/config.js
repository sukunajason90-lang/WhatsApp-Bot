require('dotenv').config();

module.exports = {
  botName: process.env.BOT_NAME || 'Canvas Bot',
  prefix: process.env.BOT_PREFIX || '.',
  ownerNumber: process.env.BOT_OWNER_NUMBER || '',
  
  // API Keys
  openaiKey: process.env.OPENAI_API_KEY || '',
  geminiKey: process.env.GEMINI_API_KEY || '',
  youtubeKey: process.env.YOUTUBE_API_KEY || '',
  spotifyId: process.env.SPOTIFY_CLIENT_ID || '',
  spotifySecret: process.env.SPOTIFY_CLIENT_SECRET || '',
  
  // Database
  databasePath: process.env.DATABASE_PATH || './database/bot.db',
  
  // Settings
  nodeEnv: process.env.NODE_ENV || 'production',
  debug: process.env.DEBUG === 'true',
  
  // Command settings
  maxWarnings: 3,
  muteTimeout: 60000, // 1 minute en ms
  
  // Messages
  messages: {
    prefix: process.env.BOT_PREFIX || '.',
    notAdmin: '❌ Vous n\'êtes pas administrateur!',
    ownerOnly: '❌ Réservé au propriétaire du bot!',
    error: '❌ Une erreur s\'est produite!',
    success: '✅ Succès!',
    notFound: '❌ Non trouvé!',
    invalidCommand: '❌ Commande invalide! Tapez `.help` pour l\'aide.',
  }
};
