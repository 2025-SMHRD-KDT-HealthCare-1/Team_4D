# BackEnd

## Socket.IO (minimal integration)

This backend keeps the existing Express API on port `3000` and adds Socket.IO on the same HTTP server.

### Environment

- `PORT=3000`
- `CORS_ORIGIN=http://localhost:5173,http://localhost:3001`
- `SOCKET_ORIGINS=http://localhost:5173` (optional, comma-separated)

### Run

```bash
npm run dev
```

### Client quick test

```bash
npm i socket.io-client
```

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('connected', socket.id);
  socket.emit('join', { userId: 7 });
  socket.emit('ping', { hello: 'world' });
});

socket.on('pong', (data) => console.log('pong', data));
socket.on('join:ok', (data) => console.log('joined', data));
socket.on('alert', (payload) => console.log('alert', payload));
```

### Server-side emit example

```js
const { getIO } = require('./socket');

getIO().to('user:7').emit('alert', {
  type: 'FALL',
  title: 'Fall detected',
});
```

`ping/pong` and `join(userId -> room user:{userId})` are enabled by default.
