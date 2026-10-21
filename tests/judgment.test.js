import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isJudgment, judgmentCourt, judgmentCase, instrumentTypeLabel, fragmentNoun, countFragments, judgmentEffectsSections } from '../src/lib/judgment.js';
import { getAcervoGroup } from '../src/lib/acervo-model.js';
import { indexLabel, KIND_BADGE } from '../src/lib/index-label.js';
import { buildInstrumentTimeline } from '../src/lib/instrument-timeline.js';
import { friendlyLabel } from '../src/lib/friendly-text.js';
import { renderAcervoView } from '../src/scripts/acervo-view.js';

const data = JSON.parse(readFileSync('revision-acervo/incorporacion-scjn-137-2026-10-21/carga.json'));
const scjn = { ...data.ley, articulos: data.articulos.length };
const apartados = data.articulos.map(a => ({ ...a, articulo_label: friendlyLabel(a.identificador) }));
// A different, hypothetical ruling: the presentation must follow its metadata, not an ID.
const other = {
    id: 'otra', tipo: 'Sentencia', siglas: 'SCJN-AI-45-2025', fecha_publicacion: '2025-11-03', vigente: null, articulos: 9,
    titulo: 'Sentencia dictada por el Pleno de la Suprema Corte de Justicia de la Nación en la Acción de Inconstitucionalidad 45/2025 y su acumulada 48/2025.',
};
const ley = { id: 'lse', tipo: 'Ley', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', fecha_publicacion: '2025-03-18', articulos: 120 };

describe('judicial rulings', () => {
    it('identifies a ruling, its court and case file from its own metadata', () => {
        expect(isJudgment(scjn)).toBe(true);
        expect(isJudgment(other)).toBe(true);
        expect(isJudgment(ley)).toBe(false);
        expect(instrumentTypeLabel(scjn)).toBe('Sentencia · SCJN');
        expect(judgmentCase(scjn)).toEqual({ kind: 'Controversia constitucional', number: '137/2026', label: 'Controversia constitucional 137/2026' });
        expect(judgmentCase(other).label).toBe('Acción de inconstitucionalidad 45/2025');
        expect(judgmentCourt({ tipo: 'sentencia', titulo: 'Sentencia de un tribunal', siglas: 'X-1' })).toBeNull();
        expect(instrumentTypeLabel({ tipo: 'sentencia', titulo: 'Sentencia de un tribunal' })).toBe('Sentencia');
        expect(instrumentTypeLabel(ley)).toBe('Ley');
        expect(getAcervoGroup(scjn)).toBe('otros');
        expect(getAcervoGroup(other)).toBe('otros');
    });

    it('calls its fragments apartados and keeps artículos for laws', () => {
        expect(fragmentNoun(scjn).many).toBe('apartados');
        expect(countFragments(1, scjn)).toBe('1 apartado');
        expect(countFragments(22, scjn)).toBe('22 apartados');
        expect(countFragments(120, ley)).toBe('120 artículos');
        const badges = apartados.map(a => KIND_BADGE[indexLabel(a).kind]);
        expect(badges.filter(b => b === 'RES')).toHaveLength(3);
        expect(badges.every(b => b === 'APART' || b === 'RES')).toBe(true);
        expect(indexLabel({ articulo_label: 'Capítulo I', tipo_articulo: 'ordinario' }).kind).not.toBe('apartado');
    });

    it('points to the sections that set its effects, without reading the publication date as effectiveness', () => {
        const { effects, resolutions } = judgmentEffectsSections(apartados);
        expect(effects.articulo_label).toBe('VII. EFECTOS');
        expect(resolutions.articulo_label).toBe('Resolutivo PRIMERO');
        expect(judgmentEffectsSections([{ articulo_label: 'I. COMPETENCIA' }])).toEqual({ effects: null, resolutions: null });
        const [entry] = buildInstrumentTimeline({ law: scjn, articles: apartados }).entries;
        expect(entry.type).toBe('Sentencia · SCJN');
        expect(entry.dateLabel).toBe('Publicación');
        expect(entry.date).toBe('2026-10-21');
        expect(entry.context).toMatch(/no corren necesariamente desde este día/);
        expect(buildInstrumentTimeline({ law: ley }).entries[0].context).toBe('');
    });
});

describe('rulings in the acervo', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('lists the ruling in Otros instrumentos with a visible Sentencia label and its apartados', () => {
        vi.stubGlobal('requestAnimationFrame', callback => setTimeout(callback, 0));
        vi.stubGlobal('cancelAnimationFrame', clearTimeout);
        document.body.innerHTML = '<div id="acervo"></div>';
        const container = document.getElementById('acervo');
        const view = renderAcervoView(container, [ley, scjn, other]);
        const card = container.querySelector(`.ac-group[data-category="otros"] [data-law-id="${scjn.id}"]`);
        expect(card).not.toBeNull();
        const category = card.querySelector('.ac-card-category');
        expect(category.textContent).toBe('Sentencia · SCJN');
        expect(category.classList.contains('is-judgment')).toBe(true);
        expect(card.querySelector('.ac-card-meta').textContent).toContain('22 apartados');
        expect(container.querySelector('[data-law-id="lse"] .ac-card-meta').textContent).toContain('120 disposiciones');
        const recent = container.querySelector(`[data-latest-id="${scjn.id}"] .ac-recent-group`);
        if (recent) expect(recent.textContent).toBe('Otros instrumentos · Sentencia');
        view.destroy();
    });
});
