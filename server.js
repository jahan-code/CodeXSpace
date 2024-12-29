const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const path=require('path')
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('build'))
app.use((req,res,next)=>{
    res.sendFile(path.join(__dirname,'build','index.html'))
})
const userSocketMap = {};

// Function to get all connected clients in a room
function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId],
        };
    });
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Socket Connected', socket.id);

    // Handle user joining a room
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);

        // Notify existing clients about the new client
        clients.forEach(({ socketId }) => {
            if (socketId !== socket.id) {
                io.to(socketId).emit(ACTIONS.JOINED, {
                    clients,
                    username,
                    socketId: socket.id,
                });
            }
        });

        // Notify the newly joined client about the current clients
        socket.emit(ACTIONS.JOINED, {
            clients,
            username,
            socketId: socket.id,
        });
    });

    // Handle code changes in a room
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Sync code with a specific client
    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });
    console.log('Socket Connected', socket.id);
    // Handle user leaving the room via button press
    socket.on(ACTIONS.LEAVE, ({ roomId, username }) => {
        socket.leave(roomId); // Leave the room
    
        // Remove the user from the userSocketMap
        delete userSocketMap[socket.id];
    
        // Notify remaining clients in the room about the disconnection
        const clients = getAllConnectedClients(roomId);
        io.in(roomId).emit(ACTIONS.DISCONNECTED, {
            socketId: socket.id,
            username,
        });
    });
    

    // Handle automatic disconnection (like closing the tab)
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];

        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });

        // Cleanup user data from userSocketMap
        delete userSocketMap[socket.id];
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
