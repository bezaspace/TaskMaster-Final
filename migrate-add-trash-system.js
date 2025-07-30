const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./taskmaster.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQLite database for trash system migration.');
});

db.serialize(() => {
  // Create deleted_tasks table
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
    console.log('Created deleted_tasks table.');
  });

  // Create deleted_task_logs table
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
    console.log('Created deleted_task_logs table.');
  });

  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_deleted_tasks_deleted_at ON deleted_tasks (deleted_at DESC)`, (err) => {
    if (err) {
      return console.error('Error creating deleted_tasks index:', err.message);
    }
    console.log('Created index on deleted_tasks.deleted_at.');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_deleted_task_logs_deleted_task_id ON deleted_task_logs (deleted_task_id)`, (err) => {
    if (err) {
      return console.error('Error creating deleted_task_logs index:', err.message);
    }
    console.log('Created index on deleted_task_logs.deleted_task_id.');
  });
});

db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Closed the database connection.');
});