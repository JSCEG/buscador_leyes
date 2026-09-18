const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');const root=__dirname;
const compact=s=>s.replace(/\s+/g,'');const results=[];
for(const name of ['DACG-PERMISOS-GA','FORMATOS-SAEE']){
 const prepared=JSON.parse(fs.readFileSync(path.join(root,name+'-revisado.json'),'utf8'));let tables=0,cells=0,boxes=0;
 for(const chunk of prepared.chunks){
  let text=chunk.contenido;
  if(chunk.tablas){const doc=new JSDOM(text.replace(/^### /,'')).window.document;text=doc.body.textContent;tables+=doc.querySelectorAll('table').length;cells+=doc.querySelectorAll('td,th').length;if(doc.querySelector('script,style,img,iframe,input,button')||[...doc.querySelectorAll('*')].some(e=>[...e.attributes].some(a=>!['rowspan','colspan'].includes(a.name))))throw Error('HTML no permitido '+chunk.identificador);}
  if(compact((chunk.prefijo_fuente||'')+text)!==compact(chunk.texto_fuente))throw Error('Diferencia textual '+name+' '+chunk.identificador);
  boxes+=(text.match(/□/g)||[]).length;
 }
 const raw=new JSDOM(fs.readFileSync(path.join(root,'fuentes',name+'.html'),'utf8')).window.document;
 const signature=doc=>[...doc.querySelectorAll('table')].map(t=>[...t.querySelectorAll('tr')].map(tr=>[...tr.children].filter(c=>['TD','TH'].includes(c.tagName)).map(c=>({rowspan:c.getAttribute('rowspan')||'1',colspan:c.getAttribute('colspan')||'1',texto:compact(c.textContent)}))));
 const sourceSig=signature(raw),targetSig=signature(new JSDOM(prepared.chunks.map(c=>c.contenido).join('\n')).window.document);
 // La única diferencia textual dentro de celdas son las imágenes de casilla cotejadas.
 for(const table of targetSig)for(const row of table)for(const cell of row)cell.texto=cell.texto.replace(/□/g,'');
 if(JSON.stringify(sourceSig)!==JSON.stringify(targetSig))throw Error('Cambió una celda o celda combinada '+name);
 if(tables!==prepared.control.tablas_preservadas||boxes!==prepared.control.casillas_preservadas)throw Error('Faltan tablas o casillas');
 results.push({instrumento:name,fragmentos:prepared.chunks.length,texto_completo_cotejado:true,tablas:tables,celdas:cells,casillas:boxes,estructura_de_celdas_identica:true});
}
fs.writeFileSync(path.join(root,'COTEJO-TABLAS.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
