import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { getDatabaseTimestamp } from './timeUtils';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: './taskmaster.db',
      driver: sqlite3.Database,
    });
  }
  return db;
}

/**
 * Helper function to get current timestamp for database operations
 */
export function getCurrentDbTimestamp(): string {
  return getDatabaseTimestamp();
}
