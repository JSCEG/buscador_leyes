import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const data = JSON.parse(readFileSync('revision-acervo/incorporacion-pendientes-2026-09-19/MIGRACION-PERMISOS-carga.json', 'utf8'));
const official = data.articulos.filter(row => !row.identificador.startsWith('Nota editorial'));
const editorial = data.articulos.find(row => row.identificador.startsWith('Nota editorial'));

afterEach(() => vi.unstubAllGlobals());

it('maps and verifies all 77 official migration-lineament fragments to their DOF pages', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(official).toHaveLength(77);
    for (const row of official) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status, row.identificador).toBe('mapped');
        expect(result.contentVerified, row.identificador).toBe(true);
        expect(result.source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/18-06-2026/Matutina/327985');
        expect(result.pages.length, row.identificador).toBeGreaterThan(0);
        expect(result.pages.every(page => page.number >= 5 && page.number <= 26), row.identificador).toBe(true);
        expect(result.highlights.length, row.identificador).toBeGreaterThan(0);
    }
    expect(resolveReaderSource(manifest, editorial.id).reason).toBe('no-traceability');
});

it('anchors the first article in the preamble and the signature at the end of the text', () => {
    const preamble = manifest.articles['21aedcc3-bef9-5762-bd4d-d1b029f54e14'];
    const signature = Object.values(manifest.articles).find(row => row.sourceId === 'dof-matutina-2026-06-18-4fb0664039a9' && row.label === 'Firma del acuerdo');
    expect(preamble.pageNumbers).toEqual([5, 6]);
    expect(preamble.anchors.every(anchor => anchor.page <= 6)).toBe(true);
    expect(signature.pageNumbers).toEqual([26]);
    expect(signature.anchors.every(anchor => anchor.page === 26 && anchor.bbox[1] > 690)).toBe(true);
});
