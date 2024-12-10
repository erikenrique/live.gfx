const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const flash = require('connect-flash');
const cors = require('cors');
const os = require('os');
const http = require('http');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // Import connect-mongo for session store
const methodOverride = require('method-override');
const socketIo = require('socket.io');
const port = process.env.PORT || 7777;
require('dotenv').config();

// Function to get the local network IP
const getLocalNetworkIP = () => {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address; // Return the local network IP
            }
        }
    }
    return 'localhost'; // Fallback if no network IP found
};

const localIP = getLocalNetworkIP();
const localServerPort = process.env.LOCAL_SERVER_PORT || 5000;

// Initialize Express app
const app = express();

const allowedOrigins = [
    process.env.PUBLIC_BASE_URL,
    `http://${localIP}:${localServerPort}`,
    'http://localhost:5000',
    'http://10.0.0.165:5000'
];

// Configure CORS to allow the local server origin
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (e.g., mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'], // Explicitly allow these HTTP methods
        credentials: true, // Allow cookies and authorization headers
    })
);

// Create HTTP server to attach to WebSocket
const server = http.createServer(app);
const io = socketIo(server); // Attach Socket.IO to the HTTP server

// Make `io` available in the request object for routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Database connection
mongoose
    .connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Passport configuration
require('./config/passport')(passport); // Load Passport configuration

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



app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Set view engine (EJS for rendering pages)
app.set('view engine', 'ejs');

// Static files
app.use(express.static('public'));

// Import routes
const adminRoutes = require('./app/routes/admin'); // Admin routes for dashboard, projects, and scenes
const mainRoutes = require('./app/routes/main'); // Main routes for index, login, and signup

// Routes
app.use('/', mainRoutes);
app.use('/admin', adminRoutes);

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// Start the server
server.listen(port, () => console.log(`Server running on port ${port}`));
