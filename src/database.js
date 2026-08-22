import { getDatabase, seedDemoData } from './db/index.js';

export async function openDatabase(filename) {
  return getDatabase({ dbPath: filename, seed: false });
}

export { seedDemoData, getDatabase };
