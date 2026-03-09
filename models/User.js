const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    name: { type: String, trim: true },
    profilePhoto: { type: String, default: '' },
    emergencyContacts: [{
        name: String,
        phone: String,
        relation: String
    }],
    guardianPhone: { type: String, default: '' },
    guardianEmail: { type: String, trim: true, lowercase: true, default: '' },
    guardianTrackingEnabled: { type: Boolean, default: false },
    savedAddresses: [{
        label: String,
        address: String,
        lat: Number,
        lng: Number
    }],
    rideCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
