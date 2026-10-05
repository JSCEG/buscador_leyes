import{readFileSync}from'node:fs';import{webcrypto}from'node:crypto';import{afterEach,expect,it,vi}from'vitest';import{getReaderSource}from'../src/lib/reader-source.js';
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
const articles=JSON.parse(readFileSync('revision-acervo/sincronizacion-cargo-transmision-legados-2026-10-05/articulos-verificados.json','utf8')).articulos;
const sourceId='dof-matutina-2026-06-18-4fb0664039a9';afterEach(()=>vi.unstubAllGlobals());
it('maps and verifies all 12 loaded transmission-charge agreement fragments against the DOF PDF',async()=>{
 vi.stubGlobal('crypto',webcrypto);expect(articles).toHaveLength(12);const source=manifest.sources[sourceId];
 expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/18-06-2026/Matutina/327985');expect(source.instrumentIds).toContain('6be7cf44-0134-5950-b9d0-a898d4ec5ced');expect(source.instrumentIds).toContain('91a6f28d-52a9-5f72-96e0-ac50a1991c96');expect(source.sha256).toBe('4fb0664039a940ee5f281059d741aa8bafff6b713ff969e60af49ed248331c49');
 for(const article of articles){const result=await getReaderSource(article.id,{articleText:article.contenido,manifest});expect(result.status,article.identificador).toBe('mapped');expect(result.contentVerified,article.identificador).toBe(true);expect(result.source.id).toBe(sourceId);expect(result.pages.every(page=>page.number>=31&&page.number<=35),article.identificador).toBe(true);expect(result.highlights.length).toBeGreaterThan(0);}
 expect(manifest.articles[articles.at(-1).id].pageNumbers).toEqual([35]);
});
