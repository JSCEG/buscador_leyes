const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/cne-sener-view-DiRzYHnd.js","assets/index-JvTJ_3xh.js","assets/index-ClUgN6t9.css","assets/permits-map-ShbW0NoQ.js","assets/permits-map-CflzZUgv.css","assets/map-common-BueYYEz6.js","assets/cne-sener-view-CZwVSzJo.css","assets/permits-map-view-Y_3uuMxX.js","assets/leaflet-src-De2SSmXW.js","assets/_commonjsHelpers-Cpj98o6Y.js","assets/leaflet-Dgihpmma.css","assets/MarkerCluster-4Oo7lyRB.css"])))=>i.map(i=>d[i]);
import{R as fe,t as W,v as te,w as Se,x as ae,y as se,z as oe,B as x,C as Ne,D as K,E as Te,F as Re,q as be,G as Ce,H as Le,J as Pe,K as Me,L as Y,M as X,N as xe,O as Ae,Q as ke,S as ne,T as qe,U as j,V as He,W as _e,X as ie,_ as le}from"./index-JvTJ_3xh.js";import{s as O,e as a,d as I,n as q,g as he,P as $e,f as V,p as D,a as Q,l as ye,b as Fe}from"./cne-shared-DMDPvk_7.js";const re=20,we=1500,B=b=>Q(b,fe),Ie={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function Oe(b,u=[],{onOpenLaw:S=()=>{},permit:R=null,onRoute:C=()=>{}}={}){const n={numero:"",titular:"",proyecto:"",start:0};let y=[],l=0,p=0,d=!0;const h=document.createElement("div");h.className="pm-panel",h.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${fe}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,b.replaceChildren(h);const t=h.querySelector(".pm-form"),c=h.querySelector(".pm-status"),r=h.querySelector(".pm-body");let $=null;const m=async()=>{$??($=await Promise.race([Ce(),new Promise(s=>setTimeout(()=>s(null),we))]))};function v(s){return s?`<span class="pm-estado is-${Ie[s]||"off"}">${a(s)}</span>`:""}function L(s){const M=Le(s.Numero,{technology:Pe($,s.Numero)}),{sector:e,activity:f}=te(s.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${a(s.PermisoId)}" data-sector="${(e==null?void 0:e.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${a(s.Numero)}</span>${v(s.Estado)}</span>
                <span class="pm-tipo">${Me(M)}<span class="pm-tipo-t">${a(M.label)}</span></span>
                <span class="pm-holder">${a(s.Persona||"Titular sin dato")}</span>
                ${s.AliasProyecto?`<span class="pm-alias">${a(s.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${e?`<span class="pm-tag">${a(e.label)}${f?` · ${a(f)}`:""}</span>`:""}
                    <span>${D(s.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${s.AnexosAsociados?`<span>${D(s.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${se(oe(s.Numero),{compact:!0})}<a class="pm-card-pdf" href="${ae(s.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${a(s.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function o(){if(!y.length){c.textContent="",r.innerHTML=be({title:"Ningún permiso coincide",body:"Revisa el número o prueba con una parte del nombre del titular."});return}const s=n.start+1,M=n.start+y.length;c.textContent=`${q(s)}–${q(M)} de ${D(l,"permiso","permisos")}`,r.innerHTML=`
            <ul class="pm-list">${y.map(L).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${M<l?"":"disabled"}>Siguientes →</button>
            </nav>`}async function i(){const s=++p;r.innerHTML=O(6),c.textContent="Consultando el registro de la CNE…";try{const[M]=await Promise.all([W({...n,length:re}),m()]);if(!d||s!==p)return;y=M.rows,l=M.total,o()}catch{if(!d||s!==p)return;c.textContent="",r.innerHTML=B("los permisos")}}function T(s){if(!s)return[];const M=typeof u=="function"?u()||[]:u;return s.laws.map(e=>ye(M,e)).filter((e,f,N)=>e&&N.indexOf(e)===f)}async function P(s,{updateRoute:M=!0}={}){M&&C(s.Numero);const{sector:e,activity:f}=te(s.Numero),N=T(e),_=Se(s.Numero);c.textContent="",r.innerHTML=`
            <article class="pm-detail" data-sector="${(e==null?void 0:e.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e?`${a(e.label)}${f?` · ${a(f)}`:""}`:"Permiso"}</span>${v(s.Estado)}</div>
                    <h2 id="pm-detail-title">${a(s.Numero)}</h2>
                    <p class="pm-holder">${a(s.Persona||"Titular sin dato")}</p>
                    ${s.AliasProyecto?`<p class="pm-alias">${a(s.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${ae(s.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${se(oe(s.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                        <a class="pm-btn" href="${x({mapPermit:s.Numero})}" data-map-link hidden><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Ver en el mapa</a>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${a(s.NumeroExpediente||"—")}</dd></div>
                    <div><dt>Último acuse</dt><dd>${a(I(s.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${q(s.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${q(s.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${q(s.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${q(s.AnexosAsociados)}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Línea de resoluciones</h3>
                    <div class="pm-res">${O(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-anx-title">
                    <h3 id="pm-anx-title">Anexos</h3>
                    <div class="pm-anx">${s.AnexosAsociados?O(1):'<p class="pm-note">Este permiso no tiene anexos publicados.</p>'}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${N.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${N.map(E=>`<button type="button" class="pm-law" data-law="${a(E.id)}"><b>${a(E.siglas||"")}</b><span>${a(E.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${_?he(_):""}
                </section>
            </article>`,r.scrollIntoView({behavior:"smooth",block:"start"});const A=r.querySelector(".pm-res");if(Ne(s.ExpedienteId).then(E=>{!d||!A.isConnected||(A.innerHTML=E.length?`<ol class="pm-timeline">${E.map((g,H)=>{const F=K(g.REsolucionId);return`
                <li class="${H===0?"is-first":""}">
                    <time>${a(I(g.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${a(g.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${a(g.NumeroResolucion||"")}</b>${g.Acta?` · Acta ${a(g.Acta)}`:""}${g.Modalidad?` · ${a(g.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${F?`<a class="pm-res-pdf" href="${a(F)}" target="_blank" rel="noopener" aria-label="Ver resolución ${a(g.NumeroResolucion||"")} en PDF">${$e}Ver resolución (PDF)</a>`:""}
                            ${g.NumeroResolucion?`<a class="pm-res-more" href="${x({resolution:g.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{A.isConnected&&(A.innerHTML=B("las resoluciones"))}),s.AnexosAsociados){const E=r.querySelector(".pm-anx");Te(s.PermisoId).then(g=>{!d||!E.isConnected||(E.innerHTML=g.length?`<ul class="pm-annexes">${g.map(H=>{const F=Re(H),ee=a(H.Descripcion||"Anexo");return`<li>${F?`<a href="${a(F)}" target="_blank" rel="noopener">${ee}</a>`:`<span>${ee}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{E.isConnected&&(E.innerHTML=B("los anexos"))})}const k=r.querySelector("[data-map-link]");fetch(`/api/mapa/buscar?q=${encodeURIComponent(s.Numero)}&limite=5`,{credentials:"same-origin"}).then(E=>E.ok?E.json():null).then(E=>{const g=((E==null?void 0:E.resultados)||[]).find(H=>V(H.numeroPermiso)===V(s.Numero)&&H.latitud!=null);!d||!g||!k.isConnected||(k.href=x({mapPermit:g.numeroPermiso}),k.hidden=!1)}).catch(()=>{}),r.querySelector(".pm-back").addEventListener("click",()=>{C(null),y.length?o():i()}),r.querySelector(".pm-share").addEventListener("click",E=>{var H;const g=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(s.Numero)}`;(H=navigator.clipboard)==null||H.writeText(g).then(()=>{E.target.textContent="Enlace copiado"},()=>{})}),r.querySelectorAll("[data-law]").forEach(E=>E.addEventListener("click",()=>{const g=N.find(H=>String(H.id)===E.dataset.law);g&&S(g)}))}async function w(s){const M=++p;r.innerHTML=O(2),c.textContent="Buscando el permiso…";try{const e=await W({numero:s,length:10});if(!d||M!==p)return;const f=e.rows.find(N=>V(N.Numero)===V(s))||(e.rows.length===1?e.rows[0]:null);if(f){y=[],P(f,{updateRoute:!1});return}t.numero.value=s,n.numero=s,y=e.rows,l=e.total,o()}catch{if(!d||M!==p)return;c.textContent="",r.innerHTML=B("el permiso")}}return t.addEventListener("submit",s=>{s.preventDefault(),Object.assign(n,{numero:t.numero.value.trim(),titular:t.titular.value.trim(),proyecto:t.proyecto.value.trim(),start:0}),C(null),i()}),t.addEventListener("reset",()=>{Object.assign(n,{numero:"",titular:"",proyecto:"",start:0}),C(null),setTimeout(i)}),r.addEventListener("click",s=>{const M=s.target.closest("[data-page]");if(M){n.start=Math.max(0,n.start+Number(M.dataset.page)*re),i().then(()=>h.scrollIntoView({behavior:"smooth",block:"start"}));return}const e=s.target.closest("[data-permit]"),f=e&&y.find(N=>String(N.PermisoId)===e.dataset.permit);f&&P(f)}),R?w(R):i(),{openPermit:s=>w(s),showList:()=>{y.length?o():i()},destroy:()=>{d=!1,h.remove()}}}const ce=20,pe=b=>Q(b,Y),je=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],De=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],Ve=1995;function Be(b={}){return b.desdeExpediente?'<p class="pm-note">La CNE aún no la publica en su buscador: se muestra lo que trae el expediente del permiso. El proemio y el fundamento aparecerán cuando la indexe.</p>':""}function Ge(b=""){return String(b).trim()?"Si es reciente, puede que la CNE aún no la publique en su buscador: ábrela desde el expediente de su permiso, en «Detalle y fundamento».":"Prueba con menos filtros o con una parte del texto."}function Ye(b,u=[],{resolution:S=null,filters:R=null,onRoute:C=()=>{}}={}){const n={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let y=[],l=0,p=0,d=!0;const h=()=>typeof u=="function"?u()||[]:u,t=new Date().getFullYear(),c=Array.from({length:t-Ve+1},(e,f)=>t-f),r=document.createElement("div");r.className="pm-panel",r.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${c.map(e=>`<option>${e}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${je.map(e=>`<option value="${a(e)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${De.map(e=>`<option value="${a(e)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${Y}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,b.replaceChildren(r);const $=r.querySelector("form"),m=r.querySelector(".pm-status"),v=r.querySelector(".pm-body");function L(e){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${a(e.NumeroResolucion)}" data-sector="${de(e.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${a(e.NumeroResolucion)}</span><span class="pm-date">${a(I(e.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${a(e.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${a(e.Proemio||"")}</span>
                <span class="pm-meta">${e.ModalidadResolucion?`<span class="pm-tag">${a(e.ModalidadResolucion)}</span>`:""}${e.NumeroActa?`<span>${a(e.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${a(K(e.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${a(e.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function o(){if(!y.length){m.textContent="",v.innerHTML=be({title:"Ninguna resolución coincide",body:Ge(n.numero)});return}const e=n.start+y.length;m.textContent=`${q(n.start+1)}–${q(e)} de ${D(l,"resolución","resoluciones")} · más recientes primero`,v.innerHTML=`
            <ul class="pm-list">${y.map(L).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${e<l?"":"disabled"}>Siguientes →</button>
            </nav>`}async function i(){const e=++p;v.innerHTML=O(6),m.textContent="Consultando las resoluciones de la CNE…";try{const f=await X(n,{start:n.start,length:ce});if(!d||e!==p)return;y=f.rows,l=f.total,o()}catch{if(!d||e!==p)return;m.textContent="",v.innerHTML=pe("las resoluciones")}}function T(e){const f=ne(e);return f.length?`<ul class="pm-found">${f.map((N,_)=>{const A=Fe(h(),N.law);return`<li data-found="${_}" ${A?`data-law-id="${a(A.id)}"`:""}>
                <p class="pm-found-law">${A?`<b>${a(A.siglas||"")}</b> `:""}${a(N.law)}${A?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${N.articles.map(k=>`<span class="pm-art" data-art="${a(k)}">Art. ${a(k)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${a(e)}</p></details>`:e?`<p class="pm-note">${a(e)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function P(e,f){const N=ne(f);await Promise.all(N.map(async(_,A)=>{const k=e.querySelector(`[data-found="${A}"][data-law-id]`);if(!k)return;const E=await qe(k.dataset.lawId,_.articles);!d||!k.isConnected||k.querySelectorAll("[data-art]").forEach(g=>{const H=E[g.dataset.art];if(!H)return;const F=document.createElement("button");F.type="button",F.className="pm-art is-linked",F.dataset.article=H,F.textContent=g.textContent,F.title="Abrir el artículo",g.replaceWith(F)})}))}function w(e,{updateRoute:f=!0}={}){f&&C(e.NumeroResolucion);const N=xe(e.Proemio),_=Ae(e),A=K(e.ResolucionId);m.textContent="",v.innerHTML=`
            <article class="pm-detail" data-sector="${de(e.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${a(e.TipoResolucion||"Resolución")}${e.ModalidadResolucion?` · ${a(e.ModalidadResolucion)}`:""}</span><span class="pm-date">${a(I(e.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${a(e.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${a(e.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${A?`<a class="pm-btn pm-btn-primary" href="${a(A)}" target="_blank" rel="noopener">${$e}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${a(I(e.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${a(e.NumeroActa||"—")}</dd></div>
                    ${e.Ponente?`<div><dt>Ponente</dt><dd>${a(e.Ponente)}</dd></div>`:""}
                </dl>
                ${Be(e)}
                ${N.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${N.map(k=>`<a class="pm-law" href="${x({permit:k})}"><b>Permiso</b><span>${a(k)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">${e.desdeExpediente?"Se verá cuando la CNE publique la resolución en su buscador; mientras, consúltalo en el PDF.":"Artículos que cita la resolución. Los que están en el acervo se pueden abrir."}</p>
                    <div class="pm-found-host">${e.desdeExpediente?"":T(e.Fundamentacion||"")}</div>
                    ${_?he(_,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,v.scrollIntoView({behavior:"smooth",block:"start"}),P(v.querySelector(".pm-found-host"),e.Fundamentacion||"").catch(()=>{}),v.querySelector(".pm-back").addEventListener("click",()=>{C(null),y.length?o():i()}),v.querySelector(".pm-share").addEventListener("click",k=>{var g;const E=`${location.origin}${location.pathname}${x({resolution:e.NumeroResolucion})}`;(g=navigator.clipboard)==null||g.writeText(E).then(()=>{k.target.textContent="Enlace copiado"},()=>{})})}async function s(e){const f=++p;v.innerHTML=O(2),m.textContent="Buscando la resolución…";try{const N=await ke(e);if(!d||f!==p)return;if(N){y=[],w(N,{updateRoute:!1});return}$.numero.value=e,n.numero=e,i()}catch{if(!d||f!==p)return;m.textContent="",v.innerHTML=pe("la resolución")}}$.addEventListener("submit",e=>{e.preventDefault(),Object.assign(n,{numero:$.numero.value.trim(),texto:$.texto.value.trim(),fecha:$.fecha.value,tipo:$.tipo.value.trim(),modalidad:$.modalidad.value.trim(),start:0}),C(null),i()}),$.addEventListener("reset",()=>{Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),C(null),setTimeout(i)}),v.addEventListener("click",e=>{const f=e.target.closest("[data-article]");if(f){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:f.dataset.article,list:[f.dataset.article]}}));return}const N=e.target.closest("[data-page]");if(N){n.start=Math.max(0,n.start+Number(N.dataset.page)*ce),i().then(()=>r.scrollIntoView({behavior:"smooth",block:"start"}));return}const _=e.target.closest("[data-resolution]"),A=_&&y.find(k=>k.NumeroResolucion===_.dataset.resolution);A&&w(A)});function M(e={}){Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...e,start:0});for(const f of["numero","texto","fecha","tipo","modalidad"])$[f].value=n[f]||"";i()}return S?s(S):R&&Object.keys(R).length?M(R):i(),{openResolution:e=>s(e),applyFilters:M,showList:()=>{y.length?o():i()},destroy:()=>{d=!1,r.remove()}}}function de(b=""){const u=b.toLowerCase();return/el[eé]ctric/.test(u)?"electricidad":/licuado/.test(u)?"gaslp":/gas natural/.test(u)?"gasnatural":/petrol|hidrocarb/.test(u)?"petroliferos":"otro"}const ve="cne-panorama-v1",Ue=12*60*60*1e3,ue=12,J=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],Z=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function Je(b,u=3){const S=[];for(let R=0;R<b.length;R+=u)S.push(...await Promise.all(b.slice(R,R+u).map(C=>C())));return S}function ze(){try{const b=JSON.parse(localStorage.getItem(ve)||"null");return b&&Date.now()-b.at<Ue?b.data:null}catch{return null}}function We(b){try{localStorage.setItem(ve,JSON.stringify({at:Date.now(),data:b}))}catch{}}async function Ke(){const u=new Date().getFullYear(),S=Array.from({length:ue},(d,h)=>u-ue+1+h),[R,C,...n]=await Je([()=>W({length:1}).then(d=>d.total),()=>j({}),...S.map(d=>()=>j({fecha:String(d)})),...J.map(d=>()=>j({fecha:String(u),tipo:d})),...Z.map(d=>()=>j({fecha:String(u),modalidad:d.filter}))]),y=S.map((d,h)=>({year:d,count:n[h]})),l=J.map((d,h)=>({label:d,count:n[S.length+h]})),p=Z.map((d,h)=>({label:d.label,count:n[S.length+J.length+h]}));return{year:u,permits:R,resolutions:C,thisYear:y.at(-1).count,perYear:y,byType:l,byMode:p,at:Date.now()}}function Ze(b){let u=!0;const S=document.createElement("div");S.className="pm-panel pn-view",S.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${Y}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,b.replaceChildren(S);const R=S.querySelector(".pm-status"),C=S.querySelector(".pn-body"),n=(l,p,d)=>{const h=Math.max(1,...l.map(t=>t.count));return`<ul class="pn-bars">${l.filter(t=>t.count>0).sort((t,c)=>c.count-t.count).map((t,c)=>`
            <li><a class="pn-bar-row" href="${x({tab:"resoluciones",filters:d(t)})}" data-tip="${a(`${t.label}: ${q(t.count)} ${p}. Ver cuáles`)}" style="--i:${c}">
                <span class="pn-bar-label">${a(t.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(t.count/h*100))}%"></span></span>
                <span class="pn-bar-value">${q(t.count)}<span class="sr-only"> ${p}</span></span>
            </a></li>`).join("")}</ul>`};function y(l,p,d){const h=Math.max(1,...l.perYear.map(t=>t.count));R.textContent=`Actualizado ${new Date(l.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,C.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${x({tab:"permisos"})}"><b>${q(l.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${x({tab:"resoluciones"})}"><b>${q(l.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${q(l.thisYear)}</b><span>resoluciones en ${l.year}</span></div>
                ${d?`<a class="pn-kpi" href="${x({tab:"resoluciones"})}"><b>${a(I(d.date))}</b><span>última sesión (${a(d.acta)})${d.count?`: ${D(d.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${l.perYear.map((t,c)=>`
                    <li><a href="${x({tab:"resoluciones",filters:{fecha:String(t.year)}})}" data-tip="${a(`${t.year}: ${q(t.count)} resoluciones. Ver cuáles`)}" style="--i:${c}">
                        <span class="pn-col-value">${q(t.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(t.count/h*100))}%"></span>
                        <span class="pn-col-label">${t.year===l.year?`${t.year}*`:t.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${l.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${l.year} por tipo</h3>${n(l.byType,"resoluciones",t=>({fecha:String(l.year),tipo:t.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${l.year} por modalidad</h3>${n(l.byMode,"resoluciones",t=>{var c;return{fecha:String(l.year),modalidad:((c=Z.find(r=>r.label===t.label))==null?void 0:c.filter)||t.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${p.length?`<ol class="pn-latest">${p.map(t=>`
                    <li><a href="${x({resolution:t.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${a(t.NumeroResolucion)}</b><time>${a(I(t.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${a(t.TipoResolucion||"")}${t.ModalidadResolucion?` · ${a(t.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${a(t.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const l=X({},{length:8}).then(c=>c.rows).catch(()=>[]);let p=ze();p||(p=await Ke(),We(p));const d=await l,h=d[0],t=h!=null&&h.NumeroActa?{date:h.FechaResolucion,acta:h.NumeroActa,count:await j({acta:h.NumeroActa}).catch(()=>0)}:null;u&&y(p,d,t)}catch{if(!u)return;R.textContent="",C.innerHTML=Q("las cifras",Y)}})(),{destroy:()=>{u=!1,S.remove()}}}const z={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},Xe=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function Qe(b,u=[],{tramite:S=null,onOpenLaw:R=()=>{},onRoute:C=()=>{}}={}){let n=!0;const y=()=>typeof u=="function"?u()||[]:u,l=r=>r.map($=>ye(y(),$)).filter(Boolean),p=document.createElement("div");p.className="pm-panel tr-view",b.replaceChildren(p);function d(){const r=[...new Set(ie.map($=>$.sector))];p.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${r.map($=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${$}">
                    <h3 id="tr-sector-${$}" class="tr-sector-title">${a(z[$]||$)}</h3>
                    <ul class="pm-list">${ie.filter(m=>m.sector===$).map(m=>{const v=l([...m.base,...m.rules,...m.forms,...m.calls]).length,L=l(m.forms).length,o=l(m.calls).length;return`<li><a class="pm-card tr-card" href="${x({tramite:m.id})}" data-sector="${m.sector}">
                            <span class="pm-card-top"><span class="pm-num">Guía de trámite</span>${o?'<span class="pm-estado is-info">Con convocatoria</span>':'<span class="pm-estado is-off">Sin convocatoria</span>'}</span>
                            <span class="pm-holder">${a(m.title)}</span>
                            ${m.scenario?`<span class="pm-alias">${a(m.scenario)}</span>`:""}
                            <span class="pm-meta"><span class="pm-tag">${a(z[m.sector]||"")}</span><span>${q(v)} instrumentos</span>${L?"<span>Formatos oficiales</span>":""}</span>
                            <span class="pm-card-tools tr-card-go">Ver guía <span aria-hidden="true">→</span></span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function h(r){return`<button type="button" class="pm-law" data-law="${a(r.id)}"><b>${a(r.siglas||"")}</b><span>${a(r.titulo)}</span></button>`}function t(r){const $=Xe.map(o=>{let i=l(r[o.key]);return o.key==="calls"&&(i=i.sort((T,P)=>String(P.fecha_publicacion||"").localeCompare(String(T.fecha_publicacion||"")))),{...o,laws:i}}).filter(o=>o.laws.length);p.innerHTML=`
            <article class="pm-detail" data-sector="${r.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${x({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${a(z[r.sector]||"")}</span></div>
                    <h2 id="tr-title">${a(r.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${$.map(o=>`
                    <section class="pm-section" aria-labelledby="tr-${o.key}">
                        <h3 id="tr-${o.key}">${a(o.title)}</h3>
                        <p class="pm-note">${a(o.note)}</p>
                        <div class="pm-laws">${o.laws.map(h).join("")}</div>
                    </section>`).join("")}
                <section class="pm-section" aria-labelledby="tr-articles">
                    <h3 id="tr-articles">Artículos clave</h3>
                    <p class="pm-note">Artículos y numerales del acervo que tratan este trámite, por relevancia.</p>
                    <div class="tr-articles"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>
                ${r.resolutions?`<section class="pm-section" aria-labelledby="tr-res">
                    <h3 id="tr-res">Resoluciones recientes de la CNE</h3>
                    <p class="pm-note">Antecedentes de este tipo de trámite, de lo más reciente a lo más antiguo.</p>
                    <div class="tr-res"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>`:""}
            </article>`,p.querySelector(".pm-share").addEventListener("click",o=>{var T;const i=`${location.origin}${location.pathname}${x({tramite:r.id})}`;(T=navigator.clipboard)==null||T.writeText(i).then(()=>{o.target.textContent="Enlace copiado"},()=>{})});const m=l(r.articles.in).map(o=>o.id),v=p.querySelector(".tr-articles");_e(r.articles.query,{lawIds:m,limit:24}).then(({data:o})=>{if(!n||!v.isConnected)return;const i=new Map,T=(o||[]).filter(P=>P.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(P.articulo_label||""))).filter(P=>{const w=i.get(P.ley_id)||0;return i.set(P.ley_id,w+1),w<3}).slice(0,8);v.innerHTML=T.length?`<ol class="tr-article-list">${T.map(P=>{var w;return`
                <li><button type="button" class="tr-article" data-article="${a(P.id)}">
                    <span class="tr-article-top"><b>${a(P.siglas_ley||((w=y().find(s=>String(s.id)===String(P.ley_id)))==null?void 0:w.siglas)||"")}</b> ${a(P.articulo_label||"")}</span>
                    <span class="tr-article-text">${a(String(P.fragmento||P.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',v.dataset.ids=JSON.stringify(T.map(P=>P.id))}).catch(()=>{v.isConnected&&(v.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const L=p.querySelector(".tr-res");L&&X(r.resolutions,{length:6}).then(({rows:o,total:i})=>{!n||!L.isConnected||(L.innerHTML=o.length?`
                    <ol class="pn-latest">${o.map(T=>`
                        <li><a href="${x({resolution:T.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${a(T.NumeroResolucion)}</b><time>${a(I(T.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${a(T.TipoResolucion||"")}${T.ModalidadResolucion?` · ${a(T.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${a(T.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${q(i)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{L.isConnected&&(L.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}p.addEventListener("click",r=>{var v;const $=r.target.closest("[data-law]");if($){const L=y().find(o=>String(o.id)===$.dataset.law);L&&R(L);return}const m=r.target.closest("[data-article]");if(m){let L=[];try{L=JSON.parse(((v=m.closest(".tr-articles"))==null?void 0:v.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:m.dataset.article,list:L.length?L:[m.dataset.article]}}))}});function c(r){const $=r&&He(r);$?t($):d(),p.scrollIntoView({behavior:"smooth",block:"start"})}return c(S),{openTramite:r=>c(r),showList:()=>c(null),destroy:()=>{n=!1,p.remove()},onRoute:C}}const ge="cne-pestanas-vistas",Ee=()=>{try{return new Set(JSON.parse(localStorage.getItem(ge)||"[]"))}catch{return new Set}};function et(b){const u=Ee();if(!u.has(b)){u.add(b);try{localStorage.setItem(ge,JSON.stringify([...u]))}catch{}}}const G=[{id:"permisos",group:"CNE",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",group:"CNE",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",group:"CNE",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",group:"CNE",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."},{id:"mapa",group:"CNE",label:"Mapa",intro:"Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos."},{id:"sener",group:"SENER",label:"Títulos y permisos",intro:"Títulos y permisos de la Secretaría de Energía: asignaciones, pozos, contratos de exploración y extracción, comercio exterior y biocombustibles, con su fuente oficial."}],me='<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6Z"/><path d="M9 4v14M15 6v14"/></svg>',tt=`<svg class="pm-mapa-art" viewBox="0 0 120 80" aria-hidden="true">
    <rect x="1" y="1" width="118" height="78" rx="12" class="pm-mapa-fondo"/>
    <path class="pm-mapa-calle" d="M-2 52c22-6 34 10 58 2s30-24 66-14M30-2c4 24-6 40 4 84M86-2c-6 30 10 50 0 84"/>
    <g class="pm-mapa-pin" style="--c:var(--rojo)"><path d="M36 38c-6 0-10 4-10 9 0 7 10 15 10 15s10-8 10-15c0-5-4-9-10-9Z"/><circle cx="36" cy="47" r="3.4"/></g>
    <g class="pm-mapa-pin" style="--c:var(--col-acuerdos)"><path d="M78 16c-5 0-8 3.5-8 7.5 0 6 8 12.5 8 12.5s8-6.5 8-12.5c0-4-3-7.5-8-7.5Z"/><circle cx="78" cy="23.5" r="2.8"/></g>
    <g class="pm-mapa-pin" style="--c:var(--col-convocatorias)"><path d="M96 46c-4 0-7 3-7 6.5 0 5 7 11 7 11s7-6 7-11c0-3.5-3-6.5-7-6.5Z"/><circle cx="96" cy="52.5" r="2.4"/></g>
</svg>`,U=[{id:"cne",short:"CNE",name:"Comisión Nacional de Energía"},{id:"sener",short:"SENER",name:"Secretaría de Energía"}];function at(b){const u=U.find(S=>S.id===b)||U[0];return`<b>${u.short}</b>${u.name}`}function nt(b,u,{route:S={tab:"permisos"},onOpenLaw:R=()=>{},setHash:C=()=>{}}={}){let n=null,y=null;const l=document.createElement("section");l.className="pm-view",l.setAttribute("aria-labelledby","pm-title"),l.innerHTML=`
        <div class="pm-head">
            <nav class="bu-seg pm-aut-switch" aria-label="Autoridad">${U.map(t=>`<a href="${t.id==="sener"?"#sener":"#permisos"}" data-aut-link="${t.id}">${t.short}</a>`).join("")}</nav>
            <p class="pm-autoridad" data-authority></p>
            <h1 id="pm-title">Permisos de energía</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de permisos">
                ${U.map(t=>`<div class="pm-tab-grupo" data-aut="${t.id}"><span class="pm-tab-group" aria-hidden="true">${t.short}</span>${G.filter(c=>c.group===t.short).map(c=>`<a role="tab" class="pm-tab${c.id==="mapa"?" is-destacado":""}" id="pm-tab-${c.id}" href="${x({tab:c.id})}" data-tab="${c.id}" aria-controls="pm-tabpanel" aria-label="${c.label} · ${c.group}">${c.id==="mapa"?me:""}${c.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}</div>`).join("")}
            </nav>
        </div>
        <a class="pm-mapa-promo" href="${x({tab:"mapa"})}">
            ${tt}
            <span class="pm-mapa-texto"><strong>Ve los permisos en el mapa</strong><span>Centrales, gasolineras, ductos y almacenes, con su estatus y sus resoluciones. Filtra por estado o por tipo.</span></span>
            <span class="bu-btn bu-btn-primario pm-mapa-cta">${me}Abrir el mapa</span>
        </a>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,b.replaceChildren(l);const p=l.querySelector(".pm-tabpanel");function d(t,c){n==null||n.destroy(),y=t,et(t);const r=Ee();l.querySelectorAll(".pm-tab").forEach(o=>{const i=!r.has(o.dataset.tab)&&o.dataset.tab!=="permisos";o.classList.toggle("is-new",i),i?o.setAttribute("aria-description","Nueva sección"):o.removeAttribute("aria-description")});const $=G.find(o=>o.id===t)||G[0];l.querySelector(".pm-intro").textContent=$.intro,l.querySelector("[data-authority]").innerHTML=at(t==="sener"?"sener":"cne"),l.classList.toggle("en-sener",t==="sener");const m=t==="sener"?"sener":"cne";l.querySelectorAll(".pm-tab-grupo").forEach(o=>{o.hidden=o.dataset.aut!==m}),l.querySelector(".pm-tabs").hidden=G.filter(o=>o.group===m.toUpperCase()).length<2,l.querySelectorAll("[data-aut-link]").forEach(o=>{o.dataset.autLink===m?o.setAttribute("aria-current","page"):o.removeAttribute("aria-current")}),l.classList.toggle("en-mapa",t==="mapa"),l.querySelector(".pm-mapa-promo").hidden=t!=="permisos",l.querySelectorAll(".pm-tab").forEach(o=>{const i=o.dataset.tab===t;o.setAttribute("aria-selected",String(i)),o.classList.toggle("is-on",i)});const v=l.querySelector(".pm-tabs"),L=l.querySelector(".pm-tab.is-on");if(L&&(v.scrollLeft+=L.getBoundingClientRect().left-v.getBoundingClientRect().left-(v.clientWidth-L.offsetWidth)/2),p.setAttribute("aria-labelledby",`pm-tab-${t}`),t==="resoluciones")n=Ye(p,u,{resolution:c.resolution||null,filters:c.filters||null,onRoute:o=>C(x({tab:t,resolution:o}))});else if(t==="tramites")n=Qe(p,u,{tramite:c.tramite||null,onOpenLaw:R});else if(t==="panorama")n=Ze(p);else if(t==="sener"){const o={destroyed:!1,view:null,record:c.record||null,destroy(){var i;this.destroyed=!0,(i=this.view)==null||i.destroy()},openRecord(i){this.view?this.view.openRecord(i):this.record=i},showList(){var i;this.record=null,(i=this.view)==null||i.showList()}};n=o,p.innerHTML='<p class="pm-loading">Cargando los títulos de la SENER…</p>',le(()=>import("./cne-sener-view-DiRzYHnd.js"),__vite__mapDeps([0,1,2,3,4,5,6])).then(i=>i.renderCneSenerView(p,{catalog:u,onOpenLaw:R,record:o.record,onRoute:T=>C(x(T?{record:T}:{tab:"sener"}))})).then(i=>{o.destroyed?i.destroy():o.view=i}).catch(()=>{o.destroyed||(p.innerHTML='<p class="pm-loading">No se pudo cargar esta sección. Revisa tu conexión e intenta de nuevo.</p>')})}else if(t==="mapa"){const o={destroyed:!1,view:null,permit:c.mapPermit||null,destroy(){var i;this.destroyed=!0,(i=this.view)==null||i.destroy()},focusPermit(i){this.view?this.view.focusPermit(i):this.permit=i}};n=o,p.innerHTML='<p class="pm-loading">Cargando el mapa…</p>',le(()=>import("./permits-map-view-Y_3uuMxX.js"),__vite__mapDeps([7,1,2,8,9,3,4,5,10,11])).then(i=>i.renderPermitsMapView(p,{permit:o.permit})).then(i=>{o.destroyed?i.destroy():o.view=i}).catch(()=>{o.destroyed||(p.innerHTML='<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>')})}else n=Oe(p,u,{permit:c.permit||null,onOpenLaw:R,onRoute:o=>C(x({tab:t,permit:o}))})}function h(t={tab:"permisos"}){const c=t.tab||"permisos";if(c!==y){d(c,t);return}c==="permisos"?t.permit?n.openPermit(t.permit):n.showList():c==="resoluciones"?t.resolution?n.openResolution(t.resolution):t.filters&&Object.keys(t.filters).length?n.applyFilters(t.filters):n.showList():c==="tramites"?t.tramite?n.openTramite(t.tramite):n.showList():c==="mapa"&&t.mapPermit?n.focusPermit(t.mapPermit):c==="sener"&&(t.record?n.openRecord(t.record):n.showList())}return h(S),{go:h,destroy:()=>{n==null||n.destroy(),l.remove()}}}export{at as authorityTag,nt as renderCneView};
