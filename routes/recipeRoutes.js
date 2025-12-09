import { Recipe, User } from '../db.js';

// Get all recipes
export const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.findAll({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      message: 'Berhasil mengambil semua resep',
      recipes,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error mengambil resep', error: error.message });
  }
};

// Get recipe by ID
export const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
        },
      ],
    });

    if (!recipe) {
      return res.status(404).json({ message: 'Resep tidak ditemukan' });
    }

    res.status(200).json({
      message: 'Berhasil mengambil resep',
      recipe,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error mengambil resep', error: error.message });
  }
};

// Get recipes by category
export const getRecipesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const recipes = await Recipe.findAll({
      where: { category },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      message: `Berhasil mengambil resep kategori ${category}`,
      recipes,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error mengambil resep', error: error.message });
  }
};

// Create recipe (Protected)
export const createRecipe = async (req, res) => {
  try {
    const { title, description, category, ingredients, instructions, image, prepTime, cookTime, servings, difficulty } = req.body;

    // Debug log: print incoming payload and user id to help diagnose malformed requests
    console.log('POST /api/recipes - body:', req.body);
    console.log('POST /api/recipes - userId:', req.userId);

    // Basic validation with clear messages
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ message: 'Field `title` wajib (minimal 3 karakter)' });
    }

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ message: 'Field `category` wajib dan harus berupa string' });
    }

    if (!instructions || typeof instructions !== 'string' || instructions.trim().length === 0) {
      return res.status(400).json({ message: 'Field `instructions` wajib' });
    }

    // Parse ingredients safely: accept array or JSON-stringified array
    let parsedIngredients = ingredients;
    try {
      if (typeof parsedIngredients === 'string') {
        parsedIngredients = parsedIngredients.trim() === '' ? [] : JSON.parse(parsedIngredients);
      }
    } catch (parseErr) {
      console.warn('Failed to parse ingredients JSON:', parseErr && parseErr.message);
      return res.status(400).json({ message: 'Field `ingredients` harus berupa array atau JSON string array' });
    }

    if (!Array.isArray(parsedIngredients) || parsedIngredients.length === 0) {
      return res.status(400).json({ message: 'Field `ingredients` wajib dan harus berisi setidaknya 1 item' });
    }

    const newRecipe = await Recipe.create({
      title: title.trim(),
      description: description || null,
      category: category.trim(),
      ingredients: parsedIngredients,
      instructions: instructions.trim(),
      image: image || null,
      prepTime,
      cookTime,
      servings,
      difficulty,
      userId: req.userId || null,
    });

    res.status(201).json({
      message: 'Resep berhasil dibuat',
      recipe: newRecipe,
    });
  } catch (error) {
    console.error('Error in createRecipe:', error && error.stack ? error.stack : error);
    res.status(500).json({ message: 'Error membuat resep', error: error.message });
  }
};

// Update recipe (Protected)
export const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, ingredients, instructions, image, prepTime, cookTime, servings, difficulty } = req.body;

    const recipe = await Recipe.findByPk(id);

    if (!recipe) {
      return res.status(404).json({ message: 'Resep tidak ditemukan' });
    }

    // Cek apakah user adalah pembuat resep
    if (recipe.userId !== req.userId) {
      return res.status(403).json({ message: 'Anda tidak memiliki izin untuk mengubah resep ini' });
    }

    await recipe.update({
      title: title || recipe.title,
      description: description || recipe.description,
      category: category || recipe.category,
      ingredients: ingredients ? (Array.isArray(ingredients) ? ingredients : JSON.parse(ingredients)) : recipe.ingredients,
      instructions: instructions || recipe.instructions,
      image: image || recipe.image,
      prepTime: prepTime || recipe.prepTime,
      cookTime: cookTime || recipe.cookTime,
      servings: servings || recipe.servings,
      difficulty: difficulty || recipe.difficulty,
    });

    res.status(200).json({
      message: 'Resep berhasil diperbarui',
      recipe,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error mengubah resep', error: error.message });
  }
};

// Delete recipe (Protected)
export const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findByPk(id);

    if (!recipe) {
      return res.status(404).json({ message: 'Resep tidak ditemukan' });
    }

    // Debug/logging: show both ids to help diagnose permission issues
    console.log(`DELETE /api/recipes/${id} requested by userId:`, req.userId, 'recipe.userId:', recipe.userId);

    // Cek apakah user adalah pembuat resep (compare as strings to avoid type mismatches)
    const ownerId = recipe.userId ? String(recipe.userId) : null;
    const requesterId = req.userId ? String(req.userId) : null;

    if (!ownerId || ownerId !== requesterId) {
      return res.status(403).json({ message: 'Anda tidak memiliki izin untuk menghapus resep ini', ownerId, requesterId });
    }

    await recipe.destroy();

    res.status(200).json({
      message: 'Resep berhasil dihapus',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error menghapus resep', error: error.message });
  }
};

// Get user's recipes
export const getUserRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.findAll({
      where: { userId: req.userId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      message: 'Berhasil mengambil resep Anda',
      recipes,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error mengambil resep', error: error.message });
  }
};
