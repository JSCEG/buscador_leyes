import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
const articles=JSON.parse(readFileSync('revision-acervo/incorporacion-convocatorias-2026-09-17/CONV-ESTRATEGICOS-M1-carga.json','utf8')).articulos
    .filter(a=>!a.identificador.toLowerCase().startsWith('nota editorial'));
const sourceId='dof-matutina-2026-05-26-1a28d5fb75ec';
afterEach(()=>vi.unstubAllGlobals());
it('maps the five loaded official fragments of strategic-projects call amendment 1',async()=>{
 vi.stubGlobal('crypto',webcrypto);expect(articles).toHaveLength(5);const source=manifest.sources[sourceId];
 expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/26-05-2026/Matutina/327526');
 expect(source.instrumentIds).toContain('373ce6df-4e78-59d9-aae5-54007a446c59');
 expect(source.sha256).toBe('1a28d5fb75ec9451422ff890b18ba71cec4a3cd92b2d4c47b90fde9c6253ed38');
 for(const article of articles){const result=await getReaderSource(article.id,{articleText:article.contenido,manifest});
  expect(result.status,article.identificador).toBe('mapped');expect(result.contentVerified,article.identificador).toBe(true);
  expect(result.source.id).toBe(sourceId);expect(result.pages.map(p=>p.number)).toEqual([45]);expect(result.highlights.length).toBeGreaterThan(0);}
});
