const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const createComplaint = async (req, res) => {
    try {
        const { title, description, latitude, longitude, category } = req.body;
        const userId = req.user.id;
        let image = null;
        if (req.files && req.files.length > 0) {
            image = req.files.map(file => `/uploads/${file.filename}`).join(',');
        } else if (req.file) {
            image = `/uploads/${req.file.filename}`;
        }

        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }

        const [result] = await pool.query(
            'INSERT INTO complaints (user_id, title, description, image, status, latitude, longitude, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, title, description, image, 'pending', latitude || null, longitude || null, category || 'Lainnya']
        );

        res.status(201).json({ message: 'Complaint created successfully', complaintId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getComplaints = async (req, res) => {
    try {
        const userId = req.user.id;

        // LaporPak: Return all complaints with like/comment counts and user like status
        const query = `
            SELECT 
                c.*, 
                u.name as user_name,
                u.profile_image as user_profile_image,
                (SELECT COUNT(*) FROM likes WHERE complaint_id = c.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE complaint_id = c.id) as comments_count,
                EXISTS(SELECT 1 FROM likes WHERE complaint_id = c.id AND user_id = ?) as is_liked_by_me
            FROM complaints c 
            JOIN users u ON c.user_id = u.id 
            ORDER BY c.created_at DESC
        `;
        const params = [userId];

        const [complaints] = await pool.query(query, params);
        
        // Convert integer 1/0 to boolean for is_liked_by_me
        const formattedComplaints = complaints.map(c => ({
            ...c,
            is_liked_by_me: !!c.is_liked_by_me
        }));

        res.json(formattedComplaints);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getComplaintById = async (req, res) => {
    try {
        const { id } = req.params;
        const [complaints] = await pool.query(
            'SELECT c.*, u.name as user_name, u.profile_image as user_profile_image FROM complaints c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
            [id]
        );

        if (complaints.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const complaint = complaints[0];

        // LaporPak: Everyone can see the complaint details
        // Get responses
        const [responses] = await pool.query(
            'SELECT r.*, u.name as admin_name, u.profile_image as admin_profile_image FROM responses r JOIN users u ON r.admin_id = u.id WHERE r.complaint_id = ? ORDER BY r.created_at ASC',
            [id]
        );

        complaint.responses = responses;
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'process', 'done', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [result] = await pool.query('UPDATE complaints SET status = ? WHERE id = ?', [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        res.json({ message: 'Complaint status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Dapatkan info laporan terlebih dahulu untuk mendapatkan nama file foto
        const [complaints] = await pool.query('SELECT image FROM complaints WHERE id = ?', [id]);
        if (complaints.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        
        const complaint = complaints[0];

        // 2. Hapus data dari database MySQL
        const [result] = await pool.query('DELETE FROM complaints WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // 3. Hapus file foto dari folder uploads jika ada
        if (complaint.image) {
            // Pisahkan dengan koma jika ada lebih dari satu foto
            const imagePaths = complaint.image.split(',');
            for (const imgPath of imagePaths) {
                if (imgPath && imgPath.trim() !== '') {
                    // Ambil nama file saja (misal: "filename.jpg" dari "/uploads/filename.jpg")
                    const filename = path.basename(imgPath.trim());
                    const filePath = path.join(__dirname, '..', 'uploads', filename);

                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (err) {
                        console.error('Gagal menghapus file foto:', filePath, err);
                    }
                }
            }
        }

        res.json({ message: 'Complaint deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const [notifications] = await pool.query(
            `SELECT r.*, c.title as complaint_title, u.name as admin_name, u.profile_image as admin_profile_image 
             FROM responses r 
             JOIN complaints c ON r.complaint_id = c.id 
             JOIN users u ON r.admin_id = u.id 
             WHERE c.user_id = ? 
             ORDER BY r.created_at DESC`,
            [userId]
        );
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const reportComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('UPDATE complaints SET is_reported = TRUE WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        res.json({ message: 'Complaint reported successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getPublicStats = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT COUNT(*) as total FROM users');
        const [complaints] = await pool.query('SELECT status, latitude, longitude FROM complaints');
        
        const totalUsers = users[0].total;
        const totalCount = complaints.length;
        const resolvedCount = complaints.filter(
          c => c.status === 'done' || c.status === 'approved'
        ).length;
        const locationsCount = complaints.filter(
          c => c.latitude !== null && c.longitude !== null
        ).length;

        res.json({ totalUsers, totalCount, resolvedCount, locationsCount });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getPublicComplaints = async (req, res) => {
    try {
        const [complaints] = await pool.query(`
            SELECT c.id, c.title, c.description, c.image, c.status, c.created_at, c.latitude, c.longitude, u.name as user_name, u.profile_image as user_profile_image 
            FROM complaints c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.status IN ('done', 'approved', 'process')
            ORDER BY c.created_at DESC 
            LIMIT 5
        `);
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createComplaint, getComplaints, getComplaintById, updateComplaintStatus, deleteComplaint, getUserNotifications, reportComplaint, getPublicStats, getPublicComplaints };
