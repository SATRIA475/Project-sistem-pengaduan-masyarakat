const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const responseRoutes = require('./routes/responses');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/complaints', complaintRoutes);
app.use('/responses', responseRoutes);
app.use('/users', userRoutes);
app.use('/chats', chatRoutes);

const PORT = process.env.PORT || 5000;

// ============================================
// Auto-Delete Inactive Chat Sessions (10 min)
// ============================================
const pool = require('./config/db');
const CHAT_EXPIRY_MINUTES = 10;

setInterval(async () => {
  try {
    // Delete all messages in rooms where the newest message is older than 10 minutes
    const [result] = await pool.query(
      `DELETE FROM chat_messages
       WHERE room_id IN (
         SELECT room_id FROM (
           SELECT room_id, MAX(created_at) AS last_activity
           FROM chat_messages
           GROUP BY room_id
           HAVING last_activity < DATE_SUB(NOW(), INTERVAL ? MINUTE)
         ) AS expired_rooms
       )`,
      [CHAT_EXPIRY_MINUTES]
    );
    if (result.affectedRows > 0) {
      console.log(`[Auto-Cleanup] Deleted ${result.affectedRows} expired chat message(s).`);
    }
  } catch (err) {
    console.error('[Auto-Cleanup] Error:', err.message);
  }
}, 60 * 1000); // Run every 60 seconds

// Ensure super admins have no profile image (as requested by user)
pool.query("UPDATE users SET profile_image = NULL WHERE role = 'super_admin'")
  .then(() => console.log('Successfully cleared profile_image for super_admin users.'))
  .catch(err => console.error('Failed to clear super_admin profile_image:', err.message));

// Ensure Bot LaporPak user exists
pool.query("SELECT id FROM users WHERE email = 'bot@laporpak.id'")
  .then(async ([rows]) => {
    if (rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('botpassword123', 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ['Bot LaporPak', 'bot@laporpak.id', hashedPassword, 'admin']
      );
      console.log('Successfully created Bot LaporPak user.');
    }
  })
  .catch(err => console.error('Failed to create Bot user:', err.message));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
