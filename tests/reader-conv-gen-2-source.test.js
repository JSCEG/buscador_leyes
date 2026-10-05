import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
const articles=JSON.parse(readFileSync('revision-acervo/incorporacion-convocatorias-2026-09-17/CONV-GEN-2-carga.json','utf8')).articulos
 .filter(a=>!a.identificador.toLowerCase().startsWith('nota editorial')&&a.identificador.toLowerCase()!=='índice de la publicación');
const sourceId='dof-vespertina-2026-05-11-f441289bcfc2';afterEach(()=>vi.unstubAllGlobals());
it('maps all 34 official fragments, formats, tables and the 14.4 figure of the second call',async()=>{
 vi.stubGlobal('crypto',webcrypto);expect(articles).toHaveLength(34);const source=manifest.sources[sourceId];
 expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/11-05-2026/Vespertina/327245');
 expect(source.instrumentIds).toContain('2dde9c74-5c23-507b-a0ae-5d3b4722d927');
 expect(source.sha256).toBe('f441289bcfc269955d8f63020cb1c25e8cd3bdfa9b65eefd6061a7481bce7a2f');
 for(const article of articles){const result=await getReaderSource(article.id,{articleText:article.contenido,manifest});
  expect(result.status,article.identificador).toBe('mapped');expect(result.contentVerified,article.identificador).toBe(true);
  expect(result.source.id).toBe(sourceId);expect(result.pages.every(p=>p.number>=2&&p.number<=19),article.identificador).toBe(true);
  expect(result.highlights.length,article.identificador).toBeGreaterThan(0);}
 const graphic=articles.find(a=>a.identificador==='Numeral 14.4');const graphicMap=manifest.articles[graphic.id];
 expect(graphicMap.anchors.some(a=>a.kind==='graphic'&&a.page===19&&a.bbox.join(',')==='84.96,316.56,527.28,502.62')).toBe(true);
 const signature=articles.find(a=>a.identificador==='Firma de la convocatoria');expect(manifest.articles[signature.id].pageNumbers).toEqual([19]);
});
