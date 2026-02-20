import { io } from 'socket.io-client';

const socketBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

export const socket = io(socketBaseUrl, {
  autoConnect: true,
});
