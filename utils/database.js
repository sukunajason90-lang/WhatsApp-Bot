const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config/config');
const logger = require('./logger');

const dbPath = config.databasePath;

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Erreur de connexion à la base de données:', err);
      } else {
        logger.info('Base de données connectée');
        this.initializeTables();
      }
    });
  }

  initializeTables() {
    // Table pour les utilisateurs
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        warnings INTEGER DEFAULT 0,
        isBanned INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table pour les groupes
    this.db.run(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT,
        antiLink INTEGER DEFAULT 0,
        antiSpam INTEGER DEFAULT 0,
        welcomeEnabled INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table pour les médias (Vault System)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS media_vault (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        chatId TEXT,
        mediaUrl TEXT,
        mediaType TEXT,
        viewedCount INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table pour les avertissements
    this.db.run(`
      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        groupId TEXT,
        reason TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Tables de base de données initialisées');
  }

  // Utilisateur
  addUser(userId, name) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)',
        [userId, name],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  // Avertissements
  addWarning(userId, groupId, reason) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO warnings (userId, groupId, reason) VALUES (?, ?, ?)',
        [userId, groupId, reason],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getWarnings(userId, groupId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM warnings WHERE userId = ? AND groupId = ? ORDER BY createdAt DESC',
        [userId, groupId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  // Médias (Vault)
  saveMedia(userId, chatId, mediaUrl, mediaType) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO media_vault (userId, chatId, mediaUrl, mediaType) VALUES (?, ?, ?, ?)',
        [userId, chatId, mediaUrl, mediaType],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  getMediaVault(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM media_vault WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  // Groupe
  addGroup(groupId, groupName) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR IGNORE INTO groups (id, name) VALUES (?, ?)',
        [groupId, groupName],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getGroup(groupId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM groups WHERE id = ?',
        [groupId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = new Database();
