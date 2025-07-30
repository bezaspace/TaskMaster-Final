const sqlite3 = require('sqlite3').verbose();

/**
 * Complete database setup script for TaskMaster
 * This script creates the entire database schema as it exists after all migrations
 * Run this script to recreate the database from scratch with the complete schema
 */

const db = new sqlite3.Database('./taskmaster.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    return console.error('Error connecting to database:', err.message);
  }
  console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  console.log('Creating complete database schema...');

  // 1. Create tasks table with all columns (final state after all migrations)
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    task_date DATE,
    start_time TIME,
    end_time TIME,
    time_slot DATETIME,
    time_slot_end DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      return console.error('Error creating tasks table:', err.message);
    }
    console.log('✓ Created tasks table with all columns');
  });

  // 2. Create task_logs table
  db.run(`CREATE TABLE IF NOT EXISTS task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      return console.error('Error creating task_logs table:', err.message);
    }
    console.log('✓ Created task_logs table');
  });

  // 3. Create notes table
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      return console.error('Error creating notes table:', err.message);
    }
    console.log('✓ Created notes table');
  });

  // 4. Create activity_log table
  db.run(`CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      return console.error('Error creating activity_log table:', err.message);
    }
    console.log('✓ Created activity_log table');
  });

  // 5. Create deleted_tasks table (trash system)
  db.run(`CREATE TABLE IF NOT EXISTS deleted_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_task_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT,
    task_date DATE,
    start_time TIME,
    end_time TIME,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      return console.error('Error creating deleted_tasks table:', err.message);
    }
    console.log('✓ Created deleted_tasks table');
  });

  // 6. Create deleted_task_logs table
  db.run(`CREATE TABLE IF NOT EXISTS deleted_task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deleted_task_id INTEGER NOT NULL,
    original_log_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME,
    FOREIGN KEY (deleted_task_id) REFERENCES deleted_tasks (id)
  )`, (err) => {
    if (err) {
      return console.error('Error creating deleted_task_logs table:', err.message);
    }
    console.log('✓ Created deleted_task_logs table');
  });

  // 7. Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON tasks (task_date)`, (err) => {
    if (err) {
      return console.error('Error creating tasks task_date index:', err.message);
    }
    console.log('✓ Created index on tasks.task_date');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status)`, (err) => {
    if (err) {
      return console.error('Error creating tasks status index:', err.message);
    }
    console.log('✓ Created index on tasks.status');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs (task_id)`, (err) => {
    if (err) {
      return console.error('Error creating task_logs task_id index:', err.message);
    }
    console.log('✓ Created index on task_logs.task_id');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log (timestamp DESC)`, (err) => {
    if (err) {
      return console.error('Error creating activity_log timestamp index:', err.message);
    }
    console.log('✓ Created index on activity_log.timestamp');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_deleted_tasks_deleted_at ON deleted_tasks (deleted_at DESC)`, (err) => {
    if (err) {
      return console.error('Error creating deleted_tasks deleted_at index:', err.message);
    }
    console.log('✓ Created index on deleted_tasks.deleted_at');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_deleted_task_logs_deleted_task_id ON deleted_task_logs (deleted_task_id)`, (err) => {
    if (err) {
      return console.error('Error creating deleted_task_logs deleted_task_id index:', err.message);
    }
    console.log('✓ Created index on deleted_task_logs.deleted_task_id');
  });

  console.log('\n🎉 Database setup completed successfully!');
  console.log('\nDatabase schema summary:');
  console.log('- tasks: Main task management with scheduling');
  console.log('- task_logs: Log entries for tasks');
  console.log('- notes: Standalone notes system');
  console.log('- activity_log: System activity tracking');
  console.log('- deleted_tasks: Soft delete system for tasks');
  console.log('- deleted_task_logs: Logs for deleted tasks');
  console.log('- All necessary indexes created for performance');
});

db.close((err) => {
  if (err) {
    return console.error('Error closing database:', err.message);
  }
  console.log('\n✅ Database connection closed. Setup complete!');
  console.log('\nYour TaskMaster database is ready to use.');
  console.log('You can now run: npm run dev');
});