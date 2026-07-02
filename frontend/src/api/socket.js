import { io } from 'socket.io-client';

export function createSocket() {
  return io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
    transports: ['websocket'],
    autoConnect: true
  });
}
