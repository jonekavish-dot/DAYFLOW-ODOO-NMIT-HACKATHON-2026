import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { SqliteDatabase } from './sqlite.js';
import { PostgresDatabase } from './postgres.js';
import { seedDemoData } from './seed.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
const DEFAULT_SQLITE_PATH = isServerless ? join(tmpdir(), 'dayflow.db') : resolve(__dirname, '../../data/dayflow.db');

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
