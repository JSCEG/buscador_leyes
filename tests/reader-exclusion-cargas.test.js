import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
const data=JSON.parse(readFileSync('revision-acervo/mapeo-exclusion-cargas-legadas-2026-10-09/carga.json','utf8'));
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
it('maps the complete amendment and signatures while excluding local editorial text',async()=>{
    vi.stubGlobal('crypto',webcrypto);
    const official=data.articulos.filter(a=>a.orden!==0);
    expect(official).toHaveLength(7);
    for(const a of official){
        const result=await getReaderSource(a.id,{articleText:a.contenido,manifest});
        expect(result.status,a.identificador).toBe('mapped');
        expect(result.contentVerified).toBe(true);
        expect(manifest.articles[a.id].pageNumbers.every(n=>n>=171&&n<=179)).toBe(true);
    }
    expect(manifest.articles[data.articulos[0].id]).toBeUndefined();
    const amendment=official.find(a=>a.orden===2);
    expect(manifest.articles[amendment.id].pageNumbers.length).toBeGreaterThan(1);
    expect((await getReaderSource(amendment.id,{articleText:amendment.contenido+' ',manifest})).reason).toBe('content-mismatch');
});
