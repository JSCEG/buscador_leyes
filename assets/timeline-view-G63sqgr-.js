import{b as E,f as C,A as v}from"./index-BDUZuLx9.js";import{i as M,I as T}from"./issuer-C24glmS_.js";const r=u=>String(u??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]),$=u=>String(u??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),A=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],k=u=>{const c=/^(\d{4})-(\d{2})-(\d{2})/.exec(u||"");return c?`${Number(c[3])} ${A[Number(c[2])-1]} ${c[1]}`:"Sin fecha"},j=u=>{var c;return((c=v.find(y=>y.id===u))==null?void 0:c.label)||"Otros"};function B(u,c=[],{onOpenLaw:y=()=>{}}={}){const p=c.map(e=>{const a=E(e.titulo)||e.titulo||"Instrumento sin título";return{law:e,name:a,full:e.titulo||"",day:String(e.fecha_publicacion||"").slice(0,10),issuer:M(e),group:C(e)}}).map(e=>({...e,haystack:$(`${e.name} ${e.full} ${e.law.siglas||""} ${e.issuer.label} ${e.issuer.short}`)})),d=p.map(e=>e.day.slice(0,4)).filter(Boolean).sort(),w=d.length?d[0]===d.at(-1)?d[0]:`${d[0]}–${d.at(-1)}`:"",h=new Map;for(const e of p)h.set(e.issuer.id,(h.get(e.issuer.id)||0)+1);const S=T.filter(e=>h.has(e.id)),L=v.filter(e=>p.some(a=>a.group===e.id)),t={issuers:new Set,group:"all",query:"",newest:!0},o=document.createElement("section");o.className="tl-view",o.setAttribute("aria-labelledby","tl-title"),o.innerHTML=`
        <div class="tl-head">
            <p class="tl-eyebrow">Acervo · cronología</p>
            <h1 id="tl-title">Línea del tiempo <span>${r(w)}</span></h1>
            <p class="tl-intro">Todo lo publicado en el acervo, en orden cronológico. El color indica la dependencia que lo emite.</p>
        </div>
        <div class="tl-controls">
            <label class="tl-search"><span class="sr-only">Buscar en la línea del tiempo</span>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <input type="search" placeholder="Buscar por nombre, siglas o dependencia" autocomplete="off"></label>
            <select class="tl-group" aria-label="Colección"><option value="all">Todas las colecciones</option>${L.map(e=>`<option value="${e.id}">${r(e.label)}</option>`).join("")}</select>
            <button type="button" class="tl-order" aria-pressed="true">Más recientes primero</button>
        </div>
        <div class="tl-issuers" role="group" aria-label="Filtrar por dependencia">
            <button type="button" class="tl-chip is-on" data-issuer="all">Todas <span>${p.length}</span></button>
            ${S.map(e=>`<button type="button" class="tl-chip" data-issuer="${e.id}" style="--dep:${e.color}" aria-pressed="false" title="${r(e.label)}"><i></i>${r(e.short)} <span>${h.get(e.id)}</span></button>`).join("")}
        </div>
        <p class="tl-status" role="status" aria-live="polite"></p>
        <div class="tl-body"></div>`,u.replaceChildren(o);const m=o.querySelector(".tl-body"),q=o.querySelector(".tl-status"),b=new Map;function g(){const e=$(t.query).split(/\s+/).filter(Boolean),a=p.filter(s=>!t.issuers.size||t.issuers.has(s.issuer.id)).filter(s=>t.group==="all"||s.group===t.group).filter(s=>e.every(l=>s.haystack.includes(l))).sort((s,l)=>(t.newest?-1:1)*s.day.localeCompare(l.day)||s.name.localeCompare(l.name,"es"));if(b.clear(),a.forEach(s=>b.set(String(s.law.id),s.law)),q.textContent=a.length===p.length?`${a.length} instrumentos`:`${a.length} de ${p.length} instrumentos`,!a.length){m.innerHTML='<p class="tl-empty">Ningún instrumento coincide con estos filtros.</p>';return}const i=new Map;for(const s of a){const l=s.day.slice(0,4)||"Sin fecha";i.has(l)||i.set(l,[]),i.get(l).push(s)}m.innerHTML=[...i].map(([s,l])=>`
            <section class="tl-year" aria-label="${r(s)}">
                <h2 class="tl-year-head">${r(s)} <span>${l.length} ${l.length===1?"instrumento":"instrumentos"}</span></h2>
                <ol class="tl-list">${l.map(n=>`
                    <li class="tl-item" style="--dep:${n.issuer.color}">
                        <time class="tl-date" datetime="${r(n.day)}">${r(k(n.day))}</time>
                        <button type="button" class="tl-main" data-law="${r(n.law.id)}">
                            <span class="tl-name">${r(n.name)}</span>
                            <span class="tl-meta"><span class="tl-dep"><i></i>${r(n.issuer.short)}</span><span>${r(j(n.group))}</span>${n.law.siglas?`<span class="tl-sig">${r(n.law.siglas)}</span>`:""}</span>
                        </button>
                        <p class="tl-desc">${r(n.full!==n.name?n.full:n.issuer.label)}</p>
                    </li>`).join("")}
                </ol>
            </section>`).join("")}o.querySelector(".tl-search input").addEventListener("input",e=>{t.query=e.target.value,g()}),o.querySelector(".tl-group").addEventListener("change",e=>{t.group=e.target.value,g()});const f=o.querySelector(".tl-order");return f.addEventListener("click",()=>{t.newest=!t.newest,f.textContent=t.newest?"Más recientes primero":"Más antiguos primero",f.setAttribute("aria-pressed",String(t.newest)),g()}),o.querySelector(".tl-issuers").addEventListener("click",e=>{const a=e.target.closest("[data-issuer]");if(!a)return;const i=a.dataset.issuer;i==="all"?t.issuers.clear():t.issuers.has(i)?t.issuers.delete(i):t.issuers.add(i),o.querySelectorAll(".tl-chip").forEach(s=>{const l=s.dataset.issuer==="all"?!t.issuers.size:t.issuers.has(s.dataset.issuer);s.classList.toggle("is-on",l),s.setAttribute("aria-pressed",String(l))}),g()}),m.addEventListener("click",e=>{const a=e.target.closest("[data-law]"),i=a&&b.get(a.dataset.law);i&&y(i)}),g(),{destroy:()=>o.remove()}}export{B as renderTimelineView};
