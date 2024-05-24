// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Specify the file path for the SQLite database
const dbPath = path.join(__dirname, 'auth.db');

// Create a new SQLite database connection
const db = new sqlite3.Database(dbPath);

// Create the "users" table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);
});

module.exports = db;
