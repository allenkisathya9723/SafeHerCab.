const { verifyToken } = require('../utils/jwtHelper');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            req.user = verifyToken(authHeader.split(' ')[1]);
        } catch { }
    }
    next();
}

module.exports = { authMiddleware, optionalAuth };
