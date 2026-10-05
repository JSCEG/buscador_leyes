import{readFileSync}from'node:fs';import{webcrypto}from'node:crypto';import{afterEach,expect,it,vi}from'vitest';import{getReaderSource}from'../src/lib/reader-source.js';
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
const articles=JSON.parse(readFileSync('revision-acervo/sincronizacion-dacg-planeacion-vinculante-2026-10-05/articulos-verificados.json','utf8')).articulos;
const sourceId='dof-vespertina-2025-10-17-82f15ac85c7d';afterEach(()=>vi.unstubAllGlobals());
it('maps and verifies all 11 loaded fragments of the binding-planning DACG',async()=>{
 vi.stubGlobal('crypto',webcrypto);expect(articles).toHaveLength(11);const source=manifest.sources[sourceId];
 expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/17-10-2025/Vespertina/323603');expect(source.instrumentIds).toContain('1a4e15a0-cb72-4195-9d96-fe1d939db0e2');expect(source.sha256).toBe('82f15ac85c7de97078a578dd5e5ac6ef2c5025d6f7af9d1a9a398a5a58b56787');
 for(const a of articles){const result=await getReaderSource(a.id,{articleText:a.contenido,manifest});expect(result.status,a.identificador).toBe('mapped');expect(result.contentVerified,a.identificador).toBe(true);expect(result.source.id).toBe(sourceId);expect(result.pages.every(p=>p.number>=113&&p.number<=116),a.identificador).toBe(true);expect(result.highlights.length).toBeGreaterThan(0);}
 const signatures=articles.find(a=>a.identificador==='Firmas y promulgación');expect(manifest.articles[signatures.id].pageNumbers).toEqual([116]);
});
