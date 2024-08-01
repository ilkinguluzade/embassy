const Message = require("../models/Model_Message");
const User = require("../models/Model_User");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const { log } = require("console");



const getUnreadMessages = async (req, res) => {
  const user = req.session.user;
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  const startIndex = (page - 1) * limit;

  if (!user) {
    return res.status(401).send("Unauthorized");
  }

  try {
    let paginatedMessages;
    let totalPages;

    const messages = await Message.find({ message_to: user.email, message_isSeen: false }).sort({ createdAt: -1 });

    paginatedMessages = messages.slice(startIndex, startIndex + limit);
    totalPages = Math.ceil(messages.length / limit);
    const unreadCount = messages.length;

    res.render("new-received", {
      messages: paginatedMessages,
      currentPage: page,
      totalPages: totalPages,
      unreadCount: unreadCount,
      user,
      title: "Oxunmamış mesajlar",
    });
  } catch (err) {
    console.error("Error retrieving unread messages:", err);
    res.status(500).send("Internal server error");
  }
};

const getUsersForMessageForm = async (req, res) => {
  const user = req.session.user;
  console.log(user);
  try {
    let users;
    if (user.role === "Super Admin") {
      users = await User.find(); // Fetch all users
    } else if (user.role === "Admin") {
      users = await User.find(); // Fetch all users
    } else if (user.role === "User") {
      users = await User.find({ user_role: "Admin" }); // Fetch only Admin users
    } else {
      return res.status(403).send("Forbidden"); // Unauthorized role
    }

    res.render("message-form", {
      users,
      user,
      title: "Yeni Mesaj Göndər",
    });
  } catch (err) {
    console.error("Error retrieving users:", err);
    res.status(500).send("Internal server error");
  }
};

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Hash hesaplamak için bir fonksiyon
const generateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256"); // veya 'md5', 'sha1' gibi diğer hash algoritmaları
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => {
      hash.update(chunk);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
};

const downloadMessageFile = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).send("Mesaj tapılmadı");
    }

    const filePath = message.message_file_path;
    const fileName = message.message_file;

    // Dosya hash'ini kontrol et
    const currentHash = await generateFileHash(filePath);
    if (currentHash !== message.message_file_hash) {
      return res.status(400).send("Faylların HASH kodu uygun gəlmir. Faylın tamlığı pozulmuşdur.");
    }

    // Dosya adını güvenli hale getir
    const safeFileName = encodeURIComponent(fileName);

    // Dosya indirme işlemi
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Dosya gönderimi
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Dosya indirildikten sonra mesajı güncelle
    fileStream.on("end", async () => {
      const now = new Date();
      message.message_file_is_downloaded = true;
      message.message_file_downloaded_at = now;

      // Silme zamanı hesaplanıyor
      const deleteTime = new Date(now.getTime() + message.message_file_life_time * 1000);
      message.message_file_scheduled_delete_time = deleteTime;

      await message.save();
    });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).send("Server xətası.");
    }
  }
};

const readMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    console.log(message);
    const user = req.session.user;

    if (!message) {
      return res.status(404).send("Mesaj tapılmadı.");
    }

    if (!message.message_isSeen && message.message_to === user.email) {
      message.message_isSeen = true;
      message.message_seen_at = new Date();
      await message.save();
    }

    res.render("read-message", { message, title: "Daxil olanlar" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server xətası.");
  }
};

const getAllSendedMessages = async (req, res) => {
  const user = req.session.user;
  const page = parseInt(req.query.page) || 1;
  const limit = 8; // Her sayfada 8 mesaj
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  if (!user) {
    return res.status(401).send("Unauthorized");
  }

  try {
    let messages;
    let paginatedMessages;
    let totalPages;
    let users;

    if (user.role === "Super Admin") {
      messages = await Message.find().sort({ createdAt: -1 });
      users = await User.find(); // Fetch all users
    } else {
      messages = await Message.find({ message_from: user.email }).sort({ createdAt: -1 });
      users = await User.find(); // Fetch all users for Admins as well
    }

    paginatedMessages = messages.slice(startIndex, endIndex);
    totalPages = Math.ceil(messages.length / limit);

    res.render("sent", {
      messages: paginatedMessages,
      currentPage: page,
      totalPages: totalPages,
      user,
      users, // Pass users to the view
      title: "Göndərilənlər",
    });
  } catch (err) {
    console.error("Error retrieving messages:", err);
    res.status(500).send("Internal server error");
  }
};

const getAllMessages = async (req, res) => {
  const user = req.session.user;
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // Her sayfada 10 mesaj
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  if (!user) {
    return res.render("auth", { title: "Giriş", message: "Session vaxtınız dolmuşdur. Təkrar daxil olun." });
  }

  try {
    let users;
    let messages;
    let paginatedMessages;
    let totalPages;
    if (user.role === "Super Admin") {
      messages = await Message.find().sort({ createdAt: -1 });
      users
    } else {
      messages = await Message.find({ message_to: user.email }).sort({ createdAt: -1 });
    }

    paginatedMessages = messages.slice(startIndex, endIndex);
    totalPages = Math.ceil(messages.length / limit);

    // Sayfa numaralarının gösterimi için gerekli değişkenler
    const maxPagesToShow = 2;
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    res.render("inbox", {
      messages: paginatedMessages,
      currentPage: page,
      totalPages: totalPages,
      startPage: startPage,
      maxPagesToShow: maxPagesToShow,
      endPage: endPage,
      user,
      title: "Daxil olanlar",
    });
  } catch (err) {
    console.error("Error retrieving messages:", err);
    res.status(500).send("Internal server error");
  }
};

const getUserMessages = async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await Message.find({ message_to: userId });
    res.json(messages);
  } catch (err) {
    res.status(500).send("Internal server error");
  }
};

const createMessage = async (req, res) => {
  const {
    message_to,
    message_content,
    message_file,
    message_file_hash,
    message_file_size,
    message_subject,
    message_file_life_time,
    user_role,
    message_severity,
  } = req.body;
  const message_from = req.session.user.email;
  console.log(req.session.user);

  try {
    let fileHash = null;
    if (req.file) {
      const filePath = path.join(__dirname, "..", "uploads", req.file.filename);
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha256");
      hash.update(fileBuffer);
      fileHash = hash.digest("hex");
    }

    // Yeni mesajı oluşturun
    const newMessage = new Message({
      message_from,
      message_to,
      message_content,
      message_file: req.file ? req.file.originalname : null,
      message_file_hash: fileHash,
      message_file_path: req.file ? path.join(__dirname, "..", "uploads", req.file.filename) : null,
      message_file_size: req.file ? req.file.size : null,
      message_severity,
      message_subject,
      message_file_life_time,
      user_role,
    });

    await newMessage.save();

    // Mesajları alın ve sayfalama yapın
    const page = parseInt(req.query.page) || 1; // Mevcut sayfa numarasını al
    const limit = 8; // Her sayfada 8 mesaj
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let messages;
    let paginatedMessages;
    let totalPages;

    if (req.session.user.role === "Super Admin") {
      messages = await Message.find();
    } else {
      messages = await Message.find({ message_to: req.session.user.email });
    }

    // Sayfalama işlemini uygulayın
    paginatedMessages = messages.slice(startIndex, endIndex);
    totalPages = Math.ceil(messages.length / limit);

    res.redirect("/sent");
  } catch (err) {
    console.error("Mesaj oluşturma hatası:", err);
    res.status(500).send("Internal server error");
  }
};

// Dosya silme işlemi
const deleteExpiredFiles = async () => {
  try {
    const messages = await Message.find({
      message_file_scheduled_delete_time: { $exists: true, $lte: new Date() },
      message_file_is_deleted: false,
    });

    messages.forEach(async (message) => {
      const filePath = message.message_file_path;

      if (filePath) {
        fs.unlink(filePath, async (err) => {
          if (err) {
            console.error("Dosya silinemedi:", err);
          } else {
            console.log(`Silinen dosya: ${filePath}`);
            message.message_file_path = null;
            message.message_file_is_deleted = true;
            message.message_file_deleted_at = new Date();
            await message.save();
          }
        });
      } else {
        console.error("Geçersiz dosya yolu:", filePath);
      }
    });
  } catch (err) {
    console.error("Dosya silme işleminde hata:", err);
  }
};

// Bu fonksiyonu her 3 dakikada bir çalıştır
setInterval(deleteExpiredFiles, 1000);

module.exports = {
  getAllMessages,
  getAllSendedMessages,
  getUserMessages,
  createMessage,
  readMessage,
  downloadMessageFile,
  getUsersForMessageForm,
  getUnreadMessages,
  upload,
};
