const express = require('express');
const router = express.Router();

// POST /api/payment/initiate
router.post('/initiate', (req, res) => {
    const { bookingId, amount, method } = req.body;
    if (!bookingId || !amount) return res.status(400).json({ error: 'Booking ID and amount required' });

    const paymentId = `PAY${Date.now()}`;
    res.json({
        success: true,
        paymentId,
        bookingId,
        amount,
        method: method || 'cash',
        status: 'pending',
        upiDeeplink: method === 'upi' ? `upi://pay?pa=safehercab@icici&pn=SafeHerCab&am=${amount}&cu=INR&tr=${paymentId}` : null,
        message: 'Payment initiated'
    });
});

// POST /api/payment/verify
router.post('/verify', (req, res) => {
    const { paymentId, bookingId } = req.body;
    // Mock verification (integrate Razorpay/Paytm in production)
    res.json({ success: true, paymentId, bookingId, status: 'success', verifiedAt: new Date() });
});

// GET /api/payment/history/:userId
router.get('/history/:userId', (req, res) => {
    res.json({ success: true, payments: [] }); // From DB in production
});

module.exports = router;
