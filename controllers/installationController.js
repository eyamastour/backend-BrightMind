const Installation = require('../models/installation');

// Add a new installation
exports.addInstallation = async (req, res) => {
    try {
      const { name, route, boxId, latitude, longitude, parent } = req.body;
  
      const newInstallation = new Installation({
        name,
        route,
        boxId,
        latitude,
        longitude,
        parent: parent || 'ROOT' // Default to ROOT if no parent specified
      });
  
      const savedInstallation = await newInstallation.save();
      res.status(201).json(savedInstallation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
// Récupérer les appareils d'une installation
exports.getDevicesByInstallation = async (req, res) => {
  try {
    const { installationId } = req.params; // On récupère l'ID de l'installation depuis les paramètres de la requête

    // Trouver l'installation par son ID
    const installation = await Installation.findById(installationId).populate('devices'); // Assurez-vous de peupler le tableau devices

    if (!installation) {
      return res.status(404).json({ error: 'Installation not found' });
    }

    // Retourner la liste des appareils associés à l'installation
    res.status(200).json(installation.devices);
  } catch (error) {
    console.error('Error fetching devices for installation:', error);
    res.status(500).json({ error: 'Failed to fetch devices for the installation' });
  }
};

// Get all installations
exports.getAllInstallations = async (req, res) => {
  try {
    const installations = await Installation.find().populate('devices');
    res.status(200).json(installations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single installation by ID
exports.getInstallationById = async (req, res) => {
  try {
    const installation = await Installation.findById(req.params.id)
      .populate('rooms')
      .populate('devices');
    if (!installation) return res.status(404).json({ message: 'Installation not found' });
    res.status(200).json(installation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get rooms by installation ID
exports.getRoomsByInstallation = async (req, res) => {
  try {
    const installation = await Installation.findById(req.params.id).populate('rooms');
    if (!installation) return res.status(404).json({ message: 'Installation not found' });
    res.status(200).json(installation.rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an installation
exports.updateInstallation = async (req, res) => {
  try {
    const updatedInstallation = await Installation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedInstallation) return res.status(404).json({ message: 'Installation not found' });
    res.status(200).json(updatedInstallation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an installation
exports.deleteInstallation = async (req, res) => {
  try {
    const deletedInstallation = await Installation.findByIdAndDelete(req.params.id);
    if (!deletedInstallation) return res.status(404).json({ message: 'Installation not found' });
    res.status(200).json({ message: 'Installation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
