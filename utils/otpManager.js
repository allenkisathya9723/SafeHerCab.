// OTP Manager – in-memory store (use Redis in production)
const otpStore = new Map();

const OTP_EXPIRY = (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000;
const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
const RESEND_COOLDOWN = 60 * 1000; // 1 min

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOTP(phone, otp) {
    const existing = otpStore.get(phone);
    const now = Date.now();

    // Cooldown check
    if (existing && now - existing.createdAt < RESEND_COOLDOWN) {
        return { success: false, message: 'Please wait before requesting another OTP', cooldownMs: RESEND_COOLDOWN - (now - existing.createdAt) };
    }

    otpStore.set(phone, {
        otp,
        attempts: 0,
        createdAt: now,
        expiresAt: now + OTP_EXPIRY
    });
    return { success: true };
}

function verifyOTP(phone, inputOtp) {
    const record = otpStore.get(phone);
    if (!record) return { success: false, message: 'OTP not found. Please request a new OTP.' };
    if (Date.now() > record.expiresAt) {
        otpStore.delete(phone);
        return { success: false, message: 'OTP expired. Please request a new OTP.' };
    }
    if (record.attempts >= MAX_ATTEMPTS) {
        otpStore.delete(phone);
        return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }
    if (record.otp !== inputOtp) {
        record.attempts++;
        return { success: false, message: `Invalid OTP. ${MAX_ATTEMPTS - record.attempts} attempts remaining.` };
    }
    otpStore.delete(phone);
    return { success: true };
}

function getRemainingCooldown(phone) {
    const record = otpStore.get(phone);
    if (!record) return 0;
    const remaining = RESEND_COOLDOWN - (Date.now() - record.createdAt);
    return Math.max(0, remaining);
}

module.exports = { generateOTP, storeOTP, verifyOTP, getRemainingCooldown };
