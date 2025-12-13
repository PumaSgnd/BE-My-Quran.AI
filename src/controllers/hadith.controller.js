const Book = require('../models/books.model');
const Hadith = require('../models/hadith.model');
const HadithNote = require('../models/hadithNote.model');
const HadithRead = require('../models/hadithRead.model');

module.exports = {
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
      const book = await Book.findBySlug(req.params.book);

      if (!book || !book.sections) {
        return res.status(404).json({ message: 'Sections not found' });
      }

      // 🔥 BALIKIN SECTION, BUKAN HADITH
      res.json(book.sections);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // 🔥 GET /api/hadith/category/:book/section/:id
  async getBySection(req, res) {
    try {
      const { book, id } = req.params;

      const bookData = await Book.findBySlug(book);
      if (!bookData || !bookData.sections) {
        return res.status(404).json({ message: 'Book or sections not found' });
      }

      const section = bookData.sections.find(
        s => String(s.id) === String(id)
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
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getHadith(req, res) {
    try {
      const id = parseInt(req.params.id, 10);

      const { rows } = await db.query(SQL_GET_HADITH, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "Hadith not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

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
