const Message = require("../models/Model_Message");


const getAllMessagesDashboard = async (req, res) => {
    try {
        const totalMessages = await Message.countDocuments();
        const totalMessagesWithFile = await Message.countDocuments({ message_file: { $ne: null } });
        const totalDownloadedFiles = await Message.countDocuments({ message_file_is_downloaded: true });
        const totalDeletedFiles = await Message.countDocuments({ message_file_is_deleted: true });
        const messages = await Message.aggregate([
            {
                $facet: {
                    totalMessages: [
                        {
                            $group: {
                                _id: { $month: "$createdAt" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    seenMessages: [
                        {
                            $match: { message_isSeen: true } // alan adını doğru yazdığınızdan emin olun
                        },
                        {
                            $group: {
                                _id: { $month: "$createdAt" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    downloadedMessages: [
                        {
                            $match: { message_file_is_downloaded: true } // alan adını doğru yazdığınızdan emin olun
                        },
                        {
                            $group: {
                                _id: { $month: "$createdAt" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);

        const data = {
            totalMessages: messages[0].totalMessages,
            seenMessages: messages[0].seenMessages,
            downloadedMessages: messages[0].downloadedMessages
        };

        if (req.query.format === 'json') {
            return res.json(data);
        }

        res.render('dashboard', { data, title: "Məlumat lövhəsi", unreadCount: res.locals.unreadCount, totalMessages, totalMessagesWithFile, totalDownloadedFiles , totalDeletedFiles });
    } catch (err) {
        console.error("Hata:", err);
        res.status(500).send("Sunucu hatası");
    }
};

module.exports = {
    getAllMessagesDashboard
};
