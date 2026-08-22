import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SqliteDatabase } from './sqlite.js';
import { PostgresDatabase } from './postgres.js';
import { seedDemoData } from './seed.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DEFAULT_SQLITE_PATH = resolve(__dirname, '../../data/dayflow.db');

export async function getDatabase({ dbPath, databaseUrl, seed = true } = {}) {
  const connectionUrl = databaseUrl || process.env.DATABASE_URL;

  let db;
  if (connectionUrl) {
    db = new PostgresDatabase(connectionUrl);
  } else {
    const filename = dbPath || DEFAULT_SQLITE_PATH;
    db = new SqliteDatabase(filename);
  }

  if (seed) {
    await seedDemoData(db);
  }

  return db;
}

export { SqliteDatabase, PostgresDatabase, seedDemoData };
