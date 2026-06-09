const pool = require('./config/db');

async function fixEnum() {
    try {
        await pool.query("ALTER TABLE complaints MODIFY COLUMN status ENUM('pending', 'process', 'done', 'approved', 'rejected') DEFAULT 'pending'");
        console.log("Successfully updated status ENUM to include 'rejected'");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

fixEnum();
