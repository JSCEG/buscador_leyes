import{R as le,j as G,p as J,k as K,l as W,m as X,n as pe,r as z,q as C,t as de,v as ue,w as _,x as ie,y as me,z as be,B as Q,C as fe,D as O}from"./index-Byvinm0-.js";const t=o=>String(o??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n]),F=o=>String(o??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),S=o=>Number(o||0).toLocaleString("es-MX"),j=(o,n,u)=>`${S(o)} ${Number(o)===1?n:u}`,$e=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],M=o=>{const n=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(o||"").trim());return n?`${Number(n[1])} ${$e[Number(n[2])-1]} ${n[3]}`:""},q=o=>`<div class="pm-list">${'<div class="pm-card pm-skel"><i></i><i></i><i></i></div>'.repeat(o)}</div>`,U=(o,n)=>`
    <div class="pm-error">
        <p><strong>No pudimos consultar ${o}.</strong> El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>
        <a class="pm-btn" href="${n}" target="_blank" rel="noopener">Abrir el sitio de la CNE</a>
    </div>`,Z={LSE:"ley del sector electrico",LSH:"ley del sector hidrocarburos",LCNE:"ley de la comision nacional de energia"};function he(o,n){return o.find(u=>F(u.siglas)===F(n))||Z[n]&&o.find(u=>F(u.titulo).startsWith(Z[n]))||null}function ve(o,n){const u=b=>F(b).replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(l=>l&&!/^(de|del|la|las|los|el|y)$/.test(l)).join(" "),g=u(n);return g&&o.find(b=>u(b.titulo)===g)||null}const re='<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',ee=20,V=o=>U(o,le),ye={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function ge(o,n=[],{onOpenLaw:u=()=>{},permit:g=null,onRoute:b=()=>{}}={}){const l={numero:"",titular:"",proyecto:"",start:0};let N=[],i=0,m=0,c=!0;const r=document.createElement("div");r.className="pm-panel",r.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${le}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,o.replaceChildren(r);const s=r.querySelector(".pm-form"),$=r.querySelector(".pm-status"),h=r.querySelector(".pm-body");function E(a){return a?`<span class="pm-estado is-${ye[a]||"off"}">${t(a)}</span>`:""}function R(a){const{sector:v,activity:e}=J(a.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${t(a.PermisoId)}" data-sector="${(v==null?void 0:v.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${t(a.Numero)}</span>${E(a.Estado)}</span>
                <span class="pm-holder">${t(a.Persona||"Titular sin dato")}</span>
                ${a.AliasProyecto?`<span class="pm-alias">${t(a.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${v?`<span class="pm-tag">${t(v.label)}${e?` · ${t(e)}`:""}</span>`:""}
                    <span>${j(a.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${a.AnexosAsociados?`<span>${j(a.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${W(X(a.Numero),{compact:!0})}<a class="pm-card-pdf" href="${K(a.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${t(a.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function k(){if(!N.length){$.textContent="",h.innerHTML='<p class="pm-empty">Ningún permiso coincide con la búsqueda. Revisa el número o prueba con una parte del nombre del titular.</p>';return}const a=l.start+1,v=l.start+N.length;$.textContent=`${S(a)}–${S(v)} de ${j(i,"permiso","permisos")}`,h.innerHTML=`
            <ul class="pm-list">${N.map(R).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${l.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${v<i?"":"disabled"}>Siguientes →</button>
            </nav>`}async function L(){const a=++m;h.innerHTML=q(6),$.textContent="Consultando el registro de la CNE…";try{const v=await G({...l,length:ee});if(!c||a!==m)return;N=v.rows,i=v.total,k()}catch{if(!c||a!==m)return;$.textContent="",h.innerHTML=V("los permisos")}}function P(a){if(!a)return[];const v=typeof n=="function"?n()||[]:n;return a.laws.map(e=>he(v,e)).filter((e,f,y)=>e&&y.indexOf(e)===f)}async function I(a,{updateRoute:v=!0}={}){v&&b(a.Numero);const{sector:e,activity:f}=J(a.Numero),y=P(e);$.textContent="",h.innerHTML=`
            <article class="pm-detail" data-sector="${(e==null?void 0:e.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e?`${t(e.label)}${f?` · ${t(f)}`:""}`:"Permiso"}</span>${E(a.Estado)}</div>
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
                    <div><dt>Último acuse</dt><dd>${t(M(a.FechaAcuse)||"—")}</dd></div>
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
                    ${y.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${y.map(p=>`<button type="button" class="pm-law" data-law="${t(p.id)}"><b>${t(p.siglas||"")}</b><span>${t(p.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                </section>
            </article>`,h.scrollIntoView({behavior:"smooth",block:"start"});const T=h.querySelector(".pm-res");if(pe(a.ExpedienteId).then(p=>{!c||!T.isConnected||(T.innerHTML=p.length?`<ol class="pm-timeline">${p.map((d,x)=>{const A=z(d.REsolucionId);return`
                <li class="${x===0?"is-first":""}">
                    <time>${t(M(d.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${t(d.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${t(d.NumeroResolucion||"")}</b>${d.Acta?` · Acta ${t(d.Acta)}`:""}${d.Modalidad?` · ${t(d.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${A?`<a class="pm-res-pdf" href="${t(A)}" target="_blank" rel="noopener" aria-label="Ver resolución ${t(d.NumeroResolucion||"")} en PDF">${re}Ver resolución (PDF)</a>`:""}
                            ${d.NumeroResolucion?`<a class="pm-res-more" href="${C({resolution:d.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{T.isConnected&&(T.innerHTML=V("las resoluciones"))}),a.AnexosAsociados){const p=h.querySelector(".pm-anx");de(a.PermisoId).then(d=>{!c||!p.isConnected||(p.innerHTML=d.length?`<ul class="pm-annexes">${d.map(x=>{const A=ue(x),D=t(x.Descripcion||"Anexo");return`<li>${A?`<a href="${t(A)}" target="_blank" rel="noopener">${D}</a>`:`<span>${D}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{p.isConnected&&(p.innerHTML=V("los anexos"))})}h.querySelector(".pm-back").addEventListener("click",()=>{b(null),N.length?k():L()}),h.querySelector(".pm-share").addEventListener("click",p=>{var x;const d=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(a.Numero)}`;(x=navigator.clipboard)==null||x.writeText(d).then(()=>{p.target.textContent="Enlace copiado"},()=>{})}),h.querySelectorAll("[data-law]").forEach(p=>p.addEventListener("click",()=>{const d=y.find(x=>String(x.id)===p.dataset.law);d&&u(d)}))}async function B(a){const v=++m;h.innerHTML=q(2),$.textContent="Buscando el permiso…";try{const e=await G({numero:a,length:10});if(!c||v!==m)return;const f=e.rows.find(y=>F(y.Numero)===F(a))||(e.rows.length===1?e.rows[0]:null);if(f){N=[],I(f,{updateRoute:!1});return}s.numero.value=a,l.numero=a,N=e.rows,i=e.total,k()}catch{if(!c||v!==m)return;$.textContent="",h.innerHTML=V("el permiso")}}return s.addEventListener("submit",a=>{a.preventDefault(),Object.assign(l,{numero:s.numero.value.trim(),titular:s.titular.value.trim(),proyecto:s.proyecto.value.trim(),start:0}),b(null),L()}),s.addEventListener("reset",()=>{Object.assign(l,{numero:"",titular:"",proyecto:"",start:0}),b(null),setTimeout(L)}),h.addEventListener("click",a=>{const v=a.target.closest("[data-page]");if(v){l.start=Math.max(0,l.start+Number(v.dataset.page)*ee),L().then(()=>r.scrollIntoView({behavior:"smooth",block:"start"}));return}const e=a.target.closest("[data-permit]"),f=e&&N.find(y=>String(y.PermisoId)===e.dataset.permit);f&&I(f)}),g?B(g):L(),{openPermit:a=>B(a),showList:()=>{N.length?k():L()},destroy:()=>{c=!1,r.remove()}}}const te=20,ae=o=>U(o,_),Ne=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],Ee=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],Re=1995;function Se(o,n=[],{resolution:u=null,onRoute:g=()=>{}}={}){const b={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let l=[],N=0,i=0,m=!0;const c=()=>typeof n=="function"?n()||[]:n,r=new Date().getFullYear(),s=Array.from({length:r-Re+1},(e,f)=>r-f),$=document.createElement("div");$.className="pm-panel",$.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${s.map(e=>`<option>${e}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${Ne.map(e=>`<option value="${t(e)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${Ee.map(e=>`<option value="${t(e)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${_}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,o.replaceChildren($);const h=$.querySelector("form"),E=$.querySelector(".pm-status"),R=$.querySelector(".pm-body");function k(e){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${t(e.NumeroResolucion)}" data-sector="${se(e.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${t(e.NumeroResolucion)}</span><span class="pm-date">${t(M(e.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${t(e.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${t(e.Proemio||"")}</span>
                <span class="pm-meta">${e.ModalidadResolucion?`<span class="pm-tag">${t(e.ModalidadResolucion)}</span>`:""}${e.NumeroActa?`<span>${t(e.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${t(z(e.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${t(e.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function L(){if(!l.length){E.textContent="",R.innerHTML='<p class="pm-empty">Ninguna resolución coincide. Prueba con menos filtros o con una parte del texto.</p>';return}const e=b.start+l.length;E.textContent=`${S(b.start+1)}–${S(e)} de ${j(N,"resolución","resoluciones")} · más recientes primero`,R.innerHTML=`
            <ul class="pm-list">${l.map(k).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${b.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${e<N?"":"disabled"}>Siguientes →</button>
            </nav>`}async function P(){const e=++i;R.innerHTML=q(6),E.textContent="Consultando las resoluciones de la CNE…";try{const f=await ie(b,{start:b.start,length:te});if(!m||e!==i)return;l=f.rows,N=f.total,L()}catch{if(!m||e!==i)return;E.textContent="",R.innerHTML=ae("las resoluciones")}}function I(e){const f=Q(e);return f.length?`<ul class="pm-found">${f.map((y,T)=>{const p=ve(c(),y.law);return`<li data-found="${T}" ${p?`data-law-id="${t(p.id)}"`:""}>
                <p class="pm-found-law">${p?`<b>${t(p.siglas||"")}</b> `:""}${t(y.law)}${p?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${y.articles.map(d=>`<span class="pm-art" data-art="${t(d)}">Art. ${t(d)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${t(e)}</p></details>`:e?`<p class="pm-note">${t(e)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function B(e,f){const y=Q(f);await Promise.all(y.map(async(T,p)=>{const d=e.querySelector(`[data-found="${p}"][data-law-id]`);if(!d)return;const x=await fe(d.dataset.lawId,T.articles);!m||!d.isConnected||d.querySelectorAll("[data-art]").forEach(A=>{const D=x[A.dataset.art];if(!D)return;const H=document.createElement("button");H.type="button",H.className="pm-art is-linked",H.dataset.article=D,H.textContent=A.textContent,H.title="Abrir el artículo",A.replaceWith(H)})}))}function a(e,{updateRoute:f=!0}={}){f&&g(e.NumeroResolucion);const y=me(e.Proemio),T=z(e.ResolucionId);E.textContent="",R.innerHTML=`
            <article class="pm-detail" data-sector="${se(e.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${t(e.TipoResolucion||"Resolución")}${e.ModalidadResolucion?` · ${t(e.ModalidadResolucion)}`:""}</span><span class="pm-date">${t(M(e.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${t(e.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${t(e.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${T?`<a class="pm-btn pm-btn-primary" href="${t(T)}" target="_blank" rel="noopener">${re}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${t(M(e.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${t(e.NumeroActa||"—")}</dd></div>
                    ${e.Ponente?`<div><dt>Ponente</dt><dd>${t(e.Ponente)}</dd></div>`:""}
                </dl>
                ${y.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${y.map(p=>`<a class="pm-law" href="${C({permit:p})}"><b>Permiso</b><span>${t(p)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${I(e.Fundamentacion||"")}</div>
                </section>
            </article>`,R.scrollIntoView({behavior:"smooth",block:"start"}),B(R.querySelector(".pm-found-host"),e.Fundamentacion||"").catch(()=>{}),R.querySelector(".pm-back").addEventListener("click",()=>{g(null),l.length?L():P()}),R.querySelector(".pm-share").addEventListener("click",p=>{var x;const d=`${location.origin}${location.pathname}${C({resolution:e.NumeroResolucion})}`;(x=navigator.clipboard)==null||x.writeText(d).then(()=>{p.target.textContent="Enlace copiado"},()=>{})})}async function v(e){const f=++i;R.innerHTML=q(2),E.textContent="Buscando la resolución…";try{const y=await be(e);if(!m||f!==i)return;if(y){l=[],a(y,{updateRoute:!1});return}h.numero.value=e,b.numero=e,P()}catch{if(!m||f!==i)return;E.textContent="",R.innerHTML=ae("la resolución")}}return h.addEventListener("submit",e=>{e.preventDefault(),Object.assign(b,{numero:h.numero.value.trim(),texto:h.texto.value.trim(),fecha:h.fecha.value,tipo:h.tipo.value.trim(),modalidad:h.modalidad.value.trim(),start:0}),g(null),P()}),h.addEventListener("reset",()=>{Object.assign(b,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),g(null),setTimeout(P)}),R.addEventListener("click",e=>{const f=e.target.closest("[data-article]");if(f){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:f.dataset.article,list:[f.dataset.article]}}));return}const y=e.target.closest("[data-page]");if(y){b.start=Math.max(0,b.start+Number(y.dataset.page)*te),P().then(()=>$.scrollIntoView({behavior:"smooth",block:"start"}));return}const T=e.target.closest("[data-resolution]"),p=T&&l.find(d=>d.NumeroResolucion===T.dataset.resolution);p&&a(p)}),u?v(u):P(),{openResolution:e=>v(e),showList:()=>{l.length?L():P()},destroy:()=>{m=!1,$.remove()}}}function se(o=""){const n=o.toLowerCase();return/el[eé]ctric/.test(n)?"electricidad":/licuado/.test(n)?"gaslp":/gas natural/.test(n)?"gasnatural":/petrol|hidrocarb/.test(n)?"petroliferos":"otro"}const ce="cne-panorama-v1",Te=12*60*60*1e3,ne=12,w=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],oe=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function xe(o,n=3){const u=[];for(let g=0;g<o.length;g+=n)u.push(...await Promise.all(o.slice(g,g+n).map(b=>b())));return u}function Le(){try{const o=JSON.parse(localStorage.getItem(ce)||"null");return o&&Date.now()-o.at<Te?o.data:null}catch{return null}}function Ce(o){try{localStorage.setItem(ce,JSON.stringify({at:Date.now(),data:o}))}catch{}}async function Pe(){const n=new Date().getFullYear(),u=Array.from({length:ne},(c,r)=>n-ne+1+r),[g,b,...l]=await xe([()=>G({length:1}).then(c=>c.total),()=>O({}),...u.map(c=>()=>O({fecha:String(c)})),...w.map(c=>()=>O({fecha:String(n),tipo:c})),...oe.map(c=>()=>O({fecha:String(n),modalidad:c.filter}))]),N=u.map((c,r)=>({year:c,count:l[r]})),i=w.map((c,r)=>({label:c,count:l[u.length+r]})),m=oe.map((c,r)=>({label:c.label,count:l[u.length+w.length+r]}));return{year:n,permits:g,resolutions:b,thisYear:N.at(-1).count,perYear:N,byType:i,byMode:m,at:Date.now()}}function Ae(o){let n=!0;const u=document.createElement("div");u.className="pm-panel pn-view",u.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${_}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,o.replaceChildren(u);const g=u.querySelector(".pm-status"),b=u.querySelector(".pn-body"),l=(i,m)=>{const c=Math.max(1,...i.map(r=>r.count));return`<ul class="pn-bars">${i.filter(r=>r.count>0).sort((r,s)=>s.count-r.count).map(r=>`
            <li><span class="pn-bar-label">${t(r.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(r.count/c*100))}%"></span></span>
                <span class="pn-bar-value">${S(r.count)}<span class="sr-only"> ${m}</span></span></li>`).join("")}</ul>`};function N(i,m,c){const r=Math.max(1,...i.perYear.map(s=>s.count));g.textContent=`Actualizado ${new Date(i.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,b.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${C({tab:"permisos"})}"><b>${S(i.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${C({tab:"resoluciones"})}"><b>${S(i.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${S(i.thisYear)}</b><span>resoluciones en ${i.year}</span></div>
                ${c?`<a class="pn-kpi" href="${C({tab:"resoluciones"})}"><b>${t(M(c.date))}</b><span>última sesión (${t(c.acta)})${c.count?`: ${j(c.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${i.perYear.map(s=>`
                    <li title="${s.year}: ${S(s.count)} resoluciones">
                        <span class="pn-col-value">${S(s.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(s.count/r*100))}%"></span>
                        <span class="pn-col-label">${s.year===i.year?`${s.year}*`:s.year}</span>
                    </li>`).join("")}</ol>
                <p class="pm-note">* ${i.year} va en curso.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${i.year} por tipo</h3>${l(i.byType,"resoluciones")}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${i.year} por modalidad</h3>${l(i.byMode,"resoluciones")}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${m.length?`<ol class="pn-latest">${m.map(s=>`
                    <li><a href="${C({resolution:s.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${t(s.NumeroResolucion)}</b><time>${t(M(s.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${t(s.TipoResolucion||"")}${s.ModalidadResolucion?` · ${t(s.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${t(s.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const i=ie({},{length:8}).then($=>$.rows).catch(()=>[]);let m=Le();m||(m=await Pe(),Ce(m));const c=await i,r=c[0],s=r!=null&&r.NumeroActa?{date:r.FechaResolucion,acta:r.NumeroActa,count:await O({acta:r.NumeroActa}).catch(()=>0)}:null;n&&N(m,c,s)}catch{if(!n)return;g.textContent="",b.innerHTML=U("las cifras",_)}})(),{destroy:()=>{n=!1,u.remove()}}}const Y=[{id:"permisos",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."}];function ke(o,n,{route:u={tab:"permisos"},onOpenLaw:g=()=>{},setHash:b=()=>{}}={}){let l=null,N=null;const i=document.createElement("section");i.className="pm-view",i.setAttribute("aria-labelledby","pm-title"),i.innerHTML=`
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">CNE: permisos y resoluciones</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de la CNE">
                ${Y.map(s=>`<a role="tab" class="pm-tab" id="pm-tab-${s.id}" href="${C({tab:s.id})}" data-tab="${s.id}" aria-controls="pm-tabpanel">${s.label}</a>`).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,o.replaceChildren(i);const m=i.querySelector(".pm-tabpanel");function c(s,$){l==null||l.destroy(),N=s;const h=Y.find(E=>E.id===s)||Y[0];i.querySelector(".pm-intro").textContent=h.intro,i.querySelectorAll(".pm-tab").forEach(E=>{const R=E.dataset.tab===s;E.setAttribute("aria-selected",String(R)),E.classList.toggle("is-on",R)}),m.setAttribute("aria-labelledby",`pm-tab-${s}`),s==="resoluciones"?l=Se(m,n,{resolution:$.resolution||null,onRoute:E=>b(C({tab:s,resolution:E}))}):s==="panorama"?l=Ae(m):l=ge(m,n,{permit:$.permit||null,onOpenLaw:g,onRoute:E=>b(C({tab:s,permit:E}))})}function r(s={tab:"permisos"}){const $=s.tab||"permisos";if($!==N){c($,s);return}$==="permisos"?s.permit?l.openPermit(s.permit):l.showList():$==="resoluciones"&&(s.resolution?l.openResolution(s.resolution):l.showList())}return r(u),{go:r,destroy:()=>{l==null||l.destroy(),i.remove()}}}export{ke as renderCneView};
