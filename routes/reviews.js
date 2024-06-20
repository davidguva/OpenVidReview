// Import required modules
const express = require('express');
const router = express.Router();
const db = require('../db/sqlite');
const fs = require('fs');
const path = require('path');
const {getDirFromConfig} = require("../util/paths");

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
}

// Middleware to check if user is authenticated for specific user-level access
function isAuthenticatedU(req, res, next) {
    if (req.session.isAuthenticatedU) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
}

// Route to create a new review
router.post('/create', isAuthenticated, (req, res) => {
    const { reviewName, videoUrl, password } = req.body;
    
    db.run('INSERT INTO reviews (reviewName, videoUrl, password) VALUES (?, ?, ?)', [reviewName, videoUrl, password], function(err) {
        if (err) {
            console.error('Error creating review:', err.message);
            res.status(500).send(err.message);
        } else {
            res.status(200).send('Review created successfully');
        }
    });
});

// Route to get a specific review
router.post('/get', (req, res) => {
    const { reviewName, reviewPassword: password } = req.body;
    req.session.isAuthenticatedU = true;
    
    db.get('SELECT * FROM reviews WHERE reviewName = ?', [reviewName], (err, row) => {
        if (err) {
            console.error('Error retrieving review:', err.message);
            res.status(500).send(err.message);
        } else if (row) {
            if (password === row.password) {
                res.json({ videoUrl: row.videoUrl, videoId: row.id, frameRate: row.frameRate });
            } else {
                res.status(401).send('Invalid password');
            }
        } else {
            res.status(404).send('Review not found');
        }
    });
});

// Route to get all reviews
router.get('/all', isAuthenticated, (req, res) => {
    db.all('SELECT * FROM reviews', (err, rows) => {
        if (err) {
            console.error('Error retrieving reviews:', err.message);
            res.status(500).send(err.message);
        } else {
            res.json(rows);
        }
    });
});

// Route to get a specific video by ID
router.get('/video/:id', isAuthenticatedU, (req, res) => {
    const id = req.params.id;
    
    db.get('SELECT * FROM reviews WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).send('Database error.');
        }
        if (!row) {
            return res.status(404).send('Video not found.');
        }
        
        const videoUrl = `${row.videoUrl}`;
        res.status(200).json({ videoUrl });
    });
});

// Route to delete a review and its related files
router.delete('/:id', isAuthenticated, (req, res) => {
    const id = req.params.id;
    
    getFilePathById(id, (err, filePath) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        
        const proxyFilePath = path.join(path.dirname(filePath), `${path.basename(filePath, path.extname(filePath))}_PROXY${path.extname(filePath)}`);
        
        db.run('DELETE FROM reviews WHERE id = ?', [id], function (err) {
            if (err) {
                return res.status(500).send('Database error while deleting review.');
            }
            
            db.run('DELETE FROM comments WHERE videoId = ?', [id], function (err) {
                if (err) {
                    return res.status(500).send('Database error while deleting comments.');
                }
                
                fs.unlink(filePath, (err) => {
                    if (err) {
                        return res.status(500).send('File not found.');
                    }
                    
                    res.status(200).send('File, proxy file, and database entries deleted.');
                });
            });
        });
    });
});

// Route to update a review
router.put('/:id', isAuthenticated, (req, res) => {
    const reviewId = req.params.id;
    const { reviewName, password } = req.body;
    
    db.run('UPDATE reviews SET reviewName = ?, password = ? WHERE id = ?', [reviewName, password, reviewId], function(err) {
        if (err) {
            console.error('Error updating review:', err.message);
            res.status(500).send(err.message);
        } else {
            res.status(200).send('Review updated successfully');
        }
    });
});

// Helper function to get file path by review ID
function getFilePathById(id, callback) {
    db.get('SELECT videoUrl FROM reviews WHERE id = ?', [id], (err, row) => {
        if (err) {
            return callback(err);
        }
        if (!row) {
            return callback(new Error('Video not found.'));
        }
        
        const filePath = path.join(__dirname, getDirFromConfig('./public/videos'), row.videoUrl);
        callback(null, filePath);
    });
}

module.exports = router;
