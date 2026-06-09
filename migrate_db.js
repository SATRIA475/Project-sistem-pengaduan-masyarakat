const pool = require('../backend/config/db');

async function migrate() {
    try {
        console.log('Checking and migrating database column...');
        // Check if column exists
        const [columns] = await pool.query('SHOW COLUMNS FROM complaints LIKE "category"');
        if (columns.length === 0) {
            await pool.query('ALTER TABLE complaints ADD COLUMN category VARCHAR(100) DEFAULT "Lainnya"');
            console.log('Successfully added "category" column to complaints table.');
        } else {
            console.log('"category" column already exists.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
