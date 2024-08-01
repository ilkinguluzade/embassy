const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        user_name: { type: String },
        user_surname: { type: String },
        user_fathername: { type: String },
        user_description: { type: String },
        user_id_card_number: { type: String },
        user_id_card_fin: { type: String },
        user_birth_date: { type: String },
        user_mobile_number: { type: String },
        user_country: { type: String },
        user_mail: { type: String },
        user_adress: { type: String },
        user_phone: { type: String },
        user_password: { type: String },
        user_status:  { type: String, enum: ["Aktiv", "Passiv"], default:"Aktiv" },
        user_role: { type: String, enum: ["Admin", "Super Admin", "User"] },
    },
    { timestamps: true }
);


const User = mongoose.model("Users", userSchema);
module.exports = User;
