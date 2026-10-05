// GET-only: toma una foto de los fragmentos ya cargados en Supabase para cotejarlos.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('dotenv').config({path:path.resolve(__dirname,'../../.env'),quiet:true});
const id='15fcb1e0-8cd8-5215-9be6-727be3002b3b';
const base=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_ANON_KEY;
if(!base||!key||new URL(base).hostname!=='carmfqhcfsqbzcwptqfz.supabase.co')throw Error('Configuración del proyecto Supabase no disponible.');
const headers={apikey:key,Authorization:`Bearer ${key}`};
(async()=>{
 const url=new URL('/rest/v1/articulos',base);url.search=new URLSearchParams({select:'id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden',ley_id:`eq.${id}`,order:'orden.asc'});
 const response=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`Supabase respondió HTTP ${response.status}.`);
 const rows=await response.json();if(rows.length!==10||rows.some(a=>a.ley_id!==id))throw Error(`Esperaba los 10 registros cargados; llegaron ${rows.length}.`);
 const editorial=rows.filter(a=>a.identificador==='Nota editorial · alcance de la publicación');const articles=rows.filter(a=>!editorial.includes(a));
 if(editorial.length!==1||articles.length!==9)throw Error('El registro editorial u oficiales cambió; revisión manual requerida.');
 const pack={ley:{id,title:'CEL-ASIGNACION-2022',source:'https://sidof.segob.gob.mx/notas/docFuente/5722482'},articulos:articles};
 fs.writeFileSync(path.join(__dirname,'articulos-verificados.json'),JSON.stringify(pack,null,2)+'\n');
 console.log(JSON.stringify({fragmentosVerificados:articles.length,notaEditorialExcluida:editorial.length,sha256:crypto.createHash('sha256').update(JSON.stringify(articles)).digest('hex')}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
