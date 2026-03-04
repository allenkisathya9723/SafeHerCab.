const mongoose = require('mongoose');

const sosEventSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driverName: String,
    vehicleNumber: String,
    userPhone: String,
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: String
    },
    nearestPoliceStation: {
        name: String,
        address: String,
        phone: String,
        distance: Number
    },
    alertsSent: {
        guardian: { type: Boolean, default: false },
        police: { type: Boolean, default: false },
        admin: { type: Boolean, default: false }
    },
    status: { type: String, enum: ['active', 'resolved'], default: 'active' },
    resolvedAt: Date,
    resolvedBy: String
}, { timestamps: true });

module.exports = mongoose.model('SosEvent', sosEventSchema);
