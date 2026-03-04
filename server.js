// SafeHerCab – Main Server
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const logger = require('./utils/logger');

const app = express();
app.set('trust proxy', 1); // Trust reverse proxy (e.g., Render) for correct IP rate limiting
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests, please try again later.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10000, message: { error: 'Too many auth attempts.' } });
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// ─── Static Files & Root Redirect ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.redirect('/auth.html');
});
app.use(express.static(path.join(__dirname, 'public')));

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/safehercab';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    logger.info('✅ MongoDB connected');
  } catch (err) {
    logger.warn('⚠️  MongoDB not available – running in demo/mock mode');
  }
};
connectDB();

// ─── Socket.io Room-Based Tracking ───────────────────────────────────────────
const activeRooms = new Map(); // bookingId → { driverSocketId, driverLastUpdate }
const adminSockets = new Set();
const driverTimeouts = new Map();

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Driver: join booking room
  socket.on('driverJoin', ({ bookingId, driverId }) => {
    socket.join(bookingId);
    activeRooms.set(bookingId, { driverSocketId: socket.id, driverId, lastUpdate: Date.now() });
    logger.info(`Driver ${driverId} joined room ${bookingId}`);
    clearDriverTimeout(bookingId);
  });

  // Rider: join booking room to receive updates
  socket.on('riderJoin', ({ bookingId }) => {
    socket.join(bookingId);
    logger.info(`Rider joined room ${bookingId}`);
  });

  // Guardian: join to watch
  socket.on('guardianJoin', ({ bookingId }) => {
    socket.join(bookingId);
  });

  // Admin: join admin room
  socket.on('adminJoin', () => {
    socket.join('admin');
    adminSockets.add(socket.id);
  });

  // Driver location update
  socket.on('locationUpdate', (data) => {
    const { bookingId, lat, lng, speed, heading } = data;
    const payload = { lat, lng, speed, heading, timestamp: Date.now() };

    // Emit only to this booking room
    io.to(bookingId).emit('locationUpdate', payload);
    io.to('admin').emit('rideLocationUpdate', { bookingId, ...payload });

    // Update last seen
    if (activeRooms.has(bookingId)) {
      activeRooms.get(bookingId).lastUpdate = Date.now();
    }
    resetDriverTimeout(bookingId, io);
  });

  // SOS broadcast
  socket.on('triggerSOS', (data) => {
    io.to(data.bookingId).emit('sosAlert', data);
    io.to('admin').emit('sosAlert', data);
    logger.warn(`🚨 SOS triggered for booking ${data.bookingId}`);
  });

  socket.on('disconnect', () => {
    adminSockets.delete(socket.id);
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

function resetDriverTimeout(bookingId, io) {
  clearDriverTimeout(bookingId);
  const timeout = setTimeout(() => {
    io.to(bookingId).emit('driverDisconnected', { bookingId, message: 'Driver location not updated for 60 seconds. Stay alert.' });
    io.to('admin').emit('driverDisconnected', { bookingId });
    logger.warn(`Driver disconnect timeout for booking ${bookingId}`);
  }, 60000);
  driverTimeouts.set(bookingId, timeout);
}

function clearDriverTimeout(bookingId) {
  if (driverTimeouts.has(bookingId)) {
    clearTimeout(driverTimeouts.get(bookingId));
    driverTimeouts.delete(bookingId);
  }
}

// Expose io to routes
app.set('io', io);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payment', require('./routes/payment'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SafeHerCab', time: new Date().toISOString() });
});

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`🌸 SafeHerCab running on http://localhost:${PORT}`);
});

module.exports = { app, io };
