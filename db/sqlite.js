const {getDirFromConfig} = require("../util/paths");
const sqlite3 = require('sqlite3').verbose();
const dbDir = getDirFromConfig('./db/comments.db');
console.log(`DB Dir: ${dbDir}`);
const db = new sqlite3.Database(dbDir);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        videoId TEXT,
        text TEXT,
        timestamp INTEGER,
        createdAt TEXT,
        username TEXT,
        color TEXT,
        colorName TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reviewName TEXT UNIQUE,
        videoUrl TEXT,
        password TEXT,
        frameRate REAL
    )`);
});

module.exports = db;
