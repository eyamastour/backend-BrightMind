const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cluster: { type: String, default: function() { return this.name; } }, // Cluster name, defaults to installation name
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: String, required: true },
  boxId: { type: String, required: true },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  planImage: { type: String }, // URL or path to the plan image
  parent: { type: mongoose.Schema.Types.Mixed, ref: 'Installation', default: 'ROOT' }, // Can be 'ROOT' or an ObjectId
  devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }], // Référence aux appareils
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }], // Référence aux rooms
  status: { type: String, enum: ['online', 'offline'], default: 'offline' }, // Status of the installation
  isCluster: { type: Boolean, default: function() { return this.parent === 'ROOT'; } } // Flag to distinguish between clusters and installations

}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

module.exports = mongoose.model('Installation', installationSchema);
