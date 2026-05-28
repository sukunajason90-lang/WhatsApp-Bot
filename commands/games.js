const logger = require('../utils/logger');

const games = {};

module.exports = {
  name: 'games',
  aliases: ['tictactoe', 'trivia', 'hangman'],
  description: 'Mini jeux (tictactoe, trivia, hangman)',
  usage: '.tictactoe, .trivia, .hangman',
  
  async execute(message, sock, args) {
    const gameType = args[0]?.toLowerCase() || 'menu';
    
    try {
      if (gameType === 'menu' || gameType === 'help') {
        return await showGameMenu(message, sock);
      }

      const chatId = message.key.remoteJid;
      
      switch(gameType) {
        case 'tictactoe':
          await startTicTacToe(message, sock, chatId);
          break;
        case 'trivia':
          await startTrivia(message, sock, chatId);
          break;
        case 'hangman':
          await startHangman(message, sock, chatId);
          break;
        default:
          await showGameMenu(message, sock);
      }
    } catch (error) {
      logger.error('Erreur jeu:', error);
      await sock.sendMessage(message.key.remoteJid, {
        text: `❌ Erreur: ${error.message}`
      });
    }
  }
};

async function showGameMenu(message, sock) {
  const menu = `
🎮 *Menu des Jeux*

╔════════════════════════════════════╗
.tictactoe - Jeu Morpion vs Bot
.trivia - Questions de culture générale
.hangman - Pendu (devinez les mots)
╚════════════════════════════════════╝

Exemple: .tictactoe
`;
  await sock.sendMessage(message.key.remoteJid, { text: menu });
}

async function startTicTacToe(message, sock, chatId) {
  const board = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
  
  games[chatId] = {
    type: 'tictactoe',
    board: board,
    playerX: 'X',
    playerO: 'O',
    turn: 'X'
  };

  const gameBoard = `
🎮 *Morpion*

${board[0]} ${board[1]} ${board[2]}
${board[3]} ${board[4]} ${board[5]}
${board[6]} ${board[7]} ${board[8]}

C'est votre tour (X)!
Choisissez un numéro (1-9)

Exemple: .move 5
`;

  await sock.sendMessage(message.key.remoteJid, { text: gameBoard });
}

async function startTrivia(message, sock, chatId) {
  const questions = [
    { q: 'Quel est la capital de la France?', a: 'paris' },
    { q: 'En quelle année l\'homme a-t-il marché sur la Lune?', a: '1969' },
    { q: 'Quel est le plus grand océan?', a: 'pacifique' }
  ];

  const randomQ = questions[Math.floor(Math.random() * questions.length)];
  
  games[chatId] = {
    type: 'trivia',
    question: randomQ.q,
    answer: randomQ.a,
    answered: false
  };

  const triviaText = `
🧠 *Trivia Question*

${randomQ.q}

Répondez avec: .answer [votre réponse]
`;

  await sock.sendMessage(message.key.remoteJid, { text: triviaText });
}

async function startHangman(message, sock, chatId) {
  const words = ['javascript', 'whatsapp', 'botdeveloper', 'programming', 'artificial'];
  const word = words[Math.floor(Math.random() * words.length)];
  const hidden = '_'.repeat(word.length);

  games[chatId] = {
    type: 'hangman',
    word: word,
    hidden: hidden.split(''),
    guessed: [],
    mistakes: 0,
    maxMistakes: 6
  };

  const hangmanText = `
🎯 *Pendu*

Mot: ${hidden}
Erreurs: ${0}/${6}

Devinez une lettre: .guess [lettre]
`;

  await sock.sendMessage(message.key.remoteJid, { text: hangmanText });
}
