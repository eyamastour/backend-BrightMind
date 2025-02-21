const mongoose = require('mongoose');

// Définir un schéma pour le device
const deviceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true   
  },
  zone: { 
    type: String, 
    required: true   
  },
  type: {
    type: String,
    enum: [
      'on/off device',
      'IR telecommand',
      'climatic station',
      'movement station',
      'command motor',
      'camera station',
      'sensor'
    ], // Types spécifiques de devices
    required: false
  },
  deviceType: { 
    type: String, 
    enum: ['actuator', 'sensor'], // Choix entre actuator ou sensor
    required: true  
  },
  status: { 
    type: String, 
    enum: ['on', 'off', 'active', 'inactive'], // Added 'inactive' status
    required: false
  },
  enableConnection: {
    type: Boolean,
    default: true,
    required: false
  },
  value: { 
    type: Number, 
    required: false  // La valeur peut être facultative pour certains types de devices
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now,
    required: false
  },
  connected: { 
    type: Boolean, 
    required: false 
  },
  portServer: { 
    type: String, 
    required: false 
  },
  installation: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Installation',  // Référence à l'ID de l'installation
    required: false 
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',  // Référence à l'ID de la room
    required: false
  },
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Créer et exporter le modèle Device
const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
