import { supabase } from './supabase';
import { getDatabaseTimestamp } from './timeUtils';

/**
 * Get Supabase client instance
 * This replaces the old SQLite getDb() function
 */
export function getDb() {
  return supabase;
}

/**
 * Helper function to get current timestamp for database operations
 * Now returns PostgreSQL-compatible timestamp
 */
export function getCurrentDbTimestamp(): string {
  return getDatabaseTimestamp();
}

/**
 * Helper function to handle Supabase query errors
 */
export function handleSupabaseError(error: any, operation: string) {
  console.error(`Supabase ${operation} error:`, error);
  throw new Error(`Database ${operation} failed: ${error.message}`);
}
