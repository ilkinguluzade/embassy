const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        message_from: { type: String },
        message_to: { type: String },
        message_content: { type: String },
        message_file: { type: String },
        message_isSeen: { type: Boolean, default: false },
        message_seen_at: { type: Date },
        message_subject: { type: String},
        message_file_hash: { type: String },
        message_file_size: { type: String },
        message_file_path: {type:String},
        message_file_deleted_at: { type: Date },
        message_file_life_time: { type: Number },
        message_file_is_downloaded: { type: Boolean, default: false },
        message_file_is_deleted: { type: Boolean, default: false },
        message_file_downloaded_at: { type: Date },
        message_file_scheduled_delete_time: { type: Date },
        message_severity: { type: String, enum:['Az vacib', 'Vacib', 'Çox vacib'] },
        user_role: { type: String, enum: ["Admin", "Super Admin", "User"] },
    },
    { timestamps: true }
);


const Message = mongoose.model("Messages", messageSchema);
module.exports = Message;
