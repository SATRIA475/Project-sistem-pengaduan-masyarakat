const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const getUsers = async (req, res) => {
    try {
        const currentRole = req.user.role;

        let query = 'SELECT id, name, email, role, profile_image, created_at FROM users WHERE id != ? ';
        const params = [req.user.id];

        // Admin can only see 'user' role
        if (currentRole === 'admin') {
            query += "AND role = 'user' ";
        }
        
        query += 'ORDER BY created_at DESC';

        const [users] = await pool.query(query, params);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentRole = req.user.role;

        // Fetch target user's role
        const [targetUsers] = await pool.query('SELECT role, profile_image FROM users WHERE id = ?', [id]);
        if (targetUsers.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const targetRole = targetUsers[0].role;
        const profileImage = targetUsers[0].profile_image;

        // Rule: admin can only delete user. super_admin can delete admin and user.
        if (currentRole === 'admin' && targetRole !== 'user') {
            return res.status(403).json({ message: 'Admins can only delete normal users' });
        }

        if (targetRole === 'super_admin') {
            return res.status(403).json({ message: 'Super Admins cannot be deleted' });
        }

        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete profile picture if exists
        if (profileImage) {
            const filename = path.basename(profileImage);
            const filePath = path.join(__dirname, '..', 'uploads', filename);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error('Failed to delete deleted user\'s profile image:', err);
            }
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        const currentRole = req.user.role;
        
        // Only super_admin can create admins. 
        if (currentRole !== 'super_admin') {
            return res.status(403).json({ message: 'Only Super Admin can add new admins' });
        }

        const { name, email, password, role } = req.body;
        
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if email already exists
        const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Only allow creating 'admin' or 'user' (prevent creating another super_admin if desired, but we can allow it or restrict it)
        if (role !== 'admin' && role !== 'user') {
            return res.status(400).json({ message: 'Invalid role assignment' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);
        
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, password } = req.body;

        // Reject and delete profile image if user role is super_admin
        if (req.file && req.user.role === 'super_admin') {
            const filePath = req.file.path;
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error('Failed to delete unauthorized super admin profile image:', err);
            }
            return res.status(403).json({ message: 'Super Administrator tidak diperbolehkan mengganti foto profil' });
        }

        // Validate email uniqueness if email is changed
        if (email) {
            const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Email already in use by another account' });
            }
        }

        const fields = [];
        const params = [];

        if (email) {
            fields.push('email = ?');
            params.push(email);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            fields.push('password = ?');
            params.push(hashedPassword);
        }

        let newProfileImage = null;
        if (req.file) {
            newProfileImage = `/uploads/${req.file.filename}`;
            fields.push('profile_image = ?');
            params.push(newProfileImage);
            
            // Delete old profile image if exists
            const [users] = await pool.query('SELECT profile_image FROM users WHERE id = ?', [userId]);
            if (users.length > 0 && users[0].profile_image) {
                const oldImage = users[0].profile_image;
                const filename = path.basename(oldImage);
                const filePath = path.join(__dirname, '..', 'uploads', filename);
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (err) {
                    console.error('Failed to delete old profile image:', err);
                }
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No updates provided' });
        }

        params.push(userId);
        await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

        // Fetch the updated user profile
        const [updatedUser] = await pool.query('SELECT profile_image FROM users WHERE id = ?', [userId]);
        const finalProfileImage = updatedUser.length > 0 ? updatedUser[0].profile_image : null;

        res.json({ 
            message: 'Profile updated successfully',
            profile_image: finalProfileImage
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentRole = req.user.role;
        const { name, email, password, role } = req.body;

        // Fetch target user's role
        const [targetUsers] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
        if (targetUsers.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const targetRole = targetUsers[0].role;

        // Admins can only update 'user' role
        if (currentRole === 'admin' && targetRole !== 'user') {
            return res.status(403).json({ message: 'Admins can only edit normal users' });
        }

        // Only super_admin can change someone's role to admin or super_admin
        if (role && role !== targetRole) {
            if (currentRole !== 'super_admin') {
                return res.status(403).json({ message: 'Only Super Admin can change user roles' });
            }
            if (role !== 'admin' && role !== 'user' && role !== 'super_admin') {
                return res.status(400).json({ message: 'Invalid role assignment' });
            }
        }

        // Check if email already exists
        if (email) {
            const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        const fields = [];
        const params = [];

        if (name) {
            fields.push('name = ?');
            params.push(name);
        }

        if (email) {
            fields.push('email = ?');
            params.push(email);
        }

        if (role) {
            fields.push('role = ?');
            params.push(role);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            fields.push('password = ?');
            params.push(hashedPassword);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No updates provided' });
        }

        params.push(id);
        await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getUsers, deleteUser, createUser, updateProfile, updateUser };
