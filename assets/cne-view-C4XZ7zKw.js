import{R as ie,j as G,p as J,k as K,l as W,m as X,n as ue,r as z,q as A,t as me,v as be,w as B,x as le,y as fe,z as he,B as Q,C as $e,D as I}from"./index-Cn81AmdH.js";const t=o=>String(o??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n]),F=o=>String(o??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),S=o=>Number(o||0).toLocaleString("es-MX"),D=(o,n,u)=>`${S(o)} ${Number(o)===1?n:u}`,ve=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],k=o=>{const n=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(o||"").trim());return n?`${Number(n[1])} ${ve[Number(n[2])-1]} ${n[3]}`:""},q=o=>`<div class="pm-list">${'<div class="pm-card pm-skel"><i></i><i></i><i></i></div>'.repeat(o)}</div>`,U=(o,n)=>`
    <div class="pm-error">
        <p><strong>No pudimos consultar ${o}.</strong> El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>
        <a class="pm-btn" href="${n}" target="_blank" rel="noopener">Abrir el sitio de la CNE</a>
    </div>`,Z={LSE:"ley del sector electrico",LSH:"ley del sector hidrocarburos",LCNE:"ley de la comision nacional de energia"};function ye(o,n){return o.find(u=>F(u.siglas)===F(n))||Z[n]&&o.find(u=>F(u.titulo).startsWith(Z[n]))||null}function ge(o,n){const u=f=>F(f).replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(i=>i&&!/^(de|del|la|las|los|el|y)$/.test(i)).join(" "),N=u(n);return N&&o.find(f=>u(f.titulo)===N)||null}const re='<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',ee=20,_=o=>U(o,ie),Ne={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function Ee(o,n=[],{onOpenLaw:u=()=>{},permit:N=null,onRoute:f=()=>{}}={}){const i={numero:"",titular:"",proyecto:"",start:0};let E=[],l=0,m=0,c=!0;const r=document.createElement("div");r.className="pm-panel",r.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${ie}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,o.replaceChildren(r);const s=r.querySelector(".pm-form"),$=r.querySelector(".pm-status"),v=r.querySelector(".pm-body");function L(a){return a?`<span class="pm-estado is-${Ne[a]||"off"}">${t(a)}</span>`:""}function b(a){const{sector:y,activity:e}=J(a.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${t(a.PermisoId)}" data-sector="${(y==null?void 0:y.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${t(a.Numero)}</span>${L(a.Estado)}</span>
                <span class="pm-holder">${t(a.Persona||"Titular sin dato")}</span>
                ${a.AliasProyecto?`<span class="pm-alias">${t(a.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${y?`<span class="pm-tag">${t(y.label)}${e?` · ${t(e)}`:""}</span>`:""}
                    <span>${D(a.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${a.AnexosAsociados?`<span>${D(a.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${W(X(a.Numero),{compact:!0})}<a class="pm-card-pdf" href="${K(a.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${t(a.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function x(){if(!E.length){$.textContent="",v.innerHTML='<p class="pm-empty">Ningún permiso coincide con la búsqueda. Revisa el número o prueba con una parte del nombre del titular.</p>';return}const a=i.start+1,y=i.start+E.length;$.textContent=`${S(a)}–${S(y)} de ${D(l,"permiso","permisos")}`,v.innerHTML=`
            <ul class="pm-list">${E.map(b).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${i.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${y<l?"":"disabled"}>Siguientes →</button>
            </nav>`}async function C(){const a=++m;v.innerHTML=q(6),$.textContent="Consultando el registro de la CNE…";try{const y=await G({...i,length:ee});if(!c||a!==m)return;E=y.rows,l=y.total,x()}catch{if(!c||a!==m)return;$.textContent="",v.innerHTML=_("los permisos")}}function P(a){if(!a)return[];const y=typeof n=="function"?n()||[]:n;return a.laws.map(e=>ye(y,e)).filter((e,h,g)=>e&&g.indexOf(e)===h)}async function j(a,{updateRoute:y=!0}={}){y&&f(a.Numero);const{sector:e,activity:h}=J(a.Numero),g=P(e);$.textContent="",v.innerHTML=`
            <article class="pm-detail" data-sector="${(e==null?void 0:e.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e?`${t(e.label)}${h?` · ${t(h)}`:""}`:"Permiso"}</span>${L(a.Estado)}</div>
                    <h2 id="pm-detail-title">${t(a.Numero)}</h2>
                    <p class="pm-holder">${t(a.Persona||"Titular sin dato")}</p>
                    ${a.AliasProyecto?`<p class="pm-alias">${t(a.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${K(a.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${W(X(a.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${t(a.NumeroExpediente||"—")}</dd></div>
                    <div><dt>Último acuse</dt><dd>${t(k(a.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${S(a.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${S(a.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${S(a.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${S(a.AnexosAsociados)}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Línea de resoluciones</h3>
                    <div class="pm-res">${q(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-anx-title">
                    <h3 id="pm-anx-title">Anexos</h3>
                    <div class="pm-anx">${a.AnexosAsociados?q(1):'<p class="pm-note">Este permiso no tiene anexos publicados.</p>'}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${g.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${g.map(p=>`<button type="button" class="pm-law" data-law="${t(p.id)}"><b>${t(p.siglas||"")}</b><span>${t(p.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                </section>
            </article>`,v.scrollIntoView({behavior:"smooth",block:"start"});const R=v.querySelector(".pm-res");if(ue(a.ExpedienteId).then(p=>{!c||!R.isConnected||(R.innerHTML=p.length?`<ol class="pm-timeline">${p.map((d,T)=>{const M=z(d.REsolucionId);return`
                <li class="${T===0?"is-first":""}">
                    <time>${t(k(d.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${t(d.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${t(d.NumeroResolucion||"")}</b>${d.Acta?` · Acta ${t(d.Acta)}`:""}${d.Modalidad?` · ${t(d.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${M?`<a class="pm-res-pdf" href="${t(M)}" target="_blank" rel="noopener" aria-label="Ver resolución ${t(d.NumeroResolucion||"")} en PDF">${re}Ver resolución (PDF)</a>`:""}
                            ${d.NumeroResolucion?`<a class="pm-res-more" href="${A({resolution:d.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{R.isConnected&&(R.innerHTML=_("las resoluciones"))}),a.AnexosAsociados){const p=v.querySelector(".pm-anx");me(a.PermisoId).then(d=>{!c||!p.isConnected||(p.innerHTML=d.length?`<ul class="pm-annexes">${d.map(T=>{const M=be(T),O=t(T.Descripcion||"Anexo");return`<li>${M?`<a href="${t(M)}" target="_blank" rel="noopener">${O}</a>`:`<span>${O}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{p.isConnected&&(p.innerHTML=_("los anexos"))})}v.querySelector(".pm-back").addEventListener("click",()=>{f(null),E.length?x():C()}),v.querySelector(".pm-share").addEventListener("click",p=>{var T;const d=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(a.Numero)}`;(T=navigator.clipboard)==null||T.writeText(d).then(()=>{p.target.textContent="Enlace copiado"},()=>{})}),v.querySelectorAll("[data-law]").forEach(p=>p.addEventListener("click",()=>{const d=g.find(T=>String(T.id)===p.dataset.law);d&&u(d)}))}async function w(a){const y=++m;v.innerHTML=q(2),$.textContent="Buscando el permiso…";try{const e=await G({numero:a,length:10});if(!c||y!==m)return;const h=e.rows.find(g=>F(g.Numero)===F(a))||(e.rows.length===1?e.rows[0]:null);if(h){E=[],j(h,{updateRoute:!1});return}s.numero.value=a,i.numero=a,E=e.rows,l=e.total,x()}catch{if(!c||y!==m)return;$.textContent="",v.innerHTML=_("el permiso")}}return s.addEventListener("submit",a=>{a.preventDefault(),Object.assign(i,{numero:s.numero.value.trim(),titular:s.titular.value.trim(),proyecto:s.proyecto.value.trim(),start:0}),f(null),C()}),s.addEventListener("reset",()=>{Object.assign(i,{numero:"",titular:"",proyecto:"",start:0}),f(null),setTimeout(C)}),v.addEventListener("click",a=>{const y=a.target.closest("[data-page]");if(y){i.start=Math.max(0,i.start+Number(y.dataset.page)*ee),C().then(()=>r.scrollIntoView({behavior:"smooth",block:"start"}));return}const e=a.target.closest("[data-permit]"),h=e&&E.find(g=>String(g.PermisoId)===e.dataset.permit);h&&j(h)}),N?w(N):C(),{openPermit:a=>w(a),showList:()=>{E.length?x():C()},destroy:()=>{c=!1,r.remove()}}}const te=20,ae=o=>U(o,B),Se=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],Re=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],Te=1995;function Le(o,n=[],{resolution:u=null,onRoute:N=()=>{}}={}){const f={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let i=[],E=0,l=0,m=!0;const c=()=>typeof n=="function"?n()||[]:n,r=new Date().getFullYear(),s=Array.from({length:r-Te+1},(e,h)=>r-h),$=document.createElement("div");$.className="pm-panel",$.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${s.map(e=>`<option>${e}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${Se.map(e=>`<option value="${t(e)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${Re.map(e=>`<option value="${t(e)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${B}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,o.replaceChildren($);const v=$.querySelector("form"),L=$.querySelector(".pm-status"),b=$.querySelector(".pm-body");function x(e){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${t(e.NumeroResolucion)}" data-sector="${se(e.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${t(e.NumeroResolucion)}</span><span class="pm-date">${t(k(e.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${t(e.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${t(e.Proemio||"")}</span>
                <span class="pm-meta">${e.ModalidadResolucion?`<span class="pm-tag">${t(e.ModalidadResolucion)}</span>`:""}${e.NumeroActa?`<span>${t(e.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${t(z(e.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${t(e.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function C(){if(!i.length){L.textContent="",b.innerHTML='<p class="pm-empty">Ninguna resolución coincide. Prueba con menos filtros o con una parte del texto.</p>';return}const e=f.start+i.length;L.textContent=`${S(f.start+1)}–${S(e)} de ${D(E,"resolución","resoluciones")} · más recientes primero`,b.innerHTML=`
            <ul class="pm-list">${i.map(x).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${f.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${e<E?"":"disabled"}>Siguientes →</button>
            </nav>`}async function P(){const e=++l;b.innerHTML=q(6),L.textContent="Consultando las resoluciones de la CNE…";try{const h=await le(f,{start:f.start,length:te});if(!m||e!==l)return;i=h.rows,E=h.total,C()}catch{if(!m||e!==l)return;L.textContent="",b.innerHTML=ae("las resoluciones")}}function j(e){const h=Q(e);return h.length?`<ul class="pm-found">${h.map((g,R)=>{const p=ge(c(),g.law);return`<li data-found="${R}" ${p?`data-law-id="${t(p.id)}"`:""}>
                <p class="pm-found-law">${p?`<b>${t(p.siglas||"")}</b> `:""}${t(g.law)}${p?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${g.articles.map(d=>`<span class="pm-art" data-art="${t(d)}">Art. ${t(d)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${t(e)}</p></details>`:e?`<p class="pm-note">${t(e)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function w(e,h){const g=Q(h);await Promise.all(g.map(async(R,p)=>{const d=e.querySelector(`[data-found="${p}"][data-law-id]`);if(!d)return;const T=await $e(d.dataset.lawId,R.articles);!m||!d.isConnected||d.querySelectorAll("[data-art]").forEach(M=>{const O=T[M.dataset.art];if(!O)return;const H=document.createElement("button");H.type="button",H.className="pm-art is-linked",H.dataset.article=O,H.textContent=M.textContent,H.title="Abrir el artículo",M.replaceWith(H)})}))}function a(e,{updateRoute:h=!0}={}){h&&N(e.NumeroResolucion);const g=fe(e.Proemio),R=z(e.ResolucionId);L.textContent="",b.innerHTML=`
            <article class="pm-detail" data-sector="${se(e.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${t(e.TipoResolucion||"Resolución")}${e.ModalidadResolucion?` · ${t(e.ModalidadResolucion)}`:""}</span><span class="pm-date">${t(k(e.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${t(e.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${t(e.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${R?`<a class="pm-btn pm-btn-primary" href="${t(R)}" target="_blank" rel="noopener">${re}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${t(k(e.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${t(e.NumeroActa||"—")}</dd></div>
                    ${e.Ponente?`<div><dt>Ponente</dt><dd>${t(e.Ponente)}</dd></div>`:""}
                </dl>
                ${g.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${g.map(p=>`<a class="pm-law" href="${A({permit:p})}"><b>Permiso</b><span>${t(p)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${j(e.Fundamentacion||"")}</div>
                </section>
            </article>`,b.scrollIntoView({behavior:"smooth",block:"start"}),w(b.querySelector(".pm-found-host"),e.Fundamentacion||"").catch(()=>{}),b.querySelector(".pm-back").addEventListener("click",()=>{N(null),i.length?C():P()}),b.querySelector(".pm-share").addEventListener("click",p=>{var T;const d=`${location.origin}${location.pathname}${A({resolution:e.NumeroResolucion})}`;(T=navigator.clipboard)==null||T.writeText(d).then(()=>{p.target.textContent="Enlace copiado"},()=>{})})}async function y(e){const h=++l;b.innerHTML=q(2),L.textContent="Buscando la resolución…";try{const g=await he(e);if(!m||h!==l)return;if(g){i=[],a(g,{updateRoute:!1});return}v.numero.value=e,f.numero=e,P()}catch{if(!m||h!==l)return;L.textContent="",b.innerHTML=ae("la resolución")}}return v.addEventListener("submit",e=>{e.preventDefault(),Object.assign(f,{numero:v.numero.value.trim(),texto:v.texto.value.trim(),fecha:v.fecha.value,tipo:v.tipo.value.trim(),modalidad:v.modalidad.value.trim(),start:0}),N(null),P()}),v.addEventListener("reset",()=>{Object.assign(f,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),N(null),setTimeout(P)}),b.addEventListener("click",e=>{const h=e.target.closest("[data-article]");if(h){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:h.dataset.article,list:[h.dataset.article]}}));return}const g=e.target.closest("[data-page]");if(g){f.start=Math.max(0,f.start+Number(g.dataset.page)*te),P().then(()=>$.scrollIntoView({behavior:"smooth",block:"start"}));return}const R=e.target.closest("[data-resolution]"),p=R&&i.find(d=>d.NumeroResolucion===R.dataset.resolution);p&&a(p)}),u?y(u):P(),{openResolution:e=>y(e),showList:()=>{i.length?C():P()},destroy:()=>{m=!1,$.remove()}}}function se(o=""){const n=o.toLowerCase();return/el[eé]ctric/.test(n)?"electricidad":/licuado/.test(n)?"gaslp":/gas natural/.test(n)?"gasnatural":/petrol|hidrocarb/.test(n)?"petroliferos":"otro"}const ce="cne-panorama-v1",xe=12*60*60*1e3,ne=12,V=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],oe=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function Ce(o,n=3){const u=[];for(let N=0;N<o.length;N+=n)u.push(...await Promise.all(o.slice(N,N+n).map(f=>f())));return u}function Ae(){try{const o=JSON.parse(localStorage.getItem(ce)||"null");return o&&Date.now()-o.at<xe?o.data:null}catch{return null}}function Pe(o){try{localStorage.setItem(ce,JSON.stringify({at:Date.now(),data:o}))}catch{}}async function Me(){const n=new Date().getFullYear(),u=Array.from({length:ne},(c,r)=>n-ne+1+r),[N,f,...i]=await Ce([()=>G({length:1}).then(c=>c.total),()=>I({}),...u.map(c=>()=>I({fecha:String(c)})),...V.map(c=>()=>I({fecha:String(n),tipo:c})),...oe.map(c=>()=>I({fecha:String(n),modalidad:c.filter}))]),E=u.map((c,r)=>({year:c,count:i[r]})),l=V.map((c,r)=>({label:c,count:i[u.length+r]})),m=oe.map((c,r)=>({label:c.label,count:i[u.length+V.length+r]}));return{year:n,permits:N,resolutions:f,thisYear:E.at(-1).count,perYear:E,byType:l,byMode:m,at:Date.now()}}function ke(o){let n=!0;const u=document.createElement("div");u.className="pm-panel pn-view",u.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${B}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,o.replaceChildren(u);const N=u.querySelector(".pm-status"),f=u.querySelector(".pn-body"),i=(l,m)=>{const c=Math.max(1,...l.map(r=>r.count));return`<ul class="pn-bars">${l.filter(r=>r.count>0).sort((r,s)=>s.count-r.count).map(r=>`
            <li><span class="pn-bar-label">${t(r.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(r.count/c*100))}%"></span></span>
                <span class="pn-bar-value">${S(r.count)}<span class="sr-only"> ${m}</span></span></li>`).join("")}</ul>`};function E(l,m,c){const r=Math.max(1,...l.perYear.map(s=>s.count));N.textContent=`Actualizado ${new Date(l.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,f.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${A({tab:"permisos"})}"><b>${S(l.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${A({tab:"resoluciones"})}"><b>${S(l.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${S(l.thisYear)}</b><span>resoluciones en ${l.year}</span></div>
                ${c?`<a class="pn-kpi" href="${A({tab:"resoluciones"})}"><b>${t(k(c.date))}</b><span>última sesión (${t(c.acta)})${c.count?`: ${D(c.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${l.perYear.map(s=>`
                    <li title="${s.year}: ${S(s.count)} resoluciones">
                        <span class="pn-col-value">${S(s.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(s.count/r*100))}%"></span>
                        <span class="pn-col-label">${s.year===l.year?`${s.year}*`:s.year}</span>
                    </li>`).join("")}</ol>
                <p class="pm-note">* ${l.year} va en curso.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${l.year} por tipo</h3>${i(l.byType,"resoluciones")}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${l.year} por modalidad</h3>${i(l.byMode,"resoluciones")}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${m.length?`<ol class="pn-latest">${m.map(s=>`
                    <li><a href="${A({resolution:s.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${t(s.NumeroResolucion)}</b><time>${t(k(s.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${t(s.TipoResolucion||"")}${s.ModalidadResolucion?` · ${t(s.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${t(s.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const l=le({},{length:8}).then($=>$.rows).catch(()=>[]);let m=Ae();m||(m=await Me(),Pe(m));const c=await l,r=c[0],s=r!=null&&r.NumeroActa?{date:r.FechaResolucion,acta:r.NumeroActa,count:await I({acta:r.NumeroActa}).catch(()=>0)}:null;n&&E(m,c,s)}catch{if(!n)return;N.textContent="",f.innerHTML=U("las cifras",B)}})(),{destroy:()=>{n=!1,u.remove()}}}const pe="cne-pestanas-vistas",de=()=>{try{return new Set(JSON.parse(localStorage.getItem(pe)||"[]"))}catch{return new Set}};function He(o){const n=de();if(!n.has(o)){n.add(o);try{localStorage.setItem(pe,JSON.stringify([...n]))}catch{}}}const Y=[{id:"permisos",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."}];function Fe(o,n,{route:u={tab:"permisos"},onOpenLaw:N=()=>{},setHash:f=()=>{}}={}){let i=null,E=null;const l=document.createElement("section");l.className="pm-view",l.setAttribute("aria-labelledby","pm-title"),l.innerHTML=`
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">CNE: permisos y resoluciones</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de la CNE">
                ${Y.map(s=>`<a role="tab" class="pm-tab" id="pm-tab-${s.id}" href="${A({tab:s.id})}" data-tab="${s.id}" aria-controls="pm-tabpanel">${s.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,o.replaceChildren(l);const m=l.querySelector(".pm-tabpanel");function c(s,$){i==null||i.destroy(),E=s,He(s);const v=de();l.querySelectorAll(".pm-tab").forEach(b=>{const x=!v.has(b.dataset.tab)&&b.dataset.tab!=="permisos";b.classList.toggle("is-new",x),x?b.setAttribute("aria-description","Nueva sección"):b.removeAttribute("aria-description")});const L=Y.find(b=>b.id===s)||Y[0];l.querySelector(".pm-intro").textContent=L.intro,l.querySelectorAll(".pm-tab").forEach(b=>{const x=b.dataset.tab===s;b.setAttribute("aria-selected",String(x)),b.classList.toggle("is-on",x)}),m.setAttribute("aria-labelledby",`pm-tab-${s}`),s==="resoluciones"?i=Le(m,n,{resolution:$.resolution||null,onRoute:b=>f(A({tab:s,resolution:b}))}):s==="panorama"?i=ke(m):i=Ee(m,n,{permit:$.permit||null,onOpenLaw:N,onRoute:b=>f(A({tab:s,permit:b}))})}function r(s={tab:"permisos"}){const $=s.tab||"permisos";if($!==E){c($,s);return}$==="permisos"?s.permit?i.openPermit(s.permit):i.showList():$==="resoluciones"&&(s.resolution?i.openResolution(s.resolution):i.showList())}return r(u),{go:r,destroy:()=>{i==null||i.destroy(),l.remove()}}}export{Fe as renderCneView};
