import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
const data=JSON.parse(readFileSync('revision-acervo/mapeo-electromovilidad-2026-10-09/carga.json','utf8'));
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
it('verifies existing electromobility text and includes image-only form pages',async()=>{
    vi.stubGlobal('crypto',webcrypto);
    for(const a of data.articulos.filter(a=>a.orden!==0)){
        const result=await getReaderSource(a.id,{articleText:a.contenido,manifest});
        expect(result.status,a.identificador).toBe('mapped');
        expect(result.contentVerified).toBe(true);
    }
    const first=data.articulos.find(a=>a.orden===23);
    const second=data.articulos.find(a=>a.orden===24);
    expect(manifest.articles[first.id].pageNumbers).toEqual(expect.arrayContaining([133,134]));
    expect(manifest.articles[second.id].anchors.some(a=>a.page===135&&a.bbox[3]>700)).toBe(true);
    expect(manifest.articles[data.articulos[0].id]).toBeUndefined();
    expect((await getReaderSource(first.id,{articleText:first.contenido+' ',manifest})).reason).toBe('content-mismatch');
});
