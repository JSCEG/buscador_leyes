import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const rows = JSON.parse(readFileSync('revision-acervo/sincronizacion-risener-2026-09-30/articulos-verificados.json', 'utf8'));

afterEach(() => vi.unstubAllGlobals());

it('maps and verifies every RISENER fragment against the official DOF issue pages', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(rows).toHaveLength(88);
    for (const row of rows) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status, row.identificador).toBe('mapped');
        expect(result.contentVerified, row.identificador).toBe(true);
        expect(result.source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/17-04-2025/Matutina/320604');
        expect(result.source.lawId).toBe(row.ley_id);
        for (let pageIndex = 0; pageIndex < result.pages.length; pageIndex++) {
            expect(resolveReaderSource(manifest, row.id, { pageIndex }).highlights.length, row.identificador).toBeGreaterThan(0);
        }
    }
});
