const express = require('express');
const app = express();
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const os = require('os');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // Import connect-mongo for session store
const passport = require('passport'); // Import Passport
// const { ensureAuthenticated } = require('./app/controllers/authController'); // Ensure Authentication Middleware
require('./config/passport')(passport); // Passport configuration
require('dotenv').config();

const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT}`; // Default for local testing
app.set('publicBaseUrl', publicBaseUrl); // Attach to the app for reuse

const Scene = require('./app/models/Scene');
const Element = require('./app/models/Element');

const port = 5000;

// Function to get the local network IP
const getLocalNetworkIp = () => {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const config of iface) {
            if (config.family === 'IPv4' && !config.internal) {
                return config.address; // Return the first found non-internal IPv4 address
            }
        }
    }
    return 'localhost'; // Fallback to localhost if no local IP is found
};

// Create HTTP server
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB Connection
mongoose
    .connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected for localServer'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Middleware for serving static files
app.use(express.static('public'));

// Configure sessions with MongoDB session store

app.use(
    session({
        secret: process.env.SESSION_SECRET, // Change to a secure value in production
        resave: false, // Don't save session if unmodified
        saveUninitialized: false, // Don't create session until something is stored
        store: MongoStore.create({
            client: mongoose.connection.getClient(), // Use the client directly
            ttl: 14 * 24 * 60 * 60, // Session expiration in seconds (14 days)
        }).on('connected', () => console.log('Connected to MongoDB for sessions')), // Log successful connection
        cookie: {
            secure: false, // Set to true if using HTTPS
            httpOnly: true, // Prevent client-side JS access to the cookie
        },
    })
);



// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

const bypassAuth = (req, res, next) => {
    console.log('Bypassing authentication...');
    next();
};

// Test Authentication Route
app.get('/test-auth', bypassAuth, (req, res) => {
    res.send('Authentication bypassed for testing');
});

// Control Room Route
app.get('/control/:sceneId', bypassAuth, async (req, res) => {
    try {
        const scene = await Scene.findById(req.params.sceneId).populate('elements'); // Populate elements
        if (!scene) {
            return res.status(404).send('Scene not found');
        }

        res.render('controlRoom', { scene, elements: scene.elements, publicBaseUrl });
    } catch (error) {
        console.error('Error loading control room:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Preview Route
app.get('/preview/:sceneId', bypassAuth, async (req, res) => {
    try {
        const scene = await Scene.findById(req.params.sceneId).populate('elements'); // Populate elements
        if (!scene) {
            return res.status(404).send('Scene not found');
        }

        res.render('preview', { elements: scene.elements, scene, publicBaseUrl });
    } catch (error) {
        console.error('Error loading preview:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Output Route
app.get('/output/:sceneId', bypassAuth, async (req, res) => {
    try {
        const scene = await Scene.findById(req.params.sceneId).populate('elements'); // Populate elements
        if (!scene) {
            return res.status(404).send('Scene not found');
        }

        const elements = scene.elements.filter((el) => el.state === 'on'); // Filter elements for Output
        res.render('output', { elements, scene, publicBaseUrl });
    } catch (error) {
        console.error('Error loading output:', error);
        res.status(500).send('Internal Server Error');
    }
});

// WebSocket Events
io.on('connection', (socket) => {
    console.log(`Local Socket.IO user connected: ${socket.id} - ORIGIN: ${socket.handshake.headers.referer}`);
    socket.on('disconnect', () => {
        console.log(`Local Socket.IO user disconnected: ${socket.id}`);
    });
});

// Start the Local Server
const localIp = getLocalNetworkIp();
server.listen(port, () => {
    console.log(`Local server running at http://${localIp}:${port}`);
});
