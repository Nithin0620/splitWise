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

const connectDB = require('./config/db');
const { disconnectDB } = connectDB;
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const expenseRoutes = require('./routes/expenses');
const settlementRoutes = require('./routes/settlements');
const inviteRoutes = require('./routes/invites');

// Passport config
require('./config/passport');

const app = express();
const server = http.createServer(app);

// Cloudflare Workers cannot host Socket.IO; it uses a no-op emitter there.
const isWorker = process.env.CF_WORKER === '1';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
  if (req.method === 'OPTIONS' || req.path === '/api/health') return next();
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

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use(errorHandler);

// Local Node.js server only. Workers use httpServerHandler(server) instead.
if (!isWorker) {
  const { initSocket } = require('./config/socket');
  initSocket(server);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server };
