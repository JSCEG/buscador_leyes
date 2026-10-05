const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('dotenv').config({path:path.resolve(__dirname,'../../.env'),quiet:true});
const base=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_ANON_KEY;
if(!base||!key||new URL(base).hostname!=='carmfqhcfsqbzcwptqfz.supabase.co')throw Error('Configuración Supabase no disponible');
const headers={apikey:key,Authorization:`Bearer ${key}`};
(async()=>{
 const u=new URL('/rest/v1/leyes',base);u.search=new URLSearchParams({select:'id,titulo,siglas,url_original,fecha_publicacion',siglas:'eq.REFORMA-LIH'});
 const lr=await fetch(u,{headers});if(!lr.ok)throw Error(`Supabase leyes HTTP ${lr.status}`);const laws=await lr.json();if(laws.length!==1||laws[0].url_original!=='https://sidof.segob.gob.mx/notas/docFuente/5752330')throw Error('El instrumento o su fuente cambió');
 const a=new URL('/rest/v1/articulos',base);a.search=new URLSearchParams({select:'id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden',ley_id:`eq.${laws[0].id}`,order:'orden.asc'});
 const ar=await fetch(a,{headers});if(!ar.ok)throw Error(`Supabase artículos HTTP ${ar.status}`);const rows=await ar.json();const editorial=rows.filter(x=>/nota editorial/i.test(x.identificador||'')),articles=rows.filter(x=>!editorial.includes(x));if(articles.length!==41||editorial.length!==1||rows.some(x=>x.ley_id!==laws[0].id))throw Error(`Esperaba 41 fragmentos y una nota editorial; llegaron ${articles.length} y ${editorial.length}`);
 const pack={ley:{id:laws[0].id,title:laws[0].titulo,siglas:laws[0].siglas,source:laws[0].url_original,date:laws[0].fecha_publicacion},articulos:articles};fs.writeFileSync(path.join(__dirname,'articulos-verificados.json'),JSON.stringify(pack,null,2)+'\n');console.log(JSON.stringify({id:pack.ley.id,count:articles.length,editorialExcluida:editorial.length,sha256:crypto.createHash('sha256').update(JSON.stringify(articles)).digest('hex')}));
})().catch(e=>{console.error(e.message);process.exitCode=1});

