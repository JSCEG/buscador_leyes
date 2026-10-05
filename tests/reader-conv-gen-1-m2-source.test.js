import{readFileSync}from'node:fs';import{webcrypto}from'node:crypto';import{afterEach,expect,it,vi}from'vitest';import{getReaderSource}from'../src/lib/reader-source.js';
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
const articles=JSON.parse(readFileSync('revision-acervo/incorporacion-convocatorias-2026-09-17/CONV-GEN-1-M2-carga.json','utf8')).articulos.filter(a=>!a.identificador.toLowerCase().startsWith('nota editorial'));
const sourceId='dof-matutina-2025-11-10-7f5b3270512b';afterEach(()=>vi.unstubAllGlobals());
it('maps the five official fragments of generation call amendment 2',async()=>{
 vi.stubGlobal('crypto',webcrypto);expect(articles).toHaveLength(5);const source=manifest.sources[sourceId];
 expect(source.originalUrl).toBe('https://sidof.segob.gob.mx/notas/getNewsletter/10-11-2025/Matutina/324043');expect(source.instrumentIds).toContain('10c059c7-bfa4-5ec0-9ae6-bf1d8a35a637');expect(source.sha256).toBe('7f5b3270512bace265139239071a007dd150e184e7a24f869055da27afba2360');
 for(const a of articles){const result=await getReaderSource(a.id,{articleText:a.contenido,manifest});expect(result.status,a.identificador).toBe('mapped');expect(result.contentVerified,a.identificador).toBe(true);expect(result.source.id).toBe(sourceId);expect(result.pages.map(p=>p.number)).toEqual([142]);expect(result.highlights.length).toBeGreaterThan(0);}
});
