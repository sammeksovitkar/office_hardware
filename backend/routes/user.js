const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Contains the hardware logic
const { authMiddleware, userMiddleware } = require('../middleware/auth');

// Hardware routes

// 1. Create a new Hardware record (Single Entry)
router.post('/hardware', authMiddleware, userMiddleware, userController.createHardware);

// ----------------------------------------------------
// 🔥 NEW: BATCH IMPORT ROUTE
// This must be added to handle the POST request from the frontend import function.
router.post('/hardware/batch-import', authMiddleware, userMiddleware, userController.batchImportHardware);
// ----------------------------------------------------

// 2. Get Hardware records allocated to the authenticated User/Employee
router.get('/hardware', authMiddleware, userMiddleware, userController.getUserHardware);

// 3. Get all Hardware records (Likely for admin/manager view)
router.get('/allhardware', authMiddleware, userController.getAllHardware);

// ----------------------------------------------------
// --- NEW EDIT & DELETE ROUTES ---
// ----------------------------------------------------

// 4. UPDATE/EDIT a specific hardware item and its parent metadata
router.put('/hardware/:id', authMiddleware, userController.updateHardwareItem);

// 5. DELETE a specific hardware ITEM (subdocument) from the parent record
router.delete('/hardware/:parentId/:itemId', authMiddleware, userController.deleteHardwareItem);

// ----------------------------------------------------

// Dummy route to get user info (kept as is)
router.get('/me', authMiddleware, userController.getMe);

module.exports = router;
