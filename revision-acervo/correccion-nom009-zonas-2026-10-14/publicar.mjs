import {readFileSync,writeFileSync,renameSync} from 'node:fs';
const root=new URL('.',import.meta.url),path=new URL('../../public/reader-sources/manifest.v1.json',root);
const audit=JSON.parse(readFileSync(new URL('cotejo.json',root),'utf8'));
let raw=readFileSync(path,'utf8');const manifest=JSON.parse(raw);let changed=0;
for(const a of audit.filter(a=>a.sha256_nuevo)){
    const map=manifest.articles[a.id];if(!map)continue;
    if(map.contentSha256!==a.sha256_previo||raw.split(a.sha256_previo).length!==2)throw Error('Mapa cambiado: '+a.id);
    raw=raw.replace(a.sha256_previo,a.sha256_nuevo);changed++;
}
raw=raw.replace(/"revision":\s*(\d+)/,(_,n)=>`"revision": ${Number(n)+1}`).replace(/("verifiedAt":\s*)"[^"]+"/,(_,p)=>p+JSON.stringify(new Date().toISOString()));
JSON.parse(raw);const next=new URL('../../public/reader-sources/manifest.v1.next.json',root);
writeFileSync(next,raw);renameSync(next,path);console.log('Hashes actualizados: '+changed);
