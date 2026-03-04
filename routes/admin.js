const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware/adminMiddleware');

// GET /api/admin/dashboard  
router.get('/dashboard', adminMiddleware, (req, res) => {
    const bookingRoute = require('./booking');
    const driverRoute = require('./drivers');
    const allBookings = bookingRoute.bookings ? [...bookingRoute.bookings.values()] : [];
    const allDrivers = driverRoute.driversMap ? [...driverRoute.driversMap.values()] : [];

    const stats = {
        totalBookings: allBookings.length,
        activeRides: allBookings.filter(b => ['assigned', 'arriving', 'onTrip'].includes(b.status)).length,
        completedRides: allBookings.filter(b => b.status === 'completed').length,
        cancelledRides: allBookings.filter(b => b.status === 'cancelled').length,
        emergencyRides: allBookings.filter(b => b.sosTriggered || b.status === 'emergency').length,
        totalDrivers: allDrivers.length,
        onlineDrivers: allDrivers.filter(d => d.status === 'online').length,
        pendingApproval: allDrivers.filter(d => !d.approved).length,
        activeSosAlerts: allBookings.filter(b => b.sosTriggered && b.status !== 'completed').length
    };

    res.json({ success: true, stats, recentBookings: allBookings.slice(-20).reverse(), drivers: allDrivers });
});

// GET /api/admin/sos-events
router.get('/sos-events', adminMiddleware, (req, res) => {
    res.json({ success: true, events: [] }); // Populated from MongoDB in production
});

// PATCH /api/admin/drivers/:id/approve
router.patch('/drivers/:id/approve', adminMiddleware, (req, res) => {
    const driverRoute = require('./drivers');
    const driver = driverRoute.driversMap && driverRoute.driversMap.get(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    driver.approved = req.body.approved !== false;
    res.json({ success: true, driver });
});

// POST /api/admin/broadcast
router.post('/broadcast', adminMiddleware, (req, res) => {
    const { message, type } = req.body;
    const io = req.app.get('io');
    if (io) io.emit('adminBroadcast', { message, type, timestamp: Date.now() });
    res.json({ success: true });
});

module.exports = router;
