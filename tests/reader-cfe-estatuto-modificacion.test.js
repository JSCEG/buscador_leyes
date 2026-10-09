import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { getReaderSource } from '../src/lib/reader-source.js';
const data=JSON.parse(readFileSync('revision-acervo/incorporacion-modificacion-estatuto-cfe-2026-10-09/carga.json','utf8'));
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
it('maps modified provisions without conflating bis/ter/quater and preserves all transitories',async()=>{
    vi.stubGlobal('crypto',webcrypto);
    const instrument=data.instruments[0];
    expect(instrument.articulos).toHaveLength(54);
    expect(instrument.articulos.filter(a=>a.tipo_articulo==='ordinario')).toHaveLength(42);
    expect(instrument.articulos.filter(a=>a.tipo_articulo==='transitorio')).toHaveLength(11);
    const q=instrument.articulos.find(a=>a.identificador==='Artículo 43 Quater · modificación');
    expect(q.contenido).toContain('Contratos de Producción Externa');
    expect(instrument.articulos.find(a=>a.identificador==='Artículo 54 · modificación').contenido).toContain('Derogado');
    for(const a of instrument.articulos){
        const m=await getReaderSource(a.id,{articleText:a.contenido,manifest});
        expect(m.status,a.identificador).toBe('mapped');
        expect(m.contentVerified).toBe(true);
        expect(manifest.articles[a.id].pageNumbers.every(n=>n>=97&&n<=108)).toBe(true);
    }
    expect((await getReaderSource(q.id,{articleText:q.contenido+' ',manifest})).reason).toBe('content-mismatch');
});
