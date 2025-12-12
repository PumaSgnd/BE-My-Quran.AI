const Hadith = require('../models/hadith.model');
const HadithNote = require('../models/hadithNote.model');
const HadithRead = require('../models/hadithRead.model');

module.exports = {
  // GET /api/hadith/categories
  async getCategories(req, res) {
    try {
      const cats = await Hadith.getCategoriesWithCount();
      return res.json(cats);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // GET /api/hadith/category/:book
  async getByCategory(req, res) {
    try {
      const book = req.params.book;
      const list = await Hadith.findByBook(book);
      // For compatibility with your frontend's HadithListPage which expects
      // `id` and `nama`, we add `nama` key (use indo text as name if exists).
      const mapped = list.map(h => ({
        id: h.id,
        nama: h.indo ? (h.indo.length > 120 ? h.indo.substring(0,120) + '...' : h.indo) : (h.arab ? h.arab.substring(0,80) : ''),
        book: h.book,
        number: h.number,
      }));
      return res.json(mapped);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // GET /api/hadith/:id
  async getHadith(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const hadith = await Hadith.findById(id);
      if (!hadith) return res.status(404).json({ message: 'Hadith tidak ditemukan' });

      if (userId) {
        hadith.read = await HadithRead.isRead(userId, hadith.id);
        hadith.note = await HadithNote.getNote(userId, hadith.id);
      }

      return res.json(hadith);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // --- NOTES ---
  // GET /api/hadith/note
  async getNotes(req, res) {
    try {
      const userId = req.user.id;
      const rows = await HadithNote.getAllForUser(userId);
      return res.json(rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // POST /api/hadith/note  body { hadith_id, note }
  async saveNote(req, res) {
    try {
      const userId = req.user.id;
      const { hadith_id, note } = req.body;
      if (!hadith_id || note === undefined) {
        return res.status(400).json({ message: 'hadith_id and note are required' });
      }
      const saved = await HadithNote.saveNote(userId, hadith_id, note);
      return res.json(saved);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE /api/hadith/note  body { hadith_id }
  async deleteNote(req, res) {
    try {
      const userId = req.user.id;
      const { hadith_id } = req.body;
      if (!hadith_id) return res.status(400).json({ message: 'hadith_id required' });
      await HadithNote.deleteNote(userId, hadith_id);
      return res.json({ message: 'Catatan berhasil dihapus' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // --- READ ---
  // GET /api/hadith/read
  async getReadList(req, res) {
    try {
      const userId = req.user.id;
      const rows = await HadithRead.getAllForUser(userId);
      return res.json(rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // POST /api/hadith/read  body { hadith_id }
  async markRead(req, res) {
    try {
      const userId = req.user.id;
      const { hadith_id } = req.body;
      if (!hadith_id) return res.status(400).json({ message: 'hadith_id required' });
      await HadithRead.markAsRead(userId, hadith_id);
      return res.json({ message: 'Hadith ditandai sudah dibaca' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // DELETE /api/hadith/read  body { hadith_id }
  async deleteRead(req, res) {
    try {
      const userId = req.user.id;
      const { hadith_id } = req.body;
      if (!hadith_id) return res.status(400).json({ message: 'hadith_id required' });
      await HadithRead.deleteRead(userId, hadith_id);
      return res.json({ message: 'Status read berhasil dihapus' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};
