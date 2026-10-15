import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
const data=JSON.parse(readFileSync('revision-acervo/mapeo-asea-taponamiento-2026-10-15/carga.json','utf8'));
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
it('maps all ASEA well plugging call provisions without including the following agreement or editorial note',async()=>{
    vi.stubGlobal('crypto',webcrypto);
    const official=data.articulos.filter(a=>a.orden!==0);
    expect(official).toHaveLength(8);
    for(const a of official){
        const r=await getReaderSource(a.id,{articleText:a.contenido,manifest});
        expect(r.status,a.identificador).toBe('mapped');
        expect(r.contentVerified).toBe(true);
        expect(manifest.articles[a.id].pageNumbers.every(n=>n>=33&&n<=35)).toBe(true);
    }
    expect(manifest.articles[data.articulos[0].id]).toBeUndefined();
    expect((await getReaderSource(official[0].id,{articleText:official[0].contenido+' ',manifest})).reason).toBe('content-mismatch');
});
