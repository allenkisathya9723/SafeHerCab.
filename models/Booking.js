const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    pickup: {
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    drop: {
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    vehicleType: { type: String, enum: ['Cab', 'Auto', 'Bike'], required: true },
    distance: { type: Number }, // km
    estimatedFare: { type: Number },
    finalFare: { type: Number },
    estimatedDuration: { type: Number }, // minutes
    status: {
        type: String,
        enum: ['pending', 'assigned', 'arriving', 'onTrip', 'completed', 'cancelled', 'emergency'],
        default: 'pending'
    },
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['upi', 'card', 'wallet', 'cash'], default: 'cash' },
    guardianTrackingEnabled: { type: Boolean, default: false },
    guardianTrackingToken: { type: String },
    route: [{
        lat: Number,
        lng: Number,
        timestamp: Date
    }],
    sosTriggered: { type: Boolean, default: false },
    sosCount: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    cancelReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
