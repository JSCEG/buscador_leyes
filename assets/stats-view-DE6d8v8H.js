const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-o8tqSt2n.js","assets/index-R78lkvkN.css"])))=>i.map(i=>d[i]);
import{A as z,f as H,h as O,_ as W}from"./index-o8tqSt2n.js";const X=new Set(["modificacion","texto original","leyes y reformas por completar"]),U=t=>typeof t=="string"?t:"",Z=t=>U(t).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim().replace(/\s+/g," "),K=t=>typeof t=="string"&&/^\d{4}-\d{2}-\d{2}/.test(t)&&Number.isFinite(Date.parse(`${t.slice(0,10)}T00:00:00Z`)),V=t=>Math.max(0,Number(t==null?void 0:t.articulos)||0);function Q(t){return K(t==null?void 0:t.fecha_publicacion)?t.fecha_publicacion.slice(0,10):null}function j(t){return`${t.slice(0,4)}-T${Math.floor((Number(t.slice(5,7))-1)/3)+1}`}function Y(t,c){const l=[];let[n,b]=[Number(t.slice(0,4)),Number(t.slice(-1))];const[s,d]=[Number(c.slice(0,4)),Number(c.slice(-1))];for(;n<s||n===s&&b<=d;)l.push(`${n}-T${b}`),++b>4&&(b=1,n++);return l}function J(t,{today:c=new Date}={}){const l=(Array.isArray(t)?t:[]).filter(e=>e&&typeof e=="object"),n=z.map(e=>({...e,count:0,fragments:0})),b=new Map(n.map(e=>[e.id,e])),s=l.map(e=>{const o=H(e),i=b.get(o);return i.count++,i.fragments+=V(e),{law:e,group:o,day:Q(e),fragments:V(e)}}),d=s.map(e=>e.day).filter(Boolean).sort(),y=new Date(c.getTime()-365*864e5).toISOString().slice(0,10),r=d.length?Y(j(d[0]),j(d.at(-1))).map(e=>({key:e,total:0,byGroup:{}})):[],h=new Map(r.map(e=>[e.key,e]));for(const e of s){if(!e.day)continue;const o=h.get(j(e.day));o.total++,o.byGroup[e.group]=(o.byGroup[e.group]||0)+1}const L=new Map;for(const{law:e}of s){const o=new Set;for(const i of Array.isArray(e.temas_clave)?e.temas_clave:[]){const v=Z(i);if(!v||X.has(v)||o.has(v))continue;o.add(v);const f=L.get(v)||{label:U(i).trim(),count:0};f.count++,L.set(v,f)}}const k=s.reduce((e,o)=>e+o.fragments,0);return{total:s.length,totalFragments:k,averageFragments:s.length?Math.round(k/s.length):0,recent:s.filter(e=>e.day&&e.day>=y).length,latestDay:d.at(-1)||null,firstDay:d[0]||null,groups:n.filter(e=>e.count>0),quarters:r,top:[...s].sort((e,o)=>o.fragments-e.fragments).slice(0,10),topics:[...L.values()].sort((e,o)=>o.count-e.count||e.label.localeCompare(o.label,"es")).slice(0,12),rows:s}}const P=new WeakMap,$=t=>new Intl.NumberFormat("es-MX").format(t),B=(t,c)=>c?`${new Intl.NumberFormat("es-MX",{maximumFractionDigits:1}).format(t/c*100)} %`:"0 %",g=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]),F=t=>`var(--st-c-${t})`,_=(t,c="medium")=>t?new Intl.DateTimeFormat("es-MX",{dateStyle:c,timeZone:"UTC"}).format(new Date(`${t}T00:00:00Z`)):"—",tt=t=>t.siglas||t.titulo,G=new Intl.Collator("es",{sensitivity:"base",numeric:!0});function M(t,c,l,n){return`<div class="st-kpi" style="--st-accent:${n}">
        <p class="st-kpi-label">${t}</p>
        <p class="st-kpi-value">${c}</p>
        <p class="st-kpi-note">${l}</p>
    </div>`}function st(t){const c=l=>t.groups.map(n=>`<span class="st-seg" style="flex-grow:${n[l]};background:${F(n.id)}"
        data-tip="${g(`${n.label}: ${$(n[l])} (${B(n[l],l==="count"?t.total:t.totalFragments)})`)}"></span>`).join("");return`<section class="st-card st-span-2" aria-labelledby="st-comp">
        <div class="st-card-head"><h2 id="st-comp">Composición del acervo</h2><p>Proporción por colección, en instrumentos y en fragmentos de texto.</p></div>
        <div class="st-stack-block"><p class="st-stack-label">Instrumentos</p><div class="st-stack" role="img" aria-label="Instrumentos por colección">${c("count")}</div></div>
        <div class="st-stack-block"><p class="st-stack-label">Fragmentos</p><div class="st-stack" role="img" aria-label="Fragmentos por colección">${c("fragments")}</div></div>
        <ul class="st-legend">
            ${t.groups.map(l=>`<li><button type="button" class="st-legend-item" data-group="${l.id}" title="Ver ${g(l.label)} en el acervo">
                <span class="st-icon" style="color:${F(l.id)}">${O(l.id,16)}</span>
                <span class="st-legend-name">${g(l.label)}</span>
                <span class="st-legend-num">${$(l.count)}</span>
                <span class="st-legend-pct">${B(l.count,t.total)}</span>
                <span class="st-legend-frag">${$(l.fragments)} frag.</span>
            </button></li>`).join("")}
        </ul>
    </section>`}function et(t){const c=t.quarters;if(!c.length)return"";const l=640,n=220,b=16,s=28,d=28,y=8,r=Math.max(...c.map(m=>m.total),1),h=Math.ceil(r/4),L=h*4,k=n-b-s,e=(l-d-y)/c.length,o=Math.min(36,e*.62),i=m=>b+k-m/L*k,v=[0,1,2,3,4].map(m=>`<g><line x1="${d}" x2="${l-y}" y1="${i(m*h)}" y2="${i(m*h)}" class="st-grid${m?"":" st-base"}"/><text x="${d-6}" y="${i(m*h)+4}" class="st-axis" text-anchor="end">${m*h}</text></g>`).join(""),f=c.map((m,S)=>{const C=d+S*e+(e-o)/2;let I=0;const D=t.groups.filter(x=>m.byGroup[x.id]).map(x=>{const q=m.byGroup[x.id],a=i(I+q),u=i(I)-a;return I+=q,`<rect x="${C}" y="${a}" width="${o}" height="${Math.max(0,u-2)}" rx="2" fill="${F(x.id)}"/>`}).join(""),[N,A]=m.key.split("-"),E=t.groups.filter(x=>m.byGroup[x.id]).map(x=>`${x.label}: ${m.byGroup[x.id]}`).join(" · "),T=A==="T1"||S===0?`<text x="${C+o/2}" y="${n-4}" class="st-axis st-axis-year" text-anchor="middle">${N}</text>`:"";return`<g class="st-col" data-tip="${g(`${A} ${N} — ${m.total} publicados${E?`
${E}`:""}`)}">
            <rect class="st-hit" x="${d+S*e}" y="${b}" width="${e}" height="${k}"/>
            ${D}
            <text x="${C+o/2}" y="${n-16}" class="st-axis" text-anchor="middle">${A}</text>${T}
            ${m.total?`<text x="${C+o/2}" y="${i(m.total)-5}" class="st-col-total" text-anchor="middle">${m.total}</text>`:""}
        </g>`}).join("");return`<section class="st-card st-span-2" aria-labelledby="st-time">
        <div class="st-card-head"><h2 id="st-time">Publicaciones por trimestre</h2><p>Fecha de publicación oficial de cada instrumento, apilada por colección.</p></div>
        <div class="st-chart-scroll"><svg class="st-chart" viewBox="0 0 ${l} ${n}" role="img" aria-label="Instrumentos publicados por trimestre">${v}${f}</svg></div>
    </section>`}function R(t,c,l,n){const b=Math.max(...n.map(s=>s.value),1);return`<section class="st-card" aria-labelledby="${t}">
        <div class="st-card-head"><h2 id="${t}">${c}</h2><p>${l}</p></div>
        <ol class="st-bars">
            ${n.map(s=>{const d=s.lawId?"button":"div";return`<li><${d} ${s.lawId?`type="button" data-law-id="${g(s.lawId)}"`:""} class="st-bar-row" title="${g(s.title)}">
                    <span class="st-bar-name">${g(s.label)}</span>
                    <span class="st-bar-track"><span class="st-bar-fill" style="--w:${s.value/b*100}%;background:${s.color}"></span></span>
                    <span class="st-bar-val">${$(s.value)}</span>
                </${d}></li>`}).join("")}
        </ol>
    </section>`}function at(t){return`<section class="st-card st-span-2 st-table-card" aria-labelledby="st-table">
        <div class="st-card-head st-table-head">
            <div><h2 id="st-table">Todos los instrumentos</h2><p class="st-table-status" role="status" aria-live="polite"></p></div>
            <div class="st-table-tools">
                <label class="st-field"><span>Buscar</span><input type="search" class="st-search" placeholder="Título o siglas" autocomplete="off" maxlength="200"></label>
                <label class="st-field"><span>Colección</span><select class="st-filter"><option value="all">Todas</option>${t.groups.map(c=>`<option value="${c.id}">${g(c.label)}</option>`).join("")}</select></label>
            </div>
        </div>
        <div class="st-table-wrap"><table class="st-table">
            <thead><tr>
                <th scope="col"><button type="button" data-sort="name">Instrumento</button></th>
                <th scope="col"><button type="button" data-sort="group">Colección</button></th>
                <th scope="col"><button type="button" data-sort="day">Publicación</button></th>
                <th scope="col" class="st-num"><button type="button" data-sort="fragments">Fragmentos</button></th>
            </tr></thead>
            <tbody></tbody>
        </table></div>
    </section>`}async function ot(t,{lawById:c=new Map,onOpenLaw:l=()=>{}}={}){let n,b=null;try{const{fetchUsageSummary:o,fetchTopConsulted:i}=await W(async()=>{const{fetchUsageSummary:v,fetchTopConsulted:f}=await import("./index-o8tqSt2n.js").then(m=>m.L);return{fetchUsageSummary:v,fetchTopConsulted:f}},__vite__mapDeps([0,1]));[n,b]=await Promise.all([o(),i(6).catch(()=>null)])}catch{return}if(!n||!(t!=null&&t.isConnected))return;const s=n.totales||{},d=n.hoy||{},y=o=>$(Number(s[o]||0)),r=o=>Number(d[o]||0)?`+${$(Number(d[o]))} hoy`:"Sin registros hoy",h=Array.isArray(n.serie)?n.serie:[],L=Math.max(1,...h.map(o=>Number(o.visitas)||0)),k=h.map(o=>`<span class="st-usage-bar" style="height:${Math.max(6,Number(o.visitas)/L*100)}%"
        data-tip="${g(`${_(String(o.dia).slice(0,10))}: ${$(Number(o.visitas))} visitas`)}"></span>`).join(""),e=n.desde?`Contando desde el ${g(_(String(n.desde).slice(0,10),"long"))}`:"Contando desde hoy";t.innerHTML=`<div class="st-usage-head"><div><h2 id="st-usage-title">Cuánto se consulta</h2></div>
            <p class="st-usage-since">${e}</p></div>
        <div class="st-kpis st-usage-kpis">
            ${M("Visitas acumuladas",y("visita"),r("visita"),"var(--st-c-leyes)")}
            ${M("Visitantes únicos",y("visitante"),"Navegadores distintos","var(--st-c-reglamentos)")}
            ${M("Búsquedas",y("busqueda"),r("busqueda"),"var(--st-c-acuerdos)")}
            ${M("Artículos consultados",y("lectura"),r("lectura"),"var(--st-c-dacg)")}
            ${M("Usuarios registrados",$(Number(n.usuarios||0)),"Cuentas confirmadas","var(--st-c-convocatorias)")}
        </div>
        ${h.length?`<div class="st-usage-chart"><p class="st-stack-label">Visitas por día · últimos 30 días</p>
            <div class="st-usage-bars" role="img" aria-label="Visitas por día en los últimos 30 días">${k}</div></div>`:""}
        ${nt(b)}`,t.hidden=!1,t.addEventListener("click",o=>{const i=o.target.closest("[data-top-law]");if(i){const f=c.get(i.dataset.topLaw);f&&l(f);return}const v=o.target.closest("[data-top-article]");if(v){const f=v.dataset.topArticle;document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:f,list:[f]}}))}})}function nt(t){const c=Array.isArray(t==null?void 0:t.leyes)?t.leyes:[],l=Array.isArray(t==null?void 0:t.articulos)?t.articulos:[];if(!c.length&&!l.length)return'<p class="st-top-empty">Aquí aparecerán las leyes y los artículos más consultados en cuanto el buscador tenga uso.</p>';const n=(s,d)=>s.length?`<ol class="st-top-list">${s.map((y,r)=>`<li>${d(y,r)}</li>`).join("")}</ol>`:'<p class="st-top-empty">Todavía sin consultas.</p>',b=s=>`<span class="st-top-count">${$(Number(s)||0)}</span>`;return`<div class="st-top">
        <div class="st-top-col"><h3>Instrumentos más consultados</h3>
            ${n(c,(s,d)=>`<button type="button" class="st-top-item" data-top-law="${g(s.id)}" title="${g(s.titulo)}">
                <span class="st-top-rank">${d+1}</span><span class="st-top-name"><strong>${g(s.siglas||"")}</strong>${g(s.titulo)}</span>${b(s.total)}</button>`)}</div>
        <div class="st-top-col"><h3>Artículos más leídos</h3>
            ${n(l,(s,d)=>`<button type="button" class="st-top-item" data-top-article="${g(s.id)}" title="${g(`${s.identificador} · ${s.ley||""}`)}">
                <span class="st-top-rank">${d+1}</span><span class="st-top-name"><strong>${g(s.identificador)}</strong>${g(s.siglas||s.ley||"")}</span>${b(s.total)}</button>`)}</div>
    </div>`}function ct(t,c,{onOpenLaw:l=()=>{},onOpenGroup:n=()=>{},today:b}={}){var q;if(!t)throw new Error("Falta el contenedor de estadísticas.");(q=P.get(t))==null||q.destroy();const s=J(c,{today:b}),d=new Map(s.groups.map(a=>[a.id,a.label])),y=s.groups[0]?[...s.groups].sort((a,u)=>u.count-a.count)[0]:null,r=document.createElement("section");r.className="st-dashboard",r.setAttribute("aria-labelledby","st-title"),r.innerHTML=`
        <div class="st-header">
            <div>
                <p class="st-eyebrow">Panorama del acervo</p>
                <h1 id="st-title">Estadísticas</h1>
                <p class="st-intro">Qué contiene el acervo regulatorio, cómo se distribuye y cuándo se publicó.</p>
            </div>
            <p class="st-updated">Publicación más reciente<br><strong>${_(s.latestDay,"long")}</strong></p>
        </div>
        <div class="st-kpis">
            ${M("Instrumentos",$(s.total),`${s.groups.length} colecciones`,"var(--st-c-leyes)")}
            ${M("Fragmentos de texto",$(s.totalFragments),`${$(s.averageFragments)} en promedio por instrumento`,"var(--st-c-reglamentos)")}
            ${M("Publicados en 12 meses",$(s.recent),`${B(s.recent,s.total)} del acervo`,"var(--st-c-acuerdos)")}
            ${M("Colección mayor",y?g(y.label):"—",y?`${$(y.count)} instrumentos`:"","var(--st-c-dacg)")}
        </div>
        <section class="st-usage" aria-labelledby="st-usage-title" hidden></section>
        <div class="st-grid-layout">
            ${st(s)}
            ${et(s)}
            ${R("st-top","Instrumentos más extensos","Por número de fragmentos. Selecciona uno para abrirlo.",s.top.map(a=>({label:tt(a.law),title:a.law.titulo,value:a.fragments,color:F(a.group),lawId:String(a.law.id)})))}
            ${R("st-topics","Temas más frecuentes","Número de instrumentos que incluyen cada tema clave.",s.topics.map(a=>({label:a.label,title:a.label,value:a.count,color:"var(--st-c-topic)"})))}
            ${at(s)}
        </div>
        <div class="st-tip" role="tooltip" hidden></div>`,t.replaceChildren(r);const h=new Map(s.rows.map(a=>[String(a.law.id),a.law]));ot(r.querySelector(".st-usage"),{lawById:h,onOpenLaw:l});const L=r.querySelector("tbody"),k=r.querySelector(".st-table-status"),e=r.querySelector(".st-search"),o=r.querySelector(".st-filter"),i={query:"",group:"all",sort:"fragments",dir:-1},v=a=>String(a??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),f={name:(a,u)=>G.compare(a.law.titulo,u.law.titulo),group:(a,u)=>G.compare(d.get(a.group),d.get(u.group)),day:(a,u)=>(a.day||"").localeCompare(u.day||""),fragments:(a,u)=>a.fragments-u.fragments};function m(){const a=v(i.query).split(/\s+/).filter(Boolean),u=s.rows.filter(p=>i.group==="all"||p.group===i.group).filter(p=>a.every(w=>v(`${p.law.titulo} ${p.law.siglas||""}`).includes(w))).sort((p,w)=>f[i.sort](p,w)*i.dir||G.compare(p.law.titulo,w.law.titulo));L.innerHTML=u.map(p=>`<tr data-law-id="${g(p.law.id)}" tabindex="0">
            <td><span class="st-td-sigla">${g(p.law.siglas||"")}</span><span class="st-td-title">${g(p.law.titulo)}</span></td>
            <td><span class="st-chip"><span class="st-icon" style="color:${F(p.group)}">${O(p.group,15)}</span>${g(d.get(p.group))}</span></td>
            <td class="st-nowrap">${_(p.day)}</td>
            <td class="st-num">${$(p.fragments)}</td>
        </tr>`).join("")||'<tr><td colspan="4" class="st-empty">Sin instrumentos que coincidan.</td></tr>',k.textContent=`${$(u.length)} de ${$(s.total)} instrumentos`,r.querySelectorAll("th button").forEach(p=>{const w=p.dataset.sort===i.sort;p.closest("th").setAttribute("aria-sort",w?i.dir>0?"ascending":"descending":"none")})}const S=r.querySelector(".st-tip"),C=a=>{const u=a.target.closest("[data-tip]");if(!u){S.hidden=!0;return}S.textContent=u.dataset.tip,S.hidden=!1;const p=r.getBoundingClientRect(),w=Math.min(a.clientX-p.left+14,p.width-S.offsetWidth-4);S.style.transform=`translate(${Math.max(4,w)}px, ${a.clientY-p.top+14}px)`},I=()=>{S.hidden=!0},D=a=>{const u=h.get(a.dataset.lawId);u&&l(u)},N=a=>{const u=a.target.closest("th button");if(u)return i.dir=i.sort===u.dataset.sort?-i.dir:u.dataset.sort==="name"||u.dataset.sort==="group"?1:-1,i.sort=u.dataset.sort,m();const p=a.target.closest("[data-group]");if(p)return n(p.dataset.group);const w=a.target.closest("[data-law-id]");w&&D(w)},A=a=>{const u=a.target.closest("tr[data-law-id]");u&&(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),D(u))},E=()=>{i.query=e.value,i.group=o.value,m()};r.addEventListener("pointermove",C),r.addEventListener("pointerleave",I),r.addEventListener("click",N),r.addEventListener("keydown",A),e.addEventListener("input",E),o.addEventListener("change",E),m();const T=r.querySelector(".st-chart-scroll");T&&(T.scrollLeft=T.scrollWidth),requestAnimationFrame==null||requestAnimationFrame(()=>r.classList.add("is-ready"));const x={destroy(){r.removeEventListener("pointermove",C),r.removeEventListener("pointerleave",I),r.removeEventListener("click",N),r.removeEventListener("keydown",A),P.delete(t)}};return P.set(t,x),x}export{ct as renderStatsView};
