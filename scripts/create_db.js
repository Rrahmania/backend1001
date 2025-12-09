#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder (assumes script run from repo root or anywhere)
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const {
  DATABASE_URL,
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'resep_DB',
  DB_USER = 'postgres',
  DB_PASSWORD = '',
} = process.env;

function makeAdminConnectionStringFromDatabaseUrl(dbUrl) {
  try {
    const u = new URL(dbUrl);
    // set to default admin DB 'postgres'
    u.pathname = '/postgres';
    return u.toString();
  } catch (err) {
    return null;
  }
}

async function createDatabase() {
  const targetDb = (() => {
    if (DATABASE_URL) {
      try {
        const u = new URL(DATABASE_URL);
        return u.pathname.replace(/^\//, '') || DB_NAME;
      } catch (err) {
        return DB_NAME;
      }
    }
    return DB_NAME;
  })();

  let adminConn = null;

  if (DATABASE_URL) {
    const adminUrl = makeAdminConnectionStringFromDatabaseUrl(DATABASE_URL);
    if (!adminUrl) throw new Error('Invalid DATABASE_URL');
    adminConn = { connectionString: adminUrl, ssl: { rejectUnauthorized: false } };
  } else {
    adminConn = {
      host: DB_HOST,
      port: parseInt(DB_PORT, 10),
      user: DB_USER,
      password: DB_PASSWORD,
      database: 'postgres',
      ssl: false,
    };
  }

  console.log('Using admin connection to create DB:', adminConn.connectionString ? '(connectionString)' : `${adminConn.host}:${adminConn.port}`);

  const client = new Client(adminConn);
  try {
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
    if (res.rowCount > 0) {
      console.log(`Database '${targetDb}' already exists.`);
    } else {
      console.log(`Creating database '${targetDb}'...`);
      // Quote identifier
      await client.query(`CREATE DATABASE "${targetDb.replace(/"/g, '""')}"`);
      console.log(`Database '${targetDb}' created.`);
    }
  } finally {
    await client.end();
  }

  // Optionally run init.sql to create tables & seed data
  const initPath = path.resolve(__dirname, '..', 'init.sql');
  if (fs.existsSync(initPath)) {
    console.log('Found init.sql — applying to the target database...');

    // connect directly to the newly created database
    let targetConn = null;
    if (DATABASE_URL) {
      try {
        const u = new URL(DATABASE_URL);
        u.pathname = `/${targetDb}`;
        targetConn = { connectionString: u.toString(), ssl: { rejectUnauthorized: false } };
      } catch (err) {
        throw err;
      }
    } else {
      targetConn = {
        host: DB_HOST,
        port: parseInt(DB_PORT, 10),
        user: DB_USER,
        password: DB_PASSWORD,
        database: targetDb,
        ssl: false,
      };
    }

    const initSql = fs.readFileSync(initPath, { encoding: 'utf8' });
    const client2 = new Client(targetConn);
    try {
      await client2.connect();
      // Execute as a single query. If this fails due to multiple statements,
      // split by semicolon and run statements that are non-empty.
      try {
        await client2.query(initSql);
      } catch (err) {
        console.log('Direct multi-statement execution failed, attempting split execution...');
        const parts = initSql.split(/;\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
        for (const stmt of parts) {
          try {
            await client2.query(stmt);
          } catch (e) {
            console.error('Error executing statement:', stmt.slice(0, 120));
            console.error(e.message);
          }
        }
      }
      console.log('init.sql applied (best-effort).');
    } finally {
      await client2.end();
    }
  } else {
    console.log('No init.sql found — skipping schema initialization.');
  }
}

createDatabase()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
