import { Sequelize } from 'sequelize';
import { DATABASE_URL, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } from './config.js';
import defineUser from './models/User.js';
import defineRecipe from './models/Recipe.js';
import defineFavorite from './models/Favorite.js';
import defineRating from './models/Rating.js';

if (DATABASE_URL) {
  console.log('🔍 Connecting to PostgreSQL via DATABASE_URL');
} else {
  console.log(`🔍 Connecting to PostgreSQL:`, {
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD ? '***' : '(empty)',
  });
}

// Prefer a full DATABASE_URL (e.g. Neon) when provided. Otherwise use individual parts.
const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          // For some hosted Postgres providers (Neon) this is necessary.
          rejectUnauthorized: false,
        },
      },
    })
  : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'postgres',
      logging: false, // Set true untuk melihat query
    });

// Initialize models
const User = defineUser(sequelize);
const Recipe = defineRecipe(sequelize, User);
const Favorite = defineFavorite(sequelize, User, Recipe);
const Rating = defineRating(sequelize, User, Recipe);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ PostgreSQL Connected: ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    
    // Sync models (create table jika belum ada)
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synced');
    
    return sequelize;
  } catch (error) {
    console.error(`❌ Error connecting to PostgreSQL: ${error.message}`);
    process.exit(1);
  }
};

export { User, Recipe, Favorite, Rating };
export default sequelize;
