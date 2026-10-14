import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {expect,it,vi} from 'vitest';
import {getReaderSource} from '../src/lib/reader-source.js';
const root='revision-acervo/auditoria-tablas-2026-10-14/';
const before=JSON.parse(readFileSync(root+'antes.json','utf8'));
const after=JSON.parse(readFileSync(root+'carga.json','utf8'));
const manifest=JSON.parse(readFileSync('public/reader-sources/manifest.v1.json','utf8'));
const text=value=>{const node=document.createElement('div');node.innerHTML=value;return node.textContent.normalize('NFD').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();};
it('preserves document text when restoring cell spans and semantic headers',()=>{
    expect(after).toHaveLength(59);
    for(const a of after){
        if(a.id==='ec823410-ad59-4080-95d9-b21f24324621')continue;
        expect(text(a.contenido),a.identificador).toBe(text(before.find(x=>x.id===a.id).contenido));
    }
    const sae=after.find(a=>a.id==='ec823410-ad59-4080-95d9-b21f24324621');
    const node=document.createElement('div');node.innerHTML=sae.contenido;
    expect(node.querySelectorAll('table')).toHaveLength(2);
    expect(node.textContent).not.toContain('|');
    expect([...node.querySelectorAll('td')].map(c=>c.textContent.trim())).toEqual(['IEC 62619','IEC 62933-5-1','IEC 62933-5-2','UL 1973','UL 9540']);
});
it('accepts corrected content hashes and rejects previous versions',async()=>{
    vi.stubGlobal('crypto',webcrypto);
    for(const a of after){
        const result=await getReaderSource(a.id,{articleText:a.contenido,manifest});
        expect(result.status,a.identificador).toBe('mapped');
        expect(result.contentVerified).toBe(true);
        const old=before.find(x=>x.id===a.id);
        expect((await getReaderSource(a.id,{articleText:old.contenido,manifest})).reason).toBe('content-mismatch');
    }
});
