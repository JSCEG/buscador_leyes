import{R as j,j as F,p as D,k as O,l as _,m as V,n as K,r as X,q as Y,t as J}from"./index-o8tqSt2n.js";const t=r=>String(r??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]),N=r=>String(r??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),B=20,Q={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"},Z=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],U=r=>{const c=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(r||"").trim());return c?`${Number(c[1])} ${Z[Number(c[2])-1]} ${c[3]}`:""},v=r=>Number(r||0).toLocaleString("es-MX"),k=(r,c,S)=>`${v(r)} ${Number(r)===1?c:S}`,z={LSE:"ley del sector electrico",LSH:"ley del sector hidrocarburos",LCNE:"ley de la comision nacional de energia"};function ee(r,c=[],{onOpenLaw:S=()=>{},permit:M=null,onRoute:E=()=>{}}={}){const p={numero:"",titular:"",proyecto:"",start:0};let d=[],A=0,h=0,f=!0;const m=document.createElement("section");m.className="pm-view",m.setAttribute("aria-labelledby","pm-title"),m.innerHTML=`
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">Permisos CNE</h1>
            <p class="pm-intro">Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula.</p>
        </div>
        <form class="pm-form" role="search" novalidate>
            <label><span>Número de permiso</span><input name="numero" placeholder="Ej. E/1439/GEN/2015" autocomplete="off"></label>
            <label><span>Titular</span><input name="titular" placeholder="Razón social" autocomplete="off"></label>
            <label><span>Proyecto</span><input name="proyecto" placeholder="Nombre o alias" autocomplete="off"></label>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${j}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,r.replaceChildren(m);const g=m.querySelector(".pm-form"),$=m.querySelector(".pm-status"),i=m.querySelector(".pm-body"),L=e=>`<div class="pm-list">${'<div class="pm-card pm-skel"><i></i><i></i><i></i></div>'.repeat(e)}</div>`,P=e=>`
        <div class="pm-error">
            <p><strong>No pudimos consultar ${e}.</strong> El registro de la CNE no respondió; intenta de nuevo en un momento.</p>
            <a class="pm-btn" href="${j}" target="_blank" rel="noopener">Abrir el registro de la CNE</a>
        </div>`;function H(e){return e?`<span class="pm-estado is-${Q[e]||"off"}">${t(e)}</span>`:""}function G(e){const{sector:s,activity:a}=D(e.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${t(e.PermisoId)}" data-sector="${(s==null?void 0:s.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${t(e.Numero)}</span>${H(e.Estado)}</span>
                <span class="pm-holder">${t(e.Persona||"Titular sin dato")}</span>
                ${e.AliasProyecto?`<span class="pm-alias">${t(e.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${s?`<span class="pm-tag">${t(s.label)}${a?` · ${t(a)}`:""}</span>`:""}
                    <span>${k(e.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${e.AnexosAsociados?`<span>${k(e.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${_(V(e.Numero),{compact:!0})}<a class="pm-card-pdf" href="${O(e.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${t(e.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function C(){if(!d.length){$.textContent="",i.innerHTML='<p class="pm-empty">Ningún permiso coincide con la búsqueda. Revisa el número o prueba con una parte del nombre del titular.</p>';return}const e=p.start+1,s=p.start+d.length;$.textContent=`${v(e)}–${v(s)} de ${k(A,"permiso","permisos")}`,i.innerHTML=`
            <ul class="pm-list">${d.map(G).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${p.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${s<A?"":"disabled"}>Siguientes →</button>
            </nav>`}async function y(){const e=++h;i.innerHTML=L(6),$.textContent="Consultando el registro de la CNE…";try{const s=await F({...p,length:B});if(!f||e!==h)return;d=s.rows,A=s.total,C()}catch{if(!f||e!==h)return;$.textContent="",i.innerHTML=P("los permisos")}}function W(e){if(!e)return[];const s=typeof c=="function"?c()||[]:c;return e.laws.map(a=>s.find(l=>N(l.siglas)===N(a))||z[a]&&s.find(l=>N(l.titulo).startsWith(z[a]))).filter((a,l,u)=>a&&u.indexOf(a)===l)}async function R(e,{updateRoute:s=!0}={}){s&&E(e.Numero);const{sector:a,activity:l}=D(e.Numero),u=W(a);$.textContent="",i.innerHTML=`
            <article class="pm-detail" data-sector="${(a==null?void 0:a.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${a?`${t(a.label)}${l?` · ${t(l)}`:""}`:"Permiso"}</span>${H(e.Estado)}</div>
                    <h2 id="pm-detail-title">${t(e.Numero)}</h2>
                    <p class="pm-holder">${t(e.Persona||"Titular sin dato")}</p>
                    ${e.AliasProyecto?`<p class="pm-alias">${t(e.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${O(e.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${_(V(e.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${t(e.NumeroExpediente||"—")}</dd></div>
                    <div><dt>Último acuse</dt><dd>${t(U(e.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${v(e.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${v(e.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${v(e.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${v(e.AnexosAsociados)}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Línea de resoluciones</h3>
                    <div class="pm-res">${L(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-anx-title">
                    <h3 id="pm-anx-title">Anexos</h3>
                    <div class="pm-anx">${e.AnexosAsociados?L(1):'<p class="pm-note">Este permiso no tiene anexos publicados.</p>'}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${u.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${u.map(n=>`<button type="button" class="pm-law" data-law="${t(n.id)}"><b>${t(n.siglas||"")}</b><span>${t(n.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                </section>
            </article>`,i.scrollIntoView({behavior:"smooth",block:"start"});const T=i.querySelector(".pm-res");if(K(e.ExpedienteId).then(n=>{!f||!T.isConnected||(T.innerHTML=n.length?`<ol class="pm-timeline">${n.map((o,b)=>{const x=X(o.REsolucionId);return`
                <li class="${b===0?"is-first":""}">
                    <time>${t(U(o.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${t(o.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${t(o.NumeroResolucion||"")}</b>${o.Acta?` · Acta ${t(o.Acta)}`:""}${o.Modalidad?` · ${t(o.Modalidad)}`:""}</p>
                        ${x?`<a class="pm-res-pdf" href="${t(x)}" target="_blank" rel="noopener" aria-label="Ver resolución ${t(o.NumeroResolucion||"")} en PDF"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>Ver resolución (PDF)</a>`:""}
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{T.isConnected&&(T.innerHTML=P("las resoluciones"))}),e.AnexosAsociados){const n=i.querySelector(".pm-anx");Y(e.PermisoId).then(o=>{!f||!n.isConnected||(n.innerHTML=o.length?`<ul class="pm-annexes">${o.map(b=>{const x=J(b),I=t(b.Descripcion||"Anexo");return`<li>${x?`<a href="${t(x)}" target="_blank" rel="noopener">${I}</a>`:`<span>${I}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{n.isConnected&&(n.innerHTML=P("los anexos"))})}i.querySelector(".pm-back").addEventListener("click",()=>{E(null),d.length?C():y()}),i.querySelector(".pm-share").addEventListener("click",n=>{var b;const o=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(e.Numero)}`;(b=navigator.clipboard)==null||b.writeText(o).then(()=>{n.target.textContent="Enlace copiado"},()=>{})}),i.querySelectorAll("[data-law]").forEach(n=>n.addEventListener("click",()=>{const o=u.find(b=>String(b.id)===n.dataset.law);o&&S(o)}))}async function q(e){const s=++h;i.innerHTML=L(2),$.textContent="Buscando el permiso…";try{const a=await F({numero:e,length:10});if(!f||s!==h)return;const l=a.rows.find(u=>N(u.Numero)===N(e))||(a.rows.length===1?a.rows[0]:null);if(l){d=[],R(l,{updateRoute:!1});return}g.numero.value=e,p.numero=e,d=a.rows,A=a.total,C()}catch{if(!f||s!==h)return;$.textContent="",i.innerHTML=P("el permiso")}}return g.addEventListener("submit",e=>{e.preventDefault(),Object.assign(p,{numero:g.numero.value.trim(),titular:g.titular.value.trim(),proyecto:g.proyecto.value.trim(),start:0}),E(null),y()}),g.addEventListener("reset",()=>{Object.assign(p,{numero:"",titular:"",proyecto:"",start:0}),E(null),setTimeout(y)}),i.addEventListener("click",e=>{const s=e.target.closest("[data-page]");if(s){p.start=Math.max(0,p.start+Number(s.dataset.page)*B),y().then(()=>m.scrollIntoView({behavior:"smooth",block:"start"}));return}const a=e.target.closest("[data-permit]"),l=a&&d.find(u=>String(u.PermisoId)===a.dataset.permit);l&&R(l)}),M?q(M):y(),{openPermit:e=>q(e),showList:()=>{d.length?C():y()},destroy:()=>{f=!1,m.remove()}}}export{ee as renderPermitsView};
