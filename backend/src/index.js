require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./db');
const authRouter    = require('./routes/auth');
const roomsRouter   = require('./routes/rooms');
const queueRouter   = require('./routes/queue');
const spotifyRouter = require('./routes/spotify');
const transferRouter = require('./routes/transfer');
const errorHandler   = require('./middleware/errorHandler');
const { initSocket } = require('./sockets/roomSocket');

const app    = express();
const server = http.createServer(app);
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: FRONTEND, credentials: true },
});

// --- Global Middleware ---
app.use(helmet());
app.use(cors({ origin: FRONTEND, credentials: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true }));

// --- Health ---
app.get('/ping', (_req, res) => res.json({ message: 'pong', ts: Date.now() }));

// --- REST Routes ---
app.use('/auth',        authRouter);
app.use('/api/rooms',   roomsRouter);
app.use('/api/rooms',   queueRouter);
app.use('/api/spotify',   spotifyRouter);
app.use('/api/transfer',  transferRouter);

// --- Global Error Handler ---
app.use(errorHandler);

// --- WebSocket ---
initSocket(io);

// --- Start ---
const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => server.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`)))
  .catch(err => { console.error('DB connection failed:', err); process.exit(1); });
