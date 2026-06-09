const express = require('express');
const router = express.Router();
const { getUsers, deleteUser, createUser, updateProfile, updateUser } = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Profile update (any authenticated user)
router.put('/profile', verifyToken, upload.single('profile_image'), updateProfile);

// Both admin and super_admin can access these routes (verifyAdmin allows both now)
router.get('/', verifyToken, verifyAdmin, getUsers);
router.post('/', verifyToken, verifyAdmin, createUser);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);
router.put('/:id', verifyToken, verifyAdmin, updateUser);

module.exports = router;
