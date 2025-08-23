// ==== API LAMA (TETAP) ====
function toSafeHtml(markup) {
    if (!markup) return '';
    let html = String(markup);
    html = html.replace(/<(?!\/?(span|sup)\b)[^>]*>/gi, '');
    html = html.replace(/<(span|sup)\s+([^>]*?)>/gi, (_, tag, attrs) => {
        const safe = [];
        String(attrs || '').split(/\s+/).forEach(a => {
            const m = a.match(/^(class|data-[\w-]+)=["'][^"']*["']$/i);
            if (m) safe.push(m[0]);
        });
        return `<${tag}${safe.length ? ' ' + safe.join(' ') : ''}>`;
    });
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
        text = text.replace(/<[^>]*>/g, '');
        text = text.replace(/\s{2,}/g, ' ').trim();
        const cm = attrs.match(/\bclass=["']([^"']+)["']/i);
        const classes = cm ? cm[1].split(/\s+/).filter(Boolean) : [];
        const rules = classes.filter(c => c.toLowerCase() !== 'tajweed');
        spans.push({ text, rules });
    }
    return spans;
}

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
};

// ==== TAMBAHAN BARU (NON-BREAKING) ====

// Ubah <rule .../> → <span ...></span>, <rule ...> → <span ...>, </rule> → </span>
function normalizeRuleToSpan(markup = '') {
    let s = String(markup);
    s = s.replace(/<rule\b([^>]*)\/>/gi, '<span$1></span>');
    s = s.replace(/<rule\b/gi, '<span');
    s = s.replace(/<\/rule>/gi, '</span>');
    return s;
}

// Wrapper kompatibel: kalau ada <rule>, otomatis dinormalisasi lalu pakai toSpans()
function toSpansCompat(markup) {
    const hasRule = /<\s*rule\b/i.test(String(markup || ''));
    return toSpans(hasRule ? normalizeRuleToSpan(markup) : markup);
}

// Parse ke indeks karakter pada plain text: hasil [{start,end,rule}]
function ruleMarkupToIndexedSpans(markup = '') {
    const spans = [];
    let plain = '';
    const stack = [];
    const tokenRe = /<rule\b[^>]*\/>|<rule\b[^>]*>|<\/rule>|<span\b[^>]*>|<\/span>|[^<]+/g;
    let m;
    while ((m = tokenRe.exec(markup)) !== null) {
        const t = m[0];
        if (/^<rule\b[^>]*\/>$/.test(t)) {
            readClasses(t).filter(c => c.toLowerCase() !== 'tajweed')
                .forEach(r => spans.push({ start: plain.length, end: plain.length, rule: r }));
        } else if (/^<rule\b/i.test(t) || /^<span\b/i.test(t)) {
            const rules = readClasses(t).filter(c => c.toLowerCase() !== 'tajweed');
            stack.push({ start: plain.length, rules });
        } else if (t === '</rule>' || t === '</span>') {
            const open = stack.pop();
            if (open && open.rules.length) {
                open.rules.forEach(r => spans.push({ start: open.start, end: plain.length, rule: r }));
            }
        } else {
            plain += t;
        }
    }
    return { text: plain, spans };
}

function readClasses(tag) {
    const m = String(tag).match(/\bclass\s*=\s*(?:"([^"]+)"|([^\s/>]+))/i);
    const cls = m ? (m[1] || m[2]) : '';
    return String(cls).split(/\s+/).filter(Boolean);
}

// HTML aman dari markup <rule> (untuk FE)
function ruleMarkupToSafeHtml(markup = '') {
    return toSafeHtml(normalizeRuleToSpan(markup));
}

module.exports = {
    // lama
    toSafeHtml,
    toSpans,
    TAJWID_RULES,
    // baru
    normalizeRuleToSpan,
    toSpansCompat,
    ruleMarkupToIndexedSpans,
    ruleMarkupToSafeHtml,
};
