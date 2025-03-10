const Installation = require('../models/installation');
const User = require('../models/User');

// Add a new installation
exports.addInstallation = async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can add installations' });
      }

      const { name, cluster, route, boxId, latitude, longitude, parent, isCluster } = req.body;
      
      const newInstallation = new Installation({
        name,
        cluster: cluster || name, // Use cluster if provided, otherwise use name
        route,
        boxId,
        latitude,
        longitude,
        parent: parent || 'ROOT',
        isCluster: isCluster !== undefined ? isCluster : (parent === 'ROOT' || parent === undefined), // If isCluster is provided, use it, otherwise determine based on parent
        userId: req.userId // Ajout de l'userId depuis le token
      });
  
      const savedInstallation = await newInstallation.save();
      res.status(201).json(savedInstallation);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
};
  
// Get devices by installation ID
exports.getDevicesByInstallation = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const installation = await Installation.findById(req.params.installationId).populate('devices');

    if (!installation) {
      return res.status(404).json({ error: 'Installation not found' });
    }

    // Check if user has permission to view this installation
    const hasPermission = 
      user.role === 'admin' || 
      installation.userId.toString() === req.userId || 
      (user.installationPermissions && user.installationPermissions.some(
        permId => permId.toString() === installation._id.toString()
      ));

    if (!hasPermission) {
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
      // Admin sees all installations
      installations = await Installation.find().populate('devices');
    } else {
      // Regular user sees only installations they have permission for
      if (user.installationPermissions && user.installationPermissions.length > 0) {
        installations = await Installation.find({
          _id: { $in: user.installationPermissions }
        }).populate('devices');
      } else {
        // If no specific permissions, show installations created by the user
        installations = await Installation.find({ userId: req.userId }).populate('devices');
      }
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

    // Check if user has permission to view this installation
    const hasPermission = 
      user.role === 'admin' || 
      installation.userId.toString() === req.userId || 
      (user.installationPermissions && user.installationPermissions.some(
        permId => permId.toString() === installation._id.toString()
      ));

    if (!hasPermission) {
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

    // Check if user has permission to view this installation
    const hasPermission = 
      user.role === 'admin' || 
      installation.userId.toString() === req.userId || 
      (user.installationPermissions && user.installationPermissions.some(
        permId => permId.toString() === installation._id.toString()
      ));

    if (!hasPermission) {
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

    // Check if user has permission to update this installation
    const hasPermission = 
      user.role === 'admin' || 
      installation.userId.toString() === req.userId || 
      (user.installationPermissions && user.installationPermissions.some(
        permId => permId.toString() === installation._id.toString()
      ));

    if (!hasPermission) {
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

    // Only admin can delete installations
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete installations' });
    }

    await Installation.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Installation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
