const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./taskmaster.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQLite database for timestamp migration.');
});

db.serialize(() => {
  // Update any NULL timestamps in tasks table
  db.run(`UPDATE tasks 
          SET created_at = datetime('now') 
          WHERE created_at IS NULL`, (err) => {
    if (err) {
      console.error('Error updating tasks created_at:', err.message);
    } else {
      console.log('Updated NULL created_at timestamps in tasks table.');
    }
  });

  db.run(`UPDATE tasks 
          SET updated_at = datetime('now') 
          WHERE updated_at IS NULL`, (err) => {
    if (err) {
      console.error('Error updating tasks updated_at:', err.message);
    } else {
      console.log('Updated NULL updated_at timestamps in tasks table.');
    }
  });

  // Update any NULL timestamps in task_logs table
  db.run(`UPDATE task_logs 
          SET created_at = datetime('now') 
          WHERE created_at IS NULL`, (err) => {
    if (err) {
      console.error('Error updating task_logs created_at:', err.message);
    } else {
      console.log('Updated NULL created_at timestamps in task_logs table.');
    }
  });

  // Ensure all timestamps are in consistent format
  console.log('Timestamp migration completed.');
});

db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Closed the database connection.');
});