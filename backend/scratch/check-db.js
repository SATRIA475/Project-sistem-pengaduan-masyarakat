const pool = require('../config/db');

async function checkDb() {
  try {
    const [rows] = await pool.query('SELECT id, title, image FROM complaints ORDER BY id DESC LIMIT 5');
    console.log('Last 5 complaints image paths in DB:');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error querying DB:', error);
    process.exit(1);
  }
}

checkDb();
