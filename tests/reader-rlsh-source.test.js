import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource, resolveReaderSource } from '../src/lib/reader-source.js';
const manifest = JSON.parse(readFileSync('public/reader-sources/manifest.v1.json', 'utf8'));
const rows = JSON.parse(readFileSync('revision-acervo/sincronizacion-rlsh-2026-09-23/articulos-verificados.json', 'utf8'));
afterEach(() => vi.unstubAllGlobals());
it('verifies all 371 RLSH fragments and rejects the old extraction error', async () => {
    vi.stubGlobal('crypto', webcrypto);
    expect(rows).toHaveLength(371);
    for (const row of rows) {
        const result = await getReaderSource(row.id, { articleText: row.contenido, manifest });
        expect(result.status, row.identificador).toBe('mapped');
        expect(result.contentVerified).toBe(true);
        expect(result.source.lawId).toBe(row.ley_id);
        for (let pageIndex = 0; pageIndex < result.pages.length; pageIndex++) {
            expect(resolveReaderSource(manifest, row.id, { pageIndex }).highlights.length).toBeGreaterThan(0);
        }
    }
    const article = rows.find(row => row.identificador === 'Artículo 272');
    expect(article.contenido).not.toContain('√');
    const oldText = article.contenido.replaceAll('atestigüen', 'atestig√en');
    expect((await getReaderSource(article.id, { articleText: oldText, manifest })).reason).toBe('content-mismatch');
});
