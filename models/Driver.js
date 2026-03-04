const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    photo: { type: String, default: 'https://ui-avatars.com/api/?name=Driver&background=e91e8c&color=fff' },
    gender: { type: String, default: 'female', enum: ['female'] },
    rating: { type: Number, default: 4.5, min: 1, max: 5 },
    totalRides: { type: Number, default: 0 },
    vehicleType: { type: String, enum: ['Cab', 'Auto', 'Bike'], required: true },
    vehicleNumber: { type: String, required: true },
    vehicleModel: { type: String },
    vehicleColor: { type: String },
    location: {
        lat: { type: Number, default: 17.3850 },
        lng: { type: Number, default: 78.4867 }
    },
    status: { type: String, enum: ['online', 'offline', 'onTrip'], default: 'offline' },
    approved: { type: Boolean, default: false },
    documents: {
        licenseVerified: { type: Boolean, default: false },
        backgroundCheck: { type: Boolean, default: false },
        trainingCompleted: { type: Boolean, default: false }
    },
    currentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
