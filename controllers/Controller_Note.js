const Note = require("../models/Model_Note");

const getAllNotes = async (req, res) => {
    try {
        const notes = await Note.find({ note_owner: req.session.user.email }).sort({ note_is_pinned: -1 });

        notes.forEach(note => {
            note.formattedStartDate = note.note_date_start.toLocaleDateString('az-AZ');
            note.formattedEndDate = note.note_date_end.toLocaleDateString('az-AZ');
        });

        res.render('notes', { title: "Qeydlər", notes: notes, unreadCount: res.locals.unreadCount, user: req.session.user });
    } catch (error) {
        console.error("Error retrieving notes:", error);
        res.status(500).send("Internal server error");
    }
};


const createNote = async (req, res) => {
    const { note_title, note_description, note_date_start, note_date_end, note_severity, note_is_pinned, note_owner } = req.body;

    try {
        const newNote = new Note({
            note_title,
            note_description,
            note_date_start,
            note_date_end,
            note_severity,
            note_is_pinned: note_is_pinned === 'true',
            note_owner: req.session.user.email
        });

        await newNote.save();
        res.redirect('/notes');
    } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).send("Internal server error");
    }
};

const deleteNote = async (req, res) => {
    const noteId = req.params.id;

    try {
        await Note.findByIdAndDelete(noteId);
        res.redirect('/notes');
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).send("Internal server error");
    }
};

const pinNote = async (req, res) => {
    const noteId = req.params.id;

    try {
        const note = await Note.findById(noteId);
        note.note_is_pinned = !note.note_is_pinned;
        await note.save();
        res.redirect('/notes');
    } catch (error) {
        console.error("Error pinning/unpinning note:", error);
        res.status(500).send("Internal server error");
    }
};

module.exports = {
    getAllNotes,
    createNote,
    deleteNote,
    pinNote
};
