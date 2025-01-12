const express = require('express');
const router = express.Router();
const installationController = require('../controllers/installationController');
// const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Installation routes - accessible à tous (sans authentification temporaire)
router.post('/', installationController.addInstallation);
router.get('/', installationController.getAllInstallations);
router.get('/:id', installationController.getInstallationById);
router.put('/:id', installationController.updateInstallation);
router.delete('/:id', installationController.deleteInstallation);
router.get('/:installationId/devices', installationController.getDevicesByInstallation);
router.get('/:id/rooms', installationController.getRoomsByInstallation);

module.exports = router;
