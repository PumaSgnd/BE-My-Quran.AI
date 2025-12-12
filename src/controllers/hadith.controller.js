const Hadith = require('../models/hadith.model');
const HadithNote = require('../models/hadithNote.model');
const HadithRead = require('../models/hadithRead.model');

module.exports = {
    // GET => list by book OR single hadith
    async getHadith(req, res) {
        const { book, number } = req.params;

        if (number) {
            const hadith = await Hadith.findOne(book, number);
            if (!hadith) return res.status(404).json({ message: "Hadith tidak ditemukan" });

            hadith.read = await HadithRead.isRead(hadith.id);
            hadith.note = await HadithNote.getNote(hadith.id);

            return res.json(hadith);
        }

        const list = await Hadith.findByBook(book);
        return res.json(list);
    },

    // NOTE — save or update
    async saveNote(req, res) {
        const { id } = req.params;
        const { note } = req.body;

        const saved = await HadithNote.saveNote(id, note);
        return res.json(saved);
    },

    // READ — mark as read
    async markRead(req, res) {
        const { id } = req.params;

        await HadithRead.markAsRead(id);
        return res.json({ message: "Hadith ditandai sudah dibaca" });
    }
};
