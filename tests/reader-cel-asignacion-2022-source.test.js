import{readFileSync}from'node:fs';import{webcrypto}from'node:crypto';import{afterEach,expect,it,vi}from'vitest';import{getReaderSource}from'../src/lib/reader-source.js';
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
const articles=JSON.parse(readFileSync('revision-acervo/sincronizacion-cel-asignacion-2022-2026-10-05/articulos-verificados.json','utf8')).articulos;
const sourceId='dof-matutina-2024-04-08-fd0f00ae1f14';afterEach(()=>vi.unstubAllGlobals());
it('maps and verifies all nine loaded CEL assignment fragments against the official DOF issue',async()=>{
 vi.stubGlobal('crypto',webcrypto);expect(articles).toHaveLength(9);const source=manifest.sources[sourceId];
 expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/08-04-2024/Matutina/312601');expect(source.instrumentIds).toContain('15fcb1e0-8cd8-5215-9be6-727be3002b3b');expect(source.sha256).toBe('fd0f00ae1f140ae00bca0e33184f51904b2522221f7d27e82219a9b952c942e8');
 for(const article of articles){const result=await getReaderSource(article.id,{articleText:article.contenido,manifest});expect(result.status,article.identificador).toBe('mapped');expect(result.contentVerified,article.identificador).toBe(true);expect(result.source.id).toBe(sourceId);expect(result.pages.every(page=>page.number>=139&&page.number<=144),article.identificador).toBe(true);expect(result.highlights.length).toBeGreaterThan(0);}
 expect(manifest.articles['3e8022b4-5fbc-5959-a96e-8d4019dec960'].pageNumbers).toEqual([142,143]);expect(manifest.articles['fe0f6434-f1c6-5165-bba5-aa9c006ed922'].pageNumbers).toEqual([143,144]);
});
