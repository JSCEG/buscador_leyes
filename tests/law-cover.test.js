import { describe, expect, it } from 'vitest';
import { GROUP_LABELS, coverData, coverHTML, spineHTML } from '../src/lib/law-cover.js';

const ley = { id: 'a', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'ley', fecha_publicacion: '2025-03-18' };
describe('law covers', () => {
  it('takes its accent from the document type, not its acronym', () => {
    const html = coverHTML({ titulo: 'Ley X', siglas: 'LX', tipo: 'Ley' });
    expect(html).toContain('data-category="leyes"');
    expect(html).not.toContain('--sh-bg');
    expect(spineHTML({ titulo: 'Ley X', siglas: 'LX', tipo: 'Ley' })).not.toContain('--sh-bg');
  });
  it.each([{}, { titulo: 'x'.repeat(600) }, { siglas: 'NOM-EM-008-ASEA-2026' }])('survives %j', law => {
    expect(() => coverHTML(law)).not.toThrow();
    expect(spineHTML(law)).toContain('sh-spine');
  });
  it('uses plain collection labels', () => { expect(GROUP_LABELS.dacg).toBe('Disposiciones'); });
  it('big acronym only up to 14 characters', () => {
    expect(coverData(ley).display).toBe('siglas');
    expect(coverData({ ...ley, siglas: 'ABCDEFGHIJKLMN' }).display).toBe('siglas');
    expect(coverData({ ...ley, siglas: 'ACUERDO-CNE-16/04/2026-DACG-SAE' }).display).toBe('name');
  });
  it('falls back when data is missing', () => {
    expect(coverData({ ...ley, fecha_publicacion: null }).year).toBe('Sin fecha');
    const noAcronym = coverData({ ...ley, siglas: '' });
    expect(noAcronym.display).toBe('name'); expect(noAcronym.name).toBeTruthy();
    expect(coverHTML({ id: 'x' })).toContain('Sin fecha');
    expect(spineHTML({ id: 'x' })).toContain('data-category="otros"');
  });
  it('keeps the official title and shortens the name', () => {
    const titulo = `Acuerdo de la Comisión Nacional de Energía por el que se emite la metodología para ${'x'.repeat(700)}`;
    const data = coverData({ ...ley, titulo, siglas: 'ACUERDO-LARGO-DE-PRUEBA', tipo: 'acuerdo' });
    expect(data.title).toBe(titulo); expect(data.name.startsWith('Metodología')).toBe(true);
  });
  it('labels rulings with their case', () => {
    const data = coverData({ id: 's', titulo: 'Sentencia de la Suprema Corte. Controversia constitucional 1/2025', siglas: 'SCJN-CC-1-2025', tipo: 'sentencia', fecha_publicacion: '2025-01-01' });
    expect(data.typeLabel.startsWith('Sentencia')).toBe(true);
  });
  it('prints the full publication date on the cover', () => {
    const data = coverData({ ...ley, fecha_publicacion: '2025-03-18' });
    expect(data.date).toBe('18 mar 2025');
    expect(data.year).toBe('2025');
    document.body.innerHTML = coverHTML({ ...ley, fecha_publicacion: '2026-10-05' });
    expect(document.querySelector('.sh-cover-date').textContent).toBe('5 oct 2026');
  });
  it('does not invent a day or a month the document does not have', () => {
    expect(coverData({ ...ley, fecha_publicacion: '2025' }).date).toBe('2025');
    expect(coverData({ ...ley, fecha_publicacion: '2025-13-40' }).date).toBe('2025');
    expect(coverData({ ...ley, fecha_publicacion: null }).date).toBe('Sin fecha');
  });
  it('keeps spines minimal: acronym and year only', () => {
    document.body.innerHTML = spineHTML(ley);
    expect(document.querySelector('.sh-spine-label').textContent).toBe('LSE');
    expect(document.querySelector('.sh-spine-year').textContent).toBe('2025');
    expect(document.querySelector('.sh-spine').textContent.replace(/\s+/g, ' ').trim()).toBe('LSE 2025');
  });
  it('draws the cover with ribbon, band and accent, and fits the acronym', () => {
    document.body.innerHTML = coverHTML(ley);
    expect(document.querySelector('.sh-cover-ribbon')).not.toBeNull();
    expect(document.querySelector('.sh-cover-band')).not.toBeNull();
    expect(document.querySelector('.sh-cover-accent')).not.toBeNull();
    expect(document.querySelector('.sh-cover-foot').textContent).toContain('2025');
    expect(document.querySelector('.sh-cover-foot svg')).not.toBeNull();
    expect(document.querySelector('.sh-cover-siglas').dataset.size).toBe('l');
    document.body.innerHTML = coverHTML({ ...ley, siglas: 'LEPEPM' });
    expect(document.querySelector('.sh-cover-siglas').dataset.size).toBe('m');
    document.body.innerHTML = coverHTML({ ...ley, siglas: 'ABCDEFGH' });
    expect(document.querySelector('.sh-cover-siglas').dataset.size).toBe('m');
    document.body.innerHTML = coverHTML({ ...ley, siglas: 'ABCDEFGHIJKLMN' });
    expect(document.querySelector('.sh-cover-siglas').dataset.size).toBe('s');
    document.body.innerHTML = '';
  });
  it('escapes HTML from data', () => {
    const evil = { ...ley, titulo: '<img src=x onerror=alert(1)>', siglas: '"><script>' };
    for (const html of [coverHTML(evil), spineHTML(evil)]) {
      expect(html).not.toContain('<img src=x'); expect(html).not.toContain('<script>');
    }
  });
});
