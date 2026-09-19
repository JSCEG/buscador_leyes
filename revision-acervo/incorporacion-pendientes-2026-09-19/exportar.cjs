// GET únicamente. Cada ejecución exige un directorio nuevo para no sobrescribir respaldos.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('dotenv').config({quiet:true});
const dest=path.join(__dirname,process.argv[2]||'antes');
if(fs.existsSync(dest))throw Error('El respaldo ya existe');
fs.mkdirSync(dest,{recursive:true});
const base=process.env.VITE_SUPABASE_URL;
if(new URL(base).hostname!=='carmfqhcfsqbzcwptqfz.supabase.co')throw Error('Proyecto inesperado');
const headers={apikey:process.env.VITE_SUPABASE_ANON_KEY,Authorization:`Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,Prefer:'count=exact'};
async function table(name){
 const rows=[];let total;
 for(let offset=0;;offset+=500){
  const select=name==='articulos'?'id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden,created_at':'*';
  const url=new URL('/rest/v1/'+name,base);url.search=new URLSearchParams({select,order:'id.asc',offset:String(offset),limit:'500'});
  const response=await fetch(url,{headers,signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error(name+': HTTP '+response.status);
  const count=Number(response.headers.get('content-range').split('/')[1]);
  if(total===undefined)total=count;if(total!==count)throw Error('Cambió el conteo');
  const batch=await response.json();rows.push(...batch);if(batch.length<500)break;
 }
 if(rows.length!==total)throw Error('Exportación incompleta');
 const data=JSON.stringify(rows,null,2);fs.writeFileSync(path.join(dest,name+'.json'),data);
 return {tabla:name,filas:rows.length,sha256:crypto.createHash('sha256').update(data).digest('hex')};
}
(async()=>{const tables=await Promise.all(['leyes','articulos','temas'].map(table));const result={fecha:new Date().toISOString(),project:'carmfqhcfsqbzcwptqfz',tablas:tables};fs.writeFileSync(path.join(dest,'snapshot.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));})().catch(e=>{console.error(e.message);process.exitCode=1;});
