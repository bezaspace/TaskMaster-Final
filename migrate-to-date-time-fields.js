const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./taskmaster.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  // Add new columns
  db.run(`ALTER TABLE tasks ADD COLUMN task_date DATE`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      return console.error(err.message);
    }
    console.log('Added task_date column to tasks table.');
  });

  db.run(`ALTER TABLE tasks ADD COLUMN start_time TIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      return console.error(err.message);
    }
    console.log('Added start_time column to tasks table.');
  });

  db.run(`ALTER TABLE tasks ADD COLUMN end_time TIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      return console.error(err.message);
    }
    console.log('Added end_time column to tasks table.');
  });

  // Migrate existing data from time_slot and time_slot_end to new fields
  db.run(`UPDATE tasks 
          SET task_date = DATE(time_slot),
              start_time = TIME(time_slot)
          WHERE time_slot IS NOT NULL`, (err) => {
    if (err) {
      console.error('Error migrating time_slot data:', err.message);
    } else {
      console.log('Migrated existing time_slot data to task_date and start_time.');
    }
  });

  db.run(`UPDATE tasks 
          SET end_time = TIME(time_slot_end)
          WHERE time_slot_end IS NOT NULL`, (err) => {
    if (err) {
      console.error('Error migrating time_slot_end data:', err.message);
    } else {
      console.log('Migrated existing time_slot_end data to end_time.');
    }
  });
});

db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Closed the database connection.');
});