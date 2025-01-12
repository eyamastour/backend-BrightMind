const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  route: { type: String, required: true },
  boxId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  parent: { type: String, ref: 'Installation', default: 'ROOT' }, // Valeur par défaut "ROOT"
  devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }], // Référence aux appareils
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }] // Référence aux rooms

}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

module.exports = mongoose.model('Installation', installationSchema);
