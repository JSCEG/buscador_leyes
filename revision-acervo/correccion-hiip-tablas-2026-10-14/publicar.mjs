import { readFileSync,writeFileSync,renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root=new URL('.',import.meta.url);
const before=JSON.parse(readFileSync(new URL('../mapeo-hiip-2026-10-14/carga.json',root),'utf8'));
const after=JSON.parse(readFileSync(new URL('carga.json',root),'utf8'));
const path=new URL('../../public/reader-sources/manifest.v1.json',root);
let raw=readFileSync(path,'utf8');const manifest=JSON.parse(raw);
let changed=0;
for(const a of after.articulos){
    const old=before.articulos.find(x=>x.id===a.id);
    if(old.contenido===a.contenido)continue;
    const hash=s=>createHash('sha256').update(s).digest('hex');
    const previous=hash(old.contenido),next=hash(a.contenido);
    if(manifest.articles[a.id].contentSha256!==previous)throw Error('Mapa cambió: '+a.id);
    if(raw.split(previous).length!==2)throw Error('Hash ambiguo');
    raw=raw.replace(previous,next);changed++;
}
if(changed!==4)throw Error('Cobertura incorrecta');
raw=raw.replace(/"revision":\s*(\d+)/,(_,n)=>`"revision": ${Number(n)+1}`)
 .replace(/("verifiedAt":\s*)"[^"]+"/,(_,p)=>p+JSON.stringify(new Date().toISOString()));
JSON.parse(raw);
const next=new URL('../../public/reader-sources/manifest.v1.next.json',root);
writeFileSync(next,raw);renameSync(next,path);
console.log('Actualizados cuatro hashes de HIIP; anclas y fuentes conservadas.');
