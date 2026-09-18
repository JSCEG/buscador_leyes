const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,source=JSON.parse(fs.readFileSync(path.join(root,'fuentes.json'),'utf8'));
const expected={'DACG-PERMISOS-GA':'20c57a897a45d8d0f35b5ff2b47ece82f7de03a9d635d12fa0fece8f917d5a7e','FORMATOS-SAEE':'8f680d6af6b67ecaecc537e014655a6e4c22a8640dcf3f31b86eb1e5c6f89c9c'};
(async()=>{const out=[];for(const n of Object.keys(expected)){
 const entries=source.find(s=>s.name===n).images;let cursor=0;
 await Promise.all(Array.from({length:6},async()=>{while(cursor<entries.length){const entry=entries[cursor++],url=new URL(entry.src);url.hostname='sidof.segob.gob.mx';const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer()),sha=crypto.createHash('sha256').update(b).digest('hex');if(sha!==expected[n]){fs.writeFileSync(path.join(root,'fuentes','casilla-'+sha+'.png'),b);throw Error('Casilla distinta: '+sha);}out.push({instrumento:n,original:entry.src,url:url.href,sha256:sha,representacion:'□'});}}));
 console.log(n,entries.length,'imágenes idénticas a la casilla vacía cotejada visualmente');
 }fs.writeFileSync(path.join(root,'casillas-verificadas.json'),JSON.stringify(out,null,2));})().catch(e=>{console.error(e.message);process.exitCode=1;});
