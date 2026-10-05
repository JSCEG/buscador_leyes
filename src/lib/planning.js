/**
 * Planning instruments (plans, sectoral and institutional programmes, national strategies and the
 * planning framework) for the «Planeación» filter. It is a cross-cutting tag: each instrument stays
 * in its own collection. New plans and programmes are recognised by their type or title; the few
 * exceptions live in src/data/planeacion.json.
 */
import overrides from '../data/planeacion.json';

export const PLANNING_FILTER = Object.freeze({ id: 'planeacion', label: 'Planeación' });

const fold = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const INCLUDE = new Set((overrides.incluir || []).map(fold));
const EXCLUDE = new Set((overrides.excluir || []).map(fold));

// "Plan Nacional de Desarrollo", "…emite el Plan de Desarrollo del Sector Eléctrico", "Programa
// Sectorial/Institucional/Especial…", "Estrategia Nacional…", and the decrees or notices that approve
// or publish them.
const TITLE = /\b(plan nacional de desarrollo|plan de desarrollo del sector|programa (sectorial|institucional|especial|nacional)|estrategia nacional|prospectiva del sector)\b/;

/**
 * Place in the planning hierarchy: national plan, sectoral programme, sector development plans,
 * institutional programmes, then the planning framework. The decree or notice that approves or
 * publishes a plan sits right after it.
 */
export function planningRank(law = {}) {
    const title = fold(law.titulo);
    const companion = /^(decreto|aviso)\b/.test(title) ? 0.5 : 0;
    if (/plan nacional de desarrollo/.test(title)) return 0 + companion;
    if (/programa sectorial/.test(title)) return 1 + companion;
    if (/plan de desarrollo del sector/.test(title)) return 2 + companion;
    if (/programa (institucional|especial|nacional)|estrategia nacional|prospectiva/.test(title)) return 3 + companion;
    return 4;
}

export function isPlanning(law = {}) {
    const siglas = fold(law.siglas);
    if (siglas && EXCLUDE.has(siglas)) return false;
    if (siglas && INCLUDE.has(siglas)) return true;
    if (['plan', 'programa', 'estrategia'].includes(fold(law.tipo))) return true;
    return TITLE.test(fold(law.titulo));
}
