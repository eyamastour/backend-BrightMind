// models/Area.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const areaSchema = new Schema({
    name: { type: String, required: true },
    sensors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sensor' }],
    actuators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actuator' }]
});

const Area = mongoose.model('Area', areaSchema);
module.exports = Area;
