

const Login = (req, res) => {
    res.render('auth', { title: "Giriş", error: req.session.error, unreadCount: res.locals.unreadCount });
};

const Error404 = (req, res) => {
    res.render('page404', { title: "404", error: req.session.error, unreadCount: res.locals.unreadCount });
};

const NewReceived = (req, res) => {
    res.render('new-received', { title: "Yeni daxil olanlar", unreadCount: res.locals.unreadCount });
};

const Notes = (req, res) => {
    res.render('notes', { title: "Qeydlər", unreadCount: res.locals.unreadCount });
};

module.exports = {

    Login,
    NewReceived,
    Notes,
    Error404
};
