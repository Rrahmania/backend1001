import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { PORT, FRONTEND_URL, ALLOWED_ORIGINS } from './config.js';
import authRoutes from './routes/authRoutes.js';
import recipeRoutes from './routes/recipeRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';

const app = express();

// Middleware
// Build allowlist from ALLOWED_ORIGINS or FRONTEND_URL with sensible defaults
const defaultLocal = 'http://localhost:5173';
// Add your deployed frontend origin here as a safe default for convenience.
const defaultFrontend = 'https://our-recepi081.vercel.app';

let allowList = [];
if (ALLOWED_ORIGINS) {
  allowList = ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
} else if (FRONTEND_URL) {
  allowList = [FRONTEND_URL];
} else {
  // Fallback allowlist: local dev + the deployed frontend (convenience)
  allowList = [defaultLocal, defaultFrontend];
}

// Log the active allowList at startup for debugging (safe to keep)
console.log('🔐 CORS allowList:', allowList);

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (e.g. curl, server-side)
    if (!origin) return callback(null, true);
    if (allowList.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: origin not allowed'), false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Wrap startup in async IIFE to properly await DB connection
(async () => {
  // Connect Database
  await connectDB();

  // Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/ratings', ratingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server running smoothly!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route tidak ditemukan' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
})(); // Close async IIFE
