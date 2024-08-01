// middlewares/unreadCount.js
const Message = require('../models/Model_Message'); // Modelinizi doğru şekilde import edin

const unreadCountMiddleware = async (req, res, next) => {
    const user = req.session.user;

    if (!user) {
        return next();
    }

    try {
        // Unread messages count calculation
        const unreadMessages = await Message.find({ message_to: user.email, message_isSeen: false });
        res.locals.unreadCount = unreadMessages.length;
    } catch (err) {
        console.error("Error retrieving unread messages count:", err);
        res.locals.unreadCount = 0;
    }

    next();
};

module.exports = unreadCountMiddleware;
