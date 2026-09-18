const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname;
(async()=>{const out=[];for(const [name,date,year]of [['DACG-PERMISOS-GA','23102025','2025'],['FORMATOS-SAEE','22052026','2026']]){
 const note=JSON.parse(fs.readFileSync(path.join(root,'fuentes',name+'.nota.json'),'utf8')).Nota;
 const url=`https://sidof.segob.gob.mx/notas/getNewsletter/${note.fecha}/Matutina/${note.codDiario}`;
 const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('HTTP '+r.status);
 const b=Buffer.from(await r.arrayBuffer());if(b.subarray(0,4).toString()!=='%PDF')throw Error('No es PDF: '+b.subarray(0,120).toString());
 fs.writeFileSync(path.join(root,'fuentes',name+'-edicion.pdf'),b);out.push({name,url,sha256:crypto.createHash('sha256').update(b).digest('hex'),bytes:b.length});console.log(name,b.length);
 }fs.writeFileSync(path.join(root,'ediciones.json'),JSON.stringify(out,null,2));})().catch(e=>{console.error(e.message);process.exitCode=1;});
