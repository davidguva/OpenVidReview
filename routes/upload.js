// Import required modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../db/sqlite');
const ffmpeg = require('fluent-ffmpeg');
const {getDirFromConfig} = require("../util/paths");

const router = express.Router();

// Custom storage engine for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = getDirFromConfig('./public/videos')
        cb(null, uploadPath);
    },
    filename: async (req, file, cb) => {
        const uploadPath = getDirFromConfig('./public/videos');
        let filename = file.originalname;
        let filePath = path.join(uploadPath, filename);

        try {
            let fileExists = true;
            let counter = 1;

            // Check if file already exists and modify filename if necessary
            while (fileExists) {
                try {
                    await fs.access(filePath);
                    const fileExt = path.extname(file.originalname);
                    const fileNameWithoutExt = path.basename(file.originalname, fileExt);
                    filename = `${fileNameWithoutExt}_${counter}${fileExt}`;
                    filePath = path.join(uploadPath, filename);
                    counter++;
                } catch (err) {
                    fileExists = false;
                }
            }

            cb(null, filename);
        } catch (err) {
            cb(err);
        }
    },
});

const upload = multer({ storage }).single('file');

// Middleware to check if the review name already exists
async function checkReviewName(req, res, next) {
    const { name } = req.body;
    try {
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT reviewName FROM reviews WHERE reviewName = ?', [name], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (row) {
            return res.status(400).send({ message: 'Review name already exists.' });
        }
        next();
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).send('Database error.');
    }
}

// Route to check if the review name already exists
router.post('/checkReviewName', checkReviewName, (req, res) => {
    res.status(200).send({ message: 'Review name is available.' });
});

// Test route to verify connection
router.get('/test', (req, res) => {
    res.status(200).send({ message: 'Test route works!' });
});

// Simplified upload route to handle file upload
router.post('/', (req, res) => {
    console.log('Upload route hit');
    upload(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(500).send({ message: 'Error uploading file.' });
        }

        const file = req.file;
        const { name, password } = req.body;
        console.log(`File: ${file}, Name: ${name}, Password: ${password}`);
        if (!file) {
            return res.status(400).send({ message: 'No file uploaded.' });
        }

        const filePath = path.resolve(getDirFromConfig('./public/videos'), file.filename);
        console.log(filePath);

        try {
            // Analyze the uploaded video file using ffmpeg
            ffmpeg.ffprobe(filePath, async (err, metadata) => {
                if (err) {
                    console.error('Error probing video file:', err);
                    await fs.unlink(filePath); // Delete the file
                    return res.status(500).send({ message: 'Error analyzing video file.' });
                }

                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                const frameRate = videoStream ? eval(videoStream.r_frame_rate) : null;

                console.log('Frame Rate:', frameRate);

                // Insert video details into the database
                db.run(
                    "INSERT INTO reviews (videoUrl, reviewName, password, frameRate) VALUES (?, ?, ?, ?)",
                    [file.filename, name, password, frameRate],
                    async function (err) {
                        if (err) {
                            console.error('Database error:', err);
                            await fs.unlink(filePath); // Delete the file
                            return res.status(500).send({ message: 'Database error.' });
                        }

                        // Emit upload progress using socket.io
                        // io.emit('uploadProgress', { progress: 100, status: 'File uploaded' });

                        res.status(200).json({ 
                            message: 'File uploaded successfully.', 
                            fileName: file.filename, 
                            name, 
                            frameRate 
                        });
                    }
                );
            });
        } catch (error) {
            console.error('Error analyzing video file:', error);
            await fs.unlink(filePath); // Delete the file
            res.status(500).send({ message: 'Error analyzing video file.' });
        }
    });
});

module.exports = router;
