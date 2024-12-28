const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://busy-marlene-codexspaces-79079c7e.koyeb.app", // Use your frontend's deployed URL
        methods: ["GET", "POST"],
    },
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => ({
        socketId,
        username: userSocketMap[socketId],
    }));
}

// Static file serving
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

io.on('connection', (socket) => {
    console.log('Socket Connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            if (socketId !== socket.id) {
                io.to(socketId).emit(ACTIONS.JOINED, { clients, username, socketId: socket.id });
            }
        });

        socket.emit(ACTIONS.JOINED, { clients, username, socketId: socket.id });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.LEAVE, ({ roomId, username }) => {
        socket.leave(roomId);
        delete userSocketMap[socket.id];

        const clients = getAllConnectedClients(roomId);
        io.in(roomId).emit(ACTIONS.DISCONNECTED, { socketId: socket.id, username });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
    });

    socket.on('error', (err) => {
        console.error('Socket Error:', err);
    });
});

server.listen(process.env.PORT || 5000, () => {
    console.log(`Server listening on port ${process.env.PORT || 5000}`);
});
