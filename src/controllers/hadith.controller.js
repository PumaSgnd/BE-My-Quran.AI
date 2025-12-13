const Hadith = require('../models/hadith.model');
const HadithNote = require('../models/hadithNote.model');
const HadithRead = require('../models/hadithRead.model');

module.exports = {
  // GET /api/hadith/categories
  async getCategories(req, res) {
    try {
      const cats = await Hadith.getCategoriesWithCount();
      res.json(cats);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // GET /api/hadith/category/:book
  async getByCategory(req, res) {
    try {
      const book = req.params.book;
      const list = await Hadith.findByBook(book);

      const mapped = list.map(h => ({
        id: h.id,
        number: h.number,
        arab: h.arab,
        indo: h.indo,
        section: h.section_id ?? null,
        category: h.category ? { id: h.category_id, name: h.category } : null,
        nama: h.indo
          ? h.indo.length > 120 ? h.indo.substring(0, 120) + '...' : h.indo
          : h.arab ? h.arab.substring(0, 80) : ''
      }));

      res.json(mapped);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getBySection (req, res) {
    const { book, id } = req.params;

    const section = sections[book]?.find(
      s => s.id === Number(id)
    );

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const hadiths = await Hadith.findByBookAndRange(
      book,
      section.first,
      section.last
    );

    res.json(hadiths);
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

      res.json({
        id: hadith.id,
        number: hadith.number,
        arab: hadith.arab,
        indo: hadith.indo,
        section: hadith.section_id ?? null,
        category: hadith.category ? { id: hadith.category_id, name: hadith.category } : null,
        read: hadith.read ?? false,
        note: hadith.note ?? null
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // --- NOTES ---
  async getNotes(req, res) {
    try {
      const userId = req.user.id;
      const notes = await HadithNote.getAllForUser(userId);
      res.json(notes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async saveNote(req, res) {
    try {
      const userId = req.user.id;
      const { hadith_id, note } = req.body;
      if (!hadith_id || note === undefined) {
        return res.status(400).json({ message: 'hadith_id and note are required' });
      }
      const saved = await HadithNote.saveNote(userId, hadith_id, note);
      res.json(saved);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async deleteNote(req, res) {
    try {
      const userId = req.user.id;
      const { hadith_id } = req.body;
      if (!hadith_id) return res.status(400).json({ message: 'hadith_id required' });
      await HadithNote.deleteNote(userId, hadith_id);
      res.json({ message: 'Catatan berhasil dihapus' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // --- READ ---
  async getReadList(req, res) {
    try {
      const userId = req.user.id;
      const list = await HadithRead.getAllForUser(userId);
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async markRead(req, res) {
    try {
      const userId = req.user.id;
      const { hadith_id } = req.body;
      if (!hadith_id) return res.status(400).json({ message: 'hadith_id required' });
      await HadithRead.markAsRead(userId, hadith_id);
      res.json({ message: 'Hadith ditandai sudah dibaca' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async deleteRead(req, res) {
    try {
      const userId = req.user.id;
      const { hadith_id } = req.body;
      if (!hadith_id) return res.status(400).json({ message: 'hadith_id required' });
      await HadithRead.deleteRead(userId, hadith_id);
      res.json({ message: 'Status read berhasil dihapus' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
};
