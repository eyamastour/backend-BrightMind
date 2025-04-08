const Installation = require('../models/installation');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/plans';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'plan-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
}).single('planImage');

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
        cluster: cluster || name, 
        route,
        boxId,
        latitude,
        longitude,
        parent: parent || 'ROOT',
        isCluster: isCluster !== undefined ? isCluster : (parent === 'ROOT' || parent === undefined), // If isCluster is provided, use it, otherwise determine based on parent
        userId: req.userId 
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

// Upload plan image for an installation
exports.uploadPlanImage = async (req, res) => {
  try {
    // Check if user is authenticated and has permission
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

    // Handle file upload
    upload(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        // An unknown error occurred
        return res.status(500).json({ message: `Error: ${err.message}` });
      }

      // If no file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Update installation with the file path
      const filePath = req.file.path;
      
      // Update the installation with the file path
      installation.planImage = filePath;
      await installation.save();

      res.status(200).json({ 
        message: 'Plan image uploaded successfully',
        planImage: filePath
      });
    });
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
