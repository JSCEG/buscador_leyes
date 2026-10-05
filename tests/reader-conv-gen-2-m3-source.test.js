import{readFileSync}from'node:fs';import{webcrypto}from'node:crypto';import{afterEach,expect,it,vi}from'vitest';import{getReaderSource}from'../src/lib/reader-source.js';
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
const articles=JSON.parse(readFileSync('revision-acervo/sincronizacion-conv-gen-2-m3-2026-10-05/articulos-verificados.json','utf8')).articulos;
const sourceId='dof-matutina-2026-06-18-4fb0664039a9';afterEach(()=>vi.unstubAllGlobals());
it('maps and verifies all five loaded second-call amendment fragments, including its calendar table',async()=>{
 vi.stubGlobal('crypto',webcrypto);expect(articles).toHaveLength(5);const source=manifest.sources[sourceId];
 expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/18-06-2026/Matutina/327985');expect(source.instrumentIds).toContain('d026115a-998a-544f-bff0-39f93c04f444');expect(source.sha256).toBe('4fb0664039a940ee5f281059d741aa8bafff6b713ff969e60af49ed248331c49');
 for(const article of articles){const result=await getReaderSource(article.id,{articleText:article.contenido,manifest});expect(result.status,article.identificador).toBe('mapped');expect(result.contentVerified,article.identificador).toBe(true);expect(result.source.id).toBe(sourceId);expect(result.pages.every(page=>page.number>=27&&page.number<=30),article.identificador).toBe(true);expect(result.highlights.length).toBeGreaterThan(0);}
 expect(manifest.articles[articles[1].id].pageNumbers).toEqual([27,28,29,30]);expect(Object.values(manifest.articles).filter(entry=>entry.sourceId===sourceId).length).toBeGreaterThanOrEqual(94);
});
