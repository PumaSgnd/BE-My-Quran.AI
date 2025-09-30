// src/controllers/surahView.controller.js
const db = require('../config/db');
const { toSafeHtml } = require('../utils/tajwid');

function parseInclude(qsInclude) {
    const set = new Set(
        String(qsInclude || '')
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(Boolean)
    );
    return {
        withTranslation: set.has('translation'),
        withAudio: set.has('audio'),
        withUserState: set.has('user_state'),
        withTajwid: set.has('tajwid'),
        withLatin: set.has('latin') || set.has('transliteration'),
    };
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function decodeEntities(str) {
    if (!str) return str;
    let s = String(str);
    const map = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
    s = s.replace(/&(amp|lt|gt|quot|#39);/g, m => map[m] || m);
    s = s.replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(parseInt(d, 10)); } catch { return _; } });
    s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return _; } });
    return s;
}
function stripHtml(str) { return String(str || '').replace(/<[^>]*>/g, ''); }
function stripEndOfAyah(str) { return String(str || '').replace(/\s*[\u0660-\u0669\u06F0-\u06F9]+$/u, ''); }

function normPlaceSlug(val) {
    const p = String(val || '').toLowerCase();
    if (p.startsWith('makk') || p.startsWith('mecc')) return 'makkah';
    if (p.startsWith('madi') || p.startsWith('medi')) return 'madinah';
    return p || null;
}
function normPlaceLabel(slug) {
    if (slug === 'makkah') return 'Makkiyah';
    if (slug === 'madinah') return 'Madaniyah';
    return null;
}

function parseFootnotes(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try {
        const v = JSON.parse(raw);
        return typeof v === 'object' ? v : {};
    } catch {
        return {};
    }
}
function cleanupFootnoteNoise(text, footMap) {
    if (!text) return text;
    let out = String(text);
    const keys = footMap ? Object.keys(footMap) : [];
    for (const k of keys) {
        const re = new RegExp(`(?:>|\\s|^)+${k}(?=(\\s|$|[.,;:!?]))`, 'g');
        out = out.replace(re, ' ');
    }
    out = out.replace(/>\s*\d+/g, ' ');
    out = out.replace(/\b\d{2,}\b/g, ' ');
    out = out.replace(/([A-Za-zÀ-ÖØ-öø-ÿ\u0600-\u06FF])\d{2,}(?=(\s|$|[.,;:!?]))/gu, '$1');
    out = out.replace(/([A-Za-zÀ-ÖØ-öø-ÿ\u0600-\u06FF])[1-9](?=(\s|$|[.,;:!?]))/gu, '$1');
    out = out.replace(/([.,;:!?)\]\}"'“”»«])\s*[1-9]\b/g, '$1');
    out = out.replace(/[1-9]\s*(?=[)\]\}"'“”»«])/g, '');
    out = out.replace(/(?:^|\s)[1-9](?=(\s|$|[.,;:!?]))/g, ' ');
    out = out.replace(/\s{2,}/g, ' ').trim();
    return out;
}

async function getSurahView(req, res) {
    try {
        const surahId = Number(req.params.id);
        if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
            return res.status(400).json({ status: 'error', message: 'Param :id tidak valid' });
        }

        const { withTranslation, withAudio, withUserState, withTajwid, withLatin } = parseInclude(req.query.include);
        const requestedLang = (req.query.lang || 'id').toLowerCase();
        const reciterId = req.query.reciter ? Number(req.query.reciter) : null;

        const sanitizeMode = (req.query.sanitize || 'none').toLowerCase(); // 'none' | 'plain'
        const footnotesMode = (req.query.footnotes || '').toLowerCase();   // 'array' | ''
        const stripEOA = (req.query.strip_eoa || '0').toLowerCase();       // '0' | 'replace'
        const latinMode = (req.query.latin_mode || 'ui').toLowerCase();    // 'ui' | 'raw'

        const all = String(req.query.all || '0') === '1';
        const page = all ? 1 : clamp(parseInt(req.query.page || '1', 10) || 1, 1, 999999);
        const limit = all ? undefined : clamp(parseInt(req.query.limit || '20', 10) || 20, 1, 100);
        const offset = all ? 0 : (page - 1) * (limit || 0);

        // 1) Header surah
        const s = await db.query(
            `SELECT id, name_simple, name_arabic, revelation_place, verses_count, bismillah_pre
       FROM surahs WHERE id = $1`,
            [surahId]
        );
        if (s.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Surah tidak ditemukan' });
        }
        const surah = s.rows[0];
        const rps = normPlaceSlug(surah.revelation_place);
        const rpl = normPlaceLabel(rps);

        // prev/next
        let prev = null, next = null;
        if (surahId > 1) {
            const p = await db.query(`SELECT id, name_simple FROM surahs WHERE id = $1`, [surahId - 1]);
            prev = p.rows[0] || null;
        }
        if (surahId < 114) {
            const n = await db.query(`SELECT id, name_simple FROM surahs WHERE id = $1`, [surahId + 1]);
            next = n.rows[0] || null;
        }

        // 2) Total ayat
        const t = await db.query(
            `SELECT COUNT(*)::int AS total FROM ayahs WHERE surah_number = $1`,
            [surahId]
        );
        const total = t.rows[0].total;

        // 3) Ambil ayat
        let ayahSql = `
      SELECT a.id, a.surah_number, a.ayah_number, a.verse_key, a.text, a.juz_number
      FROM ayahs a
      WHERE a.surah_number = $1
      ORDER BY a.ayah_number ASC
    `;
        const ayahParams = [surahId];
        if (!all) {
            ayahSql += ` LIMIT $2 OFFSET $3`;
            ayahParams.push(limit, offset);
        }
        const ayahRes = await db.query(ayahSql, ayahParams);
        const ayahs = ayahRes.rows;

        // 4) Terjemahan
        let translationByAyahId = new Map();
        if (withTranslation && ayahs.length) {
            const ayahIds = ayahs.map(r => r.id);
            const tr = await db.query(
                `SELECT ayah_id, author_name, translation_text, footnotes
         FROM translations
         WHERE ayah_id = ANY($1)`,
                [ayahIds]
            );
            for (const row of tr.rows) {
                if (translationByAyahId.has(row.ayah_id)) continue;
                let textOut = row.translation_text || '';
                const footObj = footnotesMode === 'array' ? parseFootnotes(row.footnotes) : undefined;

                if (sanitizeMode === 'plain') {
                    textOut = decodeEntities(stripHtml(textOut));
                    textOut = cleanupFootnoteNoise(textOut, footObj);
                } else {
                    textOut = textOut.replace(/\s{2,}/g, ' ').trim();
                }
                translationByAyahId.set(row.ayah_id, {
                    lang: requestedLang,
                    author: row.author_name || null,
                    text: textOut,
                    ...(footnotesMode === 'array' ? { footnotes: footObj } : {})
                });
            }
        }

        // 4b) Tajwid
        let tajwidByVerseKey = new Map();
        if (withTajwid && ayahs.length) {
            const verseKeys = ayahs.map(r => r.verse_key);
            const tj = await db.query(
                `SELECT verse_key, markup FROM tajwid_verses WHERE verse_key = ANY($1)`,
                [verseKeys]
            );
            for (const row of tj.rows) {
                tajwidByVerseKey.set(row.verse_key, row.markup);
            }
        }

        // 4c) Transliterasi (latin) dari DB
        let latinByAyahId = new Map();
        if (withLatin && ayahs.length) {
            const ayahIds = ayahs.map(r => r.id);
            const lt = await db.query(
                `SELECT ayah_id, text_raw, text_ui FROM transliterations WHERE ayah_id = ANY($1)`,
                [ayahIds]
            );
            for (const row of lt.rows) {
                latinByAyahId.set(row.ayah_id, {
                    raw: row.text_raw,
                    ui: row.text_ui,
                });
            }
        }

        // 5) Audio per surah
        let audioBlock = null;
        if (withAudio && reciterId) {
            const audio = await db.query(
                `SELECT r.id AS reciter_id, r.name, r.slug, af.audio_url
         FROM audio_files af
         JOIN reciters r ON r.id = af.reciter_id
         WHERE af.reciter_id = $1 AND af.surah_id = $2
         LIMIT 1`,
                [reciterId, surahId]
            );
            const seg = await db.query(
                `SELECT 1
         FROM audio_segments s
         JOIN ayahs a ON a.id = s.ayah_id
         WHERE s.reciter_id = $1 AND a.surah_number = $2
         LIMIT 1`,
                [reciterId, surahId]
            );
            audioBlock = audio.rowCount
                ? {
                    reciter: {
                        id: audio.rows[0].reciter_id,
                        name: audio.rows[0].name,
                        slug: audio.rows[0].slug,
                    },
                    audio_url: audio.rows[0].audio_url,
                    has_segments: seg.rowCount > 0,
                }
                : null;
        }

        // 5b) Audio segments per ayah
        let segmentsByAyahId = new Map();
        if (withAudio && reciterId && ayahs.length) {
            const ayahIds = ayahs.map(r => r.id);
            const segs = await db.query(
                `SELECT s.ayah_id, s.start_time, s.end_time
            FROM audio_segments s
            WHERE s.reciter_id = $1 AND s.ayah_id = ANY($2)`,
                [reciterId, ayahIds]
            );
            for (const row of segs.rows) {
                if (!segmentsByAyahId.has(row.ayah_id)) {
                    segmentsByAyahId.set(row.ayah_id, []);
                }
                segmentsByAyahId.get(row.ayah_id).push({
                    start: row.start_time,
                    end: row.end_time,
                });
            }
        }

        // 6) State user
        let userState = null;
        if (withUserState && req.user?.id) {
            const userId = req.user.id;
            const last = await db.query(
                `SELECT a.verse_key
         FROM last_read lr
         JOIN ayahs a ON a.id = lr.ayah_id
         WHERE lr.user_id = $1
         ORDER BY lr.updated_at DESC
         LIMIT 1`,
                [userId]
            );
            const marks = await db.query(
                `SELECT a.ayah_number
         FROM bookmarks b
         JOIN ayahs a ON a.id = b.ayah_id
         WHERE b.user_id = $1 AND a.surah_number = $2
         ORDER BY a.ayah_number ASC`,
                [userId, surahId]
            );
            userState = {
                last_read: last.rows[0] ? { verse_key: last.rows[0].verse_key } : null,
                bookmarked_ayah_numbers: marks.rows.map(r => r.ayah_number),
            };
        }

        // 7) Payload ayat
        const data = ayahs.map(r => {
            const base = {
                id: r.id,
                ayah_number: r.ayah_number,
                verse_key: r.verse_key,
                text_ar: r.text,
                juz_number: r.juz_number,
            };

            if (stripEOA === '1' || stripEOA === 'replace') {
                const stripped = stripEndOfAyah(r.text);
                if (stripEOA === 'replace') base.text_ar = stripped;
                else base.text_plain = stripped;
            }

            if (withTranslation && translationByAyahId.has(r.id)) {
                base.translation = translationByAyahId.get(r.id);
            }

            if (withTajwid) {
                const markup = tajwidByVerseKey.get(r.verse_key);
                base.tajwid = markup ? { html: toSafeHtml(markup) } : null;
            }

            if (withLatin) {
                const lt = latinByAyahId.get(r.id);
                base.transliteration = lt
                    ? { mode: latinMode, text: (latinMode === 'raw' ? lt.raw : lt.ui) }
                    : null;
            }

            if (withAudio) {
                base.audio_segments = segmentsByAyahId.get(r.id) || [];
            }

            return base;
        });

        const meta = all
            ? { page: 1, limit: total, total, totalPages: 1 }
            : { page, limit, total, totalPages: Math.max(1, Math.ceil(total / (limit || total))) };

        return res.status(200).json({
            status: 'success',
            surah: {
                id: surah.id,
                name_arabic: surah.name_arabic,
                name_simple: surah.name_simple,
                revelation_place: surah.revelation_place,
                revelation_place_slug: rps,
                revelation_place_label: rpl,
                verses_count: surah.verses_count,
                bismillah_pre: surah.bismillah_pre,
                prev_surah: prev,
                next_surah: next,
            },
            meta,
            data,
            ...(withAudio ? { audio: audioBlock } : {}),
            ...(withUserState ? { user_state: userState } : {}),
        });
    } catch (err) {
        console.error('getSurahView error:', err);
        return res.status(500).json({
            status: 'error',
            message:
                process.env.NODE_ENV === 'production'
                    ? 'Internal Server Error'
                    : (err && err.message) || 'Internal Server Error',
        });
    }
}

module.exports = { getSurahView };
