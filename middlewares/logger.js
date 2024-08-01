// middlewares/logger.js
const Log = require('../logger');
const Logger = new Log();

const logRequest = (req, res, next) => {
    const now = new Date();
    const timestamp = now.toLocaleString("en-GB", { timeZone: "Asia/Baku" });
    const user = req.session.user ? req.session.user.email : 'Bilinmir';
    const message = `Endpoint: ${req.originalUrl} - Metod: ${req.method} - İstifadəçi: ${user} - IP: ${req.ip}`;
    Logger.LogInfo(message);

    next();
};

module.exports = logRequest;
