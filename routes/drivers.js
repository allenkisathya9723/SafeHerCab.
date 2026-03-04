const express = require('express');
const router = express.Router();
const { getDistance } = require('../utils/geofence');

// Mock female drivers for Hyderabad (MongoDB in production)
const mockDrivers = [
    { id: 'drv001', name: 'Anjali Reddy', phone: '9876543210', photo: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 4.9, vehicleType: 'Cab', vehicleNumber: 'TS09AB1234', vehicleModel: 'Swift Dzire', vehicleColor: 'White', location: { lat: 17.3950, lng: 78.4880 }, status: 'online', approved: true, totalRides: 342 },
    { id: 'drv002', name: 'Priya Sharma', phone: '9876543211', photo: 'https://randomuser.me/api/portraits/women/68.jpg', rating: 4.7, vehicleType: 'Cab', vehicleNumber: 'TS10CD5678', vehicleModel: 'Honda Amaze', vehicleColor: 'Silver', location: { lat: 17.3810, lng: 78.4800 }, status: 'online', approved: true, totalRides: 218 },
    { id: 'drv003', name: 'Sravani Patel', phone: '9876543212', photo: 'https://randomuser.me/api/portraits/women/21.jpg', rating: 4.8, vehicleType: 'Auto', vehicleNumber: 'TS08EF9012', vehicleModel: 'Bajaj RE', vehicleColor: 'Yellow', location: { lat: 17.3920, lng: 78.4920 }, status: 'online', approved: true, totalRides: 567 },
    { id: 'drv004', name: 'Kavitha Naidu', phone: '9876543213', photo: 'https://randomuser.me/api/portraits/women/55.jpg', rating: 4.6, vehicleType: 'Bike', vehicleNumber: 'TS07GH3456', vehicleModel: 'Honda Activa', vehicleColor: 'Pink', location: { lat: 17.3870, lng: 78.4850 }, status: 'online', approved: true, totalRides: 891 },
    { id: 'drv005', name: 'Madhuri Rao', phone: '9876543214', photo: 'https://randomuser.me/api/portraits/women/33.jpg', rating: 4.8, vehicleType: 'Cab', vehicleNumber: 'TS11IJ7890', vehicleModel: 'Toyota Etios', vehicleColor: 'White', location: { lat: 17.4100, lng: 78.4750 }, status: 'online', approved: true, totalRides: 423 },
    { id: 'drv006', name: 'Deepika Verma', phone: '9876543215', photo: 'https://randomuser.me/api/portraits/women/76.jpg', rating: 4.5, vehicleType: 'Auto', vehicleNumber: 'TS12KL0123', vehicleModel: 'Bajaj Max', vehicleColor: 'Green', location: { lat: 17.3750, lng: 78.5000 }, status: 'online', approved: true, totalRides: 156 },
    { id: 'drv007', name: 'Sunitha Krishnan', phone: '9876543216', photo: 'https://randomuser.me/api/portraits/women/12.jpg', rating: 4.9, vehicleType: 'Bike', vehicleNumber: 'TS06MN4567', vehicleModel: 'TVS Jupiter', vehicleColor: 'Purple', location: { lat: 17.4000, lng: 78.4900 }, status: 'online', approved: true, totalRides: 1024 },
    { id: 'drv008', name: 'Rekha Pillai', phone: '9876543217', photo: 'https://randomuser.me/api/portraits/women/89.jpg', rating: 4.7, vehicleType: 'Cab', vehicleNumber: 'TS05OP8901', vehicleModel: 'Maruti WagonR', vehicleColor: 'Red', location: { lat: 17.3650, lng: 78.4700 }, status: 'online', approved: true, totalRides: 289 }
];


const driversMap = new Map(mockDrivers.map(d => [d.id, { ...d }]));

// GET /api/drivers/available?lat=&lng=&vehicleType=&radius=5
router.get('/available', (req, res) => {
    try {
        const { lat, lng, vehicleType, radius = 5 } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: 'Current location required' });

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseFloat(radius);

        let available = [...driversMap.values()].filter(d =>
            d.status === 'online' &&
            d.approved === true &&
            (!vehicleType || d.vehicleType === vehicleType)
        );

        // Calculate distance and filter within radius
        available = available
            .map(d => ({
                ...d,
                distance: parseFloat(getDistance(userLat, userLng, d.location.lat, d.location.lng).toFixed(2)),
                eta: Math.max(1, Math.ceil(getDistance(userLat, userLng, d.location.lat, d.location.lng) * 3))
            }))
            .filter(d => d.distance <= searchRadius)
            .sort((a, b) => a.distance - b.distance);

        // Dynamic generation: If no drivers are within the strict 2-3km radius,
        // move the online mock drivers to be scattered instantly around the user's pickup.
        if (available.length === 0) {
            let onlineDrivers = [...driversMap.values()].filter(d => d.status === 'online' && d.approved === true);
            if (vehicleType) onlineDrivers = onlineDrivers.filter(d => d.vehicleType === vehicleType);

            onlineDrivers.forEach((driver, idx) => {
                // Scatter them randomly within ~0.5 to 2.5 km
                const angle = Math.random() * Math.PI * 2;
                const distanceOffKm = 0.5 + Math.random() * 2.0;
                // 1 deg lat is ~111km
                const latOffset = (distanceOffKm * Math.cos(angle)) / 111;
                const lngOffset = (distanceOffKm * Math.sin(angle)) / (111 * Math.cos(userLat * Math.PI / 180));

                driver.location = { lat: userLat + latOffset, lng: userLng + lngOffset };

                available.push({
                    ...driver,
                    distance: parseFloat(distanceOffKm.toFixed(2)),
                    eta: Math.max(1, Math.ceil(distanceOffKm * 3))
                });
            });
            available.sort((a, b) => a.distance - b.distance);
        }

        res.json({ success: true, count: available.length, drivers: available });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/drivers/assign  <-- MUST be before /:id
router.post('/assign', (req, res) => {
    const { driverId, bookingId } = req.body;
    const driver = driversMap.get(driverId);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    driver.status = 'onTrip';
    driver.currentBookingId = bookingId;
    res.json({ success: true, driver });
});

// POST /api/drivers/location – Driver updates their location
router.post('/location', (req, res) => {
    const { driverId, lat, lng } = req.body;
    const driver = driversMap.get(driverId);
    if (driver) {
        driver.location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    res.json({ success: true });
});

// GET /api/drivers/admin/all – For admin dashboard  <-- MUST be before /:id
router.get('/admin/all', (req, res) => {
    res.json({ drivers: [...driversMap.values()] });
});

// GET /api/drivers/:id
router.get('/:id', (req, res) => {
    const driver = driversMap.get(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json({ driver });
});

// PATCH /api/drivers/:id/approve
router.patch('/:id/approve', (req, res) => {
    const driver = driversMap.get(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    driver.approved = req.body.approved !== false;
    res.json({ success: true, driver });
});

module.exports = router;
module.exports.driversMap = driversMap;
