import{A as X,g as H,c as z}from"./index-CWUBH9Yr.js";const V=new Set(["modificacion","texto original","leyes y reformas por completar"]),W=t=>typeof t=="string"?t:"",Z=t=>W(t).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim().replace(/\s+/g," "),K=t=>typeof t=="string"&&/^\d{4}-\d{2}-\d{2}/.test(t)&&Number.isFinite(Date.parse(`${t.slice(0,10)}T00:00:00Z`)),O=t=>Math.max(0,Number(t==null?void 0:t.articulos)||0);function Q(t){return K(t==null?void 0:t.fecha_publicacion)?t.fecha_publicacion.slice(0,10):null}function j(t){return`${t.slice(0,4)}-T${Math.floor((Number(t.slice(5,7))-1)/3)+1}`}function U(t,n){const l=[];let[d,g]=[Number(t.slice(0,4)),Number(t.slice(-1))];const[a,m]=[Number(n.slice(0,4)),Number(n.slice(-1))];for(;d<a||d===a&&g<=m;)l.push(`${d}-T${g}`),++g>4&&(g=1,d++);return l}function Y(t,{today:n=new Date}={}){const l=(Array.isArray(t)?t:[]).filter(e=>e&&typeof e=="object"),d=X.map(e=>({...e,count:0,fragments:0})),g=new Map(d.map(e=>[e.id,e])),a=l.map(e=>{const p=H(e),c=g.get(p);return c.count++,c.fragments+=O(e),{law:e,group:p,day:Q(e),fragments:O(e)}}),m=a.map(e=>e.day).filter(Boolean).sort(),x=new Date(n.getTime()-365*864e5).toISOString().slice(0,10),r=m.length?U(j(m[0]),j(m.at(-1))).map(e=>({key:e,total:0,byGroup:{}})):[],w=new Map(r.map(e=>[e.key,e]));for(const e of a){if(!e.day)continue;const p=w.get(j(e.day));p.total++,p.byGroup[e.group]=(p.byGroup[e.group]||0)+1}const I=new Map;for(const{law:e}of a){const p=new Set;for(const c of Array.isArray(e.temas_clave)?e.temas_clave:[]){const f=Z(c);if(!f||V.has(f)||p.has(f))continue;p.add(f);const M=I.get(f)||{label:W(c).trim(),count:0};M.count++,I.set(f,M)}}const k=a.reduce((e,p)=>e+p.fragments,0);return{total:a.length,totalFragments:k,averageFragments:a.length?Math.round(k/a.length):0,recent:a.filter(e=>e.day&&e.day>=x).length,latestDay:m.at(-1)||null,firstDay:m[0]||null,groups:d.filter(e=>e.count>0),quarters:r,top:[...a].sort((e,p)=>p.fragments-e.fragments).slice(0,10),topics:[...I.values()].sort((e,p)=>p.count-e.count||e.label.localeCompare(p.label,"es")).slice(0,12),rows:a}}const G=new WeakMap,y=t=>new Intl.NumberFormat("es-MX").format(t),B=(t,n)=>n?`${new Intl.NumberFormat("es-MX",{maximumFractionDigits:1}).format(t/n*100)} %`:"0 %",b=t=>String(t??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n]),q=t=>`var(--st-c-${t})`,R=(t,n="medium")=>t?new Intl.DateTimeFormat("es-MX",{dateStyle:n,timeZone:"UTC"}).format(new Date(`${t}T00:00:00Z`)):"—",J=t=>t.siglas||t.titulo,P=new Intl.Collator("es",{sensitivity:"base",numeric:!0});function A(t,n,l,d){return`<div class="st-kpi" style="--st-accent:${d}">
        <p class="st-kpi-label">${t}</p>
        <p class="st-kpi-value">${n}</p>
        <p class="st-kpi-note">${l}</p>
    </div>`}function tt(t){const n=l=>t.groups.map(d=>`<span class="st-seg" style="flex-grow:${d[l]};background:${q(d.id)}"
        data-tip="${b(`${d.label}: ${y(d[l])} (${B(d[l],l==="count"?t.total:t.totalFragments)})`)}"></span>`).join("");return`<section class="st-card st-span-2" aria-labelledby="st-comp">
        <div class="st-card-head"><h2 id="st-comp">Composición del acervo</h2><p>Proporción por colección, en instrumentos y en fragmentos de texto.</p></div>
        <div class="st-stack-block"><p class="st-stack-label">Instrumentos</p><div class="st-stack" role="img" aria-label="Instrumentos por colección">${n("count")}</div></div>
        <div class="st-stack-block"><p class="st-stack-label">Fragmentos</p><div class="st-stack" role="img" aria-label="Fragmentos por colección">${n("fragments")}</div></div>
        <ul class="st-legend">
            ${t.groups.map(l=>`<li><button type="button" class="st-legend-item" data-group="${l.id}" title="Ver ${b(l.label)} en el acervo">
                <span class="st-icon" style="color:${q(l.id)}">${z(l.id,16)}</span>
                <span class="st-legend-name">${b(l.label)}</span>
                <span class="st-legend-num">${y(l.count)}</span>
                <span class="st-legend-pct">${B(l.count,t.total)}</span>
                <span class="st-legend-frag">${y(l.fragments)} frag.</span>
            </button></li>`).join("")}
        </ul>
    </section>`}function et(t){const n=t.quarters;if(!n.length)return"";const l=640,d=220,g=16,a=28,m=28,x=8,r=Math.max(...n.map(u=>u.total),1),w=Math.ceil(r/4),I=w*4,k=d-g-a,e=(l-m-x)/n.length,p=Math.min(36,e*.62),c=u=>g+k-u/I*k,f=[0,1,2,3,4].map(u=>`<g><line x1="${m}" x2="${l-x}" y1="${c(u*w)}" y2="${c(u*w)}" class="st-grid${u?"":" st-base"}"/><text x="${m-6}" y="${c(u*w)+4}" class="st-axis" text-anchor="end">${u*w}</text></g>`).join(""),M=n.map((u,v)=>{const S=m+v*e+(e-p)/2;let L=0;const N=t.groups.filter($=>u.byGroup[$.id]).map($=>{const D=u.byGroup[$.id],s=c(L+D),o=c(L)-s;return L+=D,`<rect x="${S}" y="${s}" width="${p}" height="${Math.max(0,o-2)}" rx="2" fill="${q($.id)}"/>`}).join(""),[C,F]=u.key.split("-"),E=t.groups.filter($=>u.byGroup[$.id]).map($=>`${$.label}: ${u.byGroup[$.id]}`).join(" · "),T=F==="T1"||v===0?`<text x="${S+p/2}" y="${d-4}" class="st-axis st-axis-year" text-anchor="middle">${C}</text>`:"";return`<g class="st-col" data-tip="${b(`${F} ${C} — ${u.total} publicados${E?`
${E}`:""}`)}">
            <rect class="st-hit" x="${m+v*e}" y="${g}" width="${e}" height="${k}"/>
            ${N}
            <text x="${S+p/2}" y="${d-16}" class="st-axis" text-anchor="middle">${F}</text>${T}
            ${u.total?`<text x="${S+p/2}" y="${c(u.total)-5}" class="st-col-total" text-anchor="middle">${u.total}</text>`:""}
        </g>`}).join("");return`<section class="st-card st-span-2" aria-labelledby="st-time">
        <div class="st-card-head"><h2 id="st-time">Publicaciones por trimestre</h2><p>Fecha de publicación oficial de cada instrumento, apilada por colección.</p></div>
        <div class="st-chart-scroll"><svg class="st-chart" viewBox="0 0 ${l} ${d}" role="img" aria-label="Instrumentos publicados por trimestre">${f}${M}</svg></div>
    </section>`}function _(t,n,l,d){const g=Math.max(...d.map(a=>a.value),1);return`<section class="st-card" aria-labelledby="${t}">
        <div class="st-card-head"><h2 id="${t}">${n}</h2><p>${l}</p></div>
        <ol class="st-bars">
            ${d.map(a=>{const m=a.lawId?"button":"div";return`<li><${m} ${a.lawId?`type="button" data-law-id="${b(a.lawId)}"`:""} class="st-bar-row" title="${b(a.title)}">
                    <span class="st-bar-name">${b(a.label)}</span>
                    <span class="st-bar-track"><span class="st-bar-fill" style="--w:${a.value/g*100}%;background:${a.color}"></span></span>
                    <span class="st-bar-val">${y(a.value)}</span>
                </${m}></li>`}).join("")}
        </ol>
    </section>`}function st(t){return`<section class="st-card st-span-2 st-table-card" aria-labelledby="st-table">
        <div class="st-card-head st-table-head">
            <div><h2 id="st-table">Todos los instrumentos</h2><p class="st-table-status" role="status" aria-live="polite"></p></div>
            <div class="st-table-tools">
                <label class="st-field"><span>Buscar</span><input type="search" class="st-search" placeholder="Título o siglas" autocomplete="off" maxlength="200"></label>
                <label class="st-field"><span>Colección</span><select class="st-filter"><option value="all">Todas</option>${t.groups.map(n=>`<option value="${n.id}">${b(n.label)}</option>`).join("")}</select></label>
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
    </section>`}function ot(t,n,{onOpenLaw:l=()=>{},onOpenGroup:d=()=>{},today:g}={}){var D;if(!t)throw new Error("Falta el contenedor de estadísticas.");(D=G.get(t))==null||D.destroy();const a=Y(n,{today:g}),m=new Map(a.groups.map(s=>[s.id,s.label])),x=a.groups[0]?[...a.groups].sort((s,o)=>o.count-s.count)[0]:null,r=document.createElement("section");r.className="st-dashboard",r.setAttribute("aria-labelledby","st-title"),r.innerHTML=`
        <div class="st-header">
            <div>
                <p class="st-eyebrow">Panorama del acervo</p>
                <h1 id="st-title">Estadísticas</h1>
                <p class="st-intro">Qué contiene el acervo regulatorio, cómo se distribuye y cuándo se publicó.</p>
            </div>
            <p class="st-updated">Publicación más reciente<br><strong>${R(a.latestDay,"long")}</strong></p>
        </div>
        <div class="st-kpis">
            ${A("Instrumentos",y(a.total),`${a.groups.length} colecciones`,"var(--st-c-leyes)")}
            ${A("Fragmentos de texto",y(a.totalFragments),`${y(a.averageFragments)} en promedio por instrumento`,"var(--st-c-reglamentos)")}
            ${A("Publicados en 12 meses",y(a.recent),`${B(a.recent,a.total)} del acervo`,"var(--st-c-acuerdos)")}
            ${A("Colección mayor",x?b(x.label):"—",x?`${y(x.count)} instrumentos`:"","var(--st-c-dacg)")}
        </div>
        <div class="st-grid-layout">
            ${tt(a)}
            ${et(a)}
            ${_("st-top","Instrumentos más extensos","Por número de fragmentos. Selecciona uno para abrirlo.",a.top.map(s=>({label:J(s.law),title:s.law.titulo,value:s.fragments,color:q(s.group),lawId:String(s.law.id)})))}
            ${_("st-topics","Temas más frecuentes","Número de instrumentos que incluyen cada tema clave.",a.topics.map(s=>({label:s.label,title:s.label,value:s.count,color:"var(--st-c-topic)"})))}
            ${st(a)}
        </div>
        <div class="st-tip" role="tooltip" hidden></div>`,t.replaceChildren(r);const w=new Map(a.rows.map(s=>[String(s.law.id),s.law])),I=r.querySelector("tbody"),k=r.querySelector(".st-table-status"),e=r.querySelector(".st-search"),p=r.querySelector(".st-filter"),c={query:"",group:"all",sort:"fragments",dir:-1},f=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),M={name:(s,o)=>P.compare(s.law.titulo,o.law.titulo),group:(s,o)=>P.compare(m.get(s.group),m.get(o.group)),day:(s,o)=>(s.day||"").localeCompare(o.day||""),fragments:(s,o)=>s.fragments-o.fragments};function u(){const s=f(c.query).split(/\s+/).filter(Boolean),o=a.rows.filter(i=>c.group==="all"||i.group===c.group).filter(i=>s.every(h=>f(`${i.law.titulo} ${i.law.siglas||""}`).includes(h))).sort((i,h)=>M[c.sort](i,h)*c.dir||P.compare(i.law.titulo,h.law.titulo));I.innerHTML=o.map(i=>`<tr data-law-id="${b(i.law.id)}" tabindex="0">
            <td><span class="st-td-sigla">${b(i.law.siglas||"")}</span><span class="st-td-title">${b(i.law.titulo)}</span></td>
            <td><span class="st-chip"><span class="st-icon" style="color:${q(i.group)}">${z(i.group,15)}</span>${b(m.get(i.group))}</span></td>
            <td class="st-nowrap">${R(i.day)}</td>
            <td class="st-num">${y(i.fragments)}</td>
        </tr>`).join("")||'<tr><td colspan="4" class="st-empty">Sin instrumentos que coincidan.</td></tr>',k.textContent=`${y(o.length)} de ${y(a.total)} instrumentos`,r.querySelectorAll("th button").forEach(i=>{const h=i.dataset.sort===c.sort;i.closest("th").setAttribute("aria-sort",h?c.dir>0?"ascending":"descending":"none")})}const v=r.querySelector(".st-tip"),S=s=>{const o=s.target.closest("[data-tip]");if(!o){v.hidden=!0;return}v.textContent=o.dataset.tip,v.hidden=!1;const i=r.getBoundingClientRect(),h=Math.min(s.clientX-i.left+14,i.width-v.offsetWidth-4);v.style.transform=`translate(${Math.max(4,h)}px, ${s.clientY-i.top+14}px)`},L=()=>{v.hidden=!0},N=s=>{const o=w.get(s.dataset.lawId);o&&l(o)},C=s=>{const o=s.target.closest("th button");if(o)return c.dir=c.sort===o.dataset.sort?-c.dir:o.dataset.sort==="name"||o.dataset.sort==="group"?1:-1,c.sort=o.dataset.sort,u();const i=s.target.closest("[data-group]");if(i)return d(i.dataset.group);const h=s.target.closest("[data-law-id]");h&&N(h)},F=s=>{const o=s.target.closest("tr[data-law-id]");o&&(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),N(o))},E=()=>{c.query=e.value,c.group=p.value,u()};r.addEventListener("pointermove",S),r.addEventListener("pointerleave",L),r.addEventListener("click",C),r.addEventListener("keydown",F),e.addEventListener("input",E),p.addEventListener("change",E),u();const T=r.querySelector(".st-chart-scroll");T&&(T.scrollLeft=T.scrollWidth),requestAnimationFrame==null||requestAnimationFrame(()=>r.classList.add("is-ready"));const $={destroy(){r.removeEventListener("pointermove",S),r.removeEventListener("pointerleave",L),r.removeEventListener("click",C),r.removeEventListener("keydown",F),G.delete(t)}};return G.set(t,$),$}export{ot as renderStatsView};
