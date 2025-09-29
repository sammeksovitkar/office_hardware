const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Contains the hardware logic
const { authMiddleware, userMiddleware } = require('../middleware/auth');

// Hardware routes

// 1. Create a new Hardware record (User/Employee is allocating it)
router.post('/hardware', authMiddleware, userMiddleware, userController.createHardware);

// 2. Get Hardware records allocated to the authenticated User/Employee
router.get('/hardware', authMiddleware, userMiddleware, userController.getUserHardware);

// 3. Get all Hardware records (Likely for admin/manager view)
router.get('/allhardware', authMiddleware, userController.getAllHardware);

// ----------------------------------------------------
// --- NEW EDIT & DELETE ROUTES ---
// ----------------------------------------------------

// 4. UPDATE/EDIT a specific hardware item and its parent metadata
// The ':id' here is the ID of the PARENT Hardware document.
// The controller expects the item's _id and update data in the request body.
// Maps to: userController.updateHardwareItem
router.put('/hardware/:id', authMiddleware, userController.updateHardwareItem);

// 5. DELETE a specific hardware ITEM (subdocument) from the parent record
// ':parentId' is the ID of the PARENT Hardware document.
// ':itemId' is the ID of the specific subdocument/item being deleted.
// Maps to: userController.deleteHardwareItem
router.delete('/hardware/:parentId/:itemId', authMiddleware, userController.deleteHardwareItem);

// ----------------------------------------------------

// Dummy route to get user info (kept as is)
router.get('/me', authMiddleware, userController.getMe);

module.exports = router;