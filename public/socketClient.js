const socket = io('http://localhost:7777', {
    auth: {
        token: document.cookie.split('=')[1], // Assuming JWT is stored in a cookie
    },
});

socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

socket.on('elementUpdated', (data) => {
    console.log('Element updated:', data);
    // Handle updates in the UI
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
});
