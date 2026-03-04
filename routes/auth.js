const express = require('express');
const router = express.Router();
const { generateOTP, storeOTP, verifyOTP } = require('../utils/otpManager');
const { sendOTPSms } = require('../utils/smsHelper');
const { generateToken } = require('../utils/jwtHelper');
const logger = require('../utils/logger');

// Mock in-memory user store for demo (replace with MongoDB in production)
const mockUsers = new Map();

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({ error: 'Invalid Indian mobile number' });
        }
        const otp = generateOTP();
        const result = storeOTP(phone, otp);
        if (!result.success) {
            return res.status(429).json({ error: result.message, cooldownMs: result.cooldownMs });
        }
        await sendOTPSms(phone, otp);
        logger.info(`OTP sent to ${phone}: ${otp}`);
        res.json({ success: true, message: 'OTP sent successfully', devOtp: otp });
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

        const result = verifyOTP(phone, otp);
        if (!result.success) return res.status(400).json({ error: result.message });

        // Get or create user
        let user = mockUsers.get(phone);
        if (!user) {
            user = { id: `usr_${Date.now()}`, phone, name: '', isNew: true, createdAt: new Date() };
            mockUsers.set(phone, user);
        }

        const token = generateToken({ userId: user.id, phone, role: 'user' });
        res.json({ success: true, token, user: { id: user.id, phone, name: user.name, isNew: user.isNew } });
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// POST /api/auth/register (update profile after first login)
router.post('/register', async (req, res) => {
    try {
        const { phone, name, email, guardianPhone } = req.body;
        if (!phone || !name) return res.status(400).json({ error: 'Phone and name required' });

        let user = mockUsers.get(phone) || { id: `usr_${Date.now()}`, phone };
        user = { ...user, name, email, guardianPhone, isNew: false, updatedAt: new Date() };
        mockUsers.set(phone, user);

        const token = generateToken({ userId: user.id, phone, role: 'user' });
        res.json({ success: true, token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const { verifyToken } = require('../utils/jwtHelper');
        const decoded = verifyToken(auth.split(' ')[1]);
        const user = mockUsers.get(decoded.phone) || { id: decoded.userId, phone: decoded.phone };
        res.json({ user });
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
