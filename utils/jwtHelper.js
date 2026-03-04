const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'safehercab_secret_change_me';

function generateToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken, JWT_SECRET };
