const express = require('express');
const router = express.Router();
const installationController = require('../controllers/installationController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Installation routes - protégées par authentification
router.use(verifyToken); // Appliquer l'authentification à toutes les routes

// Routes accessibles aux utilisateurs authentifiés
router.post('/', installationController.addInstallation);
router.get('/', installationController.getAllInstallations);
router.get('/:id', installationController.getInstallationById);
router.put('/:id', installationController.updateInstallation);
router.delete('/:id', installationController.deleteInstallation);
router.post('/:id/upload-plan', installationController.uploadPlanImage);
router.get('/:installationId/devices', installationController.getDevicesByInstallation);
router.get('/:id/rooms', installationController.getRoomsByInstallation);

module.exports = router;
