import { io } from 'socket.io-client';

const url = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000';

export const socket = io(url, { autoConnect: false });