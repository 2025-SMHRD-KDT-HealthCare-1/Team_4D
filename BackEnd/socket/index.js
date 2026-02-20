const { Server } = require('socket.io');

let ioInstance;

function parseOrigins() {
  const defaults = ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174'];
  const extra = [];

  if (process.env.SOCKET_ORIGINS) {
    extra.push(...process.env.SOCKET_ORIGINS.split(',').map((v) => v.trim()).filter(Boolean));
  }

  if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*') {
    extra.push(...process.env.CORS_ORIGIN.split(',').map((v) => v.trim()).filter(Boolean));
  }

  return Array.from(new Set([...defaults, ...extra]));
}

function initSocket(server) {
  const origins = parseOrigins();

  ioInstance = new Server(server, {
    cors: {
      origin: origins,
      methods: ['GET', 'POST'],
      credentials: false,
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on('ping', (payload) => {
      socket.emit('pong', {
        ok: true,
        ts: new Date().toISOString(),
        payload: payload ?? null,
      });
    });

    socket.on('join', ({ userId } = {}) => {
      if (!userId) {
        socket.emit('join:error', { message: 'userId is required' });
        return;
      }

      const room = `user:${userId}`;
      socket.join(room);
      socket.emit('join:ok', { room });
      console.log(`[socket] ${socket.id} joined ${room}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log(`[socket] Socket.IO initialized (origins: ${origins.join(', ')})`);
  return ioInstance;
}

function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
}

module.exports = {
  initSocket,
  getIO,
};
