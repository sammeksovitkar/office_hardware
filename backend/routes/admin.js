const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// --- User Management Routes ---
router.get('/users', authMiddleware, adminMiddleware, adminController.getAllUsers);
router.post('/users', authMiddleware, adminMiddleware, adminController.createUser);
router.put('/users/:id', authMiddleware, adminMiddleware, adminController.updateUser);
router.delete('/users/:id', authMiddleware, adminMiddleware, adminController.deleteUser);

// Route for importing users
router.post('/users/import', authMiddleware, adminMiddleware, upload.single('file'), adminController.importUsersFromExcel);

// --- HARDWARE Management Routes (Replaced /sureties) ---

// Create new hardware record
router.post('/hardware', authMiddleware, adminMiddleware, adminController.createHardware);

// Get all hardware records
router.get('/hardware', authMiddleware, adminMiddleware, adminController.getAllHardware);

// Update a specific hardware record
router.put('/hardware/:id', authMiddleware, adminMiddleware, adminController.updateHardware);

// Delete a specific hardware record
router.delete('/hardware/:id', authMiddleware, adminMiddleware, adminController.deleteHardware);

// Route for importing hardware records from Excel
router.post('/hardware/import', authMiddleware, adminMiddleware, upload.single('file'), adminController.importHardwareFromExcel);


module.exports = router;