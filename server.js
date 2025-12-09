import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { PORT } from './config.js';
import authRoutes from './routes/authRoutes.js';
import recipeRoutes from './routes/recipeRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server port
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
