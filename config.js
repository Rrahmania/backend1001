import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5010;
const DATABASE_URL = process.env.DATABASE_URL || null;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT, 10) || 5432;
const DB_NAME = process.env.DB_NAME || 'resep_DB';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'Mutia_18';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

export { PORT, DATABASE_URL, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, JWT_EXPIRE };
