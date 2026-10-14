import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
const data=JSON.parse(readFileSync('revision-acervo/mapeo-conv-gen-1-m3-2026-10-14/carga.json','utf8'));
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
it('maps all generation call amendment provisions without including the following agreement or editorial note',async()=>{
    vi.stubGlobal('crypto',webcrypto);
    const official=data.articulos.filter(a=>a.orden!==0);
    expect(official).toHaveLength(5);
    for(const a of official){
        const r=await getReaderSource(a.id,{articleText:a.contenido,manifest});
        expect(r.status,a.identificador).toBe('mapped');
        expect(r.contentVerified).toBe(true);
        expect(manifest.articles[a.id].pageNumbers.every(n=>n>=70&&n<=71)).toBe(true);
    }
    expect(manifest.articles[data.articulos[0].id]).toBeUndefined();
    expect((await getReaderSource(official[0].id,{articleText:official[0].contenido+' ',manifest})).reason).toBe('content-mismatch');
});
