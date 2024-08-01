const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
    {
        ticket_subject: { type: String },
        ticket_description: { type: String },
        ticket_attachment: { type: String },
        ticket_from: { type: String },
        ticket_to: { type: String },
            ticket_attachment_hash: { type: String },
        ticket_seen_at: { type: Date },
        ticket_closed_at: { type: Date },
        ticket_status:  { type: String, enum: ["Gözləmədə", "Görüldü", "Bağlandı"], default:"Gözləmədə" },
        ticket_action_by: { type: String },
            ticket_replies: [{
                    replied_by: { type: String, required: true }, // Yanıtı yapan kullanıcının e-postası
                    reply_message: { type: String, required: true }, // Yanıt mesajı
                    reply_attachment: { type: String },
                    replied_at: { type: Date, default: Date.now } // Yanıtın zamanı
            }]
    },
    { timestamps: true }
);


const Ticket = mongoose.model("Tickets", ticketSchema);
module.exports = Ticket;
