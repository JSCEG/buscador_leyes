import{readFileSync}from'node:fs';import{webcrypto}from'node:crypto';import{afterEach,expect,it,vi}from'vitest';import{getReaderSource}from'../src/lib/reader-source.js';
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
const articles=JSON.parse(readFileSync('revision-acervo/sincronizacion-modelos-interconexion-2026-10-05/articulos-verificados.json','utf8')).articulos;
const sourceId='dof-matutina-2026-03-17-3ae8c9b91d32';afterEach(()=>vi.unstubAllGlobals());
it('maps and verifies all 47 loaded interconnection model fragments to the official DOF PDF',async()=>{
 vi.stubGlobal('crypto',webcrypto);expect(articles).toHaveLength(47);const source=manifest.sources[sourceId];
 expect(source.originalUrl).toBe('https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=17032026-MAT.pdf&repo=');expect(source.instrumentIds).toContain('e8d9d3e6-bad0-5b76-a957-eade6279cfe5');expect(source.sha256).toBe('3ae8c9b91d329d0508aafcd558e552fa7361c90c01d8ca3ac839a721175dcc34');
 for(const article of articles){const result=await getReaderSource(article.id,{articleText:article.contenido,manifest});expect(result.status,article.identificador).toBe('mapped');expect(result.contentVerified,article.identificador).toBe(true);expect(result.source.id).toBe(sourceId);expect(result.pages.every(page=>page.number>=4&&page.number<=20),article.identificador).toBe(true);expect(result.highlights.length).toBeGreaterThan(0);}
 expect(manifest.articles['6d66a87a-b3cd-5e81-9191-4d997051fc85'].pageNumbers).toContain(19);expect(manifest.articles['58e710df-3686-587a-a8b6-58378ca87076'].pageNumbers).toEqual([20]);
});
