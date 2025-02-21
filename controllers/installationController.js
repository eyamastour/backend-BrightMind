const Installation = require('../models/installation');
const User = require('../models/User');

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
        parent: parent || 'ROOT',
        userId: req.userId // Ajout de l'userId depuis le token
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
    const user = await User.findById(req.userId);
    const installation = await Installation.findById(req.params.installationId).populate('devices');

    if (!installation) {
      return res.status(404).json({ error: 'Installation not found' });
    }

    // Vérifier si l'utilisateur a le droit de voir cette installation
    if (user.role !== 'admin' && installation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this installation' });
    }

    res.status(200).json(installation.devices);
  } catch (error) {
    console.error('Error fetching devices for installation:', error);
    res.status(500).json({ error: 'Failed to fetch devices for the installation' });
  }
};

// Get all installations
exports.getAllInstallations = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let installations;
    if (user.role === 'admin') {
      // Admin voit toutes les installations
      installations = await Installation.find().populate('devices');
    } else {
      // User normal voit uniquement ses installations
      installations = await Installation.find({ userId: req.userId }).populate('devices');
    }
    
    res.status(200).json(installations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single installation by ID
exports.getInstallationById = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const installation = await Installation.findById(req.params.id)
      .populate('rooms')
      .populate('devices');

    if (!installation) {
      return res.status(404).json({ message: 'Installation not found' });
    }

    // Vérifier si l'utilisateur a le droit de voir cette installation
    if (user.role !== 'admin' && installation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this installation' });
    }

    res.status(200).json(installation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get rooms by installation ID
exports.getRoomsByInstallation = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const installation = await Installation.findById(req.params.id).populate('rooms');

    if (!installation) {
      return res.status(404).json({ message: 'Installation not found' });
    }

    // Vérifier si l'utilisateur a le droit de voir cette installation
    if (user.role !== 'admin' && installation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this installation' });
    }

    res.status(200).json(installation.rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an installation
exports.updateInstallation = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const installation = await Installation.findById(req.params.id);

    if (!installation) {
      return res.status(404).json({ message: 'Installation not found' });
    }

    // Vérifier si l'utilisateur a le droit de modifier cette installation
    if (user.role !== 'admin' && installation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this installation' });
    }

    const updatedInstallation = await Installation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedInstallation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an installation
exports.deleteInstallation = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const installation = await Installation.findById(req.params.id);

    if (!installation) {
      return res.status(404).json({ message: 'Installation not found' });
    }

    // Vérifier si l'utilisateur a le droit de supprimer cette installation
    if (user.role !== 'admin' && installation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this installation' });
    }

    await Installation.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Installation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
