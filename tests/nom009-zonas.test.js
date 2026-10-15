import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {expect,it,vi} from 'vitest';
import {getReaderSource} from '../src/lib/reader-source.js';
const root='revision-acervo/correccion-nom009-zonas-2026-10-14/';
const data=JSON.parse(readFileSync(root+'carga.json','utf8'));
const audit=JSON.parse(readFileSync(root+'cotejo.json','utf8'));
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
it('preserves each metropolitan municipality once, including Guanajuato, against verified PDF pages',async()=>{
    vi.stubGlobal('crypto',webcrypto);
    expect(audit.map(a=>a.filas.map(r=>r.municipios.length))).toEqual([[10,18,39,16,76],[4,8,1,7,5,3]]);
    for(const a of data){
        const node=document.createElement('div');node.innerHTML=a.contenido;
        expect(node.querySelectorAll('table')).toHaveLength(1);
        for(const row of node.querySelectorAll('tbody tr')){
            expect(row.cells.length).toBe(2);
            const names=[...row.querySelectorAll('li')].map(n=>n.textContent);
            expect(new Set(names).size).toBe(names.length);
        }
        expect((await getReaderSource(a.id,{articleText:a.contenido,manifest})).contentVerified).toBe(true);
    }
});
