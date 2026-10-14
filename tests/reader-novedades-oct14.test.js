import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
it('maps both new instruments including both halves of the 197-item HIIP annex',async()=>{
    vi.stubGlobal('crypto',webcrypto);
    for(const [name,count,first,last] of [['vigencias',16,38,42],['hiip',11,133,147]]){
        const data=JSON.parse(readFileSync(`revision-acervo/mapeo-${name}-2026-10-14/carga.json`,'utf8'));
        expect(data.articulos).toHaveLength(count);
        for(const a of data.articulos){
            const r=await getReaderSource(a.id,{articleText:a.contenido,manifest});
            expect(r.status,a.identificador).toBe('mapped');
            expect(r.contentVerified).toBe(true);
            expect(manifest.articles[a.id].pageNumbers.every(n=>n>=first&&n<=last)).toBe(true);
        }
        const a=data.articulos[0];
        expect((await getReaderSource(a.id,{articleText:a.contenido+' ',manifest})).reason).toBe('content-mismatch');
    }
    const audit=JSON.parse(readFileSync('revision-acervo/mapeo-hiip-2026-10-14/cotejo-reactivos.json','utf8'));
    expect(audit.map(a=>a.filas)).toEqual([100,97]);
    expect(audit.flatMap(a=>a.fallos)).toEqual([]);
});
