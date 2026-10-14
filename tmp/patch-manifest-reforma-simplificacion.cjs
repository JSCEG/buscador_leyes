const {execFileSync}=require('node:child_process'); const fs=require('node:fs'); const crypto=require('node:crypto');
const map=JSON.parse(fs.readFileSync('revision-acervo/sincronizacion-reforma-simplificacion-2026-10-06/map.json','utf8'));
const pack=JSON.parse(fs.readFileSync('revision-acervo/sincronizacion-reforma-simplificacion-2026-10-06/articulos-verificados.json','utf8'));
const path='public/reader-sources/manifest.v1.json'; const rawOriginal=execFileSync('git',['show',`HEAD:${path}`],{encoding:'utf8',maxBuffer:50*1024*1024}); const manifest=JSON.parse(rawOriginal);
const sourceId='dof-vespertina-2024-12-20-878e180516f1'; const instrumentId='6c8a912f-6ebb-5638-8d95-b53e5c4b596c';
const official=pack.articulos.filter(a=>a.identificador!=='Nota editorial · documentos relacionados');
if(manifest.revision!==70||map.source.id!==sourceId||map.source.instrumentIds[0]!==instrumentId||Object.keys(map.articles).length!==29||official.length!==29) throw new Error('Unexpected manifest base or map');
for(const article of official){ const e=map.articles[article.id]; if(!e||e.contentSha256!==crypto.createHash('sha256').update(article.contenido,'utf8').digest('hex')) throw new Error('Hash mismatch '+article.identificador); }
const eol=rawOriginal.includes('\r\n')?'\r\n':'\n'; const indent=v=>JSON.stringify(v,null,2).split('\n').map((line,i)=>i?`  ${line}`:line).join(eol);
const articlesMarker=rawOriginal.indexOf(`${eol}  "articles": {`); const sourcesClose=rawOriginal.lastIndexOf(`${eol}  },`,articlesMarker); if(articlesMarker<0||sourcesClose<0) throw new Error('sources close not found');
const sourceEntry=`    ${JSON.stringify(sourceId)}: ${indent(map.source)}`; let raw=`${rawOriginal.slice(0,sourcesClose)},${eol}${sourceEntry}${eol}${rawOriginal.slice(sourcesClose+eol.length)}`;
const end=/\r?\n  }\r?\n}\r?\n?$/; if(!end.test(raw)) throw new Error('article close not found'); const rows=Object.entries(map.articles).map(([id,v])=>`    ${JSON.stringify(id)}: ${indent(v)}`).join(`,${eol}`); raw=raw.replace(end,`,${eol}${rows}${eol}  }${eol}}`);
raw=raw.replace('"revision": 70','"revision": 71').replace(/("verifiedAt":\s*)"[^"]+"/,(_,p)=>`${p}"2026-10-06T15:00:00.000Z"`); JSON.parse(raw); fs.writeFileSync(path,raw); console.log('Restored revision-70 manifest and surgically added 29 official maps; revision 71; bytes',Buffer.byteLength(raw));
