#!/usr/bin/env node

/**
 * Migration script to add momento task fields to existing tasks table
 * Run this script to update your existing database with momento task support
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting momento tasks migration...');

  try {
    // Add momento task fields to tasks table
    console.log('📝 Adding momento task fields to tasks table...');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add momento task fields if they don't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_momento_task') THEN
            ALTER TABLE tasks ADD COLUMN is_momento_task BOOLEAN DEFAULT FALSE;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'momento_start_timestamp') THEN
            ALTER TABLE tasks ADD COLUMN momento_start_timestamp TIMESTAMPTZ;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'momento_end_timestamp') THEN
            ALTER TABLE tasks ADD COLUMN momento_end_timestamp TIMESTAMPTZ;
          END IF;
        END $$;
      `
    });

    if (alterError) {
      console.error('❌ Error adding columns:', alterError);
      throw alterError;
    }

    // Create indexes for momento tasks
    console.log('📊 Creating indexes for momento tasks...');
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create indexes for momento tasks if they don't exist
        CREATE INDEX IF NOT EXISTS idx_tasks_momento ON tasks(is_momento_task, status) WHERE is_momento_task = TRUE;
        CREATE INDEX IF NOT EXISTS idx_tasks_active_momento ON tasks(is_momento_task, momento_end_timestamp) WHERE is_momento_task = TRUE AND momento_end_timestamp IS NULL;
      `
    });

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      throw indexError;
    }

    console.log('✅ Migration completed successfully!');
    console.log('🎉 Momento tasks feature is now ready to use');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL if RPC is not available
async function runMigrationDirect() {
  console.log('🚀 Starting momento tasks migration (direct SQL)...');

  try {
    // Check if columns exist first
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'tasks')
      .in('column_name', ['is_momento_task', 'momento_start_timestamp', 'momento_end_timestamp']);

    if (checkError) {
      console.error('❌ Error checking existing columns:', checkError);
      throw checkError;
    }

    const existingColumns = columns?.map(col => col.column_name) || [];
    
    if (existingColumns.includes('is_momento_task')) {
      console.log('✅ Momento task fields already exist, skipping migration');
      return;
    }

    console.log('📝 Please run the following SQL commands in your Supabase SQL editor:');
    console.log(`
-- Add momento task fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_momento_task BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS momento_start_timestamp TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS momento_end_timestamp TIMESTAMPTZ;

-- Create indexes for momento tasks
CREATE INDEX IF NOT EXISTS idx_tasks_momento ON tasks(is_momento_task, status) WHERE is_momento_task = TRUE;
CREATE INDEX IF NOT EXISTS idx_tasks_active_momento ON tasks(is_momento_task, momento_end_timestamp) WHERE is_momento_task = TRUE AND momento_end_timestamp IS NULL;
    `);

    console.log('🎉 After running these commands, momento tasks feature will be ready!');

  } catch (error) {
    console.error('❌ Migration check failed:', error);
    console.log('📝 Please manually add the momento task fields using the SQL commands above');
  }
}

// Run migration
if (require.main === module) {
  runMigrationDirect();
}

module.exports = { runMigration, runMigrationDirect };