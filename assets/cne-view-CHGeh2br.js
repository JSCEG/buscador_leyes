const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/cne-sener-view-DS-ujxj3.js","assets/index-DNuqKnAp.js","assets/index-ClUgN6t9.css","assets/permits-map-ShbW0NoQ.js","assets/permits-map-CflzZUgv.css","assets/map-common-DrEpF0oe.js","assets/cne-sener-view-CZwVSzJo.css","assets/permits-map-view-CYa7G-Gz.js","assets/leaflet-src-De2SSmXW.js","assets/_commonjsHelpers-Cpj98o6Y.js","assets/leaflet-Dgihpmma.css","assets/MarkerCluster-4Oo7lyRB.css"])))=>i.map(i=>d[i]);
import{R as fe,t as W,v as te,w as Se,x as ae,y as se,z as oe,B as A,C as Ne,D as K,E as Te,F as Re,q as be,G as Ce,H as Le,J as Pe,K as Me,L as Y,M as X,N as Ae,O as xe,Q as ke,S as ne,T as qe,U as j,V as He,W as we,X as ie,_ as le}from"./index-DNuqKnAp.js";import{s as O,e as a,d as I,n as q,g as he,P as $e,f as D,p as V,a as Q,l as ye,b as _e}from"./cne-shared-DMDPvk_7.js";const re=20,Fe=1500,B=$=>Q($,fe),Ie={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function Oe($,u=[],{onOpenLaw:S=()=>{},permit:R=null,onRoute:C=()=>{}}={}){const i={numero:"",titular:"",proyecto:"",start:0};let y=[],l=0,p=0,d=!0;const b=document.createElement("div");b.className="pm-panel",b.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${fe}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,$.replaceChildren(b);const e=b.querySelector(".pm-form"),c=b.querySelector(".pm-status"),r=b.querySelector(".pm-body");let h=null;const m=async()=>{h??(h=await Promise.race([Ce(),new Promise(s=>setTimeout(()=>s(null),Fe))]))};function v(s){return s?`<span class="pm-estado is-${Ie[s]||"off"}">${a(s)}</span>`:""}function L(s){const M=Le(s.Numero,{technology:Pe(h,s.Numero)}),{sector:t,activity:f}=te(s.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${a(s.PermisoId)}" data-sector="${(t==null?void 0:t.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${a(s.Numero)}</span>${v(s.Estado)}</span>
                <span class="pm-tipo">${Me(M)}<span class="pm-tipo-t">${a(M.label)}</span></span>
                <span class="pm-holder">${a(s.Persona||"Titular sin dato")}</span>
                ${s.AliasProyecto?`<span class="pm-alias">${a(s.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${t?`<span class="pm-tag">${a(t.label)}${f?` · ${a(f)}`:""}</span>`:""}
                    <span>${V(s.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${s.AnexosAsociados?`<span>${V(s.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${se(oe(s.Numero),{compact:!0})}<a class="pm-card-pdf" href="${ae(s.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${a(s.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function o(){if(!y.length){c.textContent="",r.innerHTML=be({title:"Ningún permiso coincide",body:"Revisa el número o prueba con una parte del nombre del titular."});return}const s=i.start+1,M=i.start+y.length;c.textContent=`${q(s)}–${q(M)} de ${V(l,"permiso","permisos")}`,r.innerHTML=`
            <ul class="pm-list">${y.map(L).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${i.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${M<l?"":"disabled"}>Siguientes →</button>
            </nav>`}async function n(){const s=++p;r.innerHTML=O(6),c.textContent="Consultando el registro de la CNE…";try{const[M]=await Promise.all([W({...i,length:re}),m()]);if(!d||s!==p)return;y=M.rows,l=M.total,o()}catch{if(!d||s!==p)return;c.textContent="",r.innerHTML=B("los permisos")}}function T(s){if(!s)return[];const M=typeof u=="function"?u()||[]:u;return s.laws.map(t=>ye(M,t)).filter((t,f,N)=>t&&N.indexOf(t)===f)}async function P(s,{updateRoute:M=!0}={}){M&&C(s.Numero);const{sector:t,activity:f}=te(s.Numero),N=T(t),w=Se(s.Numero);c.textContent="",r.innerHTML=`
            <article class="pm-detail" data-sector="${(t==null?void 0:t.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${t?`${a(t.label)}${f?` · ${a(f)}`:""}`:"Permiso"}</span>${v(s.Estado)}</div>
                    <h2 id="pm-detail-title">${a(s.Numero)}</h2>
                    <p class="pm-holder">${a(s.Persona||"Titular sin dato")}</p>
                    ${s.AliasProyecto?`<p class="pm-alias">${a(s.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${ae(s.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${se(oe(s.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                        <a class="pm-btn" href="${A({mapPermit:s.Numero})}" data-map-link hidden><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Ver en el mapa</a>
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
                    ${w?he(w):""}
                </section>
            </article>`,r.scrollIntoView({behavior:"smooth",block:"start"});const x=r.querySelector(".pm-res");if(Ne(s.ExpedienteId).then(E=>{!d||!x.isConnected||(x.innerHTML=E.length?`<ol class="pm-timeline">${E.map((g,H)=>{const _=K(g.REsolucionId);return`
                <li class="${H===0?"is-first":""}">
                    <time>${a(I(g.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${a(g.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${a(g.NumeroResolucion||"")}</b>${g.Acta?` · Acta ${a(g.Acta)}`:""}${g.Modalidad?` · ${a(g.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${_?`<a class="pm-res-pdf" href="${a(_)}" target="_blank" rel="noopener" aria-label="Ver resolución ${a(g.NumeroResolucion||"")} en PDF">${$e}Ver resolución (PDF)</a>`:""}
                            ${g.NumeroResolucion?`<a class="pm-res-more" href="${A({resolution:g.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{x.isConnected&&(x.innerHTML=B("las resoluciones"))}),s.AnexosAsociados){const E=r.querySelector(".pm-anx");Te(s.PermisoId).then(g=>{!d||!E.isConnected||(E.innerHTML=g.length?`<ul class="pm-annexes">${g.map(H=>{const _=Re(H),ee=a(H.Descripcion||"Anexo");return`<li>${_?`<a href="${a(_)}" target="_blank" rel="noopener">${ee}</a>`:`<span>${ee}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{E.isConnected&&(E.innerHTML=B("los anexos"))})}const k=r.querySelector("[data-map-link]");fetch(`/api/mapa/buscar?q=${encodeURIComponent(s.Numero)}&limite=5`,{credentials:"same-origin"}).then(E=>E.ok?E.json():null).then(E=>{const g=((E==null?void 0:E.resultados)||[]).find(H=>D(H.numeroPermiso)===D(s.Numero)&&H.latitud!=null);!d||!g||!k.isConnected||(k.href=A({mapPermit:g.numeroPermiso}),k.hidden=!1)}).catch(()=>{}),r.querySelector(".pm-back").addEventListener("click",()=>{C(null),y.length?o():n()}),r.querySelector(".pm-share").addEventListener("click",E=>{var H;const g=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(s.Numero)}`;(H=navigator.clipboard)==null||H.writeText(g).then(()=>{E.target.textContent="Enlace copiado"},()=>{})}),r.querySelectorAll("[data-law]").forEach(E=>E.addEventListener("click",()=>{const g=N.find(H=>String(H.id)===E.dataset.law);g&&S(g)}))}async function F(s){const M=++p;r.innerHTML=O(2),c.textContent="Buscando el permiso…";try{const t=await W({numero:s,length:10});if(!d||M!==p)return;const f=t.rows.find(N=>D(N.Numero)===D(s))||(t.rows.length===1?t.rows[0]:null);if(f){y=[],P(f,{updateRoute:!1});return}e.numero.value=s,i.numero=s,y=t.rows,l=t.total,o()}catch{if(!d||M!==p)return;c.textContent="",r.innerHTML=B("el permiso")}}return e.addEventListener("submit",s=>{s.preventDefault(),Object.assign(i,{numero:e.numero.value.trim(),titular:e.titular.value.trim(),proyecto:e.proyecto.value.trim(),start:0}),C(null),n()}),e.addEventListener("reset",()=>{Object.assign(i,{numero:"",titular:"",proyecto:"",start:0}),C(null),setTimeout(n)}),r.addEventListener("click",s=>{const M=s.target.closest("[data-page]");if(M){i.start=Math.max(0,i.start+Number(M.dataset.page)*re),n().then(()=>b.scrollIntoView({behavior:"smooth",block:"start"}));return}const t=s.target.closest("[data-permit]"),f=t&&y.find(N=>String(N.PermisoId)===t.dataset.permit);f&&P(f)}),R?F(R):n(),{openPermit:s=>F(s),showList:()=>{y.length?o():n()},destroy:()=>{d=!1,b.remove()}}}const ce=20,pe=$=>Q($,Y),je=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],Ve=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],De=1995;function Be($,u=[],{resolution:S=null,filters:R=null,onRoute:C=()=>{}}={}){const i={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let y=[],l=0,p=0,d=!0;const b=()=>typeof u=="function"?u()||[]:u,e=new Date().getFullYear(),c=Array.from({length:e-De+1},(t,f)=>e-f),r=document.createElement("div");r.className="pm-panel",r.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${c.map(t=>`<option>${t}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${je.map(t=>`<option value="${a(t)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${Ve.map(t=>`<option value="${a(t)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${Y}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,$.replaceChildren(r);const h=r.querySelector("form"),m=r.querySelector(".pm-status"),v=r.querySelector(".pm-body");function L(t){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${a(t.NumeroResolucion)}" data-sector="${de(t.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${a(t.NumeroResolucion)}</span><span class="pm-date">${a(I(t.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${a(t.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${a(t.Proemio||"")}</span>
                <span class="pm-meta">${t.ModalidadResolucion?`<span class="pm-tag">${a(t.ModalidadResolucion)}</span>`:""}${t.NumeroActa?`<span>${a(t.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${a(K(t.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${a(t.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function o(){if(!y.length){m.textContent="",v.innerHTML=be({title:"Ninguna resolución coincide",body:"Prueba con menos filtros o con una parte del texto."});return}const t=i.start+y.length;m.textContent=`${q(i.start+1)}–${q(t)} de ${V(l,"resolución","resoluciones")} · más recientes primero`,v.innerHTML=`
            <ul class="pm-list">${y.map(L).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${i.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${t<l?"":"disabled"}>Siguientes →</button>
            </nav>`}async function n(){const t=++p;v.innerHTML=O(6),m.textContent="Consultando las resoluciones de la CNE…";try{const f=await X(i,{start:i.start,length:ce});if(!d||t!==p)return;y=f.rows,l=f.total,o()}catch{if(!d||t!==p)return;m.textContent="",v.innerHTML=pe("las resoluciones")}}function T(t){const f=ne(t);return f.length?`<ul class="pm-found">${f.map((N,w)=>{const x=_e(b(),N.law);return`<li data-found="${w}" ${x?`data-law-id="${a(x.id)}"`:""}>
                <p class="pm-found-law">${x?`<b>${a(x.siglas||"")}</b> `:""}${a(N.law)}${x?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${N.articles.map(k=>`<span class="pm-art" data-art="${a(k)}">Art. ${a(k)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${a(t)}</p></details>`:t?`<p class="pm-note">${a(t)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function P(t,f){const N=ne(f);await Promise.all(N.map(async(w,x)=>{const k=t.querySelector(`[data-found="${x}"][data-law-id]`);if(!k)return;const E=await qe(k.dataset.lawId,w.articles);!d||!k.isConnected||k.querySelectorAll("[data-art]").forEach(g=>{const H=E[g.dataset.art];if(!H)return;const _=document.createElement("button");_.type="button",_.className="pm-art is-linked",_.dataset.article=H,_.textContent=g.textContent,_.title="Abrir el artículo",g.replaceWith(_)})}))}function F(t,{updateRoute:f=!0}={}){f&&C(t.NumeroResolucion);const N=Ae(t.Proemio),w=xe(t),x=K(t.ResolucionId);m.textContent="",v.innerHTML=`
            <article class="pm-detail" data-sector="${de(t.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${a(t.TipoResolucion||"Resolución")}${t.ModalidadResolucion?` · ${a(t.ModalidadResolucion)}`:""}</span><span class="pm-date">${a(I(t.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${a(t.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${a(t.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${x?`<a class="pm-btn pm-btn-primary" href="${a(x)}" target="_blank" rel="noopener">${$e}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${a(I(t.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${a(t.NumeroActa||"—")}</dd></div>
                    ${t.Ponente?`<div><dt>Ponente</dt><dd>${a(t.Ponente)}</dd></div>`:""}
                </dl>
                ${N.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${N.map(k=>`<a class="pm-law" href="${A({permit:k})}"><b>Permiso</b><span>${a(k)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${T(t.Fundamentacion||"")}</div>
                    ${w?he(w,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,v.scrollIntoView({behavior:"smooth",block:"start"}),P(v.querySelector(".pm-found-host"),t.Fundamentacion||"").catch(()=>{}),v.querySelector(".pm-back").addEventListener("click",()=>{C(null),y.length?o():n()}),v.querySelector(".pm-share").addEventListener("click",k=>{var g;const E=`${location.origin}${location.pathname}${A({resolution:t.NumeroResolucion})}`;(g=navigator.clipboard)==null||g.writeText(E).then(()=>{k.target.textContent="Enlace copiado"},()=>{})})}async function s(t){const f=++p;v.innerHTML=O(2),m.textContent="Buscando la resolución…";try{const N=await ke(t);if(!d||f!==p)return;if(N){y=[],F(N,{updateRoute:!1});return}h.numero.value=t,i.numero=t,n()}catch{if(!d||f!==p)return;m.textContent="",v.innerHTML=pe("la resolución")}}h.addEventListener("submit",t=>{t.preventDefault(),Object.assign(i,{numero:h.numero.value.trim(),texto:h.texto.value.trim(),fecha:h.fecha.value,tipo:h.tipo.value.trim(),modalidad:h.modalidad.value.trim(),start:0}),C(null),n()}),h.addEventListener("reset",()=>{Object.assign(i,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),C(null),setTimeout(n)}),v.addEventListener("click",t=>{const f=t.target.closest("[data-article]");if(f){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:f.dataset.article,list:[f.dataset.article]}}));return}const N=t.target.closest("[data-page]");if(N){i.start=Math.max(0,i.start+Number(N.dataset.page)*ce),n().then(()=>r.scrollIntoView({behavior:"smooth",block:"start"}));return}const w=t.target.closest("[data-resolution]"),x=w&&y.find(k=>k.NumeroResolucion===w.dataset.resolution);x&&F(x)});function M(t={}){Object.assign(i,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...t,start:0});for(const f of["numero","texto","fecha","tipo","modalidad"])h[f].value=i[f]||"";n()}return S?s(S):R&&Object.keys(R).length?M(R):n(),{openResolution:t=>s(t),applyFilters:M,showList:()=>{y.length?o():n()},destroy:()=>{d=!1,r.remove()}}}function de($=""){const u=$.toLowerCase();return/el[eé]ctric/.test(u)?"electricidad":/licuado/.test(u)?"gaslp":/gas natural/.test(u)?"gasnatural":/petrol|hidrocarb/.test(u)?"petroliferos":"otro"}const ve="cne-panorama-v1",Ge=12*60*60*1e3,ue=12,J=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],Z=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function Ye($,u=3){const S=[];for(let R=0;R<$.length;R+=u)S.push(...await Promise.all($.slice(R,R+u).map(C=>C())));return S}function Ue(){try{const $=JSON.parse(localStorage.getItem(ve)||"null");return $&&Date.now()-$.at<Ge?$.data:null}catch{return null}}function Je($){try{localStorage.setItem(ve,JSON.stringify({at:Date.now(),data:$}))}catch{}}async function ze(){const u=new Date().getFullYear(),S=Array.from({length:ue},(d,b)=>u-ue+1+b),[R,C,...i]=await Ye([()=>W({length:1}).then(d=>d.total),()=>j({}),...S.map(d=>()=>j({fecha:String(d)})),...J.map(d=>()=>j({fecha:String(u),tipo:d})),...Z.map(d=>()=>j({fecha:String(u),modalidad:d.filter}))]),y=S.map((d,b)=>({year:d,count:i[b]})),l=J.map((d,b)=>({label:d,count:i[S.length+b]})),p=Z.map((d,b)=>({label:d.label,count:i[S.length+J.length+b]}));return{year:u,permits:R,resolutions:C,thisYear:y.at(-1).count,perYear:y,byType:l,byMode:p,at:Date.now()}}function We($){let u=!0;const S=document.createElement("div");S.className="pm-panel pn-view",S.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${Y}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,$.replaceChildren(S);const R=S.querySelector(".pm-status"),C=S.querySelector(".pn-body"),i=(l,p,d)=>{const b=Math.max(1,...l.map(e=>e.count));return`<ul class="pn-bars">${l.filter(e=>e.count>0).sort((e,c)=>c.count-e.count).map((e,c)=>`
            <li><a class="pn-bar-row" href="${A({tab:"resoluciones",filters:d(e)})}" data-tip="${a(`${e.label}: ${q(e.count)} ${p}. Ver cuáles`)}" style="--i:${c}">
                <span class="pn-bar-label">${a(e.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(e.count/b*100))}%"></span></span>
                <span class="pn-bar-value">${q(e.count)}<span class="sr-only"> ${p}</span></span>
            </a></li>`).join("")}</ul>`};function y(l,p,d){const b=Math.max(1,...l.perYear.map(e=>e.count));R.textContent=`Actualizado ${new Date(l.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,C.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${A({tab:"permisos"})}"><b>${q(l.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${A({tab:"resoluciones"})}"><b>${q(l.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${q(l.thisYear)}</b><span>resoluciones en ${l.year}</span></div>
                ${d?`<a class="pn-kpi" href="${A({tab:"resoluciones"})}"><b>${a(I(d.date))}</b><span>última sesión (${a(d.acta)})${d.count?`: ${V(d.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${l.perYear.map((e,c)=>`
                    <li><a href="${A({tab:"resoluciones",filters:{fecha:String(e.year)}})}" data-tip="${a(`${e.year}: ${q(e.count)} resoluciones. Ver cuáles`)}" style="--i:${c}">
                        <span class="pn-col-value">${q(e.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(e.count/b*100))}%"></span>
                        <span class="pn-col-label">${e.year===l.year?`${e.year}*`:e.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${l.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${l.year} por tipo</h3>${i(l.byType,"resoluciones",e=>({fecha:String(l.year),tipo:e.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${l.year} por modalidad</h3>${i(l.byMode,"resoluciones",e=>{var c;return{fecha:String(l.year),modalidad:((c=Z.find(r=>r.label===e.label))==null?void 0:c.filter)||e.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${p.length?`<ol class="pn-latest">${p.map(e=>`
                    <li><a href="${A({resolution:e.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${a(e.NumeroResolucion)}</b><time>${a(I(e.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${a(e.TipoResolucion||"")}${e.ModalidadResolucion?` · ${a(e.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${a(e.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const l=X({},{length:8}).then(c=>c.rows).catch(()=>[]);let p=Ue();p||(p=await ze(),Je(p));const d=await l,b=d[0],e=b!=null&&b.NumeroActa?{date:b.FechaResolucion,acta:b.NumeroActa,count:await j({acta:b.NumeroActa}).catch(()=>0)}:null;u&&y(p,d,e)}catch{if(!u)return;R.textContent="",C.innerHTML=Q("las cifras",Y)}})(),{destroy:()=>{u=!1,S.remove()}}}const z={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},Ke=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function Ze($,u=[],{tramite:S=null,onOpenLaw:R=()=>{},onRoute:C=()=>{}}={}){let i=!0;const y=()=>typeof u=="function"?u()||[]:u,l=r=>r.map(h=>ye(y(),h)).filter(Boolean),p=document.createElement("div");p.className="pm-panel tr-view",$.replaceChildren(p);function d(){const r=[...new Set(ie.map(h=>h.sector))];p.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${r.map(h=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${h}">
                    <h3 id="tr-sector-${h}" class="tr-sector-title">${a(z[h]||h)}</h3>
                    <ul class="pm-list">${ie.filter(m=>m.sector===h).map(m=>{const v=l([...m.base,...m.rules,...m.forms,...m.calls]).length,L=l(m.forms).length,o=l(m.calls).length;return`<li><a class="pm-card tr-card" href="${A({tramite:m.id})}" data-sector="${m.sector}">
                            <span class="pm-card-top"><span class="pm-num">Guía de trámite</span>${o?'<span class="pm-estado is-info">Con convocatoria</span>':'<span class="pm-estado is-off">Sin convocatoria</span>'}</span>
                            <span class="pm-holder">${a(m.title)}</span>
                            ${m.scenario?`<span class="pm-alias">${a(m.scenario)}</span>`:""}
                            <span class="pm-meta"><span class="pm-tag">${a(z[m.sector]||"")}</span><span>${q(v)} instrumentos</span>${L?"<span>Formatos oficiales</span>":""}</span>
                            <span class="pm-card-tools tr-card-go">Ver guía <span aria-hidden="true">→</span></span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function b(r){return`<button type="button" class="pm-law" data-law="${a(r.id)}"><b>${a(r.siglas||"")}</b><span>${a(r.titulo)}</span></button>`}function e(r){const h=Ke.map(o=>{let n=l(r[o.key]);return o.key==="calls"&&(n=n.sort((T,P)=>String(P.fecha_publicacion||"").localeCompare(String(T.fecha_publicacion||"")))),{...o,laws:n}}).filter(o=>o.laws.length);p.innerHTML=`
            <article class="pm-detail" data-sector="${r.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${A({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${a(z[r.sector]||"")}</span></div>
                    <h2 id="tr-title">${a(r.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${h.map(o=>`
                    <section class="pm-section" aria-labelledby="tr-${o.key}">
                        <h3 id="tr-${o.key}">${a(o.title)}</h3>
                        <p class="pm-note">${a(o.note)}</p>
                        <div class="pm-laws">${o.laws.map(b).join("")}</div>
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
            </article>`,p.querySelector(".pm-share").addEventListener("click",o=>{var T;const n=`${location.origin}${location.pathname}${A({tramite:r.id})}`;(T=navigator.clipboard)==null||T.writeText(n).then(()=>{o.target.textContent="Enlace copiado"},()=>{})});const m=l(r.articles.in).map(o=>o.id),v=p.querySelector(".tr-articles");we(r.articles.query,{lawIds:m,limit:24}).then(({data:o})=>{if(!i||!v.isConnected)return;const n=new Map,T=(o||[]).filter(P=>P.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(P.articulo_label||""))).filter(P=>{const F=n.get(P.ley_id)||0;return n.set(P.ley_id,F+1),F<3}).slice(0,8);v.innerHTML=T.length?`<ol class="tr-article-list">${T.map(P=>{var F;return`
                <li><button type="button" class="tr-article" data-article="${a(P.id)}">
                    <span class="tr-article-top"><b>${a(P.siglas_ley||((F=y().find(s=>String(s.id)===String(P.ley_id)))==null?void 0:F.siglas)||"")}</b> ${a(P.articulo_label||"")}</span>
                    <span class="tr-article-text">${a(String(P.fragmento||P.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',v.dataset.ids=JSON.stringify(T.map(P=>P.id))}).catch(()=>{v.isConnected&&(v.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const L=p.querySelector(".tr-res");L&&X(r.resolutions,{length:6}).then(({rows:o,total:n})=>{!i||!L.isConnected||(L.innerHTML=o.length?`
                    <ol class="pn-latest">${o.map(T=>`
                        <li><a href="${A({resolution:T.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${a(T.NumeroResolucion)}</b><time>${a(I(T.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${a(T.TipoResolucion||"")}${T.ModalidadResolucion?` · ${a(T.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${a(T.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${q(n)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{L.isConnected&&(L.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}p.addEventListener("click",r=>{var v;const h=r.target.closest("[data-law]");if(h){const L=y().find(o=>String(o.id)===h.dataset.law);L&&R(L);return}const m=r.target.closest("[data-article]");if(m){let L=[];try{L=JSON.parse(((v=m.closest(".tr-articles"))==null?void 0:v.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:m.dataset.article,list:L.length?L:[m.dataset.article]}}))}});function c(r){const h=r&&He(r);h?e(h):d(),p.scrollIntoView({behavior:"smooth",block:"start"})}return c(S),{openTramite:r=>c(r),showList:()=>c(null),destroy:()=>{i=!1,p.remove()},onRoute:C}}const ge="cne-pestanas-vistas",Ee=()=>{try{return new Set(JSON.parse(localStorage.getItem(ge)||"[]"))}catch{return new Set}};function Xe($){const u=Ee();if(!u.has($)){u.add($);try{localStorage.setItem(ge,JSON.stringify([...u]))}catch{}}}const G=[{id:"permisos",group:"CNE",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",group:"CNE",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",group:"CNE",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",group:"CNE",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."},{id:"mapa",group:"CNE",label:"Mapa",intro:"Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos."},{id:"sener",group:"SENER",label:"Títulos y permisos",intro:"Títulos y permisos de la Secretaría de Energía: asignaciones, pozos, contratos de exploración y extracción, comercio exterior y biocombustibles, con su fuente oficial."}],me='<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6Z"/><path d="M9 4v14M15 6v14"/></svg>',Qe=`<svg class="pm-mapa-art" viewBox="0 0 120 80" aria-hidden="true">
    <rect x="1" y="1" width="118" height="78" rx="12" class="pm-mapa-fondo"/>
    <path class="pm-mapa-calle" d="M-2 52c22-6 34 10 58 2s30-24 66-14M30-2c4 24-6 40 4 84M86-2c-6 30 10 50 0 84"/>
    <g class="pm-mapa-pin" style="--c:var(--rojo)"><path d="M36 38c-6 0-10 4-10 9 0 7 10 15 10 15s10-8 10-15c0-5-4-9-10-9Z"/><circle cx="36" cy="47" r="3.4"/></g>
    <g class="pm-mapa-pin" style="--c:var(--col-acuerdos)"><path d="M78 16c-5 0-8 3.5-8 7.5 0 6 8 12.5 8 12.5s8-6.5 8-12.5c0-4-3-7.5-8-7.5Z"/><circle cx="78" cy="23.5" r="2.8"/></g>
    <g class="pm-mapa-pin" style="--c:var(--col-convocatorias)"><path d="M96 46c-4 0-7 3-7 6.5 0 5 7 11 7 11s7-6 7-11c0-3.5-3-6.5-7-6.5Z"/><circle cx="96" cy="52.5" r="2.4"/></g>
</svg>`,U=[{id:"cne",short:"CNE",name:"Comisión Nacional de Energía"},{id:"sener",short:"SENER",name:"Secretaría de Energía"}];function et($){const u=U.find(S=>S.id===$)||U[0];return`<b>${u.short}</b>${u.name}`}function st($,u,{route:S={tab:"permisos"},onOpenLaw:R=()=>{},setHash:C=()=>{}}={}){let i=null,y=null;const l=document.createElement("section");l.className="pm-view",l.setAttribute("aria-labelledby","pm-title"),l.innerHTML=`
        <div class="pm-head">
            <nav class="bu-seg pm-aut-switch" aria-label="Autoridad">${U.map(e=>`<a href="${e.id==="sener"?"#sener":"#permisos"}" data-aut-link="${e.id}">${e.short}</a>`).join("")}</nav>
            <p class="pm-autoridad" data-authority></p>
            <h1 id="pm-title">Permisos de energía</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de permisos">
                ${U.map(e=>`<div class="pm-tab-grupo" data-aut="${e.id}"><span class="pm-tab-group" aria-hidden="true">${e.short}</span>${G.filter(c=>c.group===e.short).map(c=>`<a role="tab" class="pm-tab${c.id==="mapa"?" is-destacado":""}" id="pm-tab-${c.id}" href="${A({tab:c.id})}" data-tab="${c.id}" aria-controls="pm-tabpanel" aria-label="${c.label} · ${c.group}">${c.id==="mapa"?me:""}${c.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}</div>`).join("")}
            </nav>
        </div>
        <a class="pm-mapa-promo" href="${A({tab:"mapa"})}">
            ${Qe}
            <span class="pm-mapa-texto"><strong>Ve los permisos en el mapa</strong><span>Centrales, gasolineras, ductos y almacenes, con su estatus y sus resoluciones. Filtra por estado o por tipo.</span></span>
            <span class="bu-btn bu-btn-primario pm-mapa-cta">${me}Abrir el mapa</span>
        </a>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,$.replaceChildren(l);const p=l.querySelector(".pm-tabpanel");function d(e,c){i==null||i.destroy(),y=e,Xe(e);const r=Ee();l.querySelectorAll(".pm-tab").forEach(o=>{const n=!r.has(o.dataset.tab)&&o.dataset.tab!=="permisos";o.classList.toggle("is-new",n),n?o.setAttribute("aria-description","Nueva sección"):o.removeAttribute("aria-description")});const h=G.find(o=>o.id===e)||G[0];l.querySelector(".pm-intro").textContent=h.intro,l.querySelector("[data-authority]").innerHTML=et(e==="sener"?"sener":"cne"),l.classList.toggle("en-sener",e==="sener");const m=e==="sener"?"sener":"cne";l.querySelectorAll(".pm-tab-grupo").forEach(o=>{o.hidden=o.dataset.aut!==m}),l.querySelector(".pm-tabs").hidden=G.filter(o=>o.group===m.toUpperCase()).length<2,l.querySelectorAll("[data-aut-link]").forEach(o=>{o.dataset.autLink===m?o.setAttribute("aria-current","page"):o.removeAttribute("aria-current")}),l.classList.toggle("en-mapa",e==="mapa"),l.querySelector(".pm-mapa-promo").hidden=e!=="permisos",l.querySelectorAll(".pm-tab").forEach(o=>{const n=o.dataset.tab===e;o.setAttribute("aria-selected",String(n)),o.classList.toggle("is-on",n)});const v=l.querySelector(".pm-tabs"),L=l.querySelector(".pm-tab.is-on");if(L&&(v.scrollLeft+=L.getBoundingClientRect().left-v.getBoundingClientRect().left-(v.clientWidth-L.offsetWidth)/2),p.setAttribute("aria-labelledby",`pm-tab-${e}`),e==="resoluciones")i=Be(p,u,{resolution:c.resolution||null,filters:c.filters||null,onRoute:o=>C(A({tab:e,resolution:o}))});else if(e==="tramites")i=Ze(p,u,{tramite:c.tramite||null,onOpenLaw:R});else if(e==="panorama")i=We(p);else if(e==="sener"){const o={destroyed:!1,view:null,record:c.record||null,destroy(){var n;this.destroyed=!0,(n=this.view)==null||n.destroy()},openRecord(n){this.view?this.view.openRecord(n):this.record=n},showList(){var n;this.record=null,(n=this.view)==null||n.showList()}};i=o,p.innerHTML='<p class="pm-loading">Cargando los títulos de la SENER…</p>',le(()=>import("./cne-sener-view-DS-ujxj3.js"),__vite__mapDeps([0,1,2,3,4,5,6])).then(n=>n.renderCneSenerView(p,{catalog:u,onOpenLaw:R,record:o.record,onRoute:T=>C(A(T?{record:T}:{tab:"sener"}))})).then(n=>{o.destroyed?n.destroy():o.view=n}).catch(()=>{o.destroyed||(p.innerHTML='<p class="pm-loading">No se pudo cargar esta sección. Revisa tu conexión e intenta de nuevo.</p>')})}else if(e==="mapa"){const o={destroyed:!1,view:null,permit:c.mapPermit||null,destroy(){var n;this.destroyed=!0,(n=this.view)==null||n.destroy()},focusPermit(n){this.view?this.view.focusPermit(n):this.permit=n}};i=o,p.innerHTML='<p class="pm-loading">Cargando el mapa…</p>',le(()=>import("./permits-map-view-CYa7G-Gz.js"),__vite__mapDeps([7,1,2,8,9,3,4,5,10,11])).then(n=>n.renderPermitsMapView(p,{permit:o.permit})).then(n=>{o.destroyed?n.destroy():o.view=n}).catch(()=>{o.destroyed||(p.innerHTML='<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>')})}else i=Oe(p,u,{permit:c.permit||null,onOpenLaw:R,onRoute:o=>C(A({tab:e,permit:o}))})}function b(e={tab:"permisos"}){const c=e.tab||"permisos";if(c!==y){d(c,e);return}c==="permisos"?e.permit?i.openPermit(e.permit):i.showList():c==="resoluciones"?e.resolution?i.openResolution(e.resolution):e.filters&&Object.keys(e.filters).length?i.applyFilters(e.filters):i.showList():c==="tramites"?e.tramite?i.openTramite(e.tramite):i.showList():c==="mapa"&&e.mapPermit?i.focusPermit(e.mapPermit):c==="sener"&&(e.record?i.openRecord(e.record):i.showList())}return b(S),{go:b,destroy:()=>{i==null||i.destroy(),l.remove()}}}export{et as authorityTag,st as renderCneView};
