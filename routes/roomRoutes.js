const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Protected routes
router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoom);

// Protected routes (no admin role required)
router.post('/', roomController.createRoom);
router.put('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);

// Device management (no admin role required)
router.post('/:id/devices', roomController.addDeviceToRoom);
router.delete('/:id/devices', roomController.removeDeviceFromRoom);

module.exports = router;
