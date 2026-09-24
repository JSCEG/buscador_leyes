import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { buildInstrumentTimeline, timelineDate, timelineSource } from '../src/lib/instrument-timeline.js';
import { renderInstrumentTimeline } from '../src/scripts/instrument-timeline-view.js';

const base = 'revision-acervo/incorporacion-autoconsumo-2026-09-18/despues-verificado/';
const summaries = JSON.parse(readFileSync(`${base}leyes.json`, 'utf8'));
const raw = JSON.parse(readFileSync(`${base}articulos.json`, 'utf8'));
const articlesFor = id => raw.filter(a => a.ley_id === id).map(a => ({ ...a, texto: a.contenido, articulo_label: a.identificador }));
const dataFor = siglas => {
    const law = summaries.find(row => row.siglas === siglas);
    return { law, summaries, articles: articlesFor(law.id) };
};

describe('instrument chronology', () => {
    it.each(['CONV-ESTRATEGICOS', 'CONV-ESTRATEGICOS-M1', 'CONV-ESTRATEGICOS-M2', 'CONV-ESTRATEGICOS-M3'])('shows the same complete chronology from %s', siglas => {
        const data = dataFor(siglas);
        const { entries } = buildInstrumentTimeline(data);
        expect(entries.map(e => e.date)).toEqual(['2026-05-15', '2026-05-26', '2026-07-10', '2026-09-02']);
        expect(entries.map(e => e.role)).toEqual(['Texto original', 'Modificación 1', 'Modificación 2', 'Modificación 3']);
        expect(entries.filter(e => e.current).map(e => e.id)).toEqual([data.law.id]);
        expect(entries.some(e => /Firma|Nota editorial|Guía/.test(e.title))).toBe(false);
    });

    it('distinguishes publication, notification and signature fragments in the LCNE', () => {
        const { entries } = buildInstrumentTimeline(dataFor('LCNE'));
        expect(entries).toHaveLength(3);
        expect(entries.map(e => [e.date, e.dateLabel])).toEqual([
            ['2025-03-18', 'Publicación'], ['2025-11-04', 'Notificación al Congreso'], ['2025-12-26', 'Publicación en el DOF'],
        ]);
        expect(entries[1].type).toBe('Resolutivos de la SCJN');
        expect(entries[2].kind).toBe('complement');
        expect(entries[2].sourceLabel).toBe('Fuente del instrumento');
    });

    it('dates an erratum by its own DOF label, not the original decree mentioned in its text', () => {
        const { entries } = buildInstrumentTimeline(dataFor('RLEPECFE'));
        expect(entries.map(e => e.date)).toEqual(['2025-12-02', '2025-12-29']);
        expect(entries[1].type).toBe('Fe de erratas');
    });

    it('does not present related autoconsumo agreements as modifications', () => {
        const { entries } = buildInstrumentTimeline(dataFor('FORMATO-AUTOCONSUMO'));
        expect(entries).toHaveLength(3);
        expect(entries.every(e => e.role === 'Documento relacionado')).toBe(true);
        expect(entries.map(e => e.date)).toEqual(['2025-08-06', '2025-10-07', '2026-05-08']);
    });

    it.each(['DACG-Planeación Vinculante', 'LSE', 'RISENER', 'ACUERDO-PODECOBI-22052025'])('supports a record without known history: %s', siglas => {
        const data = dataFor(siglas);
        const { entries } = buildInstrumentTimeline(data);
        expect(entries).toHaveLength(1);
        expect(entries[0].id).toBe(data.law.id);
        expect(entries[0].role).toBe('Publicación');
    });

    it('follows structured relations across types without duplicate events, missing links or infinite cycles', () => {
        const laws = ['ley', 'dacg', 'acuerdo', 'reglamento'].map((tipo, i) => ({ id: String(i), titulo: `Instrumento ${i}`, tipo, fecha_publicacion: `2026-01-0${i + 1}` }));
        const relations = [[0, 1], [1, 2], [2, 0], [2, 3], [2, 3], [3, 99]].map(([a, b]) => ({ ley_afectada_id: String(a), ley_nueva_id: String(b), tipo: 'modifica' }));
        const { entries, unavailableCount } = buildInstrumentTimeline({ law: laws[1], summaries: laws, relations });
        expect(entries.map(e => e.id)).toEqual(['0', '1', '2', '3']);
        expect(entries[3].context).toBe('Modifica: Instrumento 2');
        expect(unavailableCount).toBe(1);
    });

    it('does not turn ordinary citations into history or invent dates for undated complements', () => {
        const law = { id: 'law', titulo: 'Ley', fecha_publicacion: 'invalid', url_original: 'javascript:alert(1)' };
        const articles = [
            { id: 'ordinary', tipo_articulo: 'ordinario', articulo_label: 'Artículo 1', texto: '<a href="/#ley-other">Texto original · 01/01/2020</a>' },
            { id: 'extra', tipo_articulo: 'complementario', articulo_label: 'Documento complementario', texto: 'Este texto cita una norma publicada el 2 de diciembre de 2025.' },
        ];
        const { entries } = buildInstrumentTimeline({ law, articles, summaries: [{ id: 'other' }] });
        expect(entries).toHaveLength(2);
        expect(entries.every(e => e.date === null && e.source === null)).toBe(true);
        expect(timelineDate('2026-02-30')).toBeNull();
        expect(timelineSource('https://user:password@example.com')).toBeNull();
    });

    it('escapes metadata and wires instrument/complement links separately while preserving new-tab clicks', () => {
        const container = document.createElement('div');
        const law = { id: 'law', titulo: '<img src=x onerror=alert(1)>', fecha_publicacion: '2025-01-01' };
        const other = { id: 'other', titulo: 'Otro acuerdo', fecha_publicacion: '2026-01-01' };
        const note = { tipo_articulo: 'complementario', articulo_label: 'Nota editorial', texto: '<a href="/#ley-other">Relacionado</a>' };
        const complement = { id: 'extra', tipo_articulo: 'complementario', articulo_label: 'Sentencia de la SCJN' };
        const onOpenLaw = vi.fn(), onOpenArticle = vi.fn();
        renderInstrumentTimeline(container, { law, summaries: [other], articles: [note, complement] }, { onOpenLaw, onOpenArticle });
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('h3').textContent).toBe(law.titulo);
        expect(container.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
        const lawLink = container.querySelector('[href="#ley-other"]');
        lawLink.click();
        container.querySelector('[href="#art-extra"]').click();
        expect(onOpenLaw).toHaveBeenCalledWith('other');
        expect(onOpenArticle).toHaveBeenCalledWith('extra');
        lawLink.dispatchEvent(new MouseEvent('click', { ctrlKey: true }));
        expect(onOpenLaw).toHaveBeenCalledTimes(1);
        expect(container.textContent).toContain('Sin fecha');
    });
});
