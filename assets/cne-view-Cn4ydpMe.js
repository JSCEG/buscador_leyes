const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/cne-sener-view-oSxW46AM.js","assets/index-DpUHipgq.js","assets/index-C-bYM-Kx.css","assets/permits-map-ShbW0NoQ.js","assets/permits-map-CflzZUgv.css","assets/tech-markers-DLyvz8YI.js","assets/map-common-CUgaxD19.js","assets/cne-sener-view-CZwVSzJo.css","assets/permits-map-view-MRHgcL4k.js","assets/leaflet-src-De2SSmXW.js","assets/_commonjsHelpers-Cpj98o6Y.js","assets/cne-shared-DMDPvk_7.js","assets/leaflet-Dgihpmma.css","assets/MarkerCluster-4Oo7lyRB.css"])))=>i.map(i=>d[i]);
import{t as U,R as he,v as W,w as Ce,x as se,y as ne,z as oe,B as M,C as Pe,D as X,E as Re,F as Le,q as $e,G as Y,H as Z,J as Ae,K as Me,L as xe,M as ie,N as ke,O as j,Q as qe,S as Ie,T as re,_ as le}from"./index-DpUHipgq.js";import{T as He,i as _e,a as we}from"./tech-markers-DLyvz8YI.js";import{s as F,e as a,d as O,n as q,g as ye,P as ve,f as V,p as D,a as ee,l as ge,b as Oe}from"./cne-shared-DMDPvk_7.js";const ce={electricidad:"--col-leyes",petroliferos:"--col-convocatorias",gaslp:"--col-normas",gasnatural:"--col-dacg",otro:"--col-otros"},te=c=>String(c??"").toUpperCase().trim().replace(/^CNE\//,"");function Fe(c){const i=te(c).split("/"),b=i.slice(2),l=(...o)=>o.some(h=>b.includes(h)),g=U(c).activity;return i[0]==="E"?l("IMP")?["importacion","Importación"]:l("EXP")?["importacion","Exportación"]:l("COG")?["termica","Cogeneración"]:l("AUT","AUTC")?["autoconsumo","Autoabastecimiento"]:l("PP")?["generacion","Pequeña producción"]:l("PIE")?["generacion","Producción independiente"]:l("GEN")?["generacion","Generación"]:["otro",g||"Permiso"]:l("AE")?["aerodromo",l("ALM")?"Almacenamiento en aeródromo":"Expendio en aeródromo"]:l("ALM")?["almacenamiento","Almacenamiento"]:l("TRA")?l("OM")?["distribucion","Transporte sin ducto"]:l("TM")?["distribucion","Transporte"]:["ducto","Transporte por ducto"]:l("DIST","DIS")?l("PLA")?["planta","Planta de distribución"]:["distribucion","Distribución"]:l("EXP")?l("AUT","ESA")?["autoconsumo","Autoconsumo"]:["estacion","Estación de servicio"]:l("COMP","DESC","LICUE","REG")?["planta",g||"Instalación"]:l("COM")?["comercio","Comercialización"]:["otro",g||"Permiso"]}function je(c,{technology:i=""}={}){var o;const b=((o=U(c).sector)==null?void 0:o.id)||"otro";if(b==="electricidad"&&i){const h=we("electricidad",{tecnologia:i});if(h.tech)return{icon:h.icon,label:h.label,tech:h.tech,sector:b}}const[l,g]=Fe(c);return{icon:l,label:g,sector:b}}function De(c){const i=[1,3,5].map(l=>parseInt(c.slice(l,l+2),16)/255).map(l=>l<=.03928?l/12.92:((l+.055)/1.055)**2.4);return 1.05/(.2126*i[0]+.7152*i[1]+.0722*i[2]+.05)>=3?"#fff":"#0a0707"}function Ve(c){try{return getComputedStyle(document.documentElement).getPropertyValue(c).trim()}catch{return""}}function Be(c,{size:i=""}={}){const b=c.tech?`--tec-${c.tech}`:ce[c.sector]||ce.otro,l=Ve(b),g=/^#[0-9a-f]{6}$/i.test(l)?De(l):"#fff",o=c.tech?`<svg viewBox="0 0 24 24" aria-hidden="true">${He[c.tech].glyph}</svg>`:_e(c.icon,21);return`<span class="bu-ico${i?` is-${i}`:""}" style="--c:var(${b});--t:${g}" aria-hidden="true">${o}</span>`}let pe=null;function Ge(c=i=>fetch(i,{credentials:"same-origin"}).then(b=>{if(!b.ok)throw new Error(`HTTP ${b.status}`);return b.json()})){return pe??(pe=Promise.resolve().then(()=>c("/api/mapa/capa?tipo=electricidad")).then(i=>{const b=new Map;for(const l of(i==null?void 0:i.features)||[]){const{numeroPermiso:g,tecnologia:o}=l.properties||{};g&&o&&b.set(te(g),o)}return b}).catch(()=>new Map)),pe}function Ue(c,i){return(c==null?void 0:c.get(te(i)))||""}const de=20,Ye=1500,B=c=>ee(c,he),ze={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function Je(c,i=[],{onOpenLaw:b=()=>{},permit:l=null,onRoute:g=()=>{}}={}){const o={numero:"",titular:"",proyecto:"",start:0};let h=[],p=0,u=0,f=!0;const v=document.createElement("div");v.className="pm-panel",v.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${he}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,c.replaceChildren(v);const t=v.querySelector(".pm-form"),m=v.querySelector(".pm-status"),d=v.querySelector(".pm-body");let E=null;const $=async()=>{E??(E=await Promise.race([Ge(),new Promise(s=>setTimeout(()=>s(null),Ye))]))};function S(s){return s?`<span class="pm-estado is-${ze[s]||"off"}">${a(s)}</span>`:""}function R(s){const A=je(s.Numero,{technology:Ue(E,s.Numero)}),{sector:e,activity:y}=U(s.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${a(s.PermisoId)}" data-sector="${(e==null?void 0:e.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${a(s.Numero)}</span>${S(s.Estado)}</span>
                <span class="pm-tipo">${Be(A)}<span class="pm-tipo-t">${a(A.label)}</span></span>
                <span class="pm-holder">${a(s.Persona||"Titular sin dato")}</span>
                ${s.AliasProyecto?`<span class="pm-alias">${a(s.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${e?`<span class="pm-tag">${a(e.label)}${y?` · ${a(y)}`:""}</span>`:""}
                    <span>${D(s.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${s.AnexosAsociados?`<span>${D(s.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${ne(oe(s.Numero),{compact:!0})}<a class="pm-card-pdf" href="${se(s.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${a(s.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function n(){if(!h.length){m.textContent="",d.innerHTML=$e({title:"Ningún permiso coincide",body:"Revisa el número o prueba con una parte del nombre del titular."});return}const s=o.start+1,A=o.start+h.length;m.textContent=`${q(s)}–${q(A)} de ${D(p,"permiso","permisos")}`,d.innerHTML=`
            <ul class="pm-list">${h.map(R).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${o.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${A<p?"":"disabled"}>Siguientes →</button>
            </nav>`}async function r(){const s=++u;d.innerHTML=F(6),m.textContent="Consultando el registro de la CNE…";try{const[A]=await Promise.all([W({...o,length:de}),$()]);if(!f||s!==u)return;h=A.rows,p=A.total,n()}catch{if(!f||s!==u)return;m.textContent="",d.innerHTML=B("los permisos")}}function P(s){if(!s)return[];const A=typeof i=="function"?i()||[]:i;return s.laws.map(e=>ge(A,e)).filter((e,y,C)=>e&&C.indexOf(e)===y)}async function L(s,{updateRoute:A=!0}={}){A&&g(s.Numero);const{sector:e,activity:y}=U(s.Numero),C=P(e),H=Ce(s.Numero);m.textContent="",d.innerHTML=`
            <article class="pm-detail" data-sector="${(e==null?void 0:e.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e?`${a(e.label)}${y?` · ${a(y)}`:""}`:"Permiso"}</span>${S(s.Estado)}</div>
                    <h2 id="pm-detail-title">${a(s.Numero)}</h2>
                    <p class="pm-holder">${a(s.Persona||"Titular sin dato")}</p>
                    ${s.AliasProyecto?`<p class="pm-alias">${a(s.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${se(s.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${ne(oe(s.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                        <a class="pm-btn" href="${M({mapPermit:s.Numero})}" data-map-link hidden><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Ver en el mapa</a>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${a(s.NumeroExpediente||"—")}</dd></div>
                    <div><dt>Último acuse</dt><dd>${a(O(s.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${q(s.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${q(s.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${q(s.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${q(s.AnexosAsociados)}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Línea de resoluciones</h3>
                    <div class="pm-res">${F(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-anx-title">
                    <h3 id="pm-anx-title">Anexos</h3>
                    <div class="pm-anx">${s.AnexosAsociados?F(1):'<p class="pm-note">Este permiso no tiene anexos publicados.</p>'}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${C.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${C.map(N=>`<button type="button" class="pm-law" data-law="${a(N.id)}"><b>${a(N.siglas||"")}</b><span>${a(N.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${H?ye(H):""}
                </section>
            </article>`,d.scrollIntoView({behavior:"smooth",block:"start"});const x=d.querySelector(".pm-res");if(Pe(s.ExpedienteId).then(N=>{!f||!x.isConnected||(x.innerHTML=N.length?`<ol class="pm-timeline">${N.map((T,I)=>{const _=X(T.REsolucionId);return`
                <li class="${I===0?"is-first":""}">
                    <time>${a(O(T.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${a(T.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${a(T.NumeroResolucion||"")}</b>${T.Acta?` · Acta ${a(T.Acta)}`:""}${T.Modalidad?` · ${a(T.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${_?`<a class="pm-res-pdf" href="${a(_)}" target="_blank" rel="noopener" aria-label="Ver resolución ${a(T.NumeroResolucion||"")} en PDF">${ve}Ver resolución (PDF)</a>`:""}
                            ${T.NumeroResolucion?`<a class="pm-res-more" href="${M({resolution:T.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{x.isConnected&&(x.innerHTML=B("las resoluciones"))}),s.AnexosAsociados){const N=d.querySelector(".pm-anx");Re(s.PermisoId).then(T=>{!f||!N.isConnected||(N.innerHTML=T.length?`<ul class="pm-annexes">${T.map(I=>{const _=Le(I),ae=a(I.Descripcion||"Anexo");return`<li>${_?`<a href="${a(_)}" target="_blank" rel="noopener">${ae}</a>`:`<span>${ae}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{N.isConnected&&(N.innerHTML=B("los anexos"))})}const k=d.querySelector("[data-map-link]");fetch(`/api/mapa/buscar?q=${encodeURIComponent(s.Numero)}&limite=5`,{credentials:"same-origin"}).then(N=>N.ok?N.json():null).then(N=>{const T=((N==null?void 0:N.resultados)||[]).find(I=>V(I.numeroPermiso)===V(s.Numero)&&I.latitud!=null);!f||!T||!k.isConnected||(k.href=M({mapPermit:T.numeroPermiso}),k.hidden=!1)}).catch(()=>{}),d.querySelector(".pm-back").addEventListener("click",()=>{g(null),h.length?n():r()}),d.querySelector(".pm-share").addEventListener("click",N=>{var I;const T=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(s.Numero)}`;(I=navigator.clipboard)==null||I.writeText(T).then(()=>{N.target.textContent="Enlace copiado"},()=>{})}),d.querySelectorAll("[data-law]").forEach(N=>N.addEventListener("click",()=>{const T=C.find(I=>String(I.id)===N.dataset.law);T&&b(T)}))}async function w(s){const A=++u;d.innerHTML=F(2),m.textContent="Buscando el permiso…";try{const e=await W({numero:s,length:10});if(!f||A!==u)return;const y=e.rows.find(C=>V(C.Numero)===V(s))||(e.rows.length===1?e.rows[0]:null);if(y){h=[],L(y,{updateRoute:!1});return}t.numero.value=s,o.numero=s,h=e.rows,p=e.total,n()}catch{if(!f||A!==u)return;m.textContent="",d.innerHTML=B("el permiso")}}return t.addEventListener("submit",s=>{s.preventDefault(),Object.assign(o,{numero:t.numero.value.trim(),titular:t.titular.value.trim(),proyecto:t.proyecto.value.trim(),start:0}),g(null),r()}),t.addEventListener("reset",()=>{Object.assign(o,{numero:"",titular:"",proyecto:"",start:0}),g(null),setTimeout(r)}),d.addEventListener("click",s=>{const A=s.target.closest("[data-page]");if(A){o.start=Math.max(0,o.start+Number(A.dataset.page)*de),r().then(()=>v.scrollIntoView({behavior:"smooth",block:"start"}));return}const e=s.target.closest("[data-permit]"),y=e&&h.find(C=>String(C.PermisoId)===e.dataset.permit);y&&L(y)}),l?w(l):r(),{openPermit:s=>w(s),showList:()=>{h.length?n():r()},destroy:()=>{f=!1,v.remove()}}}const ue=20,me=c=>ee(c,Y),Ke=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],We=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],Xe=1995;function Qe(c,i=[],{resolution:b=null,filters:l=null,onRoute:g=()=>{}}={}){const o={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let h=[],p=0,u=0,f=!0;const v=()=>typeof i=="function"?i()||[]:i,t=new Date().getFullYear(),m=Array.from({length:t-Xe+1},(e,y)=>t-y),d=document.createElement("div");d.className="pm-panel",d.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${m.map(e=>`<option>${e}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${Ke.map(e=>`<option value="${a(e)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${We.map(e=>`<option value="${a(e)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${Y}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,c.replaceChildren(d);const E=d.querySelector("form"),$=d.querySelector(".pm-status"),S=d.querySelector(".pm-body");function R(e){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${a(e.NumeroResolucion)}" data-sector="${fe(e.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${a(e.NumeroResolucion)}</span><span class="pm-date">${a(O(e.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${a(e.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${a(e.Proemio||"")}</span>
                <span class="pm-meta">${e.ModalidadResolucion?`<span class="pm-tag">${a(e.ModalidadResolucion)}</span>`:""}${e.NumeroActa?`<span>${a(e.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${a(X(e.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${a(e.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function n(){if(!h.length){$.textContent="",S.innerHTML=$e({title:"Ninguna resolución coincide",body:"Prueba con menos filtros o con una parte del texto."});return}const e=o.start+h.length;$.textContent=`${q(o.start+1)}–${q(e)} de ${D(p,"resolución","resoluciones")} · más recientes primero`,S.innerHTML=`
            <ul class="pm-list">${h.map(R).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${o.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${e<p?"":"disabled"}>Siguientes →</button>
            </nav>`}async function r(){const e=++u;S.innerHTML=F(6),$.textContent="Consultando las resoluciones de la CNE…";try{const y=await Z(o,{start:o.start,length:ue});if(!f||e!==u)return;h=y.rows,p=y.total,n()}catch{if(!f||e!==u)return;$.textContent="",S.innerHTML=me("las resoluciones")}}function P(e){const y=ie(e);return y.length?`<ul class="pm-found">${y.map((C,H)=>{const x=Oe(v(),C.law);return`<li data-found="${H}" ${x?`data-law-id="${a(x.id)}"`:""}>
                <p class="pm-found-law">${x?`<b>${a(x.siglas||"")}</b> `:""}${a(C.law)}${x?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${C.articles.map(k=>`<span class="pm-art" data-art="${a(k)}">Art. ${a(k)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${a(e)}</p></details>`:e?`<p class="pm-note">${a(e)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function L(e,y){const C=ie(y);await Promise.all(C.map(async(H,x)=>{const k=e.querySelector(`[data-found="${x}"][data-law-id]`);if(!k)return;const N=await ke(k.dataset.lawId,H.articles);!f||!k.isConnected||k.querySelectorAll("[data-art]").forEach(T=>{const I=N[T.dataset.art];if(!I)return;const _=document.createElement("button");_.type="button",_.className="pm-art is-linked",_.dataset.article=I,_.textContent=T.textContent,_.title="Abrir el artículo",T.replaceWith(_)})}))}function w(e,{updateRoute:y=!0}={}){y&&g(e.NumeroResolucion);const C=Ae(e.Proemio),H=Me(e),x=X(e.ResolucionId);$.textContent="",S.innerHTML=`
            <article class="pm-detail" data-sector="${fe(e.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${a(e.TipoResolucion||"Resolución")}${e.ModalidadResolucion?` · ${a(e.ModalidadResolucion)}`:""}</span><span class="pm-date">${a(O(e.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${a(e.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${a(e.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${x?`<a class="pm-btn pm-btn-primary" href="${a(x)}" target="_blank" rel="noopener">${ve}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${a(O(e.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${a(e.NumeroActa||"—")}</dd></div>
                    ${e.Ponente?`<div><dt>Ponente</dt><dd>${a(e.Ponente)}</dd></div>`:""}
                </dl>
                ${C.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${C.map(k=>`<a class="pm-law" href="${M({permit:k})}"><b>Permiso</b><span>${a(k)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${P(e.Fundamentacion||"")}</div>
                    ${H?ye(H,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,S.scrollIntoView({behavior:"smooth",block:"start"}),L(S.querySelector(".pm-found-host"),e.Fundamentacion||"").catch(()=>{}),S.querySelector(".pm-back").addEventListener("click",()=>{g(null),h.length?n():r()}),S.querySelector(".pm-share").addEventListener("click",k=>{var T;const N=`${location.origin}${location.pathname}${M({resolution:e.NumeroResolucion})}`;(T=navigator.clipboard)==null||T.writeText(N).then(()=>{k.target.textContent="Enlace copiado"},()=>{})})}async function s(e){const y=++u;S.innerHTML=F(2),$.textContent="Buscando la resolución…";try{const C=await xe(e);if(!f||y!==u)return;if(C){h=[],w(C,{updateRoute:!1});return}E.numero.value=e,o.numero=e,r()}catch{if(!f||y!==u)return;$.textContent="",S.innerHTML=me("la resolución")}}E.addEventListener("submit",e=>{e.preventDefault(),Object.assign(o,{numero:E.numero.value.trim(),texto:E.texto.value.trim(),fecha:E.fecha.value,tipo:E.tipo.value.trim(),modalidad:E.modalidad.value.trim(),start:0}),g(null),r()}),E.addEventListener("reset",()=>{Object.assign(o,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),g(null),setTimeout(r)}),S.addEventListener("click",e=>{const y=e.target.closest("[data-article]");if(y){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:y.dataset.article,list:[y.dataset.article]}}));return}const C=e.target.closest("[data-page]");if(C){o.start=Math.max(0,o.start+Number(C.dataset.page)*ue),r().then(()=>d.scrollIntoView({behavior:"smooth",block:"start"}));return}const H=e.target.closest("[data-resolution]"),x=H&&h.find(k=>k.NumeroResolucion===H.dataset.resolution);x&&w(x)});function A(e={}){Object.assign(o,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...e,start:0});for(const y of["numero","texto","fecha","tipo","modalidad"])E[y].value=o[y]||"";r()}return b?s(b):l&&Object.keys(l).length?A(l):r(),{openResolution:e=>s(e),applyFilters:A,showList:()=>{h.length?n():r()},destroy:()=>{f=!1,d.remove()}}}function fe(c=""){const i=c.toLowerCase();return/el[eé]ctric/.test(i)?"electricidad":/licuado/.test(i)?"gaslp":/gas natural/.test(i)?"gasnatural":/petrol|hidrocarb/.test(i)?"petroliferos":"otro"}const Ee="cne-panorama-v1",Ze=12*60*60*1e3,be=12,J=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],Q=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function et(c,i=3){const b=[];for(let l=0;l<c.length;l+=i)b.push(...await Promise.all(c.slice(l,l+i).map(g=>g())));return b}function tt(){try{const c=JSON.parse(localStorage.getItem(Ee)||"null");return c&&Date.now()-c.at<Ze?c.data:null}catch{return null}}function at(c){try{localStorage.setItem(Ee,JSON.stringify({at:Date.now(),data:c}))}catch{}}async function st(){const i=new Date().getFullYear(),b=Array.from({length:be},(f,v)=>i-be+1+v),[l,g,...o]=await et([()=>W({length:1}).then(f=>f.total),()=>j({}),...b.map(f=>()=>j({fecha:String(f)})),...J.map(f=>()=>j({fecha:String(i),tipo:f})),...Q.map(f=>()=>j({fecha:String(i),modalidad:f.filter}))]),h=b.map((f,v)=>({year:f,count:o[v]})),p=J.map((f,v)=>({label:f,count:o[b.length+v]})),u=Q.map((f,v)=>({label:f.label,count:o[b.length+J.length+v]}));return{year:i,permits:l,resolutions:g,thisYear:h.at(-1).count,perYear:h,byType:p,byMode:u,at:Date.now()}}function nt(c){let i=!0;const b=document.createElement("div");b.className="pm-panel pn-view",b.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${Y}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,c.replaceChildren(b);const l=b.querySelector(".pm-status"),g=b.querySelector(".pn-body"),o=(p,u,f)=>{const v=Math.max(1,...p.map(t=>t.count));return`<ul class="pn-bars">${p.filter(t=>t.count>0).sort((t,m)=>m.count-t.count).map((t,m)=>`
            <li><a class="pn-bar-row" href="${M({tab:"resoluciones",filters:f(t)})}" data-tip="${a(`${t.label}: ${q(t.count)} ${u}. Ver cuáles`)}" style="--i:${m}">
                <span class="pn-bar-label">${a(t.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(t.count/v*100))}%"></span></span>
                <span class="pn-bar-value">${q(t.count)}<span class="sr-only"> ${u}</span></span>
            </a></li>`).join("")}</ul>`};function h(p,u,f){const v=Math.max(1,...p.perYear.map(t=>t.count));l.textContent=`Actualizado ${new Date(p.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,g.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${M({tab:"permisos"})}"><b>${q(p.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${M({tab:"resoluciones"})}"><b>${q(p.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${q(p.thisYear)}</b><span>resoluciones en ${p.year}</span></div>
                ${f?`<a class="pn-kpi" href="${M({tab:"resoluciones"})}"><b>${a(O(f.date))}</b><span>última sesión (${a(f.acta)})${f.count?`: ${D(f.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${p.perYear.map((t,m)=>`
                    <li><a href="${M({tab:"resoluciones",filters:{fecha:String(t.year)}})}" data-tip="${a(`${t.year}: ${q(t.count)} resoluciones. Ver cuáles`)}" style="--i:${m}">
                        <span class="pn-col-value">${q(t.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(t.count/v*100))}%"></span>
                        <span class="pn-col-label">${t.year===p.year?`${t.year}*`:t.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${p.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${p.year} por tipo</h3>${o(p.byType,"resoluciones",t=>({fecha:String(p.year),tipo:t.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${p.year} por modalidad</h3>${o(p.byMode,"resoluciones",t=>{var m;return{fecha:String(p.year),modalidad:((m=Q.find(d=>d.label===t.label))==null?void 0:m.filter)||t.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${u.length?`<ol class="pn-latest">${u.map(t=>`
                    <li><a href="${M({resolution:t.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${a(t.NumeroResolucion)}</b><time>${a(O(t.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${a(t.TipoResolucion||"")}${t.ModalidadResolucion?` · ${a(t.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${a(t.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const p=Z({},{length:8}).then(m=>m.rows).catch(()=>[]);let u=tt();u||(u=await st(),at(u));const f=await p,v=f[0],t=v!=null&&v.NumeroActa?{date:v.FechaResolucion,acta:v.NumeroActa,count:await j({acta:v.NumeroActa}).catch(()=>0)}:null;i&&h(u,f,t)}catch{if(!i)return;l.textContent="",g.innerHTML=ee("las cifras",Y)}})(),{destroy:()=>{i=!1,b.remove()}}}const K={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},ot=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function it(c,i=[],{tramite:b=null,onOpenLaw:l=()=>{},onRoute:g=()=>{}}={}){let o=!0;const h=()=>typeof i=="function"?i()||[]:i,p=d=>d.map(E=>ge(h(),E)).filter(Boolean),u=document.createElement("div");u.className="pm-panel tr-view",c.replaceChildren(u);function f(){const d=[...new Set(re.map(E=>E.sector))];u.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${d.map(E=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${E}">
                    <h3 id="tr-sector-${E}" class="tr-sector-title">${a(K[E]||E)}</h3>
                    <ul class="pm-list">${re.filter($=>$.sector===E).map($=>{const S=p([...$.base,...$.rules,...$.forms,...$.calls]).length,R=p($.forms).length,n=p($.calls).length;return`<li><a class="pm-card tr-card" href="${M({tramite:$.id})}" data-sector="${$.sector}">
                            <span class="pm-card-top"><span class="pm-num">Guía de trámite</span>${n?'<span class="pm-estado is-info">Con convocatoria</span>':'<span class="pm-estado is-off">Sin convocatoria</span>'}</span>
                            <span class="pm-holder">${a($.title)}</span>
                            ${$.scenario?`<span class="pm-alias">${a($.scenario)}</span>`:""}
                            <span class="pm-meta"><span class="pm-tag">${a(K[$.sector]||"")}</span><span>${q(S)} instrumentos</span>${R?"<span>Formatos oficiales</span>":""}</span>
                            <span class="pm-card-tools tr-card-go">Ver guía <span aria-hidden="true">→</span></span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function v(d){return`<button type="button" class="pm-law" data-law="${a(d.id)}"><b>${a(d.siglas||"")}</b><span>${a(d.titulo)}</span></button>`}function t(d){const E=ot.map(n=>{let r=p(d[n.key]);return n.key==="calls"&&(r=r.sort((P,L)=>String(L.fecha_publicacion||"").localeCompare(String(P.fecha_publicacion||"")))),{...n,laws:r}}).filter(n=>n.laws.length);u.innerHTML=`
            <article class="pm-detail" data-sector="${d.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${M({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${a(K[d.sector]||"")}</span></div>
                    <h2 id="tr-title">${a(d.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${E.map(n=>`
                    <section class="pm-section" aria-labelledby="tr-${n.key}">
                        <h3 id="tr-${n.key}">${a(n.title)}</h3>
                        <p class="pm-note">${a(n.note)}</p>
                        <div class="pm-laws">${n.laws.map(v).join("")}</div>
                    </section>`).join("")}
                <section class="pm-section" aria-labelledby="tr-articles">
                    <h3 id="tr-articles">Artículos clave</h3>
                    <p class="pm-note">Artículos y numerales del acervo que tratan este trámite, por relevancia.</p>
                    <div class="tr-articles"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>
                ${d.resolutions?`<section class="pm-section" aria-labelledby="tr-res">
                    <h3 id="tr-res">Resoluciones recientes de la CNE</h3>
                    <p class="pm-note">Antecedentes de este tipo de trámite, de lo más reciente a lo más antiguo.</p>
                    <div class="tr-res"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>`:""}
            </article>`,u.querySelector(".pm-share").addEventListener("click",n=>{var P;const r=`${location.origin}${location.pathname}${M({tramite:d.id})}`;(P=navigator.clipboard)==null||P.writeText(r).then(()=>{n.target.textContent="Enlace copiado"},()=>{})});const $=p(d.articles.in).map(n=>n.id),S=u.querySelector(".tr-articles");Ie(d.articles.query,{lawIds:$,limit:24}).then(({data:n})=>{if(!o||!S.isConnected)return;const r=new Map,P=(n||[]).filter(L=>L.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(L.articulo_label||""))).filter(L=>{const w=r.get(L.ley_id)||0;return r.set(L.ley_id,w+1),w<3}).slice(0,8);S.innerHTML=P.length?`<ol class="tr-article-list">${P.map(L=>{var w;return`
                <li><button type="button" class="tr-article" data-article="${a(L.id)}">
                    <span class="tr-article-top"><b>${a(L.siglas_ley||((w=h().find(s=>String(s.id)===String(L.ley_id)))==null?void 0:w.siglas)||"")}</b> ${a(L.articulo_label||"")}</span>
                    <span class="tr-article-text">${a(String(L.fragmento||L.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',S.dataset.ids=JSON.stringify(P.map(L=>L.id))}).catch(()=>{S.isConnected&&(S.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const R=u.querySelector(".tr-res");R&&Z(d.resolutions,{length:6}).then(({rows:n,total:r})=>{!o||!R.isConnected||(R.innerHTML=n.length?`
                    <ol class="pn-latest">${n.map(P=>`
                        <li><a href="${M({resolution:P.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${a(P.NumeroResolucion)}</b><time>${a(O(P.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${a(P.TipoResolucion||"")}${P.ModalidadResolucion?` · ${a(P.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${a(P.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${q(r)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{R.isConnected&&(R.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}u.addEventListener("click",d=>{var S;const E=d.target.closest("[data-law]");if(E){const R=h().find(n=>String(n.id)===E.dataset.law);R&&l(R);return}const $=d.target.closest("[data-article]");if($){let R=[];try{R=JSON.parse(((S=$.closest(".tr-articles"))==null?void 0:S.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:$.dataset.article,list:R.length?R:[$.dataset.article]}}))}});function m(d){const E=d&&qe(d);E?t(E):f(),u.scrollIntoView({behavior:"smooth",block:"start"})}return m(b),{openTramite:d=>m(d),showList:()=>m(null),destroy:()=>{o=!1,u.remove()},onRoute:g}}const Se="cne-pestanas-vistas",Te=()=>{try{return new Set(JSON.parse(localStorage.getItem(Se)||"[]"))}catch{return new Set}};function rt(c){const i=Te();if(!i.has(c)){i.add(c);try{localStorage.setItem(Se,JSON.stringify([...i]))}catch{}}}const G=[{id:"permisos",group:"CNE",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",group:"CNE",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",group:"CNE",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",group:"CNE",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."},{id:"mapa",group:"CNE",label:"Mapa",intro:"Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos."},{id:"sener",group:"SENER",label:"Títulos y permisos",intro:"Títulos y permisos de la Secretaría de Energía: asignaciones, pozos, contratos de exploración y extracción, comercio exterior y biocombustibles, con su fuente oficial."}],z=[{id:"cne",short:"CNE",name:"Comisión Nacional de Energía"},{id:"sener",short:"SENER",name:"Secretaría de Energía"}];function Ne(c){const i=z.find(b=>b.id===c)||z[0];return`<b>${i.short}</b>${i.name}`}function lt(c,i,{route:b={tab:"permisos"},onOpenLaw:l=()=>{},setHash:g=()=>{}}={}){let o=null,h=null;const p=document.createElement("section");p.className="pm-view",p.setAttribute("aria-labelledby","pm-title"),p.innerHTML=`
        <div class="pm-head">
            <nav class="bu-seg pm-aut-switch" aria-label="Autoridad">${z.map(t=>`<a href="${t.id==="sener"?"#sener":"#permisos"}" data-aut-link="${t.id}">${t.short}</a>`).join("")}</nav>
            <p class="pm-autoridad" data-authority></p>
            <h1 id="pm-title">Permisos de energía</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de permisos">
                ${z.map(t=>`<div class="pm-tab-grupo" data-aut="${t.id}"><span class="pm-tab-group" aria-hidden="true">${t.short}</span>${G.filter(m=>m.group===t.short).map(m=>`<a role="tab" class="pm-tab" id="pm-tab-${m.id}" href="${M({tab:m.id})}" data-tab="${m.id}" aria-controls="pm-tabpanel" aria-label="${m.label} · ${m.group}">${m.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}</div>`).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,c.replaceChildren(p);const u=p.querySelector(".pm-tabpanel");function f(t,m){o==null||o.destroy(),h=t,rt(t);const d=Te();p.querySelectorAll(".pm-tab").forEach(n=>{const r=!d.has(n.dataset.tab)&&n.dataset.tab!=="permisos";n.classList.toggle("is-new",r),r?n.setAttribute("aria-description","Nueva sección"):n.removeAttribute("aria-description")});const E=G.find(n=>n.id===t)||G[0];p.querySelector(".pm-intro").textContent=E.intro,p.querySelector("[data-authority]").innerHTML=Ne(t==="sener"?"sener":"cne"),p.classList.toggle("en-sener",t==="sener");const $=t==="sener"?"sener":"cne";p.querySelectorAll(".pm-tab-grupo").forEach(n=>{n.hidden=n.dataset.aut!==$}),p.querySelector(".pm-tabs").hidden=G.filter(n=>n.group===$.toUpperCase()).length<2,p.querySelectorAll("[data-aut-link]").forEach(n=>{n.dataset.autLink===$?n.setAttribute("aria-current","page"):n.removeAttribute("aria-current")}),p.classList.toggle("en-mapa",t==="mapa"),p.querySelectorAll(".pm-tab").forEach(n=>{const r=n.dataset.tab===t;n.setAttribute("aria-selected",String(r)),n.classList.toggle("is-on",r)});const S=p.querySelector(".pm-tabs"),R=p.querySelector(".pm-tab.is-on");if(R&&(S.scrollLeft+=R.getBoundingClientRect().left-S.getBoundingClientRect().left-(S.clientWidth-R.offsetWidth)/2),u.setAttribute("aria-labelledby",`pm-tab-${t}`),t==="resoluciones")o=Qe(u,i,{resolution:m.resolution||null,filters:m.filters||null,onRoute:n=>g(M({tab:t,resolution:n}))});else if(t==="tramites")o=it(u,i,{tramite:m.tramite||null,onOpenLaw:l});else if(t==="panorama")o=nt(u);else if(t==="sener"){const n={destroyed:!1,view:null,record:m.record||null,destroy(){var r;this.destroyed=!0,(r=this.view)==null||r.destroy()},openRecord(r){this.view?this.view.openRecord(r):this.record=r},showList(){var r;this.record=null,(r=this.view)==null||r.showList()}};o=n,u.innerHTML='<p class="pm-loading">Cargando los títulos de la SENER…</p>',le(()=>import("./cne-sener-view-oSxW46AM.js"),__vite__mapDeps([0,1,2,3,4,5,6,7])).then(r=>r.renderCneSenerView(u,{catalog:i,onOpenLaw:l,record:n.record,onRoute:P=>g(M(P?{record:P}:{tab:"sener"}))})).then(r=>{n.destroyed?r.destroy():n.view=r}).catch(()=>{n.destroyed||(u.innerHTML='<p class="pm-loading">No se pudo cargar esta sección. Revisa tu conexión e intenta de nuevo.</p>')})}else if(t==="mapa"){const n={destroyed:!1,view:null,permit:m.mapPermit||null,destroy(){var r;this.destroyed=!0,(r=this.view)==null||r.destroy()},focusPermit(r){this.view?this.view.focusPermit(r):this.permit=r}};o=n,u.innerHTML='<p class="pm-loading">Cargando el mapa…</p>',le(()=>import("./permits-map-view-MRHgcL4k.js"),__vite__mapDeps([8,1,2,9,10,5,3,4,6,11,12,13])).then(r=>r.renderPermitsMapView(u,{permit:n.permit})).then(r=>{n.destroyed?r.destroy():n.view=r}).catch(()=>{n.destroyed||(u.innerHTML='<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>')})}else o=Je(u,i,{permit:m.permit||null,onOpenLaw:l,onRoute:n=>g(M({tab:t,permit:n}))})}function v(t={tab:"permisos"}){const m=t.tab||"permisos";if(m!==h){f(m,t);return}m==="permisos"?t.permit?o.openPermit(t.permit):o.showList():m==="resoluciones"?t.resolution?o.openResolution(t.resolution):t.filters&&Object.keys(t.filters).length?o.applyFilters(t.filters):o.showList():m==="tramites"?t.tramite?o.openTramite(t.tramite):o.showList():m==="mapa"&&t.mapPermit?o.focusPermit(t.mapPermit):m==="sener"&&(t.record?o.openRecord(t.record):o.showList())}return v(b),{go:v,destroy:()=>{o==null||o.destroy(),p.remove()}}}const ut=Object.freeze(Object.defineProperty({__proto__:null,authorityTag:Ne,renderCneView:lt},Symbol.toStringTag,{value:"Module"}));export{ut as c,je as p,Be as t};
