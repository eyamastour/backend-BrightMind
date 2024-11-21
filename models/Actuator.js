const mongoose = require('mongoose');
const Schema = mongoose.Schema; 
const actuatorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    areaName: { type: Schema.Types.ObjectId, ref: 'Area' }, 
    status: {
        type: String,
        required: true,
        enum: ['on', 'off', 'error', 'maintenance'],
        default: 'off'
    },
    connected: {
        type: Boolean,
        required: true,
        default: false
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Actuator', actuatorSchema);
