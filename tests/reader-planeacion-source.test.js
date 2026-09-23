import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';

const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());
for (const [name, count] of [['lpte', 113], ['rlpte', 152]]) {
    it(`verifies every ${name} fragment and rejects changed content`, async () => {
        vi.stubGlobal('crypto', webcrypto);
        const rows = JSON.parse(readFileSync(`revision-acervo/sincronizacion-${name}-2026-09-23/articulos-verificados.json`, 'utf8'));
        expect(rows).toHaveLength(count);
        for (const row of rows) {
            const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
            expect(result.status, row.identificador).toBe('mapped');
            expect(result.contentVerified).toBe(true);
            expect(result.source.lawId).toBe(row.ley_id);
            for (let pageIndex = 0; pageIndex < result.pages.length; pageIndex++) {
                expect(resolveReaderSource(manifest, row.id, { pageIndex }).highlights.length).toBeGreaterThan(0);
            }
        }
        expect((await getReaderSource(rows[0].id, { articleText: rows[0].contenido + ' modificación', manifest })).reason).toBe('content-mismatch');
    });
}
