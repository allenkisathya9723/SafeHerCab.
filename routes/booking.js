const express = require('express');
const router = express.Router();
const { isInHyderabad, getDistance } = require('../utils/geofence');
const { sendGuardianTrackingLink } = require('../utils/smsHelper');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { searchLocations, getCoordsForLocation } = require('../data/hyderabadLocations');

// GET /api/booking/search?q=banjara&limit=8
// Powers the booking page location autocomplete
router.get('/search', (req, res) => {
    const { q = '', limit = 8 } = req.query;
    if (q.length < 2) return res.json({ locations: [] });
    const results = searchLocations(q, parseInt(limit));
    res.json({ locations: results });
});

// In-memory booking store (MongoDB in production)
const bookings = new Map();
const mockGuardianPhones = new Map(); // userId -> guardianPhone

// Fare rates per km
const FARE_RATES = { Cab: 12, Auto: 8, Bike: 5 };
const BASE_FARE = { Cab: 40, Auto: 25, Bike: 15 };
const MIN_FARE = { Cab: 60, Auto: 40, Bike: 25 };

function calcFare(distKm, type) {
    const fare = BASE_FARE[type] + (distKm * FARE_RATES[type]);
    return Math.max(fare, MIN_FARE[type]);
}

// POST /api/booking/estimate
router.post('/estimate', (req, res) => {
    try {
        const { pickupLat, pickupLng, dropLat, dropLng, vehicleType } = req.body;
        if (!pickupLat || !dropLat) return res.status(400).json({ error: 'Pickup and drop coordinates required' });

        if (!isInHyderabad(pickupLat, pickupLng)) {
            return res.status(400).json({ error: 'Pickup location is outside Hyderabad service area' });
        }
        if (!isInHyderabad(dropLat, dropLng)) {
            return res.status(400).json({ error: 'Drop location is outside Hyderabad service area' });
        }

        const distKm = getDistance(pickupLat, pickupLng, dropLat, dropLng);
        const type = vehicleType || 'Cab';
        const fare = calcFare(distKm, type);
        const etaMinutes = Math.ceil(distKm * 3); // ~20km/h avg

        res.json({
            success: true,
            estimates: {
                Cab: { fare: Math.round(calcFare(distKm, 'Cab')), eta: etaMinutes, distance: distKm.toFixed(2) },
                Auto: { fare: Math.round(calcFare(distKm, 'Auto')), eta: etaMinutes + 2, distance: distKm.toFixed(2) },
                Bike: { fare: Math.round(calcFare(distKm, 'Bike')), eta: Math.max(etaMinutes - 2, 3), distance: distKm.toFixed(2) }
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/booking/create
router.post('/create', (req, res) => {
    try {
        const { userId, pickupAddress, pickupLat, pickupLng, dropAddress, dropLat, dropLng, vehicleType, driverId, guardianPhone, paymentMethod } = req.body;

        if (!isInHyderabad(pickupLat, pickupLng) || !isInHyderabad(dropLat, dropLng)) {
            return res.status(400).json({ error: 'Service available only within Hyderabad' });
        }

        const bookingId = `BK${Date.now()}`;
        const distKm = getDistance(pickupLat, pickupLng, dropLat, dropLng);
        const fare = Math.round(calcFare(distKm, vehicleType || 'Cab'));
        const guardianToken = uuidv4();

        const booking = {
            id: bookingId,
            userId,
            driverId: driverId || null,
            pickup: { address: pickupAddress, lat: pickupLat, lng: pickupLng },
            drop: { address: dropAddress, lat: dropLat, lng: dropLng },
            vehicleType: vehicleType || 'Cab',
            distance: distKm.toFixed(2),
            estimatedFare: fare,
            otp: Math.floor(1000 + Math.random() * 9000).toString(),
            status: driverId ? 'assigned' : 'pending',
            paymentMethod: paymentMethod || 'cash',
            paymentStatus: 'pending',
            guardianTrackingEnabled: !!guardianPhone,
            guardianPhone,
            guardianToken,
            sosTriggered: false,
            sosCount: 0,
            createdAt: new Date(),
            route: []
        };

        bookings.set(bookingId, booking);
        if (guardianPhone) mockGuardianPhones.set(userId, guardianPhone);

        // Send guardian tracking link
        if (guardianPhone) {
            const trackingUrl = `${req.protocol}://${req.get('host')}/guardian.html?token=${guardianToken}&bookingId=${bookingId}`;
            sendGuardianTrackingLink(guardianPhone, userId, trackingUrl).catch(logger.error);
        }

        logger.info(`Booking created: ${bookingId}`);
        res.json({ success: true, bookingId, booking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/booking/:id
router.get('/:id', (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
});

// PATCH /api/booking/:id/status
router.patch('/:id/status', (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const { status, driverId } = req.body;
    booking.status = status;
    if (driverId) booking.driverId = driverId;
    if (status === 'onTrip') booking.startTime = new Date();
    if (status === 'completed') { booking.endTime = new Date(); booking.paymentStatus = 'success'; }
    res.json({ success: true, booking });
});

// POST /api/booking/:id/cancel
router.post('/:id/cancel', (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    booking.status = 'cancelled';
    booking.cancelReason = req.body.reason || 'User cancelled';
    res.json({ success: true });
});

// POST /api/booking/:id/rate
router.post('/:id/rate', (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    booking.rating = req.body.rating;
    booking.feedback = req.body.feedback;
    res.json({ success: true });
});

// GET /api/booking/user/:userId
router.get('/user/:userId', (req, res) => {
    const userBookings = [...bookings.values()].filter(b => b.userId === req.params.userId);
    res.json({ bookings: userBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

// Export for server access
module.exports = router;
module.exports.bookings = bookings;
