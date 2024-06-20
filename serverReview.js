const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const session = require('express-session');

// Load environment variables from .env file
dotenv.config();

// Initialize express app and create HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Environment variables
const PASSWORD = process.env.PASSWORD || "password";
const SECRET = process.env.SECRET || "secret";
const PORT = process.env.PORT || 3000;
const TITLE = process.env.TITLE || "Title";

console.log(PASSWORD);

process.on('uncaughtExceptionMonitor', (err, origin) => {
    const appError = new Error(`Uncaught exception is crashing the app! :( Type: ${origin}`, {cause: err});
    console.error(appError)
});
// Middleware to pass socket.io to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Setup express-session middleware
app.use(session({
    secret: SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const commentRoutes = require('./routes/comments');
const reviewRoutes = require('./routes/reviews');
const extraRoutes = require('./routes/extraRoutes');
const fileRoutes = require('./routes/upload');

// Use routes
app.use('/comments', commentRoutes);
app.use('/reviews', reviewRoutes);
app.use('/extraRoutes', extraRoutes);
app.use('/upload', fileRoutes);

// Route to handle login
app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === PASSWORD) {
        req.session.isAuthenticated = true;
        return res.json({ message: 'Login successful' });
    }
    res.status(403).json({ message: 'Forbidden' });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Serve the admin HTML file
app.get('/admin', (req, res) => {
    if (req.session.isAuthenticated) {
        res.render('admin', { title: TITLE });
    } else {
        res.render('adminLogin', { title: TITLE });
    }
});

// Check authentication status
app.get('/status', (req, res) => {
    res.json({ isAuthenticated: req.session.isAuthenticated });
});

// Serve the main page
app.get('/', (req, res) => {
    res.render('index', { title: TITLE });
});

// Serve the review page
app.get('/review', (req, res) => {
    res.render('review', { title: TITLE });
});

// Handle socket.io connections
io.on('connection', (socket) => {
    // console.log('New client connected');
    socket.on('disconnect', () => {
        // console.log('Client disconnected');
    });
});


// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
    console.error(err);
});

