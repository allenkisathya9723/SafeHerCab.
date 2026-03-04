const { verifyToken } = require('../utils/jwtHelper');

function adminMiddleware(req, res, next) {
    const secret = req.headers['x-admin-secret'];
    if (secret && secret === process.env.ADMIN_SECRET) {
        req.isAdmin = true;
        return next();
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const decoded = verifyToken(authHeader.split(' ')[1]);
            if (decoded.role === 'admin') {
                req.isAdmin = true;
                return next();
            }
        } catch { }
    }
    return res.status(403).json({ error: 'Admin access required' });
}

module.exports = { adminMiddleware };
