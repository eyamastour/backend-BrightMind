const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// Public routes (no authentication required)
router.get('/', deviceController.getDevices);
router.get('/rooms/:roomId/devices', deviceController.getDevicesByRoom);
router.get('/:id', deviceController.getDevice);

// Protected routes (no admin role required)
router.post('/', deviceController.addDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
