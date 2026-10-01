const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-CoCES4MR.js","assets/index-CEn_NJoi.css"])))=>i.map(i=>d[i]);
import{A as z,a as H,c as R,_ as W}from"./index-CoCES4MR.js";const X=new Set(["modificacion","texto original","leyes y reformas por completar"]),U=t=>typeof t=="string"?t:"",Z=t=>U(t).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim().replace(/\s+/g," "),K=t=>typeof t=="string"&&/^\d{4}-\d{2}-\d{2}/.test(t)&&Number.isFinite(Date.parse(`${t.slice(0,10)}T00:00:00Z`)),V=t=>Math.max(0,Number(t==null?void 0:t.articulos)||0);function Q(t){return K(t==null?void 0:t.fecha_publicacion)?t.fecha_publicacion.slice(0,10):null}function j(t){return`${t.slice(0,4)}-T${Math.floor((Number(t.slice(5,7))-1)/3)+1}`}function Y(t,o){const n=[];let[c,b]=[Number(t.slice(0,4)),Number(t.slice(-1))];const[e,p]=[Number(o.slice(0,4)),Number(o.slice(-1))];for(;c<e||c===e&&b<=p;)n.push(`${c}-T${b}`),++b>4&&(b=1,c++);return n}function J(t,{today:o=new Date}={}){const n=(Array.isArray(t)?t:[]).filter(s=>s&&typeof s=="object"),c=z.map(s=>({...s,count:0,fragments:0})),b=new Map(c.map(s=>[s.id,s])),e=n.map(s=>{const u=H(s),i=b.get(u);return i.count++,i.fragments+=V(s),{law:s,group:u,day:Q(s),fragments:V(s)}}),p=e.map(s=>s.day).filter(Boolean).sort(),h=new Date(o.getTime()-365*864e5).toISOString().slice(0,10),l=p.length?Y(j(p[0]),j(p.at(-1))).map(s=>({key:s,total:0,byGroup:{}})):[],f=new Map(l.map(s=>[s.key,s]));for(const s of e){if(!s.day)continue;const u=f.get(j(s.day));u.total++,u.byGroup[s.group]=(u.byGroup[s.group]||0)+1}const g=new Map;for(const{law:s}of e){const u=new Set;for(const i of Array.isArray(s.temas_clave)?s.temas_clave:[]){const x=Z(i);if(!x||X.has(x)||u.has(x))continue;u.add(x);const L=g.get(x)||{label:U(i).trim(),count:0};L.count++,g.set(x,L)}}const S=e.reduce((s,u)=>s+u.fragments,0);return{total:e.length,totalFragments:S,averageFragments:e.length?Math.round(S/e.length):0,recent:e.filter(s=>s.day&&s.day>=h).length,latestDay:p.at(-1)||null,firstDay:p[0]||null,groups:c.filter(s=>s.count>0),quarters:l,top:[...e].sort((s,u)=>u.fragments-s.fragments).slice(0,10),topics:[...g.values()].sort((s,u)=>u.count-s.count||s.label.localeCompare(u.label,"es")).slice(0,12),rows:e}}const P=new WeakMap,$=t=>new Intl.NumberFormat("es-MX").format(t),B=(t,o)=>o?`${new Intl.NumberFormat("es-MX",{maximumFractionDigits:1}).format(t/o*100)} %`:"0 %",y=t=>String(t??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o]),D=t=>`var(--st-c-${t})`,_=(t,o="medium")=>t?new Intl.DateTimeFormat("es-MX",{dateStyle:o,timeZone:"UTC"}).format(new Date(`${t}T00:00:00Z`)):"—",tt=t=>t.siglas||t.titulo,G=new Intl.Collator("es",{sensitivity:"base",numeric:!0});function M(t,o,n,c){return`<div class="st-kpi" style="--st-accent:${c}">
        <p class="st-kpi-label">${t}</p>
        <p class="st-kpi-value">${o}</p>
        <p class="st-kpi-note">${n}</p>
    </div>`}function st(t){const o=n=>t.groups.map(c=>`<span class="st-seg" style="flex-grow:${c[n]};background:${D(c.id)}"
        data-tip="${y(`${c.label}: ${$(c[n])} (${B(c[n],n==="count"?t.total:t.totalFragments)})`)}"></span>`).join("");return`<section class="st-card st-span-2" aria-labelledby="st-comp">
        <div class="st-card-head"><h2 id="st-comp">Composición del acervo</h2><p>Proporción por colección, en instrumentos y en fragmentos de texto.</p></div>
        <div class="st-stack-block"><p class="st-stack-label">Instrumentos</p><div class="st-stack" role="img" aria-label="Instrumentos por colección">${o("count")}</div></div>
        <div class="st-stack-block"><p class="st-stack-label">Fragmentos</p><div class="st-stack" role="img" aria-label="Fragmentos por colección">${o("fragments")}</div></div>
        <ul class="st-legend">
            ${t.groups.map(n=>`<li><button type="button" class="st-legend-item" data-group="${n.id}" title="Ver ${y(n.label)} en el acervo">
                <span class="st-icon" style="color:${D(n.id)}">${R(n.id,16)}</span>
                <span class="st-legend-name">${y(n.label)}</span>
                <span class="st-legend-num">${$(n.count)}</span>
                <span class="st-legend-pct">${B(n.count,t.total)}</span>
                <span class="st-legend-frag">${$(n.fragments)} frag.</span>
            </button></li>`).join("")}
        </ul>
    </section>`}function et(t){const o=t.quarters;if(!o.length)return"";const n=640,c=220,b=16,e=28,p=28,h=8,l=Math.max(...o.map(m=>m.total),1),f=Math.ceil(l/4),g=f*4,S=c-b-e,s=(n-p-h)/o.length,u=Math.min(36,s*.62),i=m=>b+S-m/g*S,x=[0,1,2,3,4].map(m=>`<g><line x1="${p}" x2="${n-h}" y1="${i(m*f)}" y2="${i(m*f)}" class="st-grid${m?"":" st-base"}"/><text x="${p-6}" y="${i(m*f)+4}" class="st-axis" text-anchor="end">${m*f}</text></g>`).join(""),L=o.map((m,k)=>{const I=p+k*s+(s-u)/2;let C=0;const A=t.groups.filter(v=>m.byGroup[v.id]).map(v=>{const q=m.byGroup[v.id],a=i(C+q),r=i(C)-a;return C+=q,`<rect x="${I}" y="${a}" width="${u}" height="${Math.max(0,r-2)}" rx="2" fill="${D(v.id)}"/>`}).join(""),[E,N]=m.key.split("-"),F=t.groups.filter(v=>m.byGroup[v.id]).map(v=>`${v.label}: ${m.byGroup[v.id]}`).join(" · "),T=N==="T1"||k===0?`<text x="${I+u/2}" y="${c-4}" class="st-axis st-axis-year" text-anchor="middle">${E}</text>`:"";return`<g class="st-col" data-tip="${y(`${N} ${E} — ${m.total} publicados${F?`
${F}`:""}`)}">
            <rect class="st-hit" x="${p+k*s}" y="${b}" width="${s}" height="${S}"/>
            ${A}
            <text x="${I+u/2}" y="${c-16}" class="st-axis" text-anchor="middle">${N}</text>${T}
            ${m.total?`<text x="${I+u/2}" y="${i(m.total)-5}" class="st-col-total" text-anchor="middle">${m.total}</text>`:""}
        </g>`}).join("");return`<section class="st-card st-span-2" aria-labelledby="st-time">
        <div class="st-card-head"><h2 id="st-time">Publicaciones por trimestre</h2><p>Fecha de publicación oficial de cada instrumento, apilada por colección.</p></div>
        <div class="st-chart-scroll"><svg class="st-chart" viewBox="0 0 ${n} ${c}" role="img" aria-label="Instrumentos publicados por trimestre">${x}${L}</svg></div>
    </section>`}function O(t,o,n,c){const b=Math.max(...c.map(e=>e.value),1);return`<section class="st-card" aria-labelledby="${t}">
        <div class="st-card-head"><h2 id="${t}">${o}</h2><p>${n}</p></div>
        <ol class="st-bars">
            ${c.map(e=>{const p=e.lawId?"button":"div";return`<li><${p} ${e.lawId?`type="button" data-law-id="${y(e.lawId)}"`:""} class="st-bar-row" title="${y(e.title)}">
                    <span class="st-bar-name">${y(e.label)}</span>
                    <span class="st-bar-track"><span class="st-bar-fill" style="--w:${e.value/b*100}%;background:${e.color}"></span></span>
                    <span class="st-bar-val">${$(e.value)}</span>
                </${p}></li>`}).join("")}
        </ol>
    </section>`}function at(t){return`<section class="st-card st-span-2 st-table-card" aria-labelledby="st-table">
        <div class="st-card-head st-table-head">
            <div><h2 id="st-table">Todos los instrumentos</h2><p class="st-table-status" role="status" aria-live="polite"></p></div>
            <div class="st-table-tools">
                <label class="st-field"><span>Buscar</span><input type="search" class="st-search" placeholder="Título o siglas" autocomplete="off" maxlength="200"></label>
                <label class="st-field"><span>Colección</span><select class="st-filter"><option value="all">Todas</option>${t.groups.map(o=>`<option value="${o.id}">${y(o.label)}</option>`).join("")}</select></label>
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
    </section>`}async function ot(t){let o;try{const{fetchUsageSummary:g}=await W(async()=>{const{fetchUsageSummary:S}=await import("./index-CoCES4MR.js").then(s=>s.B);return{fetchUsageSummary:S}},__vite__mapDeps([0,1]));o=await g()}catch{return}if(!o||!(t!=null&&t.isConnected))return;const n=o.totales||{},c=o.hoy||{},b=g=>$(Number(n[g]||0)),e=g=>Number(c[g]||0)?`+${$(Number(c[g]))} hoy`:"Sin registros hoy",p=Array.isArray(o.serie)?o.serie:[],h=Math.max(1,...p.map(g=>Number(g.visitas)||0)),l=p.map(g=>`<span class="st-usage-bar" style="height:${Math.max(6,Number(g.visitas)/h*100)}%"
        data-tip="${y(`${_(String(g.dia).slice(0,10))}: ${$(Number(g.visitas))} visitas`)}"></span>`).join(""),f=o.desde?`Contando desde el ${y(_(String(o.desde).slice(0,10),"long"))}`:"Contando desde hoy";t.innerHTML=`<div class="st-usage-head"><div><p class="st-eyebrow">Uso del buscador</p><h2 id="st-usage-title">Cuánto se consulta</h2></div>
            <p class="st-usage-since">${f}</p></div>
        <div class="st-kpis st-usage-kpis">
            ${M("Visitas acumuladas",b("visita"),e("visita"),"var(--st-c-leyes)")}
            ${M("Visitantes únicos",b("visitante"),"Navegadores distintos","var(--st-c-reglamentos)")}
            ${M("Búsquedas",b("busqueda"),e("busqueda"),"var(--st-c-acuerdos)")}
            ${M("Artículos consultados",b("lectura"),e("lectura"),"var(--st-c-dacg)")}
            ${M("Usuarios registrados",$(Number(o.usuarios||0)),"Cuentas confirmadas","var(--st-c-convocatorias)")}
        </div>
        ${p.length?`<div class="st-usage-chart"><p class="st-stack-label">Visitas por día · últimos 30 días</p>
            <div class="st-usage-bars" role="img" aria-label="Visitas por día en los últimos 30 días">${l}</div></div>`:""}`,t.hidden=!1}function lt(t,o,{onOpenLaw:n=()=>{},onOpenGroup:c=()=>{},today:b}={}){var q;if(!t)throw new Error("Falta el contenedor de estadísticas.");(q=P.get(t))==null||q.destroy();const e=J(o,{today:b}),p=new Map(e.groups.map(a=>[a.id,a.label])),h=e.groups[0]?[...e.groups].sort((a,r)=>r.count-a.count)[0]:null,l=document.createElement("section");l.className="st-dashboard",l.setAttribute("aria-labelledby","st-title"),l.innerHTML=`
        <div class="st-header">
            <div>
                <p class="st-eyebrow">Panorama del acervo</p>
                <h1 id="st-title">Estadísticas</h1>
                <p class="st-intro">Qué contiene el acervo regulatorio, cómo se distribuye y cuándo se publicó.</p>
            </div>
            <p class="st-updated">Publicación más reciente<br><strong>${_(e.latestDay,"long")}</strong></p>
        </div>
        <div class="st-kpis">
            ${M("Instrumentos",$(e.total),`${e.groups.length} colecciones`,"var(--st-c-leyes)")}
            ${M("Fragmentos de texto",$(e.totalFragments),`${$(e.averageFragments)} en promedio por instrumento`,"var(--st-c-reglamentos)")}
            ${M("Publicados en 12 meses",$(e.recent),`${B(e.recent,e.total)} del acervo`,"var(--st-c-acuerdos)")}
            ${M("Colección mayor",h?y(h.label):"—",h?`${$(h.count)} instrumentos`:"","var(--st-c-dacg)")}
        </div>
        <section class="st-usage" aria-labelledby="st-usage-title" hidden></section>
        <div class="st-grid-layout">
            ${st(e)}
            ${et(e)}
            ${O("st-top","Instrumentos más extensos","Por número de fragmentos. Selecciona uno para abrirlo.",e.top.map(a=>({label:tt(a.law),title:a.law.titulo,value:a.fragments,color:D(a.group),lawId:String(a.law.id)})))}
            ${O("st-topics","Temas más frecuentes","Número de instrumentos que incluyen cada tema clave.",e.topics.map(a=>({label:a.label,title:a.label,value:a.count,color:"var(--st-c-topic)"})))}
            ${at(e)}
        </div>
        <div class="st-tip" role="tooltip" hidden></div>`,t.replaceChildren(l),ot(l.querySelector(".st-usage"));const f=new Map(e.rows.map(a=>[String(a.law.id),a.law])),g=l.querySelector("tbody"),S=l.querySelector(".st-table-status"),s=l.querySelector(".st-search"),u=l.querySelector(".st-filter"),i={query:"",group:"all",sort:"fragments",dir:-1},x=a=>String(a??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),L={name:(a,r)=>G.compare(a.law.titulo,r.law.titulo),group:(a,r)=>G.compare(p.get(a.group),p.get(r.group)),day:(a,r)=>(a.day||"").localeCompare(r.day||""),fragments:(a,r)=>a.fragments-r.fragments};function m(){const a=x(i.query).split(/\s+/).filter(Boolean),r=e.rows.filter(d=>i.group==="all"||d.group===i.group).filter(d=>a.every(w=>x(`${d.law.titulo} ${d.law.siglas||""}`).includes(w))).sort((d,w)=>L[i.sort](d,w)*i.dir||G.compare(d.law.titulo,w.law.titulo));g.innerHTML=r.map(d=>`<tr data-law-id="${y(d.law.id)}" tabindex="0">
            <td><span class="st-td-sigla">${y(d.law.siglas||"")}</span><span class="st-td-title">${y(d.law.titulo)}</span></td>
            <td><span class="st-chip"><span class="st-icon" style="color:${D(d.group)}">${R(d.group,15)}</span>${y(p.get(d.group))}</span></td>
            <td class="st-nowrap">${_(d.day)}</td>
            <td class="st-num">${$(d.fragments)}</td>
        </tr>`).join("")||'<tr><td colspan="4" class="st-empty">Sin instrumentos que coincidan.</td></tr>',S.textContent=`${$(r.length)} de ${$(e.total)} instrumentos`,l.querySelectorAll("th button").forEach(d=>{const w=d.dataset.sort===i.sort;d.closest("th").setAttribute("aria-sort",w?i.dir>0?"ascending":"descending":"none")})}const k=l.querySelector(".st-tip"),I=a=>{const r=a.target.closest("[data-tip]");if(!r){k.hidden=!0;return}k.textContent=r.dataset.tip,k.hidden=!1;const d=l.getBoundingClientRect(),w=Math.min(a.clientX-d.left+14,d.width-k.offsetWidth-4);k.style.transform=`translate(${Math.max(4,w)}px, ${a.clientY-d.top+14}px)`},C=()=>{k.hidden=!0},A=a=>{const r=f.get(a.dataset.lawId);r&&n(r)},E=a=>{const r=a.target.closest("th button");if(r)return i.dir=i.sort===r.dataset.sort?-i.dir:r.dataset.sort==="name"||r.dataset.sort==="group"?1:-1,i.sort=r.dataset.sort,m();const d=a.target.closest("[data-group]");if(d)return c(d.dataset.group);const w=a.target.closest("[data-law-id]");w&&A(w)},N=a=>{const r=a.target.closest("tr[data-law-id]");r&&(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),A(r))},F=()=>{i.query=s.value,i.group=u.value,m()};l.addEventListener("pointermove",I),l.addEventListener("pointerleave",C),l.addEventListener("click",E),l.addEventListener("keydown",N),s.addEventListener("input",F),u.addEventListener("change",F),m();const T=l.querySelector(".st-chart-scroll");T&&(T.scrollLeft=T.scrollWidth),requestAnimationFrame==null||requestAnimationFrame(()=>l.classList.add("is-ready"));const v={destroy(){l.removeEventListener("pointermove",I),l.removeEventListener("pointerleave",C),l.removeEventListener("click",E),l.removeEventListener("keydown",N),P.delete(t)}};return P.set(t,v),v}export{lt as renderStatsView};
