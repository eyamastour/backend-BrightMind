// routes/sensorRoutes.js
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
        const sensors = await Sensor.find();
        res.status(200).json(sensors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "FAILED", message: "An error occurred while fetching sensors." });
    }
});

/**
 * Get sensor by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const sensor = await Sensor.findById(req.params.id);
        if (!sensor) return res.status(404).json({ status: "FAILED", message: "Sensor not found." });
        res.status(200).json(sensor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "FAILED", message: "An error occurred while fetching the sensor." });
    }
});

router.post('/', async (req, res) => {
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
        // Créer un nouvel objet sensor
        const newSensor = new Sensor({ name, areaName, connected, lastUpdated, value });
        await newSensor.save();

        // Si une zone est spécifiée, ajoutez le capteur à cette zone
        if (areaName) {
            const area = await Area.findById(areaName);
            if (!area) {
                return res.status(404).json({ status: "FAILED", message: "Area not found." });
            }

            // Ajouter le capteur à la liste des capteurs de la zone
            area.sensors = area.sensors || []; // S'assurer que sensors est un tableau
            area.sensors.push(newSensor._id);
            await area.save();
        }

        res.status(201).json({
            status: "SUCCESS",
            message: "Sensor created successfully and added to the area!",
            sensor: newSensor
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "FAILED", message: "An error occurred while creating the sensor." });
    }
});



/**
 * Update an existing sensor
 */
router.put('/:id', async (req, res) => {
    const { name, areaName, connected, lastUpdated, value } = req.body;

    // Validate if the areaName is a valid ObjectId (if provided)
    if (areaName && !mongoose.Types.ObjectId.isValid(areaName)) {
        return res.status(400).json({ status: "FAILED", message: "Invalid areaName ObjectId!" });
    }

    try {
        const updatedSensor = await Sensor.findByIdAndUpdate(
            req.params.id,
            { name, areaName, connected, lastUpdated, value },
            { new: true } // This option returns the updated document
        );
        if (!updatedSensor) return res.status(404).json({ status: "FAILED", message: "Sensor not found." });
        res.status(200).json({ status: "SUCCESS", message: "Sensor updated successfully!", sensor: updatedSensor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "FAILED", message: "An error occurred while updating the sensor." });
    }
});


// Suppression d'un capteur
router.delete('/sensor/:id', async (req, res) => {
    try {
      const sensorId = req.params.id;
      const sensor = await Sensor.findByIdAndDelete(sensorId); // Recherche et suppression du capteur
  
      if (!sensor) {
        return res.status(404).json({ message: "Capteur non trouvé" });
      }
  
      res.status(200).json({ message: "Capteur supprimé avec succès" });
    } catch (error) {
      console.error("Erreur de suppression du capteur :", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });


module.exports = router;
