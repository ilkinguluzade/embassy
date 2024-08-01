const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/Model_User");
const Message = require("../models/Model_Message");

const accessTokenLife = '1h';
const refreshTokenLife = '7d';

let refreshTokens = [];

const getLoggedInUser = async (req, res) => {
  const user = req.session.user;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const tab = req.query.tab || 'overviewTab';

  try {
    const loggedInUser = await User.findById(user.id);
    if (!loggedInUser) {
      return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }

    const totalSendedMessages = await Message.countDocuments({ message_from: user.user_mail });
    const totalPages = Math.ceil(totalSendedMessages / limit);
    const sendedMessages = await Message.find({ message_from: user.user_mail }).skip(skip).limit(limit);
    const sendedMessageUsers = await User.find({ user_mail: { $in: sendedMessages.map(msg => msg.message_to) } });
    const receivedMessages = await Message.find({ message_to: user.user_mail });
    const receivedMessageUsers = await User.find({ user_mail: { $in: receivedMessages.map(msg => msg.message_from) } });

    const formattedStartDate = loggedInUser.createdAt.toLocaleDateString('az-AZ');

    res.render('my-profile', {
      title: "Mənim profilim",
      sendedMessages,
      sendedMessageUsers,
      receivedMessages,
      receivedMessageUsers,
      totalPages,
      tab,
      currentPage: page,
      loggedInUser,
      user,
      formattedStartDate
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const updateUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    const updatedData = {
      user_name: req.body.user_name,
      user_surname: req.body.user_surname,
      user_fathername: req.body.user_fathername,
      user_id_card_number: req.body.user_id_card_number,
      user_id_card_fin: req.body.user_id_card_fin,
      user_birth_date: req.body.user_birth_date,
      user_mobile_number: req.body.user_mobile_number,
      user_mail: req.body.user_mail,
      user_country: req.body.user_country,
    };

    // Kullanıcıyı bul ve güncelle
    const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });

    if (!user) {
      return res.status(404).send('Kullanıcı bulunamadı');
    }

    res.status(200).json({ message: 'Kullanıcı bilgileri başarıyla güncellendi', user });
  } catch (err) {
    res.status(500).send('Kullanıcı bilgilerini güncellerken hata oluştu');
  }
};

const addUser = async (req, res) => {
  const { user_id_card_number, user_id_card_fin, user_country, user_name, user_surname, user_fathername, user_birth_date, user_mobile_number, user_mail, user_password, user_status, user_role } = req.body;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;



  try {
    // İstifadəçinin artıq mövcud olub-olmadığını yoxlayırıq
    const existingUser = await User.findOne({ user_mail });
    if (existingUser) return res.status(400).send("İstifadəçi artıq mövcuddur");

    // Şifrənin hashing edilməsi
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user_password, salt);

    const newUser = new User({
      user_name,
      user_surname,
      user_fathername,
      user_birth_date,
      user_mobile_number,
      user_id_card_number,
      user_id_card_fin,
      user_country,
      user_mail,
      user_password: hashedPassword,
      user_status,
      user_role
    });
    const users = await User.find()
        .skip(skip)
        .limit(limit);

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    users.forEach(user => {
      user.formattedRegDate = user.createdAt.toLocaleDateString('az-AZ');
    });
    await newUser.save();

    // JWT token yaradılması
    const token = jwt.sign({ id: newUser._id, role: newUser.user_role }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });


    res.render('all-users',{title: "İstifadəçilər",
      users: users,
      unreadCount: res.locals.unreadCount,
      user: req.session.user,
      currentPage: page,
      totalPages: totalPages});
  } catch (err) {
    console.error(err);
    res.status(500).send("Daxili server xətası");
  }
};


const loginUser = async (req, res) => {
  const { user_mail, user_password } = req.body;


  try {
    // Kullanıcıyı e-posta adresine göre bul
    const user = await User.findOne({ user_mail });
    if (!user) {
      return res.render('auth', { message: "Mail və ya şifrə yanlışdır", title: "Giriş" });
    }

    // Şifreyi karşılaştır
    const isPasswordValid = await bcrypt.compare(user_password, user.user_password);

    if (!isPasswordValid) {
      return res.render('auth', { message: "Mail və ya şifrə yanlışdır",title: "Giriş"  });
    }

    // JWT oluştur
    const accessToken = jwt.sign({ id: user._id, email: user_mail }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: accessTokenLife });
    const refreshToken = jwt.sign({ id: user._id, email: user_mail }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: refreshTokenLife });

    // Token'i cookie'ye ekle
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });

    // Başarılı giriş durumunda session'a kullanıcı bilgilerini kaydet
    req.session.user = {
      id: user._id,
      email: user_mail,
      name: user.user_name,
      surname: user.user_surname,
      role: user.user_role
    };

    // Başarılı giriş durumunda dashboard'a yönlendir
    res.redirect('/dashboard');
  } catch (error) {

    res.status(500).send({ message: "Error during login", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { user_status: 'Passiv' });
    res.redirect('/all-users');
  } catch (err) {
    res.status(500).send("İstifadəçini silərkən xəta baş verdi.");
  }
};
const registerUser = async (req, res) => {
  const { user_name, user_surname, user_fathername, user_mail, user_company, user_adress, user_phone, user_password, user_role } = req.body;

  try {
    const existingUser = await User.findOne({ user_mail });
    if (existingUser) return res.status(400).send("User already exists");

    const newUser = new User({
      user_name,
      user_surname,
      user_fathername,
      user_mail,
      user_company,
      user_adress,
      user_phone,
      user_password,
      user_role
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    newUser.user_password = await bcrypt.hash(user_password, salt);

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id, role: newUser.user_role }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    res.status(201).json({ token });
  } catch (err) {

    res.status(500).send("Internal server error");
  }
};

const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const users = await User.find()
        .skip(skip)
        .limit(limit);

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    users.forEach(user => {
      user.formattedRegDate = user.createdAt.toLocaleDateString('az-AZ');
    });

    res.render('all-users', {
      title: "İstifadəçilər",
      users: users,
      unreadCount: res.locals.unreadCount,
      user: req.session.user,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (err) {
    res.status(500).send("Internal server error");
  }
};


const getSingleUser = async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const tab = req.query.tab || 'overviewTab';

  try {
    const user = await User.findById(id);
    const totalSendedMessages = await Message.countDocuments({ message_from: user.user_mail });
    const totalPages = Math.ceil(totalSendedMessages / limit);

    const sendedMessages = await Message.find({ message_from: user.user_mail }).skip(skip).limit(limit);
    const sendedMessageUsers = await User.find({ user_mail: { $in: sendedMessages.map(msg => msg.message_to) } });
    const receivedMessages = await Message.find({ message_to: user.user_mail });
    const receivedMessageUsers = await User.find({ user_mail: { $in: receivedMessages.map(msg => msg.message_from) } });

    user.formattedStartDate = user.createdAt.toLocaleDateString('az-AZ');

    if (!user) {
      return res.status(404).send("Kullanıcı bulunamadı");
    }

    res.render('user-details', {
      title: `${user.user_name} ${user.user_surname}`,
      user: user,
      unreadCount: res.locals.unreadCount,
      currentUser: req.session.user,
      sendedMessages: sendedMessages,
      receivedMessages: receivedMessages,
      sendedMessageUsers: sendedMessageUsers,
      receivedMessageUsers: receivedMessageUsers,
      currentPage: page,
      totalPages: totalPages,
      tab: tab
    });
  } catch (err) {
    res.status(500).send("Internal server error");
  }
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.body.userId;
    const newPassword = req.body.new_password;
    const confirmNewPassword = req.body.confirm_new_password;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'Yeni şifreler eşleşmiyor' });
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Kullanıcıyı bul ve şifreyi güncelle
    const user = await User.findByIdAndUpdate(userId, { user_password: hashedPassword }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error('Şifre güncellenirken hata:', err);
    res.status(500).json({ message: 'Şifreyi güncellerken hata oluştu' });
  }
};


module.exports = {
  loginUser,
  registerUser,
  getSingleUser,
  getAllUsers,
  getLoggedInUser,
  deleteUser,
  updateUser,
  updatePassword,
  addUser
};

