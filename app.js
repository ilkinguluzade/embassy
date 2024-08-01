const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const indexRoutes = require("./routes/index");
const cors = require('cors');
const cookieParser = require("cookie-parser");
const session = require('express-session');
const userInfo = require('./middlewares/userInfo');


const app = express();
dotenv.config();


const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
        console.log("MongoDB: Connection Successfuly");
    } catch (error) {
        throw error;
    }
};

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Express session middleware
app.use(session({
    secret: 'secrett',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(userInfo); // userInfo middleware'ini session middleware'inden sonra kullanın

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRoutes);
app.set('view engine', 'ejs');

const backendPort = process.env.BACKEND_PORT || 5009;
app.listen(backendPort, () => {
    connect();
    console.log("Server Running at " + backendPort + " port");
});
