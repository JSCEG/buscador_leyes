/**
 * Builds the automatic term map for Análisis (public/data/terminos.json).
 * 1. Defined terms: glossary articles ("se entenderá por: I. Almacenamiento: …") of every instrument.
 * 2. Where each term appears: counts per instrument over all fragments.
 * 3. Related terms: terms that share fragments (co-occurrence), strongest links kept.
 * Run: node scripts/build-terms.mjs   (reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
const URL_ = env.VITE_SUPABASE_URL;
const H = { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` };

const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');

async function all(table, select, filter = '') {
    let out = [];
    for (let off = 0; ; off += 1000) {
        const r = await fetch(`${URL_}/rest/v1/${table}?select=${select}${filter}&order=id&limit=1000&offset=${off}`, { headers: H });
        const rows = await r.json();
        if (!Array.isArray(rows)) throw new Error(JSON.stringify(rows));
        out = out.concat(rows);
        if (rows.length < 1000) return out;
    }
}

const laws = await all('leyes', 'id,titulo,siglas,tipo');
const articles = await all('articulos', 'id,ley_id,identificador,contenido,tipo_articulo');
console.log('laws', laws.length, 'fragments', articles.length);

// ── 1. Defined terms ────────────────────────────────────────────────
const GLOSSARY = /se entender[aá] por|se entienden? por|para (?:los )?efectos de (?:esta|este|las presentes|los presentes|la presente|el presente)[^.:]{0,120}(?:se entender|:)/i;
// "I. Almacenamiento: …", "XII. Centro de Carga.-", "a) Usuario Final:"
const ITEM = /(?:^|\s)(?:[IVXLC]{1,7}|[a-z]|\d{1,3})[.)]\s+([A-ZÁÉÍÓÚÑ][^:;.\n]{2,90}?)\s*(?::|\.-|\s-\s|;\s(?=[A-ZÁÉÍÓÚ]))/g;
const BAD = /^(el|la|los|las|en|de|para|por|con|que|se|su|sus|cuando|conforme|dicho|dicha|esta|este|articulo|fraccion|capitulo|titulo|seccion|ley|reglamento|lineamientos|disposiciones)\b/;
const defined = new Map(); // key -> { label, lawIds:Set, definitions: [{lawId, articleId}] }
for (const a of articles) {
    const text = strip(a.contenido);
    if (!GLOSSARY.test(text)) continue;
    for (const m of text.matchAll(ITEM)) {
        let label = m[1].trim().replace(/\s+/g, ' ').replace(/[,\s]+$/, '');
        const key = plain(label);
        const words = key.split(' ').length;
        if (key.length < 3 || words > 8 || BAD.test(key) || /\d{3,}/.test(key)) continue;
        if (!defined.has(key)) defined.set(key, { label, definitions: [] });
        const entry = defined.get(key);
        if (!entry.definitions.some(d => d.lawId === a.ley_id)) entry.definitions.push({ lawId: a.ley_id, articleId: a.id });
    }
}
console.log('defined terms', defined.size);

// Single words are too generic unless they are acronyms or nouns of the sector itself.
const SECTOR_WORDS = new Set(['distribucion', 'almacenamiento', 'produccion', 'confiabilidad', 'continuidad', 'calidad', 'hidrocarburos',
    'comercializacion', 'asignacion', 'transporte', 'petroleo', 'transportista', 'extraccion', 'exploracion', 'inspeccion', 'permisionaria',
    'distribuidora', 'reservas', 'petroliferos', 'contratista', 'petroquimicos', 'suministradora', 'generadora', 'asignataria',
    'comercializadora', 'convocatoria', 'autorizacion', 'autoconsumo', 'interconexion', 'cogeneracion', 'biocombustibles', 'geotermia']);
const GENERIC = /^(sistema|programa|consejo|plataforma|comite) nacional$|^sistema integrado$|^persona moral$|^actividad economica$|^version publica$/;
function keepTerm(label) {
    const key = plain(label).trim();
    if (GENERIC.test(key)) return false;
    if (key.includes(' ')) return true;
    if (/^[A-ZÁÉÍÓÚÑ]{3,}$/.test(label.trim())) return true;
    return SECTOR_WORDS.has(key);
}

// ── 2. Occurrences per instrument ───────────────────────────────────
const lawById = new Map(laws.map(l => [l.id, l]));
const texts = articles.map(a => ({ id: a.id, lawId: a.ley_id, text: ` ${plain(strip(a.contenido)).replace(/[^a-z0-9ñ]+/g, ' ')} ` }));
const terms = [];
for (const [key, entry] of defined) {
    const needle = ` ${key.replace(/[^a-z0-9ñ]+/g, ' ').trim()} `;
    if (needle.trim().length < 4) continue;
    const perLaw = new Map(); const fragments = [];
    for (const t of texts) {
        if (!t.text.includes(needle)) continue;
        fragments.push(t.id);
        perLaw.set(t.lawId, (perLaw.get(t.lawId) || 0) + 1);
    }
    if (perLaw.size < 2 || fragments.length < 4) continue; // only terms that cross instruments
    if (!keepTerm(entry.label)) continue;
    terms.push({ key, label: entry.label, definitions: entry.definitions, fragments, perLaw });
}
// Keep the most connected terms.
terms.sort((a, b) => b.perLaw.size - a.perLaw.size || b.fragments.length - a.fragments.length);
const top = terms.slice(0, 160);
console.log('terms kept', top.length, 'of', terms.length);

// ── 3. Related terms by shared fragments (Jaccard) ──────────────────
const sets = top.map(t => new Set(t.fragments));
const related = top.map(() => []);
for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
        let shared = 0;
        const [small, big] = sets[i].size < sets[j].size ? [sets[i], sets[j]] : [sets[j], sets[i]];
        for (const id of small) if (big.has(id)) shared++;
        if (shared < 3) continue;
        const score = shared / (sets[i].size + sets[j].size - shared);
        related[i].push({ j, shared, score }); related[j].push({ j: i, shared, score });
    }
}

// Sector of each term from the instruments that use it most.
const SECTORS = [
    ['electricidad', /el[eé]ctric|electricidad|cenace|interconex|almacenamiento de energ|cogenerac|autoconsumo|comisi[oó]n federal de electricidad|cfe|transmisi[oó]n/i],
    ['hidrocarburos', /hidrocarbur|petr[oó]le|gas natural|glp|pemex|petrol[ií]fer|sistrangas|asea/i],
    ['transicion', /biocombust|geotermi|transici[oó]n energ|energ[ií]as limpias|renovable|conuee|eficiencia energ|econom[ií]a circular/i],
    ['planeacion', /plan |plan$|programa|polos de desarrollo|desarrollo econ[oó]mico|planeaci[oó]n/i],
    ['institucional', /reglamento interior|manual de organizaci|transparencia|comisi[oó]n nacional de energ[ií]a|secretar[ií]a de energ|disposiciones generales en materia de adquisiciones/i],
];
function sectorOf(term) {
    const score = new Map(SECTORS.map(([id]) => [id, 0]));
    let total = 0;
    for (const [lawId, count] of term.perLaw) {
        const law = lawById.get(lawId);
        const title = `${law?.titulo || ''} ${law?.siglas || ''}`;
        const hit = SECTORS.find(([, re]) => re.test(title));
        if (hit) score.set(hit[0], score.get(hit[0]) + count);
        total += count;
    }
    const [best, value] = [...score].sort((a, b) => b[1] - a[1])[0];
    return total && value / total >= 0.4 ? best : 'transversal';
}

const out = {
    generatedAt: new Date().toISOString(),
    instruments: laws.length,
    fragments: articles.length,
    terms: top.map((t, i) => ({
        id: t.key.replace(/[^a-z0-9ñ]+/g, '-').replace(/^-|-$/g, ''),
        label: t.label,
        sector: sectorOf(t),
        fragments: t.fragments.length,
        instruments: [...t.perLaw].sort((a, b) => b[1] - a[1]).map(([lawId, count]) => ({ lawId, count })),
        definedIn: t.definitions.map(d => ({ lawId: d.lawId, articleId: d.articleId })).filter(d => lawById.has(d.lawId)),
        related: related[i].sort((a, b) => b.score - a.score).slice(0, 8)
            .map(r => ({ id: top[r.j].key.replace(/[^a-z0-9ñ]+/g, '-').replace(/^-|-$/g, ''), shared: r.shared })),
    })),
};
fs.writeFileSync(path.join(root, 'src/data/analisis-terminos.json'), JSON.stringify(out));
console.log('written', out.terms.length, 'terms;', out.terms.slice(0, 25).map(t => `${t.label}(${t.instruments.length})`).join(', '));
