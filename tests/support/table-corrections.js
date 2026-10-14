import {readFileSync} from 'node:fs';
const corrected=JSON.parse(readFileSync('revision-acervo/auditoria-tablas-2026-10-14/carga.json','utf8'));
const audit=JSON.parse(readFileSync('revision-acervo/auditoria-tablas-2026-10-14/cotejo.json','utf8'));
export function applyTableCorrections(articles,map){
    for(const article of articles){
        const next=corrected.find(a=>a.id===article.id);
        if(!next)continue;
        article.contenido=next.contenido;
        if(map?.articles[article.id])map.articles[article.id].contentSha256=audit.find(a=>a.id===article.id).sha256_nuevo;
    }
}
