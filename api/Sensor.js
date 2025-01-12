// routes/actuatorRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Sensor = require('../models/Sensor');
const Area = require('../models/Area');

/**
 * Get all sensors
 */
router.get('/', async (req, res) => {
    try {
        const sensors = await Sensor.find().populate('areaName', 'name'); // Inclure le nom de la zone
        res.status(200).json(sensors);
    } catch (error) {
        console.error("Erreur lors de la récupération des sensors:", error);
        res.status(500).json({ status: "FAILED", message: "Erreur lors de la récupération des sensors." });
    }
});

/**
 * Get sensor by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const sensor = await Sensor.findById(req.params.id);
        if (!sensor) return res.status(404).json({ status: "FAILED", message: "sensor not found." });
        res.status(200).json(sensor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "FAILED", message: "An error occurred while fetching the sensor." });
    }
});

/**
 * Ajouter un capteur
 */
router.post('/', async (req, res) => {
    const { name, areaName, connected, value } = req.body;

    // Validation des champs requis
    if (!name || typeof connected !== 'boolean' || value === undefined) {
        return res.status(400).json({
            status: "FAILED",
            message: "Champs obligatoires manquants ou invalides : 'name', 'connected', 'value'."
        });
    }

    // Vérifier si l'ObjectId de la zone est valide (si fourni)
    if (areaName && !mongoose.Types.ObjectId.isValid(areaName)) {
        return res.status(400).json({
            status: "FAILED",
            message: "L'ObjectId de la zone est invalide."
        });
    }

    try {
        // Créer une nouvelle instance de capteur
        const newSensor = new Sensor({
            name,
            areaName,
            connected,
            value,
            lastUpdated: Date.now() // Date mise à jour automatiquement
        });

        // Sauvegarder le capteur dans la base de données
        await newSensor.save();

        // Si une zone est spécifiée, ajouter le capteur à la zone
        if (areaName) {
            const area = await Area.findById(areaName);
            if (!area) {
                return res.status(404).json({
                    status: "FAILED",
                    message: "La zone spécifiée est introuvable."
                });
            }

            // Ajouter l'ID du capteur à la liste des capteurs de la zone
            area.sensors = area.sensors || []; // Assurer que sensors est un tableau
            area.sensors.push(newSensor._id);
            await area.save();
        }

        res.status(201).json({
            status: "SUCCESS",
            message: "Capteur créé avec succès.",
            sensor: newSensor
        });
    } catch (error) {
        console.error("Erreur lors de la création du capteur :", error);
        res.status(500).json({
            status: "FAILED",
            message: "Erreur interne du serveur."
        });
    }
});

// routes/sensorRoutes.js

router.put('/:id', async (req, res) => {
    const { name, areaName, connected, lastUpdated, value } = req.body;

    // Valider les champs d'entrée
    if (!name || typeof connected !== 'boolean' || value === undefined) {
        return res.status(400).json({ status: "FAILED", message: "Invalid input fields!" });
    }

    // Valider si areaName est un ObjectId valide (si fourni)
    if (areaName && !mongoose.Types.ObjectId.isValid(areaName)) {
        return res.status(400).json({ status: "FAILED", message: "Invalid areaName ObjectId!" });
    }

    try {
        // Trouver le capteur par son ID
        const updatedSensor = await Sensor.findByIdAndUpdate(
            req.params.id, // ID du capteur à mettre à jour
            {
                name,
                areaName,
                connected,
                lastUpdated,
                value
            },
            { new: true } // Retourner le capteur mis à jour
        );

        // Si le capteur n'a pas été trouvé, retourner une erreur
        if (!updatedSensor) {
            return res.status(404).json({ status: "FAILED", message: "Sensor not found." });
        }

        res.status(200).json({
            status: "SUCCESS",
            message: "Sensor updated successfully!",
            sensor: updatedSensor
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "FAILED", message: "An error occurred while updating the sensor." });
    }
});


/**
 * Delete an Sensor by ID
 */
router.delete('/:id', async (req, res) => {
    try {
        const deletedSensor = await Sensor.findByIdAndDelete(req.params.id);
        if (!deletedSensor) {
            return res.status(404).json({ message: 'Sensor not found' });
        }
        res.status(200).json({ message: 'Sensor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while deleting the Sensor', error });
    }
});

module.exports = router;
