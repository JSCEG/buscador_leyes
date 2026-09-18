// Compara una fotografía local con fuentes; nunca modifica datos remotos.
const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const save=(name,data)=>fs.writeFileSync(path.join(root,name),JSON.stringify(data,null,2));
const norm=s=>(s||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/\s+/g,' ').trim();
const compact=s=>(s||'').replace(/\s/g,'');
const idnorm=s=>norm(s).replace(/[.:-]/g,'').replace(/articulo /g,'').replace(/^(?:lineamiento|numeral) /,'');
const groups=xs=>{const m=new Map();for(const x of xs){const k=idnorm(x.identificador);m.set(k,[...(m.get(k)||[]),x]);}return [...m.values()];};
(async()=>{
const {parseRegulatoryText}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'../../src/lib/regulatory-parser.js'),'utf8')).toString('base64'));
const laws=read('supabase-leyes.json'),articles=read('supabase-articulos.json'),themes=read('supabase-temas.json'),sources=read('fuentes.json');
const results=[];
for(const law of laws){
  const source=sources.find(s=>s.ley_id===law.id);
  const rows=articles.filter(a=>a.ley_id===law.id).sort((a,b)=>(a.orden??0)-(b.orden??0)||a.id.localeCompare(b.id));
  const textPath=path.join(root,'fuentes',source.name+'.txt');
  let text=fs.existsSync(textPath)?fs.readFileSync(textPath,'utf8'):'';
  if(source.name==='LSE') text=text.slice(text.indexOf('ARTÍCULO TERCERO.  Se expide la Ley del Sector Eléctrico'),text.indexOf('ARTÍCULO CUARTO.  Se expide la Ley del Sector Hidrocarburos'));
  if(source.name==='LGEC') text=text.slice(0,text.indexOf('Artículo Segundo.- Se reforman'))+'\n'+text.slice(text.lastIndexOf('\nTransitorios'));
  fs.writeFileSync(path.join(root,'fuentes',source.name+'.alcance.txt'),text);
  const parsed=parseRegulatoryText(text);
  save(`fuentes/${source.name}.candidatos.json`,parsed);
  const dup=groups(rows).filter(g=>g.length>1).map(g=>g.map(a=>({id:a.id,label:a.identificador,order:a.orden,len:a.contenido?.length,first:a.contenido?.slice(0,100)})));
  const nums=rows.filter(a=>a.tipo_articulo==='ordinario').map(a=>a.identificador.match(/^(?:Art[íi]culo\s+)?(\d+)[.\s-]*$/i)?.[1]).filter(Boolean).map(Number);
  const gaps=nums.length?Array.from({length:Math.max(...nums)},(_,i)=>i+1).filter(x=>!nums.includes(x)):[];
  const types={};rows.forEach(a=>types[a.tipo_articulo]=(types[a.tipo_articulo]||0)+1);
  const anomalies=[];
  for(const a of rows){
    const flags=[];const c=a.contenido||'';
    if(!c.trim())flags.push('contenido_vacio');
    if(c.trim().length<40)flags.push('muy_corto');
    if(c.length>18000)flags.push('muy_largo');
    const internal=[...c.matchAll(/(?:^|\n)\s*(Art[íi]culo\s+(?:\d+(?:\s+Bis)?|[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\.-|[.:-]))\s+/g)].map(m=>m[1]);
    if(internal.some(h=>idnorm(h)!==idnorm(a.identificador)))flags.push('encabezado_interno');
    if(/TRANSITORIOS\b/.test(c)&&a.tipo_articulo!=='transitorio')flags.push('marcador_transitorios_en_otro_tipo');
    if(/CÁMARA DE DIPUTADOS DEL H\. CONGRESO|----------------Page|\d+\/\d+\/\d+.*DOF - Diario|https:\/\/www\.dof.*print=true/i.test(c))flags.push('ruido_de_pagina');
    if(flags.length)anomalies.push({id:a.id,label:a.identificador,type:a.tipo_articulo,order:a.orden,len:c.length,flags,internal,first:c.slice(0,180),last:c.slice(-180)});
  }
  // Correspondencia por identificador: candidatos del parser, no verdad normativa automática.
  const sourceGroups=groups(parsed.chunks);
  const comparisons=[];
  for(const a of rows){
    const candidates=sourceGroups.find(g=>idnorm(g[0].identificador)===idnorm(a.identificador))||[];
    const db=compact(a.contenido);
    let match=null;
    for(const c of candidates){const s=compact(c.contenido);if(db===s||db===compact(c.identificador)+s){match='igual_sin_espacios';break;}if(s.includes(db)&&db.length>60){match='subtexto_fuente';break;}if(db.includes(s)&&s.length>60){match='fuente_mas_texto_en_bd';break;}}
    comparisons.push({id:a.id,label:a.identificador,len:a.contenido?.length,candidates:candidates.length,source_lengths:candidates.map(x=>x.contenido.length),match});
  }
  const result={name:source.name,ley_id:law.id,title:law.titulo,date:law.fecha_publicacion,source_date:source.fecha,source_error:source.error,total:rows.length,types,themes:themes.filter(t=>t.ley_id===law.id).length,with_hierarchy:rows.filter(a=>a.titulo_nombre||a.capitulo_nombre||a.seccion_nombre).length,duplicates:dup,gaps_numeric:gaps,first:rows.slice(0,4).map(a=>a.identificador),last:rows.slice(-6).map(a=>a.identificador),anomalies,source_candidates:parsed.chunks.length,source_types:parsed.chunks.reduce((acc,c)=>(acc[c.tipo]=(acc[c.tipo]||0)+1,acc),{}),source_themes:parsed.themes.length,source_diagnostics:parsed.diagnostics,comparisons};
  results.push(result);
  console.log(JSON.stringify({name:source.name,db:rows.length,types,duplicates:dup.length,gaps,themes:result.themes,anomalies:anomalies.length,source:parsed.chunks.length,source_types:result.source_types,match:comparisons.filter(c=>c.match==='igual_sin_espacios').length}));
}
save('analisis-automatico.json',results);
})();
