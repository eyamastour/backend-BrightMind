require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('../models/Room');
const Installation = require('../models/installation');

const mongoUrl = process.env.MONGODB_URI;

async function migrateRooms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get all rooms
    const rooms = await Room.find();
    console.log(`Found ${rooms.length} rooms`);

    // Process each room
    for (const room of rooms) {
      if (room.installation) {
        const installation = await Installation.findById(room.installation);
        if (installation) {
          // Check if room is not already in installation's rooms array
          if (!installation.rooms.includes(room._id)) {
            installation.rooms.push(room._id);
            await installation.save();
            console.log(`Added room ${room._id} to installation ${installation._id}`);
          } else {
            console.log(`Room ${room._id} already in installation ${installation._id}`);
          }
        } else {
          console.log(`Installation not found for room ${room._id}`);
        }
      } else {
        console.log(`Room ${room._id} has no installation reference`);
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateRooms();
