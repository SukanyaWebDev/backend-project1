const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;
const SECRET_KEY = 'MY_SECRET_TOKEN'; // Replace with your secret key
const db = new sqlite3.Database(':memory:'); // Using in-memory SQLite database

// Create users table with id field
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);
});

app.use(bodyParser.json());

// Signup route
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  // Check if user already exists
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    if (user) {
      return res.status(400).send('User already exists.');
    }

    // Create new user with id field
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        return res.status(500).send('Internal Server Error');
      }

      const userId = this.lastID; // Retrieve the last inserted id
      const token = jwt.sign({ id: userId, username }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ auth: true, token });
    });
  });
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Retrieve user from database
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).send('Invalid username or password.');
    }

    const token = jwt.sign({ id: user.id, username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ auth: true, token });
  });
});


// Protected route
app.get('/user', authenticateToken, (req, res) => {
    res.json({ id: req.userId, username: req.username });
  });
  

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).send('Access denied. No token provided.');
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send('Invalid token.');
    }
    req.userId = decoded.id; // Store user id in request
    req.username = decoded.username;
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
