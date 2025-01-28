const mongoose = require('mongoose');

const deviceHistorySchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
deviceHistorySchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('DeviceHistory', deviceHistorySchema);
