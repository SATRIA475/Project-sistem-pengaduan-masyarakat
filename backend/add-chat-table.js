const mysql = require('mysql2/promise');
require('dotenv').config();

async function addChatTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pengaduan_masyarakat'
    });

    console.log('Connected to DB. Creating chat_messages table...');

    // Create Chat Messages Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        room_id INT NOT NULL,
        message TEXT NOT NULL,
        is_admin_reply TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Table chat_messages created successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error creating chat table:', error);
  }
}

addChatTable();
