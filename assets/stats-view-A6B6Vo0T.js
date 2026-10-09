const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-C5YFT0Ma.js","assets/index-DkONXOUR.css"])))=>i.map(i=>d[i]);
import{A as z,f as H,h as U,_ as W}from"./index-C5YFT0Ma.js";const X=new Set(["modificacion","texto original","leyes y reformas por completar"]),B=t=>typeof t=="string"?t:"",Y=t=>B(t).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim().replace(/\s+/g," "),Z=t=>typeof t=="string"&&/^\d{4}-\d{2}-\d{2}/.test(t)&&Number.isFinite(Date.parse(`${t.slice(0,10)}T00:00:00Z`)),V=t=>Math.max(0,Number(t==null?void 0:t.articulos)||0);function K(t){return Z(t==null?void 0:t.fecha_publicacion)?t.fecha_publicacion.slice(0,10):null}function q(t){return`${t.slice(0,4)}-T${Math.floor((Number(t.slice(5,7))-1)/3)+1}`}function Q(t,i){const c=[];let[o,b]=[Number(t.slice(0,4)),Number(t.slice(-1))];const[s,d]=[Number(i.slice(0,4)),Number(i.slice(-1))];for(;o<s||o===s&&b<=d;)c.push(`${o}-T${b}`),++b>4&&(b=1,o++);return c}function J(t,{today:i=new Date}={}){const c=(Array.isArray(t)?t:[]).filter(e=>e&&typeof e=="object"),o=z.map(e=>({...e,count:0,fragments:0})),b=new Map(o.map(e=>[e.id,e])),s=c.map(e=>{const m=H(e),n=b.get(m);return n.count++,n.fragments+=V(e),{law:e,group:m,day:K(e),fragments:V(e)}}),d=s.map(e=>e.day).filter(Boolean).sort(),f=new Date(i.getTime()-365*864e5).toISOString().slice(0,10),l=d.length?`${Number(d.at(-1).slice(0,4))-2}-01-01`:null,x=d.find(e=>e>=l),A=x?Q(q(x),q(d.at(-1))).map(e=>({key:e,total:0,byGroup:{}})):[],S=new Map(A.map(e=>[e.key,e])),y={key:"antes",older:!0,year:l==null?void 0:l.slice(0,4),total:0,byGroup:{},items:[]};for(const e of s){if(!e.day)continue;const m=e.day<l?y:S.get(q(e.day));m.total++,m.byGroup[e.group]=(m.byGroup[e.group]||0)+1,m===y&&y.items.push({day:e.day,title:B(e.law.siglas||e.law.titulo)})}y.total&&(y.items.sort((e,m)=>e.day.localeCompare(m.day)),A.unshift(y));const p=new Map;for(const{law:e}of s){const m=new Set;for(const n of Array.isArray(e.temas_clave)?e.temas_clave:[]){const h=Y(n);if(!h||X.has(h)||m.has(h))continue;m.add(h);const w=p.get(h)||{label:B(n).trim(),count:0};w.count++,p.set(h,w)}}const $=s.reduce((e,m)=>e+m.fragments,0);return{total:s.length,totalFragments:$,averageFragments:s.length?Math.round($/s.length):0,recent:s.filter(e=>e.day&&e.day>=f).length,latestDay:d.at(-1)||null,firstDay:d[0]||null,groups:o.filter(e=>e.count>0),quarters:A,top:[...s].sort((e,m)=>m.fragments-e.fragments).slice(0,10),topics:[...p.values()].sort((e,m)=>m.count-e.count||e.label.localeCompare(m.label,"es")).slice(0,12),rows:s}}const P=new WeakMap,v=t=>new Intl.NumberFormat("es-MX").format(t),O=(t,i)=>i?`${new Intl.NumberFormat("es-MX",{maximumFractionDigits:1}).format(t/i*100)} %`:"0 %",g=t=>String(t??"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i]),D=t=>`var(--st-c-${t})`,_=(t,i="medium")=>t?new Intl.DateTimeFormat("es-MX",{dateStyle:i,timeZone:"UTC"}).format(new Date(`${t}T00:00:00Z`)):"—",tt=t=>t.siglas||t.titulo,G=new Intl.Collator("es",{sensitivity:"base",numeric:!0});function L(t,i,c,o){return`<div class="st-kpi" style="--st-accent:${o}">
        <p class="st-kpi-label">${t}</p>
        <p class="st-kpi-value">${i}</p>
        <p class="st-kpi-note">${c}</p>
    </div>`}function st(t){const i=c=>t.groups.map(o=>`<span class="st-seg" style="flex-grow:${o[c]};background:${D(o.id)}"
        data-tip="${g(`${o.label}: ${v(o[c])} (${O(o[c],c==="count"?t.total:t.totalFragments)})`)}"></span>`).join("");return`<section class="st-card st-span-2" aria-labelledby="st-comp">
        <div class="st-card-head"><h2 id="st-comp">Composición del acervo</h2><p>Proporción por colección, en instrumentos y en disposiciones (artículos, numerales, anexos).</p></div>
        <div class="st-stack-block"><p class="st-stack-label">Instrumentos</p><div class="st-stack" role="img" aria-label="Instrumentos por colección">${i("count")}</div></div>
        <div class="st-stack-block"><p class="st-stack-label">Disposiciones</p><div class="st-stack" role="img" aria-label="Disposiciones por colección">${i("fragments")}</div></div>
        <ul class="st-legend">
            ${t.groups.map(c=>`<li><button type="button" class="st-legend-item" data-group="${c.id}" title="Ver ${g(c.label)} en el acervo">
                <span class="st-icon" style="color:${D(c.id)}">${U(c.id,16)}</span>
                <span class="st-legend-name">${g(c.label)}</span>
                <span class="st-legend-num">${v(c.count)}</span>
                <span class="st-legend-pct">${O(c.count,t.total)}</span>
                <span class="st-legend-frag">${v(c.fragments)} ${c.fragments===1?"disposición":"disposiciones"}</span>
            </button></li>`).join("")}
        </ul>
    </section>`}function et(t){const i=t.quarters;if(!i.length)return"";const c=640,o=220,b=16,s=28,d=28,f=8,l=Math.max(...i.map(n=>n.total),1),x=Math.ceil(l/4),A=x*4,S=o-b-s,y=(c-d-f)/i.length,p=Math.min(36,y*.62),$=n=>b+S-n/A*S,e=[0,1,2,3,4].map(n=>`<g><line x1="${d}" x2="${c-f}" y1="${$(n*x)}" y2="${$(n*x)}" class="st-grid${n?"":" st-base"}"/><text x="${d-6}" y="${$(n*x)+4}" class="st-axis" text-anchor="end">${n*x}</text></g>`).join(""),m=i.map((n,h)=>{var T;const w=d+h*y+(y-p)/2;let M=0;const I=t.groups.filter(a=>n.byGroup[a.id]).map(a=>{const r=n.byGroup[a.id],u=$(M+r),k=$(M)-u;return M+=r,`<rect x="${w}" y="${u}" width="${p}" height="${Math.max(0,k-2)}" rx="2" fill="${D(a.id)}"/>`}).join(""),N=t.groups.filter(a=>n.byGroup[a.id]).map(a=>`${a.label}: ${n.byGroup[a.id]}`).join(" · ");if(n.older){const a=n.items.map(u=>`${u.day.slice(0,4)} · ${u.title}`).join(`
`),r=d+(h+1)*y;return`<g class="st-col st-col-older" data-tip="${g(`Antes de ${n.year} — ${n.total} publicados
${a}`)}">
                <rect class="st-hit" x="${d+h*y}" y="${b}" width="${y}" height="${S}"/>
                ${I}
                <line x1="${r}" x2="${r}" y1="${b}" y2="${b+S}" class="st-divider"/>
                <text x="${w+p/2}" y="${o-16}" class="st-axis" text-anchor="middle">Antes</text>
                <text x="${w+p/2}" y="${o-4}" class="st-axis st-axis-year" text-anchor="middle">de ${n.year}</text>
                <text x="${w+p/2}" y="${$(n.total)-5}" class="st-col-total" text-anchor="middle">${n.total}</text>
            </g>`}const[E,C]=n.key.split("-"),j=C==="T1"||h===0||((T=i[h-1])==null?void 0:T.older)?`<text x="${w+p/2}" y="${o-4}" class="st-axis st-axis-year" text-anchor="middle">${E}</text>`:"";return`<g class="st-col" data-tip="${g(`${C} ${E} — ${n.total} publicados${N?`
${N}`:""}`)}">
            <rect class="st-hit" x="${d+h*y}" y="${b}" width="${y}" height="${S}"/>
            ${I}
            <text x="${w+p/2}" y="${o-16}" class="st-axis" text-anchor="middle">${C}</text>${j}
            ${n.total?`<text x="${w+p/2}" y="${$(n.total)-5}" class="st-col-total" text-anchor="middle">${n.total}</text>`:""}
        </g>`}).join("");return`<section class="st-card st-span-2" aria-labelledby="st-time">
        <div class="st-card-head"><h2 id="st-time">Publicaciones por trimestre</h2><p>Fecha de publicación oficial de cada instrumento, apilada por colección. Lo publicado antes de los últimos tres años va junto en la primera barra.</p></div>
        <div class="st-chart-scroll"><svg class="st-chart" viewBox="0 0 ${c} ${o}" role="img" aria-label="Instrumentos publicados por trimestre">${e}${m}</svg></div>
    </section>`}function R(t,i,c,o){const b=Math.max(...o.map(s=>s.value),1);return`<section class="st-card" aria-labelledby="${t}">
        <div class="st-card-head"><h2 id="${t}">${i}</h2><p>${c}</p></div>
        <ol class="st-bars">
            ${o.map(s=>{const d=s.lawId?"button":"div";return`<li><${d} ${s.lawId?`type="button" data-law-id="${g(s.lawId)}"`:""} class="st-bar-row" title="${g(s.title)}">
                    <span class="st-bar-name">${g(s.label)}</span>
                    <span class="st-bar-track"><span class="st-bar-fill" style="--w:${s.value/b*100}%;background:${s.color}"></span></span>
                    <span class="st-bar-val">${v(s.value)}</span>
                </${d}></li>`}).join("")}
        </ol>
    </section>`}function at(t){return`<section class="st-card st-span-2 st-table-card" aria-labelledby="st-table">
        <div class="st-card-head st-table-head">
            <div><h2 id="st-table">Todos los instrumentos</h2><p class="st-table-status" role="status" aria-live="polite"></p></div>
            <div class="st-table-tools">
                <label class="st-field"><span>Buscar</span><input type="search" class="st-search" placeholder="Título o siglas" autocomplete="off" maxlength="200"></label>
                <label class="st-field"><span>Colección</span><select class="st-filter"><option value="all">Todas</option>${t.groups.map(i=>`<option value="${i.id}">${g(i.label)}</option>`).join("")}</select></label>
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
    </section>`}async function ot(t,{lawById:i=new Map,onOpenLaw:c=()=>{}}={}){let o,b=null;try{const{fetchUsageSummary:p,fetchTopConsulted:$}=await W(async()=>{const{fetchUsageSummary:e,fetchTopConsulted:m}=await import("./index-C5YFT0Ma.js").then(n=>n.a1);return{fetchUsageSummary:e,fetchTopConsulted:m}},__vite__mapDeps([0,1]));[o,b]=await Promise.all([p(),$(6).catch(()=>null)])}catch{return}if(!o||!(t!=null&&t.isConnected))return;const s=o.totales||{},d=o.hoy||{},f=p=>v(Number(s[p]||0)),l=p=>Number(d[p]||0)?`+${v(Number(d[p]))} hoy`:"Sin registros hoy",x=Array.isArray(o.serie)?o.serie:[],A=Math.max(1,...x.map(p=>Number(p.visitas)||0)),S=x.map(p=>`<span class="st-usage-bar" style="height:${Math.max(6,Number(p.visitas)/A*100)}%"
        data-tip="${g(`${_(String(p.dia).slice(0,10))}: ${v(Number(p.visitas))} visitas`)}"></span>`).join(""),y=o.desde?`Contando desde el ${g(_(String(o.desde).slice(0,10),"long"))}`:"Contando desde hoy";t.innerHTML=`<div class="st-usage-head">
            <p class="st-usage-since">${y}</p></div>
        <div class="st-kpis st-usage-kpis">
            ${L("Visitas acumuladas",f("visita"),l("visita"),"var(--st-c-leyes)")}
            ${L("Visitantes únicos",f("visitante"),"Navegadores distintos","var(--st-c-reglamentos)")}
            ${L("Búsquedas",f("busqueda"),l("busqueda"),"var(--st-c-acuerdos)")}
            ${L("Artículos consultados",f("lectura"),l("lectura"),"var(--st-c-dacg)")}
            ${L("Usuarios registrados",v(Number(o.usuarios||0)),"Cuentas confirmadas","var(--st-c-convocatorias)")}
        </div>
        ${x.length?`<div class="st-usage-chart"><p class="st-stack-label">Visitas por día · últimos 30 días</p>
            <div class="st-usage-bars" role="img" aria-label="Visitas por día en los últimos 30 días">${S}</div></div>`:""}
        ${nt(b)}`,t.hidden=!1,t.addEventListener("click",p=>{const $=p.target.closest("[data-top-law]");if($){const m=i.get($.dataset.topLaw);m&&c(m);return}const e=p.target.closest("[data-top-article]");if(e){const m=e.dataset.topArticle;document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:m,list:[m]}}))}})}function nt(t){const i=Array.isArray(t==null?void 0:t.leyes)?t.leyes:[],c=Array.isArray(t==null?void 0:t.articulos)?t.articulos:[];if(!i.length&&!c.length)return'<p class="st-top-empty">Aquí aparecerán las leyes y los artículos más consultados en cuanto el buscador tenga uso.</p>';const o=(s,d)=>s.length?`<ol class="st-top-list">${s.map((f,l)=>`<li>${d(f,l)}</li>`).join("")}</ol>`:'<p class="st-top-empty">Todavía sin consultas.</p>',b=s=>`<span class="st-top-count">${v(Number(s)||0)}</span>`;return`<div class="st-top">
        <div class="st-top-col"><h3>Instrumentos más consultados</h3>
            ${o(i,(s,d)=>`<button type="button" class="st-top-item" data-top-law="${g(s.id)}" title="${g(s.titulo)}">
                <span class="st-top-rank">${d+1}</span><span class="st-top-name"><strong>${g(s.siglas||"")}</strong>${g(s.titulo)}</span>${b(s.total)}</button>`)}</div>
        <div class="st-top-col"><h3>Artículos más leídos</h3>
            ${o(c,(s,d)=>`<button type="button" class="st-top-item" data-top-article="${g(s.id)}" title="${g(`${s.identificador} · ${s.ley||""}`)}">
                <span class="st-top-rank">${d+1}</span><span class="st-top-name"><strong>${g(s.identificador)}</strong>${g(s.siglas||s.ley||"")}</span>${b(s.total)}</button>`)}</div>
    </div>`}function ct(t,i,{onOpenLaw:c=()=>{},onOpenGroup:o=()=>{},today:b}={}){var T;if(!t)throw new Error("Falta el contenedor de estadísticas.");(T=P.get(t))==null||T.destroy();const s=J(i,{today:b}),d=new Map(s.groups.map(a=>[a.id,a.label])),f=s.groups[0]?[...s.groups].sort((a,r)=>r.count-a.count)[0]:null,l=document.createElement("section");l.className="st-dashboard",l.setAttribute("aria-labelledby","st-title"),l.innerHTML=`
        <div class="st-header">
            <div>
                <p class="st-eyebrow">Panorama del acervo</p>
                <h1 id="st-title">Estadísticas</h1>
                <p class="st-intro">Qué contiene el acervo regulatorio, cómo se distribuye y cuándo se publicó.</p>
            </div>
            <p class="st-updated">Publicación más reciente<br><strong>${_(s.latestDay,"long")}</strong></p>
        </div>
        <div class="st-kpis">
            ${L("Instrumentos",v(s.total),`${s.groups.length} colecciones`,"var(--st-c-leyes)")}
            ${L("Artículos y disposiciones",v(s.totalFragments),`${v(s.averageFragments)} en promedio por instrumento`,"var(--st-c-reglamentos)")}
            ${L("Publicados en 12 meses",v(s.recent),`${O(s.recent,s.total)} del acervo`,"var(--st-c-acuerdos)")}
            ${L("Colección mayor",f?g(f.label):"—",f?`${v(f.count)} instrumentos`:"","var(--st-c-dacg)")}
        </div>
        <section class="st-usage" aria-label="Uso del buscador" hidden></section>
        <div class="st-grid-layout">
            ${st(s)}
            ${et(s)}
            ${R("st-top","Instrumentos más extensos","Por número de artículos y disposiciones. Selecciona uno para abrirlo.",s.top.map(a=>({label:tt(a.law),title:a.law.titulo,value:a.fragments,color:D(a.group),lawId:String(a.law.id)})))}
            ${R("st-topics","Temas más frecuentes","Número de instrumentos que incluyen cada tema clave.",s.topics.map(a=>({label:a.label,title:a.label,value:a.count,color:"var(--st-c-topic)"})))}
            ${at(s)}
        </div>
        <div class="st-tip" role="tooltip" hidden></div>`,t.replaceChildren(l);const x=new Map(s.rows.map(a=>[String(a.law.id),a.law]));ot(l.querySelector(".st-usage"),{lawById:x,onOpenLaw:c});const A=l.querySelector("tbody"),S=l.querySelector(".st-table-status"),y=l.querySelector(".st-search"),p=l.querySelector(".st-filter"),$={query:"",group:"all",sort:"fragments",dir:-1},e=a=>String(a??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),m={name:(a,r)=>G.compare(a.law.titulo,r.law.titulo),group:(a,r)=>G.compare(d.get(a.group),d.get(r.group)),day:(a,r)=>(a.day||"").localeCompare(r.day||""),fragments:(a,r)=>a.fragments-r.fragments};function n(){const a=e($.query).split(/\s+/).filter(Boolean),r=s.rows.filter(u=>$.group==="all"||u.group===$.group).filter(u=>a.every(k=>e(`${u.law.titulo} ${u.law.siglas||""}`).includes(k))).sort((u,k)=>m[$.sort](u,k)*$.dir||G.compare(u.law.titulo,k.law.titulo));A.innerHTML=r.map(u=>`<tr data-law-id="${g(u.law.id)}" tabindex="0">
            <td><span class="st-td-sigla">${g(u.law.siglas||"")}</span><span class="st-td-title">${g(u.law.titulo)}</span></td>
            <td><span class="st-chip"><span class="st-icon" style="color:${D(u.group)}">${U(u.group,15)}</span>${g(d.get(u.group))}</span></td>
            <td class="st-nowrap">${_(u.day)}</td>
            <td class="st-num">${v(u.fragments)}</td>
        </tr>`).join("")||'<tr><td colspan="4" class="st-empty">Sin instrumentos que coincidan.</td></tr>',S.textContent=`${v(r.length)} de ${v(s.total)} instrumentos`,l.querySelectorAll("th button").forEach(u=>{const k=u.dataset.sort===$.sort;u.closest("th").setAttribute("aria-sort",k?$.dir>0?"ascending":"descending":"none")})}const h=l.querySelector(".st-tip"),w=a=>{const r=a.target.closest("[data-tip]");if(!r){h.hidden=!0;return}h.textContent=r.dataset.tip,h.hidden=!1;const u=l.getBoundingClientRect(),k=Math.min(a.clientX-u.left+14,u.width-h.offsetWidth-4);h.style.transform=`translate(${Math.max(4,k)}px, ${a.clientY-u.top+14}px)`},M=()=>{h.hidden=!0},I=a=>{const r=x.get(a.dataset.lawId);r&&c(r)},N=a=>{const r=a.target.closest("th button");if(r)return $.dir=$.sort===r.dataset.sort?-$.dir:r.dataset.sort==="name"||r.dataset.sort==="group"?1:-1,$.sort=r.dataset.sort,n();const u=a.target.closest("[data-group]");if(u)return o(u.dataset.group);const k=a.target.closest("[data-law-id]");k&&I(k)},E=a=>{const r=a.target.closest("tr[data-law-id]");r&&(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),I(r))},C=()=>{$.query=y.value,$.group=p.value,n()};l.addEventListener("pointermove",w),l.addEventListener("pointerleave",M),l.addEventListener("click",N),l.addEventListener("keydown",E),y.addEventListener("input",C),p.addEventListener("change",C),n();const F=l.querySelector(".st-chart-scroll");F&&(F.scrollLeft=F.scrollWidth),requestAnimationFrame==null||requestAnimationFrame(()=>l.classList.add("is-ready"));const j={destroy(){l.removeEventListener("pointermove",w),l.removeEventListener("pointerleave",M),l.removeEventListener("click",N),l.removeEventListener("keydown",E),P.delete(t)}};return P.set(t,j),j}export{ct as renderStatsView};
