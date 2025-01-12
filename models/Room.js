const mongoose = require('mongoose');

// Define schema for Room
const roomSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true   
  },
  description: { 
    type: String, 
    required: false   
  },
  devices: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Device'  // Reference to Device model
  }],
  installation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Installation',  // Reference to Installation like in Device model
    required: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save middleware to update the updatedAt timestamp
roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create and export Room model
const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
