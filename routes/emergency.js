const express = require('express');
const router = express.Router();
const { sendSOSAlert, sendPoliceAlert } = require('../utils/smsHelper');
const { sendSOSEmail } = require('../utils/emailHelper');
const logger = require('../utils/logger');
const { findNearestStations, hyderabadPoliceStations } = require('../data/hyderabadPoliceStations');

const sosCooldowns = new Map(); // bookingId → lastSOSTime
const SOS_COOLDOWN_MS = 30000; // 30 seconds

// GET /api/emergency/police?lat=&lng=&limit=5
router.get('/police', (req, res) => {
    try {
        const { lat, lng, limit = 5 } = req.query;
        const userLat = parseFloat(lat) || 17.3850;
        const userLng = parseFloat(lng) || 78.4867;

        const sorted = findNearestStations(userLat, userLng, parseInt(limit) || 5)
            .map(ps => ({ ...ps, distance: ps.distanceKm }));

        res.json({ success: true, policeStations: sorted, nearest: sorted[0] || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/emergency/sos
router.post('/sos', async (req, res) => {
    try {
        const { bookingId, userId, userName, userPhone, driverName, vehicleNumber, lat, lng, guardianPhone, guardianEmail } = req.body;

        if (!lat || !lng) return res.status(400).json({ error: 'Location required for SOS' });

        // Cooldown check
        const lastSOS = sosCooldowns.get(bookingId);
        if (lastSOS && Date.now() - lastSOS < SOS_COOLDOWN_MS) {
            const remainingMs = SOS_COOLDOWN_MS - (Date.now() - lastSOS);
            return res.status(429).json({ error: 'SOS cooldown active', remainingMs });
        }
        sosCooldowns.set(bookingId, Date.now());

        // Find nearest police station
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const [nearestPS] = findNearestStations(userLat, userLng, 1);
        if (nearestPS) nearestPS.distance = nearestPS.distanceKm;

        // Log SOS event
        const sosEvent = {
            id: `SOS${Date.now()}`,
            bookingId, userId, userName, userPhone, driverName, vehicleNumber,
            location: { lat: userLat, lng: userLng },
            nearestPoliceStation: nearestPS,
            alertsSent: { guardian: false, email: false, police: false, admin: true },
            status: 'active',
            createdAt: new Date()
        };

        // Emit to admin via socket
        const io = req.app.get('io');
        if (io) {
            io.to('admin').emit('sosAlert', sosEvent);
            io.to(bookingId).emit('sosAlert', sosEvent);
        }

        // Send SMS to guardian
        const alertResults = {};
        const locationLink = `https://maps.google.com/?q=${userLat},${userLng}`;

        if (guardianPhone) {
            alertResults.guardian = await sendSOSAlert(guardianPhone, userName || userPhone, driverName || 'Unknown', vehicleNumber || 'Unknown', locationLink);
            sosEvent.alertsSent.guardian = alertResults.guardian.success;
        }

        // Send Email to guardian
        logger.info(`SOS Check: guardianEmail=${guardianEmail}`);
        if (guardianEmail) {
            alertResults.email = await sendSOSEmail(guardianEmail, {
                userName: userName || userPhone,
                userPhone,
                driverName: driverName || 'Unknown',
                vehicleNumber: vehicleNumber || 'Unknown',
                locationLink
            });
            sosEvent.alertsSent.email = alertResults.email.success;
        }

        // Send SMS to nearest police station
        if (nearestPS && nearestPS.phone) {
            alertResults.police = await sendPoliceAlert(nearestPS.phone, userName || userPhone, driverName || 'Unknown', vehicleNumber || 'Unknown', locationLink);
            sosEvent.alertsSent.police = alertResults.police.success;
        }

        logger.warn(`🚨 SOS: ${bookingId} | User: ${userPhone} | Location: ${lat},${lng}`);

        res.json({
            success: true,
            sosEventId: sosEvent.id,
            nearestPoliceStation: nearestPS,
            alertsSent: sosEvent.alertsSent,
            locationLink: `https://maps.google.com/?q=${userLat},${userLng}`
        });
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/emergency/resolve
router.post('/resolve', (req, res) => {
    const { sosEventId, resolvedBy } = req.body;
    res.json({ success: true, resolvedAt: new Date(), resolvedBy });
});

module.exports = router;
