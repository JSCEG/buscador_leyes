const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname;
(async()=>{for(const [name,uri]of [['permisos','/imagenes_diarios/2025/10/23/MAT/sener_1_Cimg_8893.png'],['saee','/imagenes_diarios/2026/05/22/MAT/sener_1_Cimg_6346.png']]){
 for(const host of ['sidof.segob.gob.mx','sidofqa.segob.gob.mx','dof.gob.mx']){
  const url='https://'+host+uri;
  try{const r=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());if(b[0]!==137)throw Error('No PNG');fs.writeFileSync(path.join(root,'fuentes','casilla-'+name+'.png'),b);console.log(JSON.stringify({name,url,bytes:b.length,sha:crypto.createHash('sha256').update(b).digest('hex')}));break;}
  catch(e){console.log(name,host,e.message,e.cause?.code||'');}
 }
}})().catch(e=>{console.error(e);process.exitCode=1;});
