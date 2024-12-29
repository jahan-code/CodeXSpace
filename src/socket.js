import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: Infinity,
        timeout: 10000,
        transports: ['websocket','polling'],
     
    };
    const socketUrl = process.env.REACT_APP_BACKEND_URL;
    return io(socketUrl, options);

};