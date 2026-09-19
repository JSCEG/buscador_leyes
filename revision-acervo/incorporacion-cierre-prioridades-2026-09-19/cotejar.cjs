// Comparación independiente del alcance incorporado, cada celda y cada gráfico.
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=__dirname,load=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8')),images=load('imagenes.json');
const compact=s=>s.replace(/\s/g,'');const result=[];
const signature=d=>[...d.querySelectorAll('table')].map(t=>[...t.querySelectorAll('tr')].map(r=>[...r.children].filter(c=>['TD','TH'].includes(c.tagName)).map(c=>({rowspan:c.getAttribute('rowspan')||'1',colspan:c.getAttribute('colspan')||'1',texto:compact(c.textContent)}))));
for(const s of load('fuentes.json')){
 const p=load(s.name+'-revisado.json');
 const raw=new JSDOM(fs.readFileSync(path.join(root,'fuentes',s.name+'.html'),'utf8')).window.document;raw.querySelectorAll('style,title').forEach(e=>e.remove());
 if(s.name==='DECRETO-REFORMA-ENERGETICA'){
  const origin=load('fuentes/'+s.name+'.bloques.json');
  if(origin.sha256!=='b6d282de677189459e923bf1a3d08a11344772ea55b93c66f1d7759d7d58d53f'||origin.bloques.length!==4864)throw Error('Cambió el decreto');
  if(compact(origin.bloques.map(b=>b.texto).join(''))!==compact(raw.body.textContent))throw Error('Texto de origen alterado');
  raw.body.innerHTML=origin.bloques.slice(4747,4864).map(b=>b.html).join('\n');
 }
 for(const img of raw.querySelectorAll('img')){const m=images.find(m=>m.name===s.name&&m.original===img.getAttribute('src'));if(!m)throw Error('Imagen desconocida');if(m.width<20&&m.height<20)img.replaceWith(raw.createTextNode('□'));else img.setAttribute('src',m.url);}
 const doc=new JSDOM(p.chunks.map(c=>c.contenido).join('\n')).window.document;
 if(compact(doc.body.textContent)!==compact(raw.body.textContent))throw Error('Texto incompleto o duplicado '+s.name);
 if(JSON.stringify(signature(raw))!==JSON.stringify(signature(doc)))throw Error('Celda o estructura diferente '+s.name);
 if(JSON.stringify([...raw.querySelectorAll('img')].map(e=>e.getAttribute('src')))!==JSON.stringify([...doc.querySelectorAll('img')].map(e=>e.getAttribute('src'))))throw Error('Gráfico diferente '+s.name);
 for(const c of p.chunks){const cd=new JSDOM(c.contenido).window.document;if(compact(cd.body.textContent)!==compact(c.texto_fuente))throw Error('Texto de fragmento diferente '+c.identificador);}
 const allowed=new Set(['HTML','HEAD','BODY','TABLE','THEAD','TBODY','TFOOT','TR','TD','TH','P','DIV','B','STRONG','I','EM','SUP','SUB','UL','OL','LI','BR','IMG']);
 for(const e of doc.querySelectorAll('*')){if(!allowed.has(e.tagName))throw Error('Etiqueta no permitida');for(const a of e.attributes){if(!(['TD','TH'].includes(e.tagName)&&['colspan','rowspan'].includes(a.name))&&!(e.tagName==='IMG'&&['src','alt'].includes(a.name)))throw Error('Atributo no permitido');}}
 result.push({instrumento:s.name,alcance:s.name==='DECRETO-REFORMA-ENERGETICA'?'Artículos Noveno y Décimo, sus transitorios y cierre común; bloques 4747 a 4863 (base cero) del decreto original':'Documento completo',fragmentos_fuente:p.chunks.length,texto_completo_cotejado:true,tablas:doc.querySelectorAll('table').length,celdas:doc.querySelectorAll('td,th').length,graficos:doc.querySelectorAll('img').length,casillas:(doc.body.textContent.match(/□/g)||[]).length,estructura_de_celdas_identica:true});
}
fs.writeFileSync(path.join(root,'COTEJO-FUENTES.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
