const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

// Initialize Socket.IO server
const setupSocketIO = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*', // Update with your allowed origins
            methods: ['GET', 'POST'],
        },
    });

    // Middleware for JWT authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
        if (!token) {
            return next(new Error('Authentication error: Token required'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; // Attach user info to the socket
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    // Handle WebSocket connections
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.id}`);

        // Add your real-time events here
        socket.on('updateElement', (data) => {
            console.log(`User ${socket.user.id} updated element`, data);
            // Broadcast updates to other connected clients
            socket.broadcast.emit('elementUpdated', data);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.id}`);
        });
    });

    return io;
};

module.exports = setupSocketIO;
