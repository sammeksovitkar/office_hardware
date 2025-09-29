const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Admin only routes
router.get('/users', authMiddleware, adminMiddleware, adminController.getAllUsers);
router.post('/users', authMiddleware, adminMiddleware, adminController.createUser);
router.put('/users/:id', authMiddleware, adminMiddleware, adminController.updateUser);
router.delete('/users/:id', authMiddleware, adminMiddleware, adminController.deleteUser);

// Correct route for importing users
router.post('/users/import', authMiddleware, adminMiddleware, upload.single('file'), adminController.importUsersFromExcel);

// 🌟 ADDED: Route for creating a new Surety 🌟
router.post('/sureties', authMiddleware, adminMiddleware, adminController.createSurety);

// Correct route for importing sureties
router.post('/sureties/import', authMiddleware, adminMiddleware, upload.single('file'), adminController.importSuretiesFromExcel);

router.get('/sureties', authMiddleware, adminMiddleware, adminController.getAllSureties);
router.put('/sureties/:id', authMiddleware, adminMiddleware, adminController.updateSurety);
router.delete('/sureties/:id', authMiddleware, adminMiddleware, adminController.deleteSurety);

module.exports = router;