import { describe, expect, it } from 'vitest';
import { COVER_COLORS, GROUP_LABELS, coverData, coverHTML, spineHTML } from '../src/lib/law-cover.js';

const ley = { id: 'a', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'ley', fecha_publicacion: '2025-03-18' };
const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

describe('law covers', () => {
  it('meets 4.5:1 in every collection', () => {
    expect(Object.keys(COVER_COLORS)).toHaveLength(7);
    for (const { bg, ink } of Object.values(COVER_COLORS)) expect(ratio(bg, ink)).toBeGreaterThanOrEqual(4.5);
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
  it('escapes HTML from data', () => {
    const evil = { ...ley, titulo: '<img src=x onerror=alert(1)>', siglas: '"><script>' };
    for (const html of [coverHTML(evil), spineHTML(evil)]) {
      expect(html).not.toContain('<img src=x'); expect(html).not.toContain('<script>');
    }
  });
});
