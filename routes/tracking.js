const express = require('express');
const router = express.Router();

// POST /api/tracking/update – Driver pushes location
router.post('/update', (req, res) => {
    try {
        const { bookingId, lat, lng, speed, heading, driverId } = req.body;
        const io = req.app.get('io');
        if (io && bookingId) {
            io.to(bookingId).emit('locationUpdate', { lat, lng, speed, heading, timestamp: Date.now() });
            io.to('admin').emit('rideLocationUpdate', { bookingId, lat, lng, speed, heading, driverId });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tracking/offline-alert – Network failure detected by client
// NOTE: Must be before /:bookingId to avoid matching 'offline-alert' as a param
router.post('/offline-alert', async (req, res) => {
    try {
        const { bookingId, userId, guardianPhone, driverName, vehicleNumber, lastLat, lastLng, userName } = req.body;
        const { sendOfflineEmergency } = require('../utils/smsHelper');
        const logger = require('../utils/logger');

        logger.warn(`⚠️ Offline alert for booking ${bookingId}`);

        let smsSent = false;
        if (guardianPhone) {
            const result = await sendOfflineEmergency(guardianPhone, userName || userId, lastLat, lastLng, driverName, vehicleNumber);
            smsSent = result.success;
        }

        const io = req.app.get('io');
        if (io) io.to('admin').emit('offlineAlert', { bookingId, userId, lastLat, lastLng });

        res.json({ success: true, smsSent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tracking/:bookingId – Get tracking status
router.get('/:bookingId', (req, res) => {
    res.json({ bookingId: req.params.bookingId, status: 'live', message: 'Connect via Socket.io for real-time updates' });
});

module.exports = router;
