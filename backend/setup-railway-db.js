const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupRailwayDB() {
    console.log('==============================================');
    console.log('🚀 Setting up Database on Railway...');
    console.log('==============================================');

    const argUrl = process.argv[2];
    const connectionUri = argUrl || process.env.MYSQL_URL || process.env.DATABASE_URL;

    let connection;
    try {
        if (connectionUri) {
            console.log(`Connecting via URL: ${connectionUri.replace(/:([^:@]+)@/, ':****@')}`);
            connection = await mysql.createConnection(connectionUri);
        } else {
            const host = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
            const port = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306);
            const user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
            const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.MYSQLPASSWORD || '');
            const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway';

            console.log(`Connecting to Host: ${host}:${port}, User: ${user}, DB: ${database}`);
            connection = await mysql.createConnection({
                host,
                port,
                user,
                password,
                database,
                multipleStatements: true
            });
        }

        console.log('✅ Connected successfully to MySQL server!');

        // Read database.sql
        const sqlPath = path.resolve(__dirname, '../database.sql');
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`File not found: ${sqlPath}`);
        }

        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split statements by semicolon while ignoring comments
        const cleanSql = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');

        const statements = cleanSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Executing ${statements.length} SQL statements from database.sql...`);

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            try {
                await connection.query(stmt);
                const firstLine = stmt.split('\n')[0].substring(0, 50);
                console.log(`  [${i + 1}/${statements.length}] Done: ${firstLine}...`);
            } catch (err) {
                console.warn(`  [${i + 1}/${statements.length}] Warning on: ${stmt.substring(0, 40)}...`, err.message);
            }
        }

        // Verify tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('\n📋 Created Tables in Database:');
        tables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));

        // Verify users
        const [users] = await connection.query('SELECT id, name, email, role FROM users');
        console.log('\n👥 Seeded Users:');
        users.forEach(u => console.log(`  - [${u.role}] ${u.name} (${u.email})`));

        console.log('\n🎉 SUCCESS! Railway database has been configured and migrated successfully.');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Connection / Migration Error:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

setupRailwayDB();
