// GET-only: captura los fragmentos cargados de la tercera modificación de la segunda convocatoria.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('dotenv').config({path:path.resolve(__dirname,'../../.env'),quiet:true});
const base=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_ANON_KEY;
if(!base||!key||new URL(base).hostname!=='carmfqhcfsqbzcwptqfz.supabase.co')throw Error('Configuración del proyecto Supabase no disponible.');
const headers={apikey:key,Authorization:`Bearer ${key}`};
(async()=>{
 const lawUrl=new URL('/rest/v1/leyes',base);lawUrl.search=new URLSearchParams({select:'id,titulo,siglas,url_original,fecha_publicacion',siglas:'eq.CONV-GEN-2-M3'});
 const lawResponse=await fetch(lawUrl,{headers,signal:AbortSignal.timeout(30000)});if(!lawResponse.ok)throw Error(`Supabase respondió HTTP ${lawResponse.status} al leer el instrumento.`);const laws=await lawResponse.json();
 if(laws.length!==1||laws[0].url_original!=='https://sidof.segob.gob.mx/notas/docFuente/5790938')throw Error('No se localizó el instrumento esperado en Supabase.');const law=laws[0];
 const url=new URL('/rest/v1/articulos',base);url.search=new URLSearchParams({select:'id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden',ley_id:`eq.${law.id}`,order:'orden.asc'});
 const response=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`Supabase respondió HTTP ${response.status}.`);const rows=await response.json();
 if(rows.length!==6||rows.some(article=>article.ley_id!==law.id))throw Error(`Esperaba los 6 registros cargados; llegaron ${rows.length}.`);
 const editorial=rows.filter(article=>/nota editorial/i.test(article.identificador||'')),articles=rows.filter(article=>!editorial.includes(article));if(editorial.length!==1||articles.length!==5)throw Error('El registro editorial u oficiales cambió; revisión manual requerida.');
 fs.writeFileSync(path.join(__dirname,'articulos-verificados.json'),JSON.stringify({ley:{id:law.id,title:law.titulo,siglas:law.siglas,source:law.url_original,date:law.fecha_publicacion},articulos:articles},null,2)+'\n');
 console.log(JSON.stringify({fragmentosVerificados:articles.length,notaEditorialExcluida:editorial.length,sha256:crypto.createHash('sha256').update(JSON.stringify(articles)).digest('hex')}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
