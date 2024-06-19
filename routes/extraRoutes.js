const express = require('express');
const router = express.Router();
const db = require('../db/sqlite');

router.get('/colors', (req, res) => {
    db.all('SELECT * FROM colors', (err, rows) => {
        if (err) {
            console.error('Error retrieving comments:', err.message);
            res.status(500).send(err.message);
        } else {
            res.json(rows);
        }
    });
});

module.exports = router;