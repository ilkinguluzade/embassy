const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
    {
        note_title: { type: String },
        note_description: { type: String },
        note_date_start: { type: Date },
        note_date_end: { type: Date },
        note_severity: { type: String },
        note_owner: { type: String },
        note_is_pinned: {type: Boolean, default: false},

    },
    { timestamps: true }
);


const Note = mongoose.model("Notes", noteSchema);
module.exports = Note;
