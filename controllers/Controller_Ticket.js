const Ticket = require("../models/Model_Ticket");
const User = require("../models/Model_User");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Dosyaların yükleneceği klasör
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Dosya adını oluştur
    }
});

const upload = multer({ storage: storage });

// Bileti okundu olarak işaretleme fonksiyonu
const readTicket = async (req, res) => {
    const ticketId = req.params.id; // URL'den bilet ID'sini al
    const user = req.session.user; // Oturumdaki kullanıcıyı al

    try {
        // Bileti ID'ye göre bul
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: "Bilet bulunamadı" });
        }

        // Biletin sadece belirtilen kullanıcıya ait olup olmadığını kontrol et
        if (ticket.ticket_to === user.email && ticket.ticket_status === "Gözləmədə") {
            ticket.ticket_status = "Görüldü";
            ticket.ticket_seen_at = new Date();
            await ticket.save();
        }

        res.render('read-ticket', {
            title: "Bilet",
            unreadCount: res.locals.unreadCount,
            ticket
        });
    } catch (err) {
        console.error("Bilet okundu olarak işaretlenirken hata oluştu:", err);
        res.status(500).json({ message: "Bir hata oluştu", error: err.message });
    }
};

// Dosya indirme fonksiyonu
const downloadAttachment = async (req, res) => {
    const ticketId = req.params.id;

    try {
        const ticket = await Ticket.findById(ticketId);

        if (!ticket || !ticket.ticket_attachment) {
            return res.status(404).json({ message: "Dosya bulunamadı" });
        }

        const filePath = path.join(__dirname, '..', 'uploads', ticket.ticket_attachment);
        const originalFileName = ticket.ticket_attachment.split('-').slice(1).join('-'); // Orijinal dosya adını almak için timestamp'i çıkar
        res.download(filePath, originalFileName);
    } catch (err) {
        console.error("Dosya indirilirken hata oluştu:", err);
        res.status(500).json({ message: "Bir hata oluştu", error: err.message });
    }
};
const replyAttachment = async (req, res) => {
    const { filename } = req.params;
    const filePath = path.join('uploads', filename);

    res.download(filePath, filename, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('File download error');
        }
    });
};
// Yanıt oluşturma fonksiyonu
const replyToTicket = async (req, res) => {
    const ticketId = req.params.id; // URL'den bilet ID'sini al
    const { reply_message } = req.body;
    const user = req.session.user; // Oturumdaki kullanıcıyı al

    try {
        // Bileti ID'ye göre bul
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: "Bilet bulunamadı" });
        }

        // Biletin durumunu güncelle
        if (ticket.ticket_to === user.email && ticket.ticket_status === "Gözləmədə") {
            ticket.ticket_status = "Görüldü";
        }

        let reply_attachment = "";
        let reply_attachment_hash = "";

        if (req.file) {
            reply_attachment = req.file.filename;
            const fileBuffer = fs.readFileSync(req.file.path);
            reply_attachment_hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        }

        if(ticket.ticket_to === user.email || ticket.ticket_from === user.email) {
            ticket.ticket_replies.push({
                replied_by: user.email,
                reply_message,
                reply_attachment,
                reply_attachment_hash
            });
        }

        await ticket.save();

        res.redirect(`/received-tickets/read-ticket/${ticketId}`);
    } catch (err) {
        console.error("Bilet yanıtı oluşturulurken hata oluştu:", err);
        res.status(500).json({ message: "Bir hata oluştu", error: err.message });
    }
};

// Gönderilen biletleri listeleme fonksiyonu
const getAllSentTickets = async (req, res) => {
    const user = req.session.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const startIndex = (page - 1) * limit;

    try {
        let tickets;
        let paginatedTickets;
        let totalPages;
        let users;

        if (user.role === "Super Admin") {
            tickets = await Ticket.find().sort({ createdAt: -1 });
            users = await User.find();
        } else if (user.role === "Admin") {
            tickets = await Ticket.find({ ticket_from: user.email }).sort({ createdAt: -1 });
            users = await User.find({ user_role: "Super Admin" });
        } else if (user.role === "User") {
            tickets = await Ticket.find({ ticket_from: user.email }).sort({ createdAt: -1 });
            users = await User.find({ user_role: "Admin" });
        }

        paginatedTickets = tickets.slice(startIndex, startIndex + limit);
        totalPages = Math.ceil(tickets.length / limit);

        res.render('sent-tickets', {
            title: "Göndərilən biletlər",
            tickets: paginatedTickets,
            unreadCount: res.locals.unreadCount,
            totalPages: totalPages,
            currentPage: page,
            user,
            users
        });
    } catch (err) {
        res.status(500).json({ message: "Bir hata oluştu", error: err.message });
    }
};

// Alınan biletleri listeleme fonksiyonu
const getAllTickets = async (req, res) => {
    const user = req.session.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const startIndex = (page - 1) * limit;

    try {
        let tickets;
        let paginatedTickets;
        let totalPages;

        if (user.role === "Super Admin") {
            tickets = await Ticket.find().sort({ createdAt: -1 });
        } else {
            tickets = await Ticket.find({ ticket_to: user.email }).sort({ createdAt: -1 });
        }

        paginatedTickets = tickets.slice(startIndex, startIndex + limit);
        totalPages = Math.ceil(tickets.length / limit);

        res.render('received-tickets', {
            title: "Daxil olan biletlər",
            tickets: paginatedTickets,
            unreadCount: res.locals.unreadCount,
            totalPages: totalPages,
            user,
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ message: "Bir hata oluştu", error: err.message });
    }
};

// Bilet oluşturma fonksiyonu
const createTicket = async (req, res) => {
    const { ticket_subject, ticket_description, ticket_to } = req.body;
    const user = req.session.user; // Oturumdaki kullanıcıyı al

    try {
        let ticket_attachment = "";
        let ticket_attachment_hash = "";

        if (req.file) {
            ticket_attachment = req.file.filename;
            const fileBuffer = fs.readFileSync(req.file.path);
            ticket_attachment_hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        }

        // Yeni bilet oluştur
        const newTicket = new Ticket({
            ticket_subject,
            ticket_description,
            ticket_attachment,
            ticket_attachment_hash,
            ticket_from: user.email,
            ticket_to,
            ticket_status: "Gözləmədə",
            ticket_replies: []
        });

        await newTicket.save();

        res.status(201).json({ message: "Bilet başarıyla oluşturuldu", ticket: newTicket });
    } catch (err) {
        console.error("Bilet oluşturulurken hata oluştu:", err);
        res.status(500).json({ message: "Bir hata oluştu", error: err.message });
    }
};

// Modellerin fonksiyonları dışa aktarılıyor
module.exports = {
    getAllTickets,
    getAllSentTickets,
    createTicket,
    readTicket,
    downloadAttachment,
    replyToTicket,
        replyAttachment
};
