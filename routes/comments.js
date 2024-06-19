// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db/sqlite');
const { body, validationResult } = require('express-validator');

// Middleware to check if user is authenticated for specific user-level access
function isAuthenticatedU(req, res, next) {
    if (req.session.isAuthenticatedU) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
}

// Route to get all comments for a specific video
router.get('/:videoId', isAuthenticatedU, (req, res) => {
    const videoId = req.params.videoId;
    db.all('SELECT * FROM comments WHERE videoId = ? ORDER BY timestamp', [videoId], (err, rows) => {
        if (err) {
            console.error('Error retrieving comments:', err.message);
            res.status(500).send(err.message);
        } else {
            res.json(rows);
        }
    });
});

// Route to create a new comment
router.post(
    '/', 
    isAuthenticatedU,
    [
        body('videoId').isNumeric().notEmpty(),
        body('text').isString().notEmpty(),
        body('timestamp').isNumeric(),
        body('username').isString().notEmpty(),
        body('colorName').isString().notEmpty(),
        body('isDone').isBoolean().notEmpty()
    ],  
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { videoId, text, timestamp, username, colorName, isDone } = req.body;
        const createdAt = new Date().toISOString();
        db.run(
            'INSERT INTO comments (videoId, text, timestamp, createdAt, username, colorName, isDone) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [videoId, text, timestamp, createdAt, username, colorName, isDone],
            function(err) {
                if (err) {
                    console.error('Error saving comment:', err.message);
                    res.status(500).send(err.message);
                } else {
                    res.json({ id: this.lastID, videoId, text, timestamp, createdAt, username, colorName });
                }
            }
        );
    }
);

// Route to update a comment's text
router.put('/:id', isAuthenticatedU,
    [
        body('text').isString().notEmpty()
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { text } = req.body;
        const id = req.params.id;
        db.run('UPDATE comments SET text = ? WHERE id = ?', [text, id], function(err) {
            if (err) {
                console.error('Error updating comment:', err.message);
                res.status(500).send(err.message);
            } else {
                res.json({ id, text });
            }
        });
    }
);

// Route to update a comment's 'isDone' status
router.put('/:id/isDone', isAuthenticatedU,
    [
        body('isDone').isInt({ min: 0, max: 1 }).notEmpty()
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { isDone } = req.body;
        const id = req.params.id;
        db.run('UPDATE comments SET isDone = ? WHERE id = ?', [isDone, id], function(err) {
            if (err) {
                console.error('Error updating comment:', err.message);
                res.status(500).send(err.message);
            } else {
                res.json({ id, isDone });
            }
        });
    }
);

// Route to delete a comment
router.delete('/:id', isAuthenticatedU, (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM comments WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting comment:', err.message);
            res.status(500).send(err.message);
        } else {
            res.json({ id });
        }
    });
});

module.exports = router;
