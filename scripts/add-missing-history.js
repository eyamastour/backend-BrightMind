const mongoose = require('mongoose');
require('dotenv').config();

const Device = require('../models/device');
const DeviceHistory = require('../models/deviceHistory');

async function addMissingHistory() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all devices
    const devices = await Device.find();
    console.log(`Found ${devices.length} devices`);

    let addedCount = 0;

    // For each device
    for (const device of devices) {
      // Check if device has any history records
      const historyExists = await DeviceHistory.exists({ deviceId: device._id });
      
      if (!historyExists) {
        // Create initial history record
        await DeviceHistory.create({
          deviceId: device._id,
          deviceName: device.name,
          deviceType: device.deviceType,
          value: device.value || (device.deviceType === 'actuator' ? false : 0),
          // Set timestamp to a few days ago to ensure it shows up in default 7-day view
          timestamp: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)) // 3 days ago
        });
        addedCount++;
        console.log(`Added history record for device: ${device.name}`);
      }
    }

    console.log(`Added history records for ${addedCount} devices`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addMissingHistory();
