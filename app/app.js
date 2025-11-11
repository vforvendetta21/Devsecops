// app/app.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Insecure secret (for demo)
const APP_SECRET = process.env.APP_SECRET || "default_secret";

// In-memory DB (demo)
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
  db.run("INSERT INTO users (username,password) VALUES ('alice','password123')");
});

// Home
app.get('/', (req, res) => {
  res.render('index', { secret: APP_SECRET });
});

// Reflected XSS demo: shows query param 'q' without escaping
app.get('/search', (req, res) => {
  const q = req.query.q || '';
  // deliberate insecure: render q directly
  res.send(`<h1>Search results for: ${q}</h1><p>Nothing found.</p>`);
});

// Login vulnerable to SQL injection (string concatenation)
app.post('/login', (req, res) => {
  const user = req.body.username;
  const pass = req.body.password;
  // INSECURE: concatenation => SQLi
  const sql = `SELECT * FROM users WHERE username = '${user}' AND password = '${pass}'`;
  db.get(sql, (err, row) => {
    if (err) return res.status(500).send("DB error");
    if (row) return res.send(`Welcome ${row.username}`);
    res.status(401).send('Invalid credentials');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`App listening on ${PORT}`));
