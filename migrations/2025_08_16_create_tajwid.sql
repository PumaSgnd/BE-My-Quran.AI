-- Tabel tajwid per-ayat (sumber: QUL qpc-hafs)
CREATE TABLE IF NOT EXISTS tajwid_verses (
  id            SERIAL PRIMARY KEY,
  ayah_id       INTEGER REFERENCES ayahs(id) ON DELETE CASCADE,
  verse_key     VARCHAR(16) NOT NULL UNIQUE, -- "2:3"
  surah_number  INTEGER     NOT NULL,
  ayah_number   INTEGER     NOT NULL,
  markup        TEXT        NOT NULL,        -- teks QUL: <rule class=...> ... </rule>
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- percepat join/lookup
CREATE INDEX IF NOT EXISTS idx_tajwid_verse_key   ON tajwid_verses(verse_key);
CREATE INDEX IF NOT EXISTS idx_tajwid_surah_ayah  ON tajwid_verses(surah_number, ayah_number);
CREATE INDEX IF NOT EXISTS idx_tajwid_ayah_id     ON tajwid_verses(ayah_id);
