const Device = require('../models/device');
const Installation = require('../models/installation');
const Room = require('../models/Room');
const DeviceHistory = require('../models/deviceHistory');

// Fonction pour ajouter un nouveau device
// Fonction pour ajouter un nouveau device
exports.addDevice = async (req, res) => {
  try {
    const { name, zone, type, deviceType, status, value, lastUpdated, connected, portServer, installationId, roomId } = req.body;

    // Vérifier que tous les champs nécessaires sont présents
    if (!name || !zone || !type || !deviceType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Vérifier que le type de device est valide
    if (!['actuator', 'sensor'].includes(deviceType)) {
      return res.status(400).json({ error: 'Invalid deviceType. It should be "actuator" or "sensor".' });
    }

    // Créer un nouvel objet Device
    const newDevice = new Device({
      name,
      zone,
      type,
      deviceType,
      status,
      value,
      lastUpdated,
      connected,
      portServer
    });

    // Si roomId est fourni, associer le device à la room
    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: `Room with ID ${roomId} not found` });
      }
      newDevice.room = roomId;
      room.devices.push(newDevice._id);
      await room.save();
    }

    // Si installationId est fourni, on ajoute le device à l'installation correspondante
    if (installationId) {
      const installation = await Installation.findById(installationId);

      if (!installation) {
        return res.status(404).json({ error: `Installation with ID ${installationId} not found` });
      }

      // Ajouter le périphérique à l'installation dans la base de données
      newDevice.installation = installationId; // Associer l'ID de l'installation au périphérique
      await newDevice.save();

      // Create initial history record
      await DeviceHistory.create({
        deviceId: newDevice._id,
        deviceName: newDevice.name,
        deviceType: newDevice.deviceType,
        value: newDevice.value || (newDevice.deviceType === 'actuator' ? false : 0)
      });

      // Ajouter le périphérique à la liste des périphériques de l'installation
      installation.devices.push(newDevice._id); // Ajouter le périphérique à l'installation
      await installation.save();

      // Répondre avec le périphérique ajouté et l'installation mise à jour
      return res.status(201).json({ device: newDevice, installation });
    }

    // Sauvegarder le périphérique sans installation associée
    await newDevice.save();

    // Create initial history record even for devices without installation
    await DeviceHistory.create({
      deviceId: newDevice._id,
      deviceName: newDevice.name,
      deviceType: newDevice.deviceType,
      value: newDevice.value || (newDevice.deviceType === 'actuator' ? false : 0)
    });
    return res.status(201).json(newDevice);

  } catch (error) {
    console.error('Error adding device:', error);
    return res.status(500).json({ error: 'Server error, failed to add device' });
  }
};


  
// Fonction pour récupérer les devices
exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find().populate('room');
    res.status(200).json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
};

// Fonction pour récupérer un device spécifique
exports.getDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findById(id).populate('room');

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.status(200).json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
};

// Fonction pour mettre à jour un device
exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Get the current device to check for room changes
    const currentDevice = await Device.findById(id);
    if (!currentDevice) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // If room is being changed, update the references
    if (updatedData.room && updatedData.room !== currentDevice.room?.toString()) {
      // Remove device from old room if it exists
      if (currentDevice.room) {
        await Room.updateOne(
          { _id: currentDevice.room },
          { $pull: { devices: id } }
        );
      }

      // Add device to new room
      const newRoom = await Room.findById(updatedData.room);
      if (!newRoom) {
        return res.status(404).json({ error: 'New room not found' });
      }
      newRoom.devices.push(id);
      await newRoom.save();
    }

    // Update the device and populate room details
    // If value has changed, record it in history
    if ('value' in updatedData && currentDevice.value !== updatedData.value) {
      await DeviceHistory.create({
        deviceId: id,
        deviceName: currentDevice.name,
        deviceType: currentDevice.deviceType,
        value: updatedData.value
      });
    }

    const updatedDevice = await Device.findByIdAndUpdate(id, updatedData, { 
      new: true 
    }).populate('room');

    if (!updatedDevice) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.status(200).json(updatedDevice);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
};

// Get history for a specific device
exports.getDeviceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days) || 7;

    const device = await Device.findById(id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await DeviceHistory.find({
      deviceId: id,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching device history:', error);
    res.status(500).json({ error: 'Failed to fetch device history' });
  }
};

// Get history for all devices in an installation
exports.getInstallationDevicesHistory = async (req, res) => {
  try {
    const { installationId } = req.params;
    const days = parseInt(req.query.days) || 7;

    const installation = await Installation.findById(installationId);
    if (!installation) {
      return res.status(404).json({ error: 'Installation not found' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all devices in the installation
    const devices = await Device.find({ installation: installationId });
    const deviceIds = devices.map(device => device._id);

    const history = await DeviceHistory.find({
      deviceId: { $in: deviceIds },
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching installation devices history:', error);
    res.status(500).json({ error: 'Failed to fetch installation devices history' });
  }
};

// Fonction pour récupérer les devices d'une installation
exports.getDevicesByInstallation = async (req, res) => {
  try {
    const { installationId } = req.params;

    // Vérifier si l'installation existe
    const installation = await Installation.findById(installationId);
    if (!installation) {
      return res.status(404).json({ error: 'Installation not found' });
    }

    // Récupérer les devices de l'installation
    const devices = await Device.find({ installation: installationId });
    res.status(200).json(devices);
  } catch (error) {
    console.error('Error fetching devices for installation:', error);
    res.status(500).json({ error: 'Failed to fetch devices for installation' });
  }
};

// Fonction pour récupérer les devices d'une room
exports.getDevicesByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Vérifier si la room existe
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Fetch devices that have this room ID and populate room details
    const devices = await Device.find({ room: roomId }).populate('room');
    res.status(200).json(devices);
  } catch (error) {
    console.error('Error fetching devices for room:', error);
    res.status(500).json({ error: 'Failed to fetch devices for room' });
  }
};

// Fonction pour supprimer un device
exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDevice = await Device.findByIdAndDelete(id);

    if (!deletedDevice) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Remove device reference from room if it was associated with one
    if (deletedDevice.room) {
      await Room.updateOne(
        { _id: deletedDevice.room },
        { $pull: { devices: id } }
      );
    }

    // Remove device reference from installation if it was associated with one
    await Installation.updateMany(
      { devices: id },
      { $pull: { devices: id } }
    );

    res.status(200).json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
};
