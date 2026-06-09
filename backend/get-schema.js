const pool = require('./config/db');

async function getSchema() {
    try {
        const [tables] = await pool.query("SHOW TABLES");
        const tableNames = tables.map(t => Object.values(t)[0]);
        for (const tableName of tableNames) {
            const [create] = await pool.query(`SHOW CREATE TABLE ${tableName}`);
            console.log(create[0]['Create Table']);
            console.log(';\n');
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

getSchema();
