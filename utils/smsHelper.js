const logger = require('./logger');

let twilioClient = null;

// Initialize Twilio lazily
function getClient() {
    if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
            const twilio = require('twilio');
            twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        } catch (e) {
            logger.warn('Twilio not configured – SMS will be logged only');
        }
    }
    return twilioClient;
}

/**
 * Send SMS via Twilio or log in development
 */
async function sendSMS(to, message) {
    const client = getClient();
    const formattedTo = to.startsWith('+') ? to : `+91${to}`;

    if (!client) {
        logger.info(`[SMS MOCK] To: ${formattedTo} | Message: ${message}`);
        return { success: true, mock: true };
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedTo
        });
        logger.info(`SMS sent to ${formattedTo}: ${result.sid}`);
        return { success: true, sid: result.sid };
    } catch (err) {
        logger.error(`SMS failed to ${formattedTo}: ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * Send OTP SMS
 */
async function sendOTPSms(phone, otp) {
    const message = `SafeHer Ride OTP: ${otp}\nValid for 10 minutes. Do not share with anyone.\nYour safety is our priority 🌸`;
    return sendSMS(phone, message);
}

/**
 * Send SOS alert to guardian
 */
async function sendSOSAlert(guardianPhone, riderName, driverName, vehicleNumber, locationLink) {
    const message = `🚨 SOS ALERT from SafeHer Ride!\n` +
        `${riderName} has triggered an emergency.\n` +
        `Driver: ${driverName} | Vehicle: ${vehicleNumber}\n` +
        `Live Location: ${locationLink}\n` +
        `Please call her immediately!`;
    return sendSMS(guardianPhone, message);
}

/**
 * Send Police alert
 */
async function sendPoliceAlert(policePhone, riderName, driverName, vehicleNumber, locationLink) {
    const message = `🚨 EMERGENCY DISPATCH: SafeHer Ride Incident!\n` +
        `Rider: ${riderName} is in Danger.\n` +
        `Driver: ${driverName} | Vehicle: ${vehicleNumber}\n` +
        `Live GPS: ${locationLink}\n` +
        `Please dispatch immediately!`;
    return sendSMS(policePhone, message);
}

/**
 * Send offline emergency SMS when internet fails
 */
async function sendOfflineEmergency(guardianPhone, riderName, lastLat, lastLng, driverName, vehicleNumber) {
    const message = `🆘 EMERGENCY – SafeHer Ride OFFLINE\n` +
        `${riderName}'s internet disconnected during ride.\n` +
        `Last known location: https://maps.google.com/?q=${lastLat},${lastLng}\n` +
        `Driver: ${driverName} | Vehicle: ${vehicleNumber}\n` +
        `Please contact her immediately!`;
    return sendSMS(guardianPhone, message);
}

/**
 * Send guardian tracking link
 */
async function sendGuardianTrackingLink(guardianPhone, riderName, trackingUrl) {
    const message = `🌸 SafeHer Ride Update\n` +
        `${riderName} is on a ride. Track live:\n${trackingUrl}\n` +
        `This link is valid for this ride only.`;
    return sendSMS(guardianPhone, message);
}

module.exports = { sendSMS, sendOTPSms, sendSOSAlert, sendPoliceAlert, sendOfflineEmergency, sendGuardianTrackingLink };
