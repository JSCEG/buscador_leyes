/**
 * Compact labels for the law index grid, read from the fragment's own type and identifier.
 * The fragment's position is never used as a legal number: "Artículo Único" stays "Art. Único",
 * a plan's "Apartado 1.5.1" shows "1.5.1", and fragments without a number show a short name.
 */
import { GUIDE_LABEL } from './friendly-text.js';

const plain = value => String(value || '').normalize('NFD').replace(/\p{M}/gu, '');

const UNITS = { primero: 1, segundo: 2, tercero: 3, cuarto: 4, quinto: 5, sexto: 6, septimo: 7, octavo: 8, noveno: 9 };
const TENS = { decimo: 10, vigesimo: 20, trigesimo: 30, cuadragesimo: 40, quincuagesimo: 50 };
const SPECIAL = { undecimo: 11, duodecimo: 12 };

/** Spanish ordinal words ("Décimo Segundo", "Decimoprimera", "Trigésima quinta") → number, or 'Único'. */
export function ordinalValue(text) {
    const words = plain(text).toLowerCase()
        .replace(/\b(decimo|vigesimo|trigesimo|cuadragesimo|quincuagesimo)(?=[a-z])/g, '$1 ')
        .split(/[^a-z0-9]+/).filter(Boolean)
        .map(word => word.replace(/a$/, 'o'));   // feminine: primera → primero
    if (words[0] === 'unico') return 'Único';
    let total = 0;
    for (const word of words) {
        const value = UNITS[word] ?? TENS[word] ?? SPECIAL[word];
        if (value === undefined) break;
        total += value;
    }
    return total || null;
}

const num = value => String(value).replace(/\.$/, '').replace(/(\d)o$/i, '$1º');
const ordinalOrNumber = (rest, suffix = 'º') => {
    const lead = plain(rest).trim().match(/^(\d+[a-z]?(?:\.\d+)*)\.?(?:\s+(bis|ter|quater)\b)?/i);
    if (lead) return lead[2] ? `${num(lead[1])} ${lead[2][0].toUpperCase()}${lead[2].slice(1).toLowerCase()}` : num(lead[1]);
    const value = ordinalValue(rest);
    return value === 'Único' ? 'Único' : value ? `${value}${suffix}` : null;
};

function transitoryOrigin(scope) {
    const s = scope.toLowerCase();
    if (!s || /^ley$/.test(s) || /transitorias/.test(s)) return '';
    if (/fondo mexicano/.test(s)) return 'FMP';
    if (/organica/.test(s)) return 'LOAPF';
    if (/disposiciones generales/.test(s)) return 'DG';
    if (/decreto/.test(s)) return 'Dec.';
    if (/reglamento/.test(s)) return 'Reg.';
    if (/acuerdo/.test(s)) return 'Ac.';
    return '';
}

/** Kinds drive the list badge and the grouping of the index. */
export const KIND_BADGE = {
    articulo: 'ART', apartado: 'APART', numeral: 'NUM', lineamiento: 'LIN', resolutivo: 'RES', base: 'BASE', disposicion: 'DISP',
    clausula: 'CLÁUS', capitulo: 'CAP', modificacion: 'MOD', objetivo: 'OBJ', indicador: 'IND', eje: 'EJE', tabla: 'TABLA',
    formato: 'FORM', anexo: 'ANEXO', apendice: 'APÉND', transitorio: 'TRANS', preambulo: 'PREÁM', complementario: 'COMPL',
    guia: 'GUÍA', seccion: 'SECC',
};

export const isGuide = item => item?.tipo_articulo === 'complementario' && GUIDE_LABEL.test(plain(item.articulo_label));

function shortName(label) {
    const first = String(label || '').split(/\s*[·:,(]\s*|\s+/)[0] || '';
    if (/^firma/i.test(plain(first))) return 'Firma';
    if (/^(indice|presentacion)/i.test(plain(first))) return 'Índice';
    return first.length > 9 ? `${first.slice(0, 8)}.` : first || '—';
}

// [pattern on the accent-free label, kind, prefix, feminine ordinal?]
const NAMED = [
    [/^articulo\s+(.+)/i, 'articulo', 'Art.'],
    [/^numeral\s+(.+)/i, 'numeral', 'Num.'],
    [/^lineamiento\s+(.+)/i, 'lineamiento', 'Lin.'],
    [/^resolutivo\s+(.+)/i, 'resolutivo', 'Res.'],
    [/^base\s+(.+)/i, 'base', 'Base', true],
    [/^disposicion\s+(.+)/i, 'disposicion', 'Disp.', true],
    [/^clausula\s+(.+)/i, 'clausula', 'Cláus.', true],
    [/^capitulo\s+(.+)/i, 'capitulo', 'Cap.'],
    [/^indicador\s+(.+)/i, 'indicador', 'Ind.'],
    [/^eje\s+(?:general|transversal)?\s*(.+)/i, 'eje', 'Eje'],
    [/^formato\s+(.+)/i, 'formato', 'Form.'],
];

export function indexLabel(item) {
    const label = String(item?.articulo_label || '').trim();
    const p = plain(label);
    const type = item?.tipo_articulo;
    let m;

    if (isGuide(item)) return { short: 'Guía', kind: 'guia' };
    if (type === 'preambulo') return { short: 'Preámb.', kind: 'preambulo' };
    if (type === 'transitorio') {
        const [head, ...scope] = p.split('·').map(part => part.trim());
        const value = ordinalOrNumber(head.replace(/^.*?transitorio\s*/i, ''));
        // A law often carries its own transitories and those of the decree that issued it.
        const origin = transitoryOrigin(scope.join(' '));
        return { short: value ? `T. ${value}${origin ? ` ${origin}` : ''}` : 'Trans.', kind: 'transitorio' };
    }
    // Amendments first: "Anexo único · Modificación al artículo 21", "Modificación · Artículo 1o · LOAPF".
    if ((m = p.match(/modificacion\b.*?\bart(?:iculo|\.)?\s*(?:no\.?\s*)?(\d+[a-z]?)/i))) return { short: `Mod. ${num(m[1])}`, kind: 'modificacion' };
    if ((m = p.match(/texto citado del numeral\s+([\d.]+)/i))) return { short: `Cita ${num(m[1])}`, kind: 'numeral' };
    if ((m = p.match(/objetivo\s+([a-z]?\d+(?:\.\d+)*)/i))) return { short: `Obj. ${m[1].toUpperCase()}`, kind: 'objetivo' };
    if ((m = p.match(/^apendice\s+(\w+)(?:\s*·\s*(?:numeral|articulo)\s+([\d.]+))?/i))) {
        return { short: m[2] ? `${m[1].toUpperCase()}·${num(m[2])}` : `Apénd. ${m[1].toUpperCase()}`, kind: 'apendice' };
    }
    if ((m = p.match(/^apartado\s+([a-z]?[\divxlc]*\d*(?:\.\d+)*)\.?(?:\s|$)/i)) && m[1]) return { short: m[1].toUpperCase(), kind: 'apartado' };
    if ((m = p.match(/\btabla\s+([a-z]?\d+(?:\.\d+)*)/i))) return { short: `Tabla ${m[1].toUpperCase()}`, kind: 'tabla' };
    if ((m = p.match(/_(\d+)\s*·\s*formato/i))) return { short: `Form. ${m[1]}`, kind: 'formato' };
    for (const [pattern, kind, prefix, feminine] of NAMED) {
        if ((m = p.match(pattern))) {
            const value = ordinalOrNumber(m[1], feminine ? 'ª' : 'º');
            if (value) return { short: `${prefix} ${value}`, kind };
        }
    }
    if ((m = p.match(/^anexo\s+(\w+)/i))) return { short: /^unico$/i.test(m[1]) ? 'Anexo' : `Anexo ${m[1]}`, kind: 'anexo' };
    if ((m = p.match(/^(\d+(?:\.\d+)*(?:\.[a-z])?|[a-z]\))\.?(?:\s|$)/i))) return { short: num(m[1]), kind: 'seccion' };
    if (type === 'anexo') return { short: shortName(label), kind: 'anexo' };
    if (type === 'complementario') return { short: shortName(label), kind: 'complementario' };
    return { short: shortName(label), kind: 'seccion' };
}
