const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./taskmaster.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  db.run(`ALTER TABLE tasks ADD COLUMN time_slot DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      return console.error(err.message);
    }
    console.log('Added time_slot column to tasks table.');
  });
});

db.close((err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Closed the database connection.');
});
