import{e as M,m as T,A as S,P as f,n as A,q as v,r as N}from"./index-BafVdweq.js";import{i as k,I as j}from"./issuer-C24glmS_.js";const r=u=>String(u??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]),w=u=>String(u??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),x=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],I=u=>{const c=/^(\d{4})-(\d{2})-(\d{2})/.exec(u||"");return c?`${Number(c[3])} ${x[Number(c[2])-1]} ${c[1]}`:"Sin fecha"},B=u=>{var c;return((c=S.find(m=>m.id===u))==null?void 0:c.label)||"Otros"};function G(u,c=[],{onOpenLaw:m=()=>{}}={}){const p=c.map(e=>{const a=M(e.titulo)||e.titulo||"Instrumento sin título";return{law:e,name:a,full:e.titulo||"",day:String(e.fecha_publicacion||"").slice(0,10),issuer:k(e),group:T(e)}}).map(e=>({...e,haystack:w(`${e.name} ${e.full} ${e.law.siglas||""} ${e.issuer.label} ${e.issuer.short}`)})),d=p.map(e=>e.day.slice(0,4)).filter(Boolean).sort(),L=d.length?d[0]===d.at(-1)?d[0]:`${d[0]}–${d.at(-1)}`:"",h=new Map;for(const e of p)h.set(e.issuer.id,(h.get(e.issuer.id)||0)+1);const q=j.filter(e=>h.has(e.id)),E=S.filter(e=>p.some(a=>a.group===e.id)),t={issuers:new Set,group:"all",query:"",newest:!0},n=document.createElement("section");n.className="tl-view",n.setAttribute("aria-labelledby","tl-title"),n.innerHTML=`
        <div class="tl-head" data-emblem-host>
            ${A("cronologia")}
            <p class="tl-eyebrow">Acervo · cronología</p>
            <h1 id="tl-title">Línea del tiempo <span>${r(L)}</span></h1>
            <p class="tl-intro">Todo lo publicado en el acervo, en orden cronológico. El color indica la dependencia que lo emite.</p>
        </div>
        <div class="tl-controls">
            <label class="tl-search"><span class="sr-only">Buscar en la línea del tiempo</span>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <input type="search" placeholder="Buscar por nombre, siglas o dependencia" autocomplete="off"></label>
            <select class="tl-group" aria-label="Colección"><option value="all">Todas las colecciones</option>${E.map(e=>`<option value="${e.id}">${r(e.label)}</option>`).join("")}${p.some(e=>v(e.law))?`<option value="${f.id}">${f.label} (planes y programas)</option>`:""}</select>
            <button type="button" class="tl-order" aria-pressed="true">Más recientes primero</button>
        </div>
        <div class="tl-issuers" role="group" aria-label="Filtrar por dependencia">
            <button type="button" class="tl-chip is-on" data-issuer="all">Todas <span>${p.length}</span></button>
            ${q.map(e=>`<button type="button" class="tl-chip" data-issuer="${e.id}" style="--dep:${e.color}" aria-pressed="false" title="${r(e.label)}"><i></i>${r(e.short)} <span>${h.get(e.id)}</span></button>`).join("")}
        </div>
        <p class="tl-status" role="status" aria-live="polite"></p>
        <div class="tl-body"></div>`,u.replaceChildren(n);const b=n.querySelector(".tl-body"),C=n.querySelector(".tl-status"),y=new Map;function g(){const e=w(t.query).split(/\s+/).filter(Boolean),a=p.filter(s=>!t.issuers.size||t.issuers.has(s.issuer.id)).filter(s=>t.group==="all"||(t.group===f.id?v(s.law):s.group===t.group)).filter(s=>e.every(l=>s.haystack.includes(l))).sort((s,l)=>(t.newest?-1:1)*s.day.localeCompare(l.day)||s.name.localeCompare(l.name,"es"));if(y.clear(),a.forEach(s=>y.set(String(s.law.id),s.law)),C.textContent=a.length===p.length?`${a.length} instrumentos`:`${a.length} de ${p.length} instrumentos`,!a.length){b.innerHTML=N({title:"Ningún instrumento coincide",body:"Quita algún filtro o busca con otras palabras."});return}const i=new Map;for(const s of a){const l=s.day.slice(0,4)||"Sin fecha";i.has(l)||i.set(l,[]),i.get(l).push(s)}b.innerHTML=[...i].map(([s,l])=>`
            <section class="tl-year" aria-label="${r(s)}">
                <h2 class="tl-year-head">${r(s)} <span>${l.length} ${l.length===1?"instrumento":"instrumentos"}</span></h2>
                <ol class="tl-list">${l.map(o=>`
                    <li class="tl-item" style="--dep:${o.issuer.color}">
                        <time class="tl-date" datetime="${r(o.day)}">${r(I(o.day))}</time>
                        <button type="button" class="tl-main" data-law="${r(o.law.id)}">
                            <span class="tl-name">${r(o.name)}</span>
                            <span class="tl-meta"><span class="tl-dep"><i></i>${r(o.issuer.short)}</span><span>${r(B(o.group))}</span>${o.law.siglas?`<span class="tl-sig">${r(o.law.siglas)}</span>`:""}</span>
                        </button>
                        <p class="tl-desc">${r(o.full!==o.name?o.full:o.issuer.label)}</p>
                    </li>`).join("")}
                </ol>
            </section>`).join("")}n.querySelector(".tl-search input").addEventListener("input",e=>{t.query=e.target.value,g()}),n.querySelector(".tl-group").addEventListener("change",e=>{t.group=e.target.value,g()});const $=n.querySelector(".tl-order");return $.addEventListener("click",()=>{t.newest=!t.newest,$.textContent=t.newest?"Más recientes primero":"Más antiguos primero",$.setAttribute("aria-pressed",String(t.newest)),g()}),n.querySelector(".tl-issuers").addEventListener("click",e=>{const a=e.target.closest("[data-issuer]");if(!a)return;const i=a.dataset.issuer;i==="all"?t.issuers.clear():t.issuers.has(i)?t.issuers.delete(i):t.issuers.add(i),n.querySelectorAll(".tl-chip").forEach(s=>{const l=s.dataset.issuer==="all"?!t.issuers.size:t.issuers.has(s.dataset.issuer);s.classList.toggle("is-on",l),s.setAttribute("aria-pressed",String(l))}),g()}),b.addEventListener("click",e=>{const a=e.target.closest("[data-law]"),i=a&&y.get(a.dataset.law);i&&m(i)}),g(),{destroy:()=>n.remove()}}export{G as renderTimelineView};
