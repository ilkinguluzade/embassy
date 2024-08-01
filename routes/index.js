const express = require("express");
const router = express.Router();
const {
    loginUser,
    getSingleUser,
    addUser,
    getLoggedInUser,
    deleteUser,
    updateUser,
    updatePassword,
    registerUser,
    getAllUsers
} = require("../controllers/Controller_User");
const {
    Error404,
    Login,
    NewReceived,
    Sent,
    Notes
} = require("../controllers/Controller_Index");
const verifyToken = require("../middlewares/auth");
const unreadCountMiddleware = require("../middlewares/unreadCount");
const {
    getAllMessages,
    getUnreadMessages,
    getAllSendedMessages,
    getUserMessages,
    getMonthlyMessageCount,
    createMessage,
    readMessage,
    downloadMessageFile,
    getUsersForMessageForm
} = require("../controllers/Controller_Message");
const {
    getAllTickets,
    getAllSentTickets,
    downloadAttachment,
    readTicket,
    replyToTicket,
    createTicket, replyAttachment
} = require("../controllers/Controller_Ticket");

const {
    getAllMessagesDashboard
} = require("../controllers/Controller_Dashboard");
const {
    getAllNotes,
    createNote,
    deleteNote,
    pinNote
} = require("../controllers/Controller_Note");

const upload = require('../controllers/Controller_Message').upload;
const logRequest = require("../middlewares/logger");




router.use(unreadCountMiddleware);

router.get("/received-tickets", verifyToken, logRequest, getAllTickets);
router.get("/sent-tickets", verifyToken, logRequest, getAllSentTickets);
router.post('/create-ticket', verifyToken, logRequest, upload.single('ticket_attachment'), createTicket);
router.get('/received-tickets/read-ticket/:id', verifyToken, logRequest, readTicket);
router.get('/sent-tickets/read-ticket/:id', verifyToken, logRequest, readTicket);
router.post('/tickets/reply/:id', verifyToken, logRequest, replyToTicket);
router.post('/tickets/:id/reply', verifyToken, logRequest, upload.single('reply_attachment'), replyToTicket);
router.get('/tickets/:id/download', verifyToken, logRequest, downloadAttachment); // İndirme rotası
router.get('/download/:filename', verifyToken, logRequest, replyAttachment); // İndirme rotası


router.get("/my-profile", verifyToken, logRequest, getLoggedInUser);
router.get("/all-users", verifyToken, logRequest, getAllUsers);
router.get("/all-users/:id", verifyToken, logRequest, getSingleUser);
router.post('/users', verifyToken, logRequest, addUser);
router.get('/delete-user/:id', verifyToken, logRequest, deleteUser);
router.post('/messages', verifyToken, upload.single('message_file'), createMessage);
router.post('/update-user',verifyToken, logRequest, updateUser);

router.post('/update-password', verifyToken, logRequest,updatePassword);
router.get("/inbox", verifyToken, logRequest, getAllMessages);

router.get("/inbox/read-message/:id", verifyToken, logRequest, readMessage);
router.get('/inbox/download-message-file/:id', verifyToken, logRequest, downloadMessageFile);

router.get("/sent", verifyToken, logRequest, getAllSendedMessages);
router.get("/sent/read-message/:id", verifyToken, logRequest, readMessage);

router.get("/messages/:userId", verifyToken, logRequest, getUserMessages);

router.get("/dashboard", verifyToken, logRequest, getAllMessagesDashboard);
router.get('/dashboard', getAllMessagesDashboard);

router.get("/users", verifyToken, logRequest, getAllUsers);
router.get("/new-received", verifyToken, logRequest, getUnreadMessages);
router.get("/notes", verifyToken, logRequest, getAllNotes);
router.post("/notes", verifyToken, logRequest, createNote);
router.post("/notes/delete/:id", verifyToken, logRequest, deleteNote);
router.post("/notes/pin/:id", verifyToken, logRequest, pinNote);

router.get("/", logRequest, Login);
router.post("/login", logRequest, loginUser);
router.post("/register", logRequest, registerUser);

router.get("*", verifyToken, logRequest, Error404);



module.exports = router;
