const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Send SOS Email Alert to Guardian
 */
async function sendSOSEmail(guardianEmail, { userName, userPhone, driverName, vehicleNumber, locationLink }) {
    logger.info(`[SOS] sendSOSEmail triggered for ${guardianEmail}`);

    if (!guardianEmail) {
        logger.warn('[SOS] No guardianEmail provided');
        return { success: false, error: 'No guardian email provided' };
    }

    const mailOptions = {
        from: `"SafeHer SOS" <${process.env.EMAIL_USER}>`,
        to: guardianEmail,
        subject: `🚨 SOS EMERGENCY: ${userName} needs help!`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 2px solid #ff4d4d; border-radius: 10px;">
                <h2 style="color: #ff4d4d;">🚨 SOS ALERT</h2>
                <p>Guardian, <b>${userName}</b> (${userPhone}) has triggered an emergency alert during her ride.</p>
                <hr>
                <div style="background: #fdf2f2; padding: 15px; border-radius: 8px;">
                    <p><b>Ride Details:</b></p>
                    <p><b>Driver:</b> ${driverName}</p>
                    <p><b>Vehicle:</b> ${vehicleNumber}</p>
                </div>
                <p><b>Live Location:</b><br>
                <a href="${locationLink}" style="display: inline-block; padding: 12px 24px; background-color: #ff4d4d; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">
                    Track Live on Google Maps
                </a></p>
                <hr>
                <p style="color: #666; font-size: 12px;">This is an automated emergency message from SafeHer Ride System. Please do not reply.</p>
            </div>
        `
    };

    // If no real credentials, just mock it
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER.includes('your_gmail_id')) {
        logger.info(`[EMAIL MOCK] To: ${guardianEmail} | Subject: SOS Alert for ${userName}`);
        return { success: true, mock: true };
    }

    logger.info(`Attempting real SOS email send via ${process.env.EMAIL_USER} to ${guardianEmail}`);

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const info = await transporter.sendMail(mailOptions);
        logger.info(`SOS Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error(`SOS Email failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

module.exports = { sendSOSEmail };
