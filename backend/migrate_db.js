const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Checking and migrating database column...');
        const [columns] = await pool.query('SHOW COLUMNS FROM complaints LIKE "category"');
        if (columns.length === 0) {
            await pool.query('ALTER TABLE complaints ADD COLUMN category VARCHAR(100) DEFAULT "Lainnya"');
            console.log('Successfully added "category" column to complaints table.');
        } else {
            console.log('"category" column already exists.');
        }

        const [userColumns] = await pool.query('SHOW COLUMNS FROM users LIKE "profile_image"');
        if (userColumns.length === 0) {
            await pool.query('ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL');
            console.log('Successfully added "profile_image" column to users table.');
        } else {
            console.log('"profile_image" column already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
