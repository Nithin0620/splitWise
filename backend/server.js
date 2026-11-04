require('express-async-errors');
if (process.env.CF_WORKER !== '1') {
  require('dotenv').config();
}

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { disconnectDB } = connectDB;
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const expenseRoutes = require('./routes/expenses');
const settlementRoutes = require('./routes/settlements');
const inviteRoutes = require('./routes/invites');
const realtimeRoutes = require('./routes/realtime');
const currencyRoutes = require('./routes/currencies');
const notificationRoutes = require('./routes/notifications');

// Passport config
require('./config/passport');

const app = express();
const server = http.createServer(app);

// Respect proxy headers (Koyeb, Render, Fly, Cloudflare) for client IPs and
// secure-cookie detection.
app.set('trust proxy', 1);

// Cloudflare Workers cannot host Socket.IO; it uses a no-op emitter there.
const isWorker = process.env.CF_WORKER === '1';

// Middleware
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
if (!isWorker) app.use(morgan('dev'));
app.use(cookieParser());

// Minimal body parser. Express's body-parser pulls in iconv-lite, whose
// Node stream extension crashes in the Workers runtime.
const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        reject(Object.assign(new Error('Request body too large'), { status: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

app.use(async (req, res, next) => {
  const type = req.headers['content-type'] || '';
  const isJson = type.includes('application/json');
  const isForm = type.includes('application/x-www-form-urlencoded');

  if (!isJson && !isForm) return next();

  try {
    const raw = await readBody(req);
    if (!raw) {
      req.body = {};
    } else if (isJson) {
      try {
        req.body = JSON.parse(raw);
      } catch {
        return res.status(400).json({ message: 'Invalid JSON payload' });
      }
    } else {
      req.body = Object.fromEntries(new URLSearchParams(raw));
    }
    next();
  } catch (err) {
    next(err);
  }
});
app.use(passport.initialize());

// Make sure MongoDB is connected before handling API requests.
app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS' || req.path === '/api/health') {
    return next();
  }
  try {
    await connectDB();
  } catch (err) {
    return next(err);
  }

  if (!isWorker) return next();

  // Workers cannot reuse I/O objects (MongoDB sockets) across requests.
  // Close the connection before the response is sent.
  let released = false;
  const release = async () => {
    if (released) return;
    released = true;
    try {
      await disconnectDB();
    } catch (err) {
      console.error('MongoDB disconnect error:', err.message);
    }
  };

  const originalEnd = res.end;
  res.end = function (...args) {
    release().finally(() => originalEnd.apply(this, args));
    return this;
  };

  res.on('close', () => {
    if (!res.writableEnded) release();
  });

  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] || 'unknown';
  res.json({
    status: dbState === 'connected' || dbState === 'connecting' ? 'ok' : 'degraded',
    db: dbState,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Unknown API routes return JSON instead of the HTML default.
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use(errorHandler);

// Local Node.js server only. Workers use httpServerHandler(server) instead.
if (!isWorker) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  // Generate due recurring expenses once an hour.
  const { startRecurringScheduler, stopRecurringScheduler } = require('./utils/recurring');
  startRecurringScheduler();

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received — shutting down`);

    stopRecurringScheduler();
    const force = setTimeout(() => process.exit(1), 10_000);
    if (force.unref) force.unref();

    server.close(async () => {
      try {
        await disconnectDB();
        console.log('Shutdown complete');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err.message);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown('uncaughtException');
  });
}

module.exports = { app, server };
