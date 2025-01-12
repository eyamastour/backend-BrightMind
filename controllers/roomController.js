const Room = require('../models/Room');

// Get all rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('devices')
      .populate('installation');
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single room by ID
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('devices')
      .populate('installation');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Installation = require('../models/installation');

// Create a new room
exports.createRoom = async (req, res) => {
  try {
    // Create the room
    const room = new Room({
      name: req.body.name,
      description: req.body.description,
      installation: req.body.installation
    });
    const newRoom = await room.save();

    // Update the installation's rooms array
    const installation = await Installation.findById(req.body.installation);
    if (!installation) {
      await Room.findByIdAndDelete(newRoom._id);
      return res.status(404).json({ message: 'Installation not found' });
    }

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
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // If installation is being changed, update both old and new installations
    if (req.body.installation && req.body.installation !== room.installation.toString()) {
      // Remove room from old installation
      if (room.installation) {
        const oldInstallation = await Installation.findById(room.installation);
        if (oldInstallation) {
          oldInstallation.rooms = oldInstallation.rooms.filter(r => r.toString() !== room._id.toString());
          await oldInstallation.save();
        }
      }

      // Add room to new installation
      const newInstallation = await Installation.findById(req.body.installation);
      if (!newInstallation) {
        return res.status(404).json({ message: 'New installation not found' });
      }
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
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Remove room from installation's rooms array
    if (room.installation) {
      const installation = await Installation.findById(room.installation);
      if (installation) {
        installation.rooms = installation.rooms.filter(r => r.toString() !== room._id.toString());
        await installation.save();
      }
    }

    await Room.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add device to room
exports.addDeviceToRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
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
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
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
