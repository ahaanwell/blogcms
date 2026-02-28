require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes    = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const blogRoutes    = require('./routes/blogs');
const { loginLimiter } = require('./middleware/rateLimiter');
const Project = require('./models/Project');

const app = express();

// ── Security Headers ───────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────────────
// Admin panel origins from .env (always trusted)
const ADMIN_ORIGINS = (process.env.ADMIN_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: async (origin, callback) => {
    try {
      // Allow server-to-server calls (no origin header — curl, Postman, SSR)
      if (!origin) return callback(null, true);

      // Always allow admin panel
      if (ADMIN_ORIGINS.includes(origin)) return callback(null, true);

      // Check DB for project websites
      const match = await Project.findOne({ allowedOrigins: origin, isActive: true }).select('_id');
      if (match) return callback(null, true);

      callback(new Error(`CORS blocked: ${origin}`));
    } catch (err) {
      callback(err);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

// ── Body Parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send('Welcome to M2N Blog CMS API');
});

app.use('/api/auth',     loginLimiter, authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/blogs',    blogRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Error Handler ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ message: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// ── Start ──────────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    console.log(`🌍 Admin origins allowed: ${ADMIN_ORIGINS.join(', ')}`);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB error:', err));
