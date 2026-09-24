const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');

try {
  const db = new DatabaseSync('brain.db');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('=== TABLES IN BRAIN.DB ===');
  console.log(tables.map(t => t.name));

  for (const t of tables) {
    const rows = db.prepare(`SELECT * FROM ${t.name}`).all();
    console.log(`\n--- TABLE: ${t.name} (Total: ${rows.length}) ---`);
    console.log(JSON.stringify(rows, null, 2));
  }
} catch (err) {
  console.error('Error reading brain.db:', err);
}
