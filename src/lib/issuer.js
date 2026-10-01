/**
 * Which authority issued an instrument, for the general timeline. Read only from what the
 * document itself says (title, acronym, type) plus explicit overrides in src/data/dependencias.json;
 * nothing is guessed — instruments that do not say so are "Por precisar".
 */
import overrides from '../data/dependencias.json';

export const ISSUERS = Object.freeze([
    { id: 'congreso', label: 'Congreso de la Unión', short: 'Congreso', color: '#6d4fa3' },
    { id: 'ejecutivo', label: 'Ejecutivo Federal', short: 'Ejecutivo', color: '#d0683a' },
    { id: 'sener', label: 'Secretaría de Energía', short: 'SENER', color: '#9b2247' },
    { id: 'cne', label: 'Comisión Nacional de Energía', short: 'CNE', color: '#3f74c4' },
    { id: 'cre', label: 'Comisión Reguladora de Energía (extinta)', short: 'CRE', color: '#7c8aa5' },
    { id: 'cenace', label: 'Centro Nacional de Control de Energía', short: 'CENACE', color: '#138a6a' },
    { id: 'cenagas', label: 'Centro Nacional de Control del Gas Natural', short: 'CENAGAS', color: '#8b5e34' },
    { id: 'asea', label: 'Agencia de Seguridad, Energía y Ambiente', short: 'ASEA', color: '#b8862b' },
    { id: 'cfe', label: 'Comisión Federal de Electricidad', short: 'CFE', color: '#0e7490' },
    { id: 'pemex', label: 'Petróleos Mexicanos', short: 'PEMEX', color: '#4b5563' },
    { id: 'conuee', label: 'Comisión Nacional para el Uso Eficiente de la Energía', short: 'CONUEE', color: '#5f8f1f' },
    { id: 'otra', label: 'Por precisar', short: 'Por precisar', color: '#a8a29e' },
]);
const BY_ID = new Map(ISSUERS.map(issuer => [issuer.id, issuer]));

// Order matters: the most specific authority named in the title wins.
const TITLE_RULES = [
    [/Comisión Reguladora de Energía|\bCRE\b/i, 'cre'],
    [/Comisión Nacional de Energía|\bCNE\b/i, 'cne'],
    [/Centro Nacional de Control de Energía|\bCENACE\b/i, 'cenace'],
    [/Centro Nacional de Control del Gas Natural|\bCENAGAS\b/i, 'cenagas'],
    [/Agencia de Seguridad, Energía y Ambiente|\bASEA\b/i, 'asea'],
    [/Comisión Nacional para el Uso Eficiente de la Energía|\bCONUEE\b/i, 'conuee'],
    [/Secretaría de Energía|\bSENER\b/i, 'sener'],
];

/** Issuer id for a law summary ({ titulo, siglas, tipo }). */
export function issuerId(law = {}) {
    const siglas = String(law.siglas || '').trim();
    const override = overrides[siglas];
    if (override && BY_ID.has(override)) return override;
    const title = String(law.titulo || '');
    const tipo = String(law.tipo || '').toLowerCase();
    // Laws come from Congress; regulations, decrees and national plans from the Executive. A
    // regulation named after an agency ("Reglamento Interior de la CNE") is still the Executive's.
    if (tipo === 'ley' || /^Ley\b/.test(title)) return 'congreso';
    // Reforms to laws or to the Constitution are Congress's even when published as a decree;
    // a reform to a regulation stays with the Executive (next rule).
    if (/^(Decreto por el que se reforman|Reformas a)\b/i.test(title) && /\b(Ley|Constitución)\b/.test(title) && !/Reglamento/.test(title)) return 'congreso';
    if (['reglamento', 'decreto', 'plan'].includes(tipo) || /^(Reglamento|Decreto)\b/.test(title)) return 'ejecutivo';
    if (/^ASEA-/i.test(siglas)) return 'asea';
    for (const [pattern, id] of TITLE_RULES) if (pattern.test(title)) return id;
    // Self-issued instruments of the state companies (policies, internal rules, mixed schemes).
    if (/^(Pol[ií]ticas|Disposiciones Generales|Lineamientos de los Esquemas)\b[^]*Comisión Federal de Electricidad/i.test(title) || /^CFE-|-CFE$/i.test(siglas)) return 'cfe';
    if (/Petróleos Mexicanos|\bPEMEX\b/i.test(title) && !/^(Ley|Reglamento)/.test(title)) return 'pemex';
    return 'otra';
}

export const issuerOf = law => BY_ID.get(issuerId(law));
