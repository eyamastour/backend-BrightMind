const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Protected routes
router.get('/', deviceController.getDevices);
router.get('/rooms/:roomId/devices', deviceController.getDevicesByRoom);
router.get('/installations/:installationId/devices', deviceController.getDevicesByInstallation);
router.get('/:id', deviceController.getDevice);
router.get('/:id/history', deviceController.getDeviceHistory);
router.get('/installations/:installationId/history', deviceController.getInstallationDevicesHistory);

// Protected routes (no admin role required)
router.post('/', deviceController.addDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
