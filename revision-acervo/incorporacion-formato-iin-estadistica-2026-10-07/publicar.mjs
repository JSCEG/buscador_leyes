import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('.', import.meta.url);
const data = JSON.parse(readFileSync(new URL('carga.json', root), 'utf8'));
const path = new URL('../../public/reader-sources/manifest.v1.json', root);
let raw = readFileSync(path, 'utf8');
const old = JSON.parse(raw);
const articles = data.instruments.flatMap(i => i.articulos);
if (data.instruments.length !== 2 || articles.length !== 43 || Object.keys(data.articles).length !== 43) throw Error('Cobertura incompleta');
for (const instrument of data.instruments) {
    const source = instrument.source;
    if (old.sources[source.id] || source.transport !== 'remote-pdf'
        || !/^https:\/\/www\.snieg\.mx\/Documentos\/Normatividad\/Formatos_reg\/(?:Instructivo_)?Formato_IIN_Estadistica\.pdf$/.test(source.originalUrl)) throw Error('Fuente no verificada');
    for (const a of instrument.articulos) {
        const m = data.articles[a.id];
        if (old.articles[a.id] || !m || m.sourceId !== source.id || m.label !== a.identificador
            || m.contentSha256 !== createHash('sha256').update(a.contenido).digest('hex') || !m.anchors.length) throw Error('Mapa incorrecto');
        for (const anchor of m.anchors) {
            const p = source.pages[anchor.page - 1];
            const [x0,y0,x1,y1] = anchor.bbox;
            if (!p || !m.pageNumbers.includes(anchor.page) || !(0 <= x0 && x0 < x1 && x1 <= p.width && 0 <= y0 && y0 < y1 && y1 <= p.height)) throw Error('Coordenadas fuera de página');
        }
    }
}
function objectEnd(text, start) {
    let depth=0,quoted=false,escaped=false;
    for (let i=start;i<text.length;i++) {
        const c=text[i];
        if(quoted) {if(escaped) escaped=false; else if(c==='\\') escaped=true; else if(c==='"') quoted=false;}
        else if(c==='"') quoted=true;
        else if(c==='{') depth++;
        else if(c==='}' && --depth===0) return i;
    }
    throw Error('Objeto JSON incompleto');
}
function append(key, entries) {
    const at=raw.indexOf(`"${key}":`),open=raw.indexOf('{',at),end=objectEnd(raw,open);
    const add=Object.entries(entries).map(([id,value])=>`\n    ${JSON.stringify(id)}: ${JSON.stringify(value,null,2).replace(/\n/g,'\n    ')}`).join(',');
    raw=raw.slice(0,end)+','+add+'\n  '+raw.slice(end);
}
append('sources',data.sources); append('articles',data.articles);
raw=raw.replace(/"revision":\s*(\d+)/,(_,n)=>`"revision": ${Number(n)+1}`)
    .replace(/("verifiedAt":\s*)"[^"]+"/,(_,p)=>p+JSON.stringify(new Date().toISOString()));
const final=JSON.parse(raw);
const next=new URL('../../public/reader-sources/manifest.v1.next.json',root);
writeFileSync(next,raw); renameSync(next,path);
console.log(`Revisión ${final.revision}: dos instrumentos de apoyo, 43 fragmentos mapeados.`);
