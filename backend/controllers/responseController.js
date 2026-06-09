const pool = require('../config/db');

const addResponse = async (req, res) => {
    try {
        const { complaint_id, message } = req.body;
        const admin_id = req.user.id;

        if (!complaint_id || !message) {
            return res.status(400).json({ message: 'Complaint ID and message are required' });
        }

        // Check if complaint exists
        const [complaints] = await pool.query('SELECT * FROM complaints WHERE id = ?', [complaint_id]);
        if (complaints.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        await pool.query(
            'INSERT INTO responses (complaint_id, admin_id, message) VALUES (?, ?, ?)',
            [complaint_id, admin_id, message]
        );

        res.status(201).json({ message: 'Response added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteResponse = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM responses WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Response not found' });
        }

        res.json({ message: 'Response deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { addResponse, deleteResponse };
