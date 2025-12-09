import express from 'express';
import {
  getAllRecipes,
  getRecipeById,
  getRecipesByCategory,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getUserRecipes,
} from '../controllers/recipeController.js';
import { authMiddleware } from '../middleware/requireAuth.js';
import multer from 'multer';
import path from 'path';

// Setup multer storage to save uploads to ./uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});

const upload = multer({ storage });

const router = express.Router();

// Public routes
router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);
router.get('/category/:category', getRecipesByCategory);

// Protected routes (update/delete/user recipes remain protected)
// Allow public POST so users can submit recipes without authentication
// Support multipart/form-data uploads (image) via multer
router.post('/', upload.single('image'), createRecipe);
router.put('/:id', authMiddleware, updateRecipe);
router.delete('/:id', authMiddleware, deleteRecipe);
router.get('/user/my-recipes', authMiddleware, getUserRecipes);

export default router;
