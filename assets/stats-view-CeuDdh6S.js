const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-D0rYOcpz.js","assets/index-CE9JLWWp.css"])))=>i.map(i=>d[i]);
import{A as z,m as W,n as X,p as H,_ as Y}from"./index-D0rYOcpz.js";const Z=new Set(["modificacion","texto original","leyes y reformas por completar"]),O=t=>typeof t=="string"?t:"",K=t=>O(t).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim().replace(/\s+/g," "),Q=t=>typeof t=="string"&&/^\d{4}-\d{2}-\d{2}/.test(t)&&Number.isFinite(Date.parse(`${t.slice(0,10)}T00:00:00Z`)),R=t=>Math.max(0,Number(t==null?void 0:t.articulos)||0);function J(t){return Q(t==null?void 0:t.fecha_publicacion)?t.fecha_publicacion.slice(0,10):null}function P(t){return`${t.slice(0,4)}-T${Math.floor((Number(t.slice(5,7))-1)/3)+1}`}function tt(t,c){const n=[];let[r,p]=[Number(t.slice(0,4)),Number(t.slice(-1))];const[e,o]=[Number(c.slice(0,4)),Number(c.slice(-1))];for(;r<e||r===e&&p<=o;)n.push(`${r}-T${p}`),++p>4&&(p=1,r++);return n}function st(t,{today:c=new Date}={}){const n=(Array.isArray(t)?t:[]).filter(s=>s&&typeof s=="object"),r=z.map(s=>({...s,count:0,fragments:0})),p=new Map(r.map(s=>[s.id,s])),e=n.map(s=>{const u=W(s),l=p.get(u);return l.count++,l.fragments+=R(s),{law:s,group:u,day:J(s),fragments:R(s)}}),o=e.map(s=>s.day).filter(Boolean).sort(),S=new Date(c.getTime()-365*864e5).toISOString().slice(0,10),f=o.length?`${Number(o.at(-1).slice(0,4))-2}-01-01`:null,i=o.find(s=>s>=f),M=i?tt(P(i),P(o.at(-1))).map(s=>({key:s,total:0,byGroup:{}})):[],k=new Map(M.map(s=>[s.key,s])),y={key:"antes",older:!0,year:f==null?void 0:f.slice(0,4),total:0,byGroup:{},items:[]};for(const s of e){if(!s.day)continue;const u=s.day<f?y:k.get(P(s.day));u.total++,u.byGroup[s.group]=(u.byGroup[s.group]||0)+1,u===y&&y.items.push({day:s.day,title:O(s.law.siglas||s.law.titulo)})}y.total&&(y.items.sort((s,u)=>s.day.localeCompare(u.day)),M.unshift(y));const v=new Map;for(const{law:s}of e){const u=new Set;for(const l of Array.isArray(s.temas_clave)?s.temas_clave:[]){const g=K(l);if(!g||Z.has(g)||u.has(g))continue;u.add(g);const b=v.get(g)||{label:O(l).trim(),count:0};b.count++,v.set(g,b)}}const x=e.reduce((s,u)=>s+u.fragments,0);return{total:e.length,totalFragments:x,averageFragments:e.length?Math.round(x/e.length):0,recent:e.filter(s=>s.day&&s.day>=S).length,latestDay:o.at(-1)||null,firstDay:o[0]||null,groups:r.filter(s=>s.count>0),quarters:M,top:[...e].sort((s,u)=>u.fragments-s.fragments).slice(0,10),topics:[...v.values()].sort((s,u)=>u.count-s.count||s.label.localeCompare(u.label,"es")).slice(0,12),rows:e}}const G=new WeakMap,h=t=>new Intl.NumberFormat("es-MX").format(t),V=(t,c)=>c?`${new Intl.NumberFormat("es-MX",{maximumFractionDigits:1}).format(t/c*100)} %`:"0 %",$=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]),F=t=>`var(--st-c-${t})`,_=(t,c="medium")=>t?new Intl.DateTimeFormat("es-MX",{dateStyle:c,timeZone:"UTC"}).format(new Date(`${t}T00:00:00Z`)):"—",et=t=>t.siglas||t.titulo,B=new Intl.Collator("es",{sensitivity:"base",numeric:!0});function L(t,c,n,r){return`<div class="st-kpi" style="--st-accent:${r}">
        <p class="st-kpi-label">${t}</p>
        <p class="st-kpi-value${/\d/.test(c)?"":" is-word"}">${c}</p>
        <p class="st-kpi-note">${n}</p>
    </div>`}function at(t){const c=n=>t.groups.map(r=>`<span class="st-seg" style="flex-grow:${r[n]};background:${F(r.id)}"
        data-tip="${$(`${r.label}: ${h(r[n])} (${V(r[n],n==="count"?t.total:t.totalFragments)})`)}"></span>`).join("");return`<section class="st-card st-span-2" aria-labelledby="st-comp">
        <div class="st-card-head"><h2 id="st-comp">Composición del acervo</h2><p>Proporción por colección, en instrumentos y en disposiciones (artículos, numerales, anexos).</p></div>
        <div class="st-stack-block"><p class="st-stack-label">Instrumentos</p><div class="st-stack" role="img" aria-label="Instrumentos por colección">${c("count")}</div></div>
        <div class="st-stack-block"><p class="st-stack-label">Disposiciones</p><div class="st-stack" role="img" aria-label="Disposiciones por colección">${c("fragments")}</div></div>
        <ul class="st-legend">
            ${t.groups.map(n=>`<li><button type="button" class="st-legend-item" data-group="${n.id}" title="Ver ${$(n.label)} en el acervo">
                <span class="st-icon" style="color:${F(n.id)}">${H(n.id,16)}</span>
                <span class="st-legend-name">${$(n.label)}</span>
                <span class="st-legend-num">${h(n.count)}</span>
                <span class="st-legend-pct">${V(n.count,t.total)}</span>
                <span class="st-legend-frag">${h(n.fragments)} ${n.fragments===1?"disposición":"disposiciones"}</span>
            </button></li>`).join("")}
        </ul>
    </section>`}function ot(t){const c=t.quarters;if(!c.length)return"";const n=640,r=220,p=16,e=28,o=28,S=8,f=Math.max(...c.map(l=>l.total),1),i=Math.ceil(f/4),M=i*4,k=r-p-e,y=(n-o-S)/c.length,v=Math.min(36,y*.62),x=l=>p+k-l/M*k,s=[0,1,2,3,4].map(l=>`<g><line x1="${o}" x2="${n-S}" y1="${x(l*i)}" y2="${x(l*i)}" class="st-grid${l?"":" st-base"}"/><text x="${o-6}" y="${x(l*i)+4}" class="st-axis" text-anchor="end">${l*i}</text></g>`).join(""),u=c.map((l,g)=>{var j;const b=o+g*y+(y-v)/2;let N=0;const C=t.groups.filter(w=>l.byGroup[w.id]).map(w=>{const a=l.byGroup[w.id],d=x(N+a),m=x(N)-d;return N+=a,`<rect x="${b}" y="${d}" width="${v}" height="${Math.max(0,m-2)}" rx="2" fill="${F(w.id)}"/>`}).join(""),T=t.groups.filter(w=>l.byGroup[w.id]).map(w=>`${w.label}: ${l.byGroup[w.id]}`).join(" · ");if(l.older){const w=l.items.map(d=>`${d.day.slice(0,4)} · ${d.title}`).join(`
`),a=o+(g+1)*y;return`<g class="st-col st-col-older" data-tip="${$(`Antes de ${l.year} — ${l.total} publicados
${w}`)}">
                <rect class="st-hit" x="${o+g*y}" y="${p}" width="${y}" height="${k}"/>
                ${C}
                <line x1="${a}" x2="${a}" y1="${p}" y2="${p+k}" class="st-divider"/>
                <text x="${b+v/2}" y="${r-16}" class="st-axis" text-anchor="middle">Antes</text>
                <text x="${b+v/2}" y="${r-4}" class="st-axis st-axis-year" text-anchor="middle">de ${l.year}</text>
                <text x="${b+v/2}" y="${x(l.total)-5}" class="st-col-total" text-anchor="middle">${l.total}</text>
            </g>`}const[E,I]=l.key.split("-"),D=I==="T1"||g===0||((j=c[g-1])==null?void 0:j.older)?`<text x="${b+v/2}" y="${r-4}" class="st-axis st-axis-year" text-anchor="middle">${E}</text>`:"";return`<g class="st-col" data-tip="${$(`${I} ${E} — ${l.total} publicados${T?`
${T}`:""}`)}">
            <rect class="st-hit" x="${o+g*y}" y="${p}" width="${y}" height="${k}"/>
            ${C}
            <text x="${b+v/2}" y="${r-16}" class="st-axis" text-anchor="middle">${I}</text>${D}
            ${l.total?`<text x="${b+v/2}" y="${x(l.total)-5}" class="st-col-total" text-anchor="middle">${l.total}</text>`:""}
        </g>`}).join("");return`<section class="st-card st-span-2" aria-labelledby="st-time">
        <div class="st-card-head"><h2 id="st-time">Publicaciones por trimestre</h2><p>Fecha de publicación oficial de cada instrumento, apilada por colección. Lo publicado antes de los últimos tres años va junto en la primera barra.</p></div>
        <div class="st-chart-scroll"><svg class="st-chart" viewBox="0 0 ${n} ${r}" role="img" aria-label="Instrumentos publicados por trimestre">${s}${u}</svg></div>
    </section>`}function U(t,c,n,r){const p=Math.max(...r.map(e=>e.value),1);return`<section class="st-card" aria-labelledby="${t}">
        <div class="st-card-head"><h2 id="${t}">${c}</h2><p>${n}</p></div>
        <ol class="st-bars">
            ${r.map(e=>{const o=e.lawId?"button":"div";return`<li><${o} ${e.lawId?`type="button" data-law-id="${$(e.lawId)}"`:""} class="st-bar-row" title="${$(e.title)}">
                    <span class="st-bar-name">${$(e.label)}</span>
                    <span class="st-bar-track"><span class="st-bar-fill" style="--w:${e.value/p*100}%;background:${e.color}"></span></span>
                    <span class="st-bar-val">${h(e.value)}</span>
                </${o}></li>`}).join("")}
        </ol>
    </section>`}function nt(t){return`<section class="st-card st-span-2 st-table-card" aria-labelledby="st-table">
        <div class="st-card-head st-table-head">
            <div><h2 id="st-table">Todos los instrumentos</h2><p class="st-table-status" role="status" aria-live="polite"></p></div>
            <div class="st-table-tools">
                <label class="st-field"><span>Buscar</span><input type="search" class="st-search" placeholder="Título o siglas" autocomplete="off" maxlength="200"></label>
                <label class="st-field"><span>Colección</span><select class="st-filter"><option value="all">Todas</option>${t.groups.map(c=>`<option value="${c.id}">${$(c.label)}</option>`).join("")}</select></label>
            </div>
        </div>
        <div class="st-table-wrap"><table class="st-table">
            <thead><tr>
                <th scope="col"><button type="button" data-sort="name">Instrumento</button></th>
                <th scope="col"><button type="button" data-sort="group">Colección</button></th>
                <th scope="col"><button type="button" data-sort="day">Publicación</button></th>
                <th scope="col" class="st-num"><button type="button" data-sort="fragments">Disposiciones</button></th>
            </tr></thead>
            <tbody></tbody>
        </table></div>
    </section>`}async function lt(t,{lawById:c=new Map,onOpenLaw:n=()=>{},onSearch:r=()=>{}}={}){let p,e=null,o=[];try{const{fetchUsageSummary:s,fetchTopConsulted:u,fetchTopSearches:l}=await Y(async()=>{const{fetchUsageSummary:g,fetchTopConsulted:b,fetchTopSearches:N}=await import("./index-D0rYOcpz.js").then(C=>C.ai);return{fetchUsageSummary:g,fetchTopConsulted:b,fetchTopSearches:N}},__vite__mapDeps([0,1]));[p,e,o]=await Promise.all([s(),u(6).catch(()=>null),l(10).catch(()=>[])])}catch{return}if(!p||!(t!=null&&t.isConnected))return;const S=p.totales||{},f=p.hoy||{},i=s=>h(Number(S[s]||0)),M=s=>Number(f[s]||0)?`+${h(Number(f[s]))} hoy`:"Sin registros hoy",k=Array.isArray(p.serie)?p.serie:[],y=Math.max(1,...k.map(s=>Number(s.visitas)||0)),v=k.map(s=>`<span class="st-usage-bar" style="height:${Math.max(6,Number(s.visitas)/y*100)}%"
        data-tip="${$(`${_(String(s.dia).slice(0,10))}: ${h(Number(s.visitas))} visitas`)}"></span>`).join(""),x=p.desde?`Contando desde el ${$(_(String(p.desde).slice(0,10),"long"))}`:"Contando desde hoy";t.innerHTML=`<div class="st-usage-head">
            <p class="st-usage-since">${x}</p></div>
        <div class="st-kpis st-usage-kpis">
            ${L("Visitas acumuladas",i("visita"),M("visita"),"var(--st-c-leyes)")}
            ${L("Visitantes únicos",i("visitante"),"Navegadores distintos","var(--st-c-reglamentos)")}
            ${L("Búsquedas",i("busqueda"),M("busqueda"),"var(--st-c-acuerdos)")}
            ${L("Artículos consultados",i("lectura"),M("lectura"),"var(--st-c-dacg)")}
            ${L("Usuarios registrados",h(Number(p.usuarios||0)),"Cuentas confirmadas","var(--st-c-convocatorias)")}
        </div>
        ${k.length?`<div class="st-usage-chart"><p class="st-stack-label">Visitas por día · últimos 30 días</p>
            <div class="st-usage-bars" role="img" aria-label="Visitas por día en los últimos 30 días">${v}</div></div>`:""}
        ${ct(e)}
        ${it(o)}`,t.hidden=!1,t.addEventListener("click",s=>{const u=s.target.closest("[data-top-law]");if(u){const b=c.get(u.dataset.topLaw);b&&n(b);return}const l=s.target.closest("[data-top-search]");if(l){r(l.dataset.topSearch);return}const g=s.target.closest("[data-top-article]");if(g){const b=g.dataset.topArticle;document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:b,list:[b]}}))}})}function ct(t){const c=Array.isArray(t==null?void 0:t.leyes)?t.leyes:[],n=Array.isArray(t==null?void 0:t.articulos)?t.articulos:[];if(!c.length&&!n.length)return'<p class="st-top-empty">Aquí aparecerán las leyes y los artículos más consultados en cuanto el buscador tenga uso.</p>';const r=(e,o)=>e.length?`<ol class="st-top-list">${e.map((S,f)=>`<li>${o(S,f)}</li>`).join("")}</ol>`:'<p class="st-top-empty">Todavía sin consultas.</p>',p=e=>`<span class="st-top-count">${h(Number(e)||0)}</span>`;return`<div class="st-top">
        <div class="st-top-col"><h3>Instrumentos más consultados</h3>
            ${r(c,(e,o)=>`<button type="button" class="st-top-item" data-top-law="${$(e.id)}" title="${$(e.titulo)}">
                <span class="st-top-rank">${o+1}</span><span class="st-top-name"><strong>${$(e.siglas||"")}</strong>${$(e.titulo)}</span>${p(e.total)}</button>`)}</div>
        <div class="st-top-col"><h3>Artículos más leídos</h3>
            ${r(n,(e,o)=>`<button type="button" class="st-top-item" data-top-article="${$(e.id)}" title="${$(`${e.identificador} · ${e.ley||""}`)}">
                <span class="st-top-rank">${o+1}</span><span class="st-top-name"><strong>${$(e.identificador)}</strong>${$(e.siglas||e.ley||"")}</span>${p(e.total)}</button>`)}</div>
    </div>`}function it(t){if(!(t!=null&&t.length))return"";const c=Math.max(1,...t.map(n=>Number(n.total)||0));return`<div class="st-searches"><h3>Lo más buscado <span>últimos 30 días</span></h3>
        <ol class="st-search-list">${t.map((n,r)=>`<li><button type="button" class="st-search-item" data-top-search="${$(n.termino)}">
            <span class="st-top-rank">${r+1}</span><span class="st-search-term">${$(n.termino)}</span>
            <span class="st-search-bar"><i style="width:${Math.max(4,Number(n.total)/c*100)}%"></i></span><span class="st-top-count">${h(Number(n.total)||0)}</span></button></li>`).join("")}</ol>
        <p class="st-top-empty">Solo términos buscados tres veces o más; no se guarda quién busca.</p></div>`}function dt(t,c,{onOpenLaw:n=()=>{},onOpenGroup:r=()=>{},onSearch:p=()=>{},today:e}={}){var w;if(!t)throw new Error("Falta el contenedor de estadísticas.");(w=G.get(t))==null||w.destroy();const o=st(c,{today:e}),S=new Map(o.groups.map(a=>[a.id,a.label])),f=o.groups[0]?[...o.groups].sort((a,d)=>d.count-a.count)[0]:null,i=document.createElement("section");i.className="st-dashboard",i.setAttribute("aria-labelledby","st-title"),i.innerHTML=`
        <div class="st-header" data-emblem-host>
            ${X("estadisticas")}
            <div>
                <p class="st-eyebrow">Panorama del acervo</p>
                <h1 id="st-title">Estadísticas</h1>
                <p class="st-intro">Qué contiene el acervo regulatorio, cómo se distribuye y cuándo se publicó.</p>
            </div>
            <p class="st-updated">Publicación más reciente<br><strong>${_(o.latestDay,"long")}</strong></p>
        </div>
        <div class="st-kpis">
            ${L("Instrumentos",h(o.total),`${o.groups.length} colecciones`,"var(--st-c-leyes)")}
            ${L("Artículos y disposiciones",h(o.totalFragments),`${h(o.averageFragments)} en promedio por instrumento`,"var(--st-c-reglamentos)")}
            ${L("Publicados en 12 meses",h(o.recent),`${V(o.recent,o.total)} del acervo`,"var(--st-c-acuerdos)")}
            ${L("Colección mayor",f?$(f.label):"—",f?`${h(f.count)} instrumentos`:"","var(--st-c-dacg)")}
        </div>
        <section class="st-usage" aria-label="Uso del buscador" hidden></section>
        <div class="st-grid-layout">
            ${at(o)}
            ${ot(o)}
            ${U("st-top","Instrumentos más extensos","Por número de artículos y disposiciones. Selecciona uno para abrirlo.",o.top.map(a=>({label:et(a.law),title:a.law.titulo,value:a.fragments,color:F(a.group),lawId:String(a.law.id)})))}
            ${U("st-topics","Temas más frecuentes","Número de instrumentos que incluyen cada tema clave.",o.topics.map(a=>({label:a.label,title:a.label,value:a.count,color:"var(--st-c-topic)"})))}
            ${nt(o)}
        </div>
        <div class="st-tip" role="tooltip" hidden></div>`,t.replaceChildren(i);const M=new Map(o.rows.map(a=>[String(a.law.id),a.law]));lt(i.querySelector(".st-usage"),{lawById:M,onOpenLaw:n,onSearch:p});const k=i.querySelector("tbody"),y=i.querySelector(".st-table-status"),v=i.querySelector(".st-search"),x=i.querySelector(".st-filter"),s={query:"",group:"all",sort:"fragments",dir:-1},u=a=>String(a??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),l={name:(a,d)=>B.compare(a.law.titulo,d.law.titulo),group:(a,d)=>B.compare(S.get(a.group),S.get(d.group)),day:(a,d)=>(a.day||"").localeCompare(d.day||""),fragments:(a,d)=>a.fragments-d.fragments};function g(){const a=u(s.query).split(/\s+/).filter(Boolean),d=o.rows.filter(m=>s.group==="all"||m.group===s.group).filter(m=>a.every(A=>u(`${m.law.titulo} ${m.law.siglas||""}`).includes(A))).sort((m,A)=>l[s.sort](m,A)*s.dir||B.compare(m.law.titulo,A.law.titulo));k.innerHTML=d.map(m=>`<tr data-law-id="${$(m.law.id)}" tabindex="0">
            <td><span class="st-td-sigla">${$(m.law.siglas||"")}</span><span class="st-td-title">${$(m.law.titulo)}</span></td>
            <td><span class="st-chip"><span class="st-icon" style="color:${F(m.group)}">${H(m.group,15)}</span>${$(S.get(m.group))}</span></td>
            <td class="st-nowrap">${_(m.day)}</td>
            <td class="st-num">${h(m.fragments)}</td>
        </tr>`).join("")||'<tr><td colspan="4" class="st-empty">Sin instrumentos que coincidan.</td></tr>',y.textContent=`${h(d.length)} de ${h(o.total)} instrumentos`,i.querySelectorAll("th button").forEach(m=>{const A=m.dataset.sort===s.sort;m.closest("th").setAttribute("aria-sort",A?s.dir>0?"ascending":"descending":"none")})}const b=i.querySelector(".st-tip"),N=a=>{const d=a.target.closest("[data-tip]");if(!d){b.hidden=!0;return}b.textContent=d.dataset.tip,b.hidden=!1;const m=i.getBoundingClientRect(),A=Math.min(a.clientX-m.left+14,m.width-b.offsetWidth-4);b.style.transform=`translate(${Math.max(4,A)}px, ${a.clientY-m.top+14}px)`},C=()=>{b.hidden=!0},T=a=>{const d=M.get(a.dataset.lawId);d&&n(d)},E=a=>{const d=a.target.closest("th button");if(d)return s.dir=s.sort===d.dataset.sort?-s.dir:d.dataset.sort==="name"||d.dataset.sort==="group"?1:-1,s.sort=d.dataset.sort,g();const m=a.target.closest("[data-group]");if(m)return r(m.dataset.group);const A=a.target.closest("[data-law-id]");A&&T(A)},I=a=>{const d=a.target.closest("tr[data-law-id]");d&&(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),T(d))},q=()=>{s.query=v.value,s.group=x.value,g()};i.addEventListener("pointermove",N),i.addEventListener("pointerleave",C),i.addEventListener("click",E),i.addEventListener("keydown",I),v.addEventListener("input",q),x.addEventListener("change",q),g();const D=i.querySelector(".st-chart-scroll");D&&(D.scrollLeft=D.scrollWidth),requestAnimationFrame==null||requestAnimationFrame(()=>i.classList.add("is-ready"));const j={destroy(){i.removeEventListener("pointermove",N),i.removeEventListener("pointerleave",C),i.removeEventListener("click",E),i.removeEventListener("keydown",I),G.delete(t)}};return G.set(t,j),j}export{dt as renderStatsView};
