const express = require('express');
const router = express.Router();
const Area = require('../models/Area');

// Créer une nouvelle Area
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const newArea = new Area({ name });
    const savedArea = await newArea.save();
    res.status(201).json(savedArea);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la création de l\'area', error });
  }
});

// Lire toutes les Areas
router.get('/', async (req, res) => {
  try {
    const areas = await Area.find();
    res.status(200).json(areas);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des areas', error });
  }
});

// Lire une Area par ID
router.get('/:id', async (req, res) => {
  try {
    const area = await Area.findById(req.params.id).populate('sensors actuators');
    if (!area) {
      return res.status(404).json({ message: 'Area non trouvée' });
    }
    res.status(200).json(area);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'area', error });
  }
});

// Mettre à jour une Area
router.put('/:id', async (req, res) => {
  try {
    const { name, sensors, actuators } = req.body;
    const updatedArea = await Area.findByIdAndUpdate(
      req.params.id,
      { name, sensors, actuators },
      { new: true }
    );
    if (!updatedArea) {
      return res.status(404).json({ message: 'Area non trouvée' });
    }
    res.status(200).json(updatedArea);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'area', error });
  }
});

// Supprimer une Area
router.delete('/:id', async (req, res) => {
  try {
    const deletedArea = await Area.findByIdAndDelete(req.params.id);
    if (!deletedArea) {
      return res.status(404).json({ message: 'Area non trouvée' });
    }
    res.status(200).json({ message: 'Area supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'area', error });
  }
});

// Ajouter des Sensors et Actuators à une Area
router.put('/:id/addSensorsAndActuators', async (req, res) => {
  try {
    const { sensors, actuators } = req.body;
    const updatedArea = await Area.findByIdAndUpdate(
      req.params.id,
      { $push: { sensors: { $each: sensors }, actuators: { $each: actuators } } },
      { new: true }
    );
    if (!updatedArea) {
      return res.status(404).json({ message: 'Area non trouvée' });
    }
    res.status(200).json(updatedArea);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout de sensors et actuators', error });
  }
});

module.exports = router;
