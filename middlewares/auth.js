const Log = require('../logger');
const Logger = new Log();
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // Kullanıcıya ait JWT token'ı al
    const accessToken = req.cookies.accessToken;

    // Token yoksa, oturumu reddet
    if (!accessToken) {

        req.session.error = "İcazəsiz giriş! Hesabınıza daxil olun.";
        const message = `IP adresi ${req.ip} olan istifadəçi ${req.originalUrl} endpointinə ${req.method} metodu ilə icazəsiz giriş etməyə çalışdı`;
        Logger.LogWarning(message)
        return res.redirect("/"); // veya istediğiniz başka bir sayfaya yönlendirin
    }

    try {
        // Token doğrulama
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        // Token'in geçerlilik süresini kontrol et
        if (decoded.exp < Date.now() / 1000) {

            req.session.destroy();
            const message = `IP adresi ${req.ip} olan istifadəçi ${req.originalUrl} endpointinə ${req.method} metodu ilə daxil olmazdan əvvəl tokeninin vaxtı bitdi`;
            Logger.LogWarning(message)
            req.session.error = "Session vaxtınız dolmuşdur. Təkrar daxil olun.";
            return res.redirect("/");
        }

        req.user = decoded;
        next();
    } catch (err) {
        const message = `IP adresi ${req.ip} olan istifadəçi ${req.originalUrl} endpointinə ${req.method} metodu ilə daxil olmazdan əvvəl tokeninin vaxtı bitdi`;
        Logger.LogWarning(message)
        req.session.error = "Session vaxtınız dolmuşdur. Təkrar daxil olun.";
        return res.redirect("/");
    }
};

module.exports = verifyToken;
