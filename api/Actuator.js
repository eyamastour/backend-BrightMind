const express = require('express');
const router = express.Router();
const Actuator = require('../models/Actuator');
const Area = require('../models/Area');

// Récupérer tous les actuateurs
router.get('/', async (req, res) => {
    try {
        const actuators = await Actuator.find().populate('areaName', 'name'); // Inclure le nom de la zone
        res.status(200).json(actuators);
    } catch (error) {
        console.error("Erreur lors de la récupération des actuateurs:", error);
        res.status(500).json({ status: "FAILED", message: "Erreur lors de la récupération des actuateurs." });
    }
});

// Récupérer un actuateur par son ID
router.get('/:id', async (req, res) => {
    try {
        const actuator = await Actuator.findById(req.params.id).populate('areaName', 'name');
        if (!actuator) {
            return res.status(404).json({ status: "FAILED", message: "Actuateur non trouvé." });
        }
        res.status(200).json(actuator);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'actuateur:", error);
        res.status(500).json({ status: "FAILED", message: "Erreur lors de la récupération de l'actuateur." });
    }
});

// Créer un nouvel actuateur et l'ajouter à une zone
router.post('/', async (req, res) => {
    const { name, areaName, status, connected } = req.body;

    // Validation des champs
    if (!name || !areaName || typeof connected !== 'boolean' || !status) {
        return res.status(400).json({ status: "FAILED", message: "Champs de saisie non valides!" });
    }

    try {
        // Vérification si la zone existe
        const area = await Area.findById(areaName);
        if (!area) {
            return res.status(404).json({ status: "FAILED", message: "Zone non trouvée." });
        }

        // Création de l'actuateur
        const newActuator = new Actuator({
            name,
            areaName,
            status,
            connected,
        });

        await newActuator.save();

        // Ajouter l'actuateur à la zone
        area.actuators.push(newActuator._id);
        await area.save();

        res.status(201).json({ status: "SUCCESS", message: "Actuateur créé avec succès et ajouté à la zone!", actuator: newActuator });
    } catch (error) {
        console.error("Erreur lors de la création de l'actuateur:", error);
        res.status(500).json({ status: "FAILED", message: "Erreur lors de la création de l'actuateur." });
    }
});

// Mettre à jour un actuateur
router.put('/:id', async (req, res) => {
    const { connected, name, status } = req.body; // Ajout d'autres champs si nécessaire

    try {
        const updatedActuator = await Actuator.findByIdAndUpdate(
            req.params.id,
            { connected, name, status, lastUpdated: Date.now() },
            { new: true } // Retourner l'objet mis à jour
        );

        if (!updatedActuator) {
            return res.status(404).json({ status: "FAILED", message: "Actuateur non trouvé." });
        }

        res.status(200).json({ status: "SUCCESS", message: "Actuateur mis à jour avec succès.", actuator: updatedActuator });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'actuateur:", error);
        res.status(500).json({ status: "FAILED", message: "Erreur lors de la mise à jour de l'actuateur." });
    }
});

// Supprimer un actuateur
router.delete('/:id', async (req, res) => {
    const actuatorId = req.params.id;

    try {
        const actuator = await Actuator.findByIdAndDelete(actuatorId); // Trouver et supprimer l'actuateur
        if (!actuator) {
            return res.status(404).json({ status: "FAILED", message: "Actuateur non trouvé." });
        }

        // Supprimer l'actuateur de la zone associée
        const area = await Area.findById(actuator.areaName);
        if (area) {
            area.actuators = area.actuators.filter(actId => actId.toString() !== actuatorId);
            await area.save();
        }

        res.status(200).json({ status: "SUCCESS", message: "Actuateur supprimé avec succès." });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'actuateur:", error);
        res.status(500).json({ status: "FAILED", message: "Erreur lors de la suppression de l'actuateur." });
    }
});

module.exports = router;
