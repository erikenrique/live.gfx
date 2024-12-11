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
const port = 5000;
// const { ensureAuthenticated } = require('./app/controllers/authController'); // bring back on public launch / wanting to not bypassAuth

require('./config/passport')(passport); // Passport configuration
require('dotenv').config();

const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT}`; // Default for local testing
app.set('publicBaseUrl', publicBaseUrl); // Attach to the app for reuse

const Scene = require('./app/models/Scene');
const Element = require('./app/models/Element');


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


const ensureAuthenticated = (req, res, next) => {
    req.user = { _id: 'fakeUserId123', username: 'testUser123' }; // Mock user
    next();
};

// Test Authentication Route
app.get('/test-auth', ensureAuthenticated, (req, res) => {
    res.send(`Hello, authenticated user! User ID: ${req.user._id}`);
});

// Control Room Route
app.get('/control/:sceneId', async (req, res) => {
    try {
        const scene = await Scene.findById(req.params.sceneId).populate('elements');
        if (!scene) {
            return res.status(404).send('Scene not found');
        }

        const localBaseUrl = `http://${req.hostname}:${port}`; // Dynamic local base URL
        res.render('controlRoom', {
            scene,
            elements: scene.elements,
            projectId: scene.projectId,
            publicBaseUrl: app.get('publicBaseUrl'), // Admin base URL
            localBaseUrl, // Local base URL
            isEditing: false,
            hostname: req.hostname,
            port: port
        });
    } catch (error) {
        console.error('Error loading control room:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Preview Route
app.get('/preview/:sceneId', async (req, res) => {
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
app.get('/output/:sceneId', async (req, res) => {
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

// Handle Preview Toggle
app.post('/project/:projectId/scene/:sceneId/elements/:id/preview-toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const element = await Element.findById(id);

        if (!element) return res.status(404).json({ error: 'Element not found' });

        element.state = element.state === 'preview on' ? 'preview off' : 'preview on';
        await element.save();

        res.json({ message: 'Element preview toggled', element });
        console.log(`Preview state toggled for element: ${id}`);
    } catch (error) {
        console.error('Error toggling preview state:', error);
        res.status(500).json({ error: 'Error toggling preview state' });
    }
});

// Handle Run Preview
app.post('/project/:projectId/scene/:sceneId/elements/run-preview', async (req, res) => {
    try {
        const { sceneId } = req.params;
        const scene = await Scene.findById(sceneId).populate('elements');

        if (!scene) return res.status(404).json({ error: 'Scene not found' });

        const elements = scene.elements.filter(el => el.state === 'preview on');
        elements.forEach(el => (el.state = 'on'));
        await Promise.all(elements.map(el => el.save()));

        res.json({ message: 'Preview changes applied' });
        console.log(`Preview changes applied for scene: ${sceneId}`);
    } catch (error) {
        console.error('Error running preview:', error);
        res.status(500).json({ error: 'Error running preview' });
    }
});

// Handle Z-Index Changes
app.put('/project/:projectId/scene/:sceneId/elements/:id/z-up', async (req, res) => {
    try {
        const { id } = req.params;
        const element = await Element.findById(id);

        if (!element) return res.status(404).json({ error: 'Element not found' });

        element.zIndex += 1;
        await element.save();

        res.json({ message: 'Z-index increased', element });
        console.log(`Z-index increased for element: ${id}`);
    } catch (error) {
        console.error('Error increasing z-index:', error);
        res.status(500).json({ error: 'Error increasing z-index' });
    }
});

app.put('/project/:projectId/scene/:sceneId/elements/:id/z-down', async (req, res) => {
    try {
        const { id } = req.params;
        const element = await Element.findById(id);

        if (!element) return res.status(404).json({ error: 'Element not found' });

        element.zIndex -= 1;
        await element.save();

        res.json({ message: 'Z-index decreased', element });
        console.log(`Z-index decreased for element: ${id}`);
    } catch (error) {
        console.error('Error decreasing z-index:', error);
        res.status(500).json({ error: 'Error decreasing z-index' });
    }
});

// Handle Element Deletion
app.delete('/project/:projectId/scene/:sceneId/elements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const element = await Element.findByIdAndDelete(id);

        if (!element) return res.status(404).json({ error: 'Element not found' });

        res.json({ message: 'Element deleted', element });
        console.log(`Element deleted: ${id}`);
    } catch (error) {
        console.error('Error deleting element:', error);
        res.status(500).json({ error: 'Error deleting element' });
    }
});


// WebSocket Events
io.on('connection', (socket) => {
    console.log(`Local Socket.IO user connected: ${socket.id} - ORIGIN: ${socket.handshake.headers.referer}`);
    
    socket.onAny((event, ...args) => {
        console.log(`Event received: ${event}`, args);
    });


    socket.on('elementPreviewStateChanged', (data) => {
        console.log(`Element preview state changed (local):`, data);
        // Emit to all connected clients
        io.emit('elementPreviewStateChanged', data);
        console.log('broadcasted that')
    });

    socket.on('disconnect', () => {
        console.log(`Local Socket.IO user disconnected: ${socket.id}`);
    });
});


// Start the Local Server
const localIp = getLocalNetworkIp();
server.listen(port, () => {
    console.log(`Local server running at http://${localIp}:${port}`);
});
