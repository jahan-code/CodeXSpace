import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: Infinity,
        timeout: 10000,
        transports: ['websocket','polling'],
     
    };

    return io('https://busy-marlene-codexspaces-79079c7e.koyeb.app', options);

};