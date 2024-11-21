// models/Sensor.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sensorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    areaName: { type: Schema.Types.ObjectId, ref: 'Area' }, 

    connected: {
        type: Boolean,
        required: true,
        default: false
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    value: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Sensor', sensorSchema);
