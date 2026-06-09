const express = require('express');
const router = express.Router();
const { createComplaint, getComplaints, getComplaintById, updateComplaintStatus, deleteComplaint, getUserNotifications, reportComplaint, getPublicStats, getPublicComplaints } = require('../controllers/complaintController');
const { toggleLike, addComment, getComments } = require('../controllers/interactionController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', verifyToken, (req, res, next) => {
    upload.array('image', 10)(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE' 
                ? 'Ukuran foto terlalu besar. Maksimal adalah 50MB!' 
                : (err.message || 'Gagal mengunggah foto.');
            return res.status(400).json({ message });
        }
        next();
    });
}, createComplaint);

router.get('/', verifyToken, getComplaints);
router.get('/public/stats', getPublicStats);
router.get('/public/list', getPublicComplaints);
router.get('/notifications', verifyToken, getUserNotifications);
router.get('/:id', verifyToken, getComplaintById);
router.put('/:id/status', verifyToken, verifyAdmin, updateComplaintStatus);
router.delete('/:id', verifyToken, verifyAdmin, deleteComplaint);
router.post('/:id/report', verifyToken, reportComplaint);

// Interaction Routes
router.post('/:id/like', verifyToken, toggleLike);
router.post('/:id/comments', verifyToken, addComment);
router.get('/:id/comments', verifyToken, getComments);

module.exports = router;
