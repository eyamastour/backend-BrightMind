const express = require('express');
const router = express.Router();
const Actuator = require('../models/Actuator');
const Area = require('../models/Area');

router.get('/', async (req, res) => {
    try {
        const actuators = await Actuator.find();
        res.status(200).json(actuators);
    } catch (error) {
        res.status(500).json({ status: "FAILED", message: "Erreur lors de la récupération des actuateurs." });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const actuator = await Actuator.findById(req.params.id);
        if (!actuator) return res.status(404).json({ status: "FAILED", message: "Actuateur non trouvé" });
        res.status(200).json(actuator);
    } catch (error) {
        res.status(500).json({ status: "FAILED", message: "Erreur lors de la récupération de l'actuateur." });
    }
});

router.post('/', async (req, res) => {
    const { name, areaName, status, connected, lastUpdated } = req.body;
    
    if (!name || !areaName || typeof connected !== 'boolean' || !status) {
        return res.status(400).json({ status: "FAILED", message: "Champs de saisie non valides!" });
    }

    try {
        const newActuator = new Actuator({ name, areaName, status, connected, lastUpdated });
        await newActuator.save();

        const area = await Area.findById(areaName);
        if (!area) {
            return res.status(404).json({ status: "FAILED", message: "Zone non trouvée." });
        }

        area.actuators.push(newActuator._id);
        await area.save();

        res.status(201).json({ status: "SUCCESS", message: "Actuateur créé avec succès et ajouté à la zone!", actuator: newActuator });
    } catch (error) {
        res.status(500).json({ status: "FAILED", message: "Erreur lors de la création de l'actuateur." });
    }
});

router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { connected } = req.body;  // On récupère la nouvelle valeur de `connected`
    
    try {
      // Recherche de l'élément (sensor ou actuator) et mise à jour du statut
      const updatedItem = await Actuator.findByIdAndUpdate(
        id,
        { connected: connected },  // Mise à jour du champ `connected`
        { new: true }  // Retourner l'élément mis à jour
      );
  
      if (!updatedItem) {
        return res.status(404).json({ status: "FAILED", message: "Élément non trouvé." });
      }
  
      res.status(200).json({ status: "SUCCESS", message: "Statut mis à jour.", item: updatedItem });
    } catch (error) {
      console.error("Erreur de mise à jour :", error);
      res.status(500).json({ status: "FAILED", message: "Erreur lors de la mise à jour." });
    }
  });
  

router.delete('/:id', async (req, res) => {
    const actuatorId = req.params.id;

    try {
        const actuator = await Actuator.findByIdAndDelete(actuatorId); // Find and delete the actuator
        if (!actuator) {
            return res.status(404).json({ message: "Actuateur non trouvé" });
        }
        res.status(200).json({ message: "Actuateur supprimé avec succès" });
    } catch (error) {
        console.error("Erreur de suppression de l'actuateur:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

module.exports = router;
