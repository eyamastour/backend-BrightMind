const Room = require('../models/Room');
const Installation = require('../models/installation');
const User = require('../models/User');

// Get all rooms
exports.getRooms = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let rooms;
    if (user.role === 'admin') {
      rooms = await Room.find()
        .populate('devices')
        .populate('installation');
    } else {
      // Get installations owned by the user
      const installations = await Installation.find({ userId: req.userId });
      const installationIds = installations.map(inst => inst._id);
      
      // Get rooms from those installations
      rooms = await Room.find({ installation: { $in: installationIds } })
        .populate('devices')
        .populate('installation');
    }
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single room by ID
exports.getRoom = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const room = await Room.findById(req.params.id)
      .populate('devices')
      .populate('installation');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user has permission to view this room
    const installation = await Installation.findById(room.installation);
    if (!installation) {
      return res.status(404).json({ message: 'Installation not found' });
    }

    if (user.role !== 'admin' && installation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this room' });
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new room
exports.createRoom = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has permission to add room to this installation
    const installation = await Installation.findById(req.body.installation);
    if (!installation) {
      return res.status(404).json({ message: 'Installation not found' });
    }

    if (user.role !== 'admin' && installation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to add room to this installation' });
    }

    // Create the room
    const room = new Room({
      name: req.body.name,
      description: req.body.description,
      installation: req.body.installation
    });
    const newRoom = await room.save();

    // Update the installation's rooms array
    installation.rooms.push(newRoom._id);
    await installation.save();

    res.status(201).json(newRoom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a room
exports.updateRoom = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const room = await Room.findById(req.params.id).populate('installation');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user has permission to update this room
    const installation = await Installation.findById(room.installation);
    if (!installation) {
      return res.status(404).json({ message: 'Installation not found' });
    }

    if (user.role !== 'admin' && installation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this room' });
    }

    // If installation is being changed, update both old and new installations
    if (req.body.installation && req.body.installation !== room.installation.toString()) {
      // Check if user has permission to move room to new installation
      const newInstallation = await Installation.findById(req.body.installation);
      if (!newInstallation) {
        return res.status(404).json({ message: 'New installation not found' });
      }

      if (user.role !== 'admin' && newInstallation.userId.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized to move room to this installation' });
      }

      // Remove room from old installation
      installation.rooms = installation.rooms.filter(r => r.toString() !== room._id.toString());
      await installation.save();

      // Add room to new installation
      newInstallation.rooms.push(room._id);
      await newInstallation.save();
    }

    // Update room fields
    if (req.body.name) room.name = req.body.name;
    if (req.body.description) room.description = req.body.description;
    if (req.body.installation) room.installation = req.body.installation;

    const updatedRoom = await room.save();
    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a room
exports.deleteRoom = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const room = await Room.findById(req.params.id).populate('installation');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user has permission to delete this room
    const installation = await Installation.findById(room.installation);
    if (!installation) {
      return res.status(404).json({ message: 'Installation not found' });
    }

    if (user.role !== 'admin' && installation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this room' });
    }

    // Remove room from installation's rooms array
    installation.rooms = installation.rooms.filter(r => r.toString() !== room._id.toString());
    await installation.save();

    await Room.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add device to room
exports.addDeviceToRoom = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const room = await Room.findById(req.params.id).populate('installation');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user has permission to add device to this room
    const installation = await Installation.findById(room.installation);
    if (!installation) {
      return res.status(404).json({ message: 'Installation not found' });
    }

    if (user.role !== 'admin' && installation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to add device to this room' });
    }

    const deviceId = req.body.deviceId;
    if (!room.devices.includes(deviceId)) {
      room.devices.push(deviceId);
      const updatedRoom = await room.save();
      res.status(200).json(updatedRoom);
    } else {
      res.status(400).json({ message: 'Device already in room' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove device from room
exports.removeDeviceFromRoom = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const room = await Room.findById(req.params.id).populate('installation');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user has permission to remove device from this room
    const installation = await Installation.findById(room.installation);
    if (!installation) {
      return res.status(404).json({ message: 'Installation not found' });
    }

    if (user.role !== 'admin' && installation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to remove device from this room' });
    }

    const deviceId = req.body.deviceId;
    const deviceIndex = room.devices.indexOf(deviceId);
    if (deviceIndex > -1) {
      room.devices.splice(deviceIndex, 1);
      const updatedRoom = await room.save();
      res.status(200).json(updatedRoom);
    } else {
      res.status(400).json({ message: 'Device not found in room' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
