import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const data = JSON.parse(readFileSync('revision-acervo/incorporacion-pendientes-2026-09-19/MIGRACION-ACLARACION-carga.json', 'utf8'));
const official = data.articulos.filter(row => row.id !== '3e5d22a1-8b7f-5637-8532-d25e7069cf82');
const editorial = data.articulos.find(row => row.id === '3e5d22a1-8b7f-5637-8532-d25e7069cf82');

afterEach(() => vi.unstubAllGlobals());

it('maps all and only official clarification fragments to page 107', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(official).toHaveLength(3);
    for (const row of official) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status).toBe('mapped');
        expect(result.contentVerified).toBe(true);
        expect(result.source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/26-06-2026/Matutina/328125');
        expect(result.pages.map(page => page.number)).toEqual([107]);
        expect(result.highlights.length).toBeGreaterThan(0);
        expect(result.highlights.every(box => box.y + box.height < 78)).toBe(true);
    }
    expect(resolveReaderSource(manifest, editorial.id).reason).toBe('no-traceability');
});

it('keeps the table correction and signature within their verified labels', () => {
    const correction = manifest.articles['8f223d51-5f31-5657-be7e-9be836c24a4f'];
    const signature = manifest.articles['19c63719-5fb1-53e3-979b-e1a0ba790b68'];
    expect(correction.label).toContain('Dice y debe decir');
    expect(correction.anchors.some(anchor => anchor.bbox[1] >= 490 && anchor.bbox[1] < 560)).toBe(true);
    expect(signature.label).toBe('Firma de la nota aclaratoria');
    expect(signature.anchors.every(anchor => anchor.bbox[1] >= 570 && anchor.bbox[3] <= 605)).toBe(true);
    expect(editorial.contenido).toContain('no forma parte del texto oficial');
});
