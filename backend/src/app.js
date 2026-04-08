// ============================================
// Express Application Setup
// ============================================
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const routes = require('./routes');
const {
  corsOptions,
  generalLimiter,
  helmetConfig,
  sanitizeInput,
  hpp,
} = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { env } = require('./config/env');

const app = express();

// ─── Security Middleware ─────────────────────
app.use(helmetConfig);
app.use(corsOptions);
app.use(hpp);

// ─── Rate Limiting ───────────────────────────
app.use('/api/', generalLimiter);

// ─── Parsing & Logging ──────────────────────
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Request sanitization ────────────────────
app.use(sanitizeInput);

// ─── HTTP Request Logging ────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Disable X-Powered-By ───────────────────
app.disable('x-powered-by');

// ─── API Routes ──────────────────────────────
app.use('/api/v1', routes);

// ─── Error Handling ──────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
