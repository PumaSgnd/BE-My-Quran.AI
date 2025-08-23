// src/services/dailyAyah.service.js
const {
    Ayah, Surah, Translation, AudioFile, Transliteration, TajwidVerse, sequelize,
} = require('../models');
const { ruleMarkupToIndexedSpans } = require('../utils/tajwid');

/**
 * Pilih 1 ayat deterministik per tanggal:
 * - hitung total ayat
 * - ambil offset = (hari UTC sejak epoch) % total
 * - SELECT dengan offset (ORDER BY id ASC) biar stabil
 */
async function pickAyahBySeedDate(seedDate) {
    const total = await Ayah.count();
    if (!total) throw Object.assign(new Error('Data ayat kosong'), { status: 500 });

    const dayNumber = Math.floor(seedDate.getTime() / 86400000); // 86400000 = ms per hari
    const offset = ((dayNumber % total) + total) % total;

    const row = await Ayah.findOne({
        order: [['id', 'ASC']],
        offset,
        include: [{ model: Surah, attributes: ['id', 'name_simple', 'name_translation_id'] }],
        attributes: ['id', 'text', 'ayah_number', 'verse_key', 'juz_number', 'surah_number'],
    });

    if (!row) throw Object.assign(new Error('Gagal memilih ayat'), { status: 500 });
    return row;
}

async function getPreferredTranslation(ayahId, lang = 'id') {
    if (lang === 'id') {
        const t = await Translation.findOne({
            where: { ayah_id: ayahId, author_name: 'Kemenag' },
            attributes: ['translation_text', 'footnotes'],
        });
        if (t) return t.toJSON();
    }

    const byLang = await Translation.findOne({
        where: { ayah_id: ayahId, language_code: lang },
        attributes: ['translation_text', 'footnotes'],
        order: [['id', 'ASC']],
    });
    if (byLang) return byLang.toJSON();

    const any = await Translation.findOne({
        where: { ayah_id: ayahId },
        attributes: ['translation_text', 'footnotes'],
        order: [['id', 'ASC']],
    });
    return any ? any.toJSON() : null;
}

async function getAudioForSurah(surahId, reciterId = 1) {
    const a = await AudioFile.findOne({
        where: { surah_id: surahId, reciter_id: reciterId },
        attributes: ['audio_url'],
    });
    return a ? a.audio_url : null;
}

async function getLatin(ayahId) {
    const tr = await Transliteration.findOne({
        where: { ayah_id: ayahId },
        attributes: ['text_raw'],
    });
    return tr ? tr.text_raw : null;
}

async function getTajwidSpans(ayahId) {
    const tv = await TajwidVerse.findOne({
        where: { ayah_id: ayahId },
        attributes: ['markup'],
    });
    if (!tv?.markup) return [];
    const { spans } = ruleMarkupToIndexedSpans(tv.markup);
    return Array.isArray(spans) ? spans : [];
}

/**
 * Service utama yang dipanggil controller
 * @param {{ seedDate: Date, include: Set<string>, lang: string, reciter: number }}
 */
async function getDailyAyah(opts) {
    const { seedDate, include, lang, reciter } = opts;

    const ayahRow = await pickAyahBySeedDate(seedDate);
    const s = ayahRow.Surah;

    // base payload
    const payload = {
        date: seedDate.toISOString().slice(0, 10), // YYYY-MM-DD (UTC)
        surah: {
            id: s?.id ?? null,
            number: ayahRow.surah_number,
            name: s?.name_simple ?? null,
            translation: s?.name_translation_id ?? null,
        },
        ayah: {
            id: ayahRow.id,
            ayah_number: ayahRow.ayah_number,
            verse_key: ayahRow.verse_key,
            text_ar: ayahRow.text,
            juz_number: ayahRow.juz_number,
        },
        translation: null,
        latin: null,
        audio_url: null,
        tajwid_spans: null,
    };

    // optional includes
    if (include.has('translation')) {
        const t = await getPreferredTranslation(ayahRow.id, lang);
        payload.translation = t?.translation_text ?? null;
    }

    if (include.has('latin')) {
        payload.latin = await getLatin(ayahRow.id);
    }

    if (include.has('audio')) {
        payload.audio_url = await getAudioForSurah(ayahRow.surah_number, reciter);
    }

    if (include.has('tajwid')) {
        payload.tajwid_spans = await getTajwidSpans(ayahRow.id);
    }

    return payload;
}

module.exports = {
    getDailyAyah,
};
