// util sederhana utk sanitasi & parse markup tajwid
function toSafeHtml(markup) {
    if (!markup) return '';
    let html = String(markup);

    // buang semua tag selain <span> & <sup>
    html = html.replace(/<(?!\/?(span|sup)\b)[^>]*>/gi, '');

    // bersihkan attribute berbahaya, sisakan class & data-*
    html = html.replace(/<(span|sup)\s+([^>]*?)>/gi, (_, tag, attrs) => {
        const safe = [];
        String(attrs || '')
            .split(/\s+/)
            .forEach(a => {
                const m = a.match(/^(class|data-[\w-]+)=["'][^"']*["']$/i);
                if (m) safe.push(m[0]);
            });
        return `<${tag}${safe.length ? ' ' + safe.join(' ') : ''}>`;
    });

    // hapus event handler / js:
    html = html.replace(/\son[a-z]+\s*=\s*["'][^"']*["']/gi, '');
    html = html.replace(/javascript:/gi, '');

    return html.trim();
}

function toSpans(markup) {
    const spans = [];
    if (!markup) return spans;

    const re = /<span\b([^>]*)>(.*?)<\/span>/gis;
    let m;
    while ((m = re.exec(markup)) !== null) {
        const attrs = m[1] || '';
        let text = m[2] || '';
        // strip tag dalam isi
        text = text.replace(/<[^>]*>/g, '');
        text = text.replace(/\s{2,}/g, ' ').trim();

        // ambil class
        const cm = attrs.match(/\bclass=["']([^"']+)["']/i);
        const classes = cm ? cm[1].split(/\s+/).filter(Boolean) : [];

        // rules = semua class tajwid kecuali "tajweed"
        const rules = classes.filter(c => c.toLowerCase() !== 'tajweed');

        spans.push({ text, rules });
    }
    return spans;
}

// Legend (bisa kamu ganti sesuai preferensi FE)
const TAJWID_RULES = {
    ikhfa: { key: 'ikhfa', label: 'Ikhfā’', color: '#f39c12' },
    iqlab: { key: 'iqlab', label: 'Iqlāb', color: '#9b59b6' },
    idgham_gh: { key: 'idgham_gh', label: 'Idghām bighunnah', color: '#27ae60' },
    idgham_ngh: { key: 'idgham_ngh', label: 'Idghām bilā ghunnah', color: '#16a085' },
    qalqalah: { key: 'qalqalah', label: 'Qalqalah', color: '#e74c3c' },
    mad: { key: 'mad', label: 'Mad', color: '#2980b9' },
    ghunnah: { key: 'ghunnah', label: 'Ghunnah', color: '#2ecc71' },
    lam_shams: { key: 'lam_shams', label: 'Lām Syamsiyyah', color: '#d35400' },
    lam_qamr: { key: 'lam_qamr', label: 'Lām Qamariyyah', color: '#7f8c8d' },
    // tambahkan jika FE butuh key lain
};

module.exports = { toSafeHtml, toSpans, TAJWID_RULES };
