const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/cne-sener-view-SHAcA_6o.js","assets/index-Bh104QL1.js","assets/index-C-bYM-Kx.css","assets/permits-map-ShbW0NoQ.js","assets/permits-map-CflzZUgv.css","assets/tech-markers-DLyvz8YI.js","assets/map-common-CUgaxD19.js","assets/cne-sener-view-CZwVSzJo.css","assets/permits-map-view-BO_j-3xr.js","assets/leaflet-src-De2SSmXW.js","assets/_commonjsHelpers-Cpj98o6Y.js","assets/cne-shared-DMDPvk_7.js","assets/leaflet-Dgihpmma.css","assets/MarkerCluster-4Oo7lyRB.css"])))=>i.map(i=>d[i]);
import{t as U,R as $e,v as W,w as Pe,x as se,y as oe,z as ne,B as M,C as Re,D as Z,E as Le,F as Ae,q as ye,G as Y,H as Q,J as Me,K as xe,L as ke,M as ie,N as qe,O as j,Q as Ie,S as we,T as re,_ as le}from"./index-Bh104QL1.js";import{T as _e,i as He,a as Oe}from"./tech-markers-DLyvz8YI.js";import{s as F,e as a,d as O,n as q,g as ve,P as ge,f as V,p as D,a as ee,l as Ee,b as Fe}from"./cne-shared-DMDPvk_7.js";const ce={electricidad:"--col-leyes",petroliferos:"--col-convocatorias",gaslp:"--col-normas",gasnatural:"--col-dacg",otro:"--col-otros"},te=p=>String(p??"").toUpperCase().trim().replace(/^CNE\//,"");function je(p){const i=te(p).split("/"),b=i.slice(2),l=(...n)=>n.some(h=>b.includes(h)),g=U(p).activity;return i[0]==="E"?l("IMP")?["importacion","Importación"]:l("EXP")?["importacion","Exportación"]:l("COG")?["termica","Cogeneración"]:l("AUT","AUTC")?["autoconsumo","Autoabastecimiento"]:l("PP")?["generacion","Pequeña producción"]:l("PIE")?["generacion","Producción independiente"]:l("GEN")?["generacion","Generación"]:["otro",g||"Permiso"]:l("AE")?["aerodromo",l("ALM")?"Almacenamiento en aeródromo":"Expendio en aeródromo"]:l("ALM")?["almacenamiento","Almacenamiento"]:l("TRA")?l("OM")?["distribucion","Transporte sin ducto"]:l("TM")?["distribucion","Transporte"]:["ducto","Transporte por ducto"]:l("DIST","DIS")?l("PLA")?["planta","Planta de distribución"]:["distribucion","Distribución"]:l("EXP")?l("AUT","ESA")?["autoconsumo","Autoconsumo"]:["estacion","Estación de servicio"]:l("COMP","DESC","LICUE","REG")?["planta",g||"Instalación"]:l("COM")?["comercio","Comercialización"]:["otro",g||"Permiso"]}function De(p,{technology:i=""}={}){var n;const b=((n=U(p).sector)==null?void 0:n.id)||"otro";if(b==="electricidad"&&i){const h=Oe("electricidad",{tecnologia:i});if(h.tech)return{icon:h.icon,label:h.label,tech:h.tech,sector:b}}const[l,g]=je(p);return{icon:l,label:g,sector:b}}function Ve(p){const i=[1,3,5].map(l=>parseInt(p.slice(l,l+2),16)/255).map(l=>l<=.03928?l/12.92:((l+.055)/1.055)**2.4);return 1.05/(.2126*i[0]+.7152*i[1]+.0722*i[2]+.05)>=3?"#fff":"#0a0707"}function Be(p){try{return getComputedStyle(document.documentElement).getPropertyValue(p).trim()}catch{return""}}function Ge(p,{size:i=""}={}){const b=p.tech?`--tec-${p.tech}`:ce[p.sector]||ce.otro,l=Be(b),g=/^#[0-9a-f]{6}$/i.test(l)?Ve(l):"#fff",n=p.tech?`<svg viewBox="0 0 24 24" aria-hidden="true">${_e[p.tech].glyph}</svg>`:He(p.icon,21);return`<span class="bu-ico${i?` is-${i}`:""}" style="--c:var(${b});--t:${g}" aria-hidden="true">${n}</span>`}let pe=null;function Ue(p=i=>fetch(i,{credentials:"same-origin"}).then(b=>{if(!b.ok)throw new Error(`HTTP ${b.status}`);return b.json()})){return pe??(pe=Promise.resolve().then(()=>p("/api/mapa/capa?tipo=electricidad")).then(i=>{const b=new Map;for(const l of(i==null?void 0:i.features)||[]){const{numeroPermiso:g,tecnologia:n}=l.properties||{};g&&n&&b.set(te(g),n)}return b}).catch(()=>new Map)),pe}function Ye(p,i){return(p==null?void 0:p.get(te(i)))||""}const de=20,ze=1500,B=p=>ee(p,$e),Je={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function Ke(p,i=[],{onOpenLaw:b=()=>{},permit:l=null,onRoute:g=()=>{}}={}){const n={numero:"",titular:"",proyecto:"",start:0};let h=[],c=0,m=0,f=!0;const v=document.createElement("div");v.className="pm-panel",v.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${$e}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,p.replaceChildren(v);const e=v.querySelector(".pm-form"),u=v.querySelector(".pm-status"),d=v.querySelector(".pm-body");let E=null;const $=async()=>{E??(E=await Promise.race([Ue(),new Promise(s=>setTimeout(()=>s(null),ze))]))};function S(s){return s?`<span class="pm-estado is-${Je[s]||"off"}">${a(s)}</span>`:""}function R(s){const A=De(s.Numero,{technology:Ye(E,s.Numero)}),{sector:t,activity:y}=U(s.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${a(s.PermisoId)}" data-sector="${(t==null?void 0:t.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${a(s.Numero)}</span>${S(s.Estado)}</span>
                <span class="pm-tipo">${Ge(A)}<span class="pm-tipo-t">${a(A.label)}</span></span>
                <span class="pm-holder">${a(s.Persona||"Titular sin dato")}</span>
                ${s.AliasProyecto?`<span class="pm-alias">${a(s.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${t?`<span class="pm-tag">${a(t.label)}${y?` · ${a(y)}`:""}</span>`:""}
                    <span>${D(s.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${s.AnexosAsociados?`<span>${D(s.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${oe(ne(s.Numero),{compact:!0})}<a class="pm-card-pdf" href="${se(s.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${a(s.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function o(){if(!h.length){u.textContent="",d.innerHTML=ye({title:"Ningún permiso coincide",body:"Revisa el número o prueba con una parte del nombre del titular."});return}const s=n.start+1,A=n.start+h.length;u.textContent=`${q(s)}–${q(A)} de ${D(c,"permiso","permisos")}`,d.innerHTML=`
            <ul class="pm-list">${h.map(R).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${A<c?"":"disabled"}>Siguientes →</button>
            </nav>`}async function r(){const s=++m;d.innerHTML=F(6),u.textContent="Consultando el registro de la CNE…";try{const[A]=await Promise.all([W({...n,length:de}),$()]);if(!f||s!==m)return;h=A.rows,c=A.total,o()}catch{if(!f||s!==m)return;u.textContent="",d.innerHTML=B("los permisos")}}function P(s){if(!s)return[];const A=typeof i=="function"?i()||[]:i;return s.laws.map(t=>Ee(A,t)).filter((t,y,N)=>t&&N.indexOf(t)===y)}async function L(s,{updateRoute:A=!0}={}){A&&g(s.Numero);const{sector:t,activity:y}=U(s.Numero),N=P(t),w=Pe(s.Numero);u.textContent="",d.innerHTML=`
            <article class="pm-detail" data-sector="${(t==null?void 0:t.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${t?`${a(t.label)}${y?` · ${a(y)}`:""}`:"Permiso"}</span>${S(s.Estado)}</div>
                    <h2 id="pm-detail-title">${a(s.Numero)}</h2>
                    <p class="pm-holder">${a(s.Persona||"Titular sin dato")}</p>
                    ${s.AliasProyecto?`<p class="pm-alias">${a(s.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${se(s.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${oe(ne(s.Numero))}
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
                    ${N.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${N.map(C=>`<button type="button" class="pm-law" data-law="${a(C.id)}"><b>${a(C.siglas||"")}</b><span>${a(C.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${w?ve(w):""}
                </section>
            </article>`,d.scrollIntoView({behavior:"smooth",block:"start"});const x=d.querySelector(".pm-res");if(Re(s.ExpedienteId).then(C=>{!f||!x.isConnected||(x.innerHTML=C.length?`<ol class="pm-timeline">${C.map((T,I)=>{const _=Z(T.REsolucionId);return`
                <li class="${I===0?"is-first":""}">
                    <time>${a(O(T.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${a(T.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${a(T.NumeroResolucion||"")}</b>${T.Acta?` · Acta ${a(T.Acta)}`:""}${T.Modalidad?` · ${a(T.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${_?`<a class="pm-res-pdf" href="${a(_)}" target="_blank" rel="noopener" aria-label="Ver resolución ${a(T.NumeroResolucion||"")} en PDF">${ge}Ver resolución (PDF)</a>`:""}
                            ${T.NumeroResolucion?`<a class="pm-res-more" href="${M({resolution:T.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{x.isConnected&&(x.innerHTML=B("las resoluciones"))}),s.AnexosAsociados){const C=d.querySelector(".pm-anx");Le(s.PermisoId).then(T=>{!f||!C.isConnected||(C.innerHTML=T.length?`<ul class="pm-annexes">${T.map(I=>{const _=Ae(I),ae=a(I.Descripcion||"Anexo");return`<li>${_?`<a href="${a(_)}" target="_blank" rel="noopener">${ae}</a>`:`<span>${ae}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{C.isConnected&&(C.innerHTML=B("los anexos"))})}const k=d.querySelector("[data-map-link]");fetch(`/api/mapa/buscar?q=${encodeURIComponent(s.Numero)}&limite=5`,{credentials:"same-origin"}).then(C=>C.ok?C.json():null).then(C=>{const T=((C==null?void 0:C.resultados)||[]).find(I=>V(I.numeroPermiso)===V(s.Numero)&&I.latitud!=null);!f||!T||!k.isConnected||(k.href=M({mapPermit:T.numeroPermiso}),k.hidden=!1)}).catch(()=>{}),d.querySelector(".pm-back").addEventListener("click",()=>{g(null),h.length?o():r()}),d.querySelector(".pm-share").addEventListener("click",C=>{var I;const T=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(s.Numero)}`;(I=navigator.clipboard)==null||I.writeText(T).then(()=>{C.target.textContent="Enlace copiado"},()=>{})}),d.querySelectorAll("[data-law]").forEach(C=>C.addEventListener("click",()=>{const T=N.find(I=>String(I.id)===C.dataset.law);T&&b(T)}))}async function H(s){const A=++m;d.innerHTML=F(2),u.textContent="Buscando el permiso…";try{const t=await W({numero:s,length:10});if(!f||A!==m)return;const y=t.rows.find(N=>V(N.Numero)===V(s))||(t.rows.length===1?t.rows[0]:null);if(y){h=[],L(y,{updateRoute:!1});return}e.numero.value=s,n.numero=s,h=t.rows,c=t.total,o()}catch{if(!f||A!==m)return;u.textContent="",d.innerHTML=B("el permiso")}}return e.addEventListener("submit",s=>{s.preventDefault(),Object.assign(n,{numero:e.numero.value.trim(),titular:e.titular.value.trim(),proyecto:e.proyecto.value.trim(),start:0}),g(null),r()}),e.addEventListener("reset",()=>{Object.assign(n,{numero:"",titular:"",proyecto:"",start:0}),g(null),setTimeout(r)}),d.addEventListener("click",s=>{const A=s.target.closest("[data-page]");if(A){n.start=Math.max(0,n.start+Number(A.dataset.page)*de),r().then(()=>v.scrollIntoView({behavior:"smooth",block:"start"}));return}const t=s.target.closest("[data-permit]"),y=t&&h.find(N=>String(N.PermisoId)===t.dataset.permit);y&&L(y)}),l?H(l):r(),{openPermit:s=>H(s),showList:()=>{h.length?o():r()},destroy:()=>{f=!1,v.remove()}}}const ue=20,me=p=>ee(p,Y),We=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],Ze=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],Xe=1995;function Qe(p,i=[],{resolution:b=null,filters:l=null,onRoute:g=()=>{}}={}){const n={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let h=[],c=0,m=0,f=!0;const v=()=>typeof i=="function"?i()||[]:i,e=new Date().getFullYear(),u=Array.from({length:e-Xe+1},(t,y)=>e-y),d=document.createElement("div");d.className="pm-panel",d.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${u.map(t=>`<option>${t}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${We.map(t=>`<option value="${a(t)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${Ze.map(t=>`<option value="${a(t)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${Y}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,p.replaceChildren(d);const E=d.querySelector("form"),$=d.querySelector(".pm-status"),S=d.querySelector(".pm-body");function R(t){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${a(t.NumeroResolucion)}" data-sector="${fe(t.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${a(t.NumeroResolucion)}</span><span class="pm-date">${a(O(t.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${a(t.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${a(t.Proemio||"")}</span>
                <span class="pm-meta">${t.ModalidadResolucion?`<span class="pm-tag">${a(t.ModalidadResolucion)}</span>`:""}${t.NumeroActa?`<span>${a(t.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${a(Z(t.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${a(t.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function o(){if(!h.length){$.textContent="",S.innerHTML=ye({title:"Ninguna resolución coincide",body:"Prueba con menos filtros o con una parte del texto."});return}const t=n.start+h.length;$.textContent=`${q(n.start+1)}–${q(t)} de ${D(c,"resolución","resoluciones")} · más recientes primero`,S.innerHTML=`
            <ul class="pm-list">${h.map(R).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${t<c?"":"disabled"}>Siguientes →</button>
            </nav>`}async function r(){const t=++m;S.innerHTML=F(6),$.textContent="Consultando las resoluciones de la CNE…";try{const y=await Q(n,{start:n.start,length:ue});if(!f||t!==m)return;h=y.rows,c=y.total,o()}catch{if(!f||t!==m)return;$.textContent="",S.innerHTML=me("las resoluciones")}}function P(t){const y=ie(t);return y.length?`<ul class="pm-found">${y.map((N,w)=>{const x=Fe(v(),N.law);return`<li data-found="${w}" ${x?`data-law-id="${a(x.id)}"`:""}>
                <p class="pm-found-law">${x?`<b>${a(x.siglas||"")}</b> `:""}${a(N.law)}${x?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${N.articles.map(k=>`<span class="pm-art" data-art="${a(k)}">Art. ${a(k)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${a(t)}</p></details>`:t?`<p class="pm-note">${a(t)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function L(t,y){const N=ie(y);await Promise.all(N.map(async(w,x)=>{const k=t.querySelector(`[data-found="${x}"][data-law-id]`);if(!k)return;const C=await qe(k.dataset.lawId,w.articles);!f||!k.isConnected||k.querySelectorAll("[data-art]").forEach(T=>{const I=C[T.dataset.art];if(!I)return;const _=document.createElement("button");_.type="button",_.className="pm-art is-linked",_.dataset.article=I,_.textContent=T.textContent,_.title="Abrir el artículo",T.replaceWith(_)})}))}function H(t,{updateRoute:y=!0}={}){y&&g(t.NumeroResolucion);const N=Me(t.Proemio),w=xe(t),x=Z(t.ResolucionId);$.textContent="",S.innerHTML=`
            <article class="pm-detail" data-sector="${fe(t.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${a(t.TipoResolucion||"Resolución")}${t.ModalidadResolucion?` · ${a(t.ModalidadResolucion)}`:""}</span><span class="pm-date">${a(O(t.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${a(t.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${a(t.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${x?`<a class="pm-btn pm-btn-primary" href="${a(x)}" target="_blank" rel="noopener">${ge}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${a(O(t.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${a(t.NumeroActa||"—")}</dd></div>
                    ${t.Ponente?`<div><dt>Ponente</dt><dd>${a(t.Ponente)}</dd></div>`:""}
                </dl>
                ${N.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${N.map(k=>`<a class="pm-law" href="${M({permit:k})}"><b>Permiso</b><span>${a(k)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${P(t.Fundamentacion||"")}</div>
                    ${w?ve(w,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,S.scrollIntoView({behavior:"smooth",block:"start"}),L(S.querySelector(".pm-found-host"),t.Fundamentacion||"").catch(()=>{}),S.querySelector(".pm-back").addEventListener("click",()=>{g(null),h.length?o():r()}),S.querySelector(".pm-share").addEventListener("click",k=>{var T;const C=`${location.origin}${location.pathname}${M({resolution:t.NumeroResolucion})}`;(T=navigator.clipboard)==null||T.writeText(C).then(()=>{k.target.textContent="Enlace copiado"},()=>{})})}async function s(t){const y=++m;S.innerHTML=F(2),$.textContent="Buscando la resolución…";try{const N=await ke(t);if(!f||y!==m)return;if(N){h=[],H(N,{updateRoute:!1});return}E.numero.value=t,n.numero=t,r()}catch{if(!f||y!==m)return;$.textContent="",S.innerHTML=me("la resolución")}}E.addEventListener("submit",t=>{t.preventDefault(),Object.assign(n,{numero:E.numero.value.trim(),texto:E.texto.value.trim(),fecha:E.fecha.value,tipo:E.tipo.value.trim(),modalidad:E.modalidad.value.trim(),start:0}),g(null),r()}),E.addEventListener("reset",()=>{Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),g(null),setTimeout(r)}),S.addEventListener("click",t=>{const y=t.target.closest("[data-article]");if(y){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:y.dataset.article,list:[y.dataset.article]}}));return}const N=t.target.closest("[data-page]");if(N){n.start=Math.max(0,n.start+Number(N.dataset.page)*ue),r().then(()=>d.scrollIntoView({behavior:"smooth",block:"start"}));return}const w=t.target.closest("[data-resolution]"),x=w&&h.find(k=>k.NumeroResolucion===w.dataset.resolution);x&&H(x)});function A(t={}){Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...t,start:0});for(const y of["numero","texto","fecha","tipo","modalidad"])E[y].value=n[y]||"";r()}return b?s(b):l&&Object.keys(l).length?A(l):r(),{openResolution:t=>s(t),applyFilters:A,showList:()=>{h.length?o():r()},destroy:()=>{f=!1,d.remove()}}}function fe(p=""){const i=p.toLowerCase();return/el[eé]ctric/.test(i)?"electricidad":/licuado/.test(i)?"gaslp":/gas natural/.test(i)?"gasnatural":/petrol|hidrocarb/.test(i)?"petroliferos":"otro"}const Se="cne-panorama-v1",et=12*60*60*1e3,be=12,J=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],X=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function tt(p,i=3){const b=[];for(let l=0;l<p.length;l+=i)b.push(...await Promise.all(p.slice(l,l+i).map(g=>g())));return b}function at(){try{const p=JSON.parse(localStorage.getItem(Se)||"null");return p&&Date.now()-p.at<et?p.data:null}catch{return null}}function st(p){try{localStorage.setItem(Se,JSON.stringify({at:Date.now(),data:p}))}catch{}}async function ot(){const i=new Date().getFullYear(),b=Array.from({length:be},(f,v)=>i-be+1+v),[l,g,...n]=await tt([()=>W({length:1}).then(f=>f.total),()=>j({}),...b.map(f=>()=>j({fecha:String(f)})),...J.map(f=>()=>j({fecha:String(i),tipo:f})),...X.map(f=>()=>j({fecha:String(i),modalidad:f.filter}))]),h=b.map((f,v)=>({year:f,count:n[v]})),c=J.map((f,v)=>({label:f,count:n[b.length+v]})),m=X.map((f,v)=>({label:f.label,count:n[b.length+J.length+v]}));return{year:i,permits:l,resolutions:g,thisYear:h.at(-1).count,perYear:h,byType:c,byMode:m,at:Date.now()}}function nt(p){let i=!0;const b=document.createElement("div");b.className="pm-panel pn-view",b.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${Y}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,p.replaceChildren(b);const l=b.querySelector(".pm-status"),g=b.querySelector(".pn-body"),n=(c,m,f)=>{const v=Math.max(1,...c.map(e=>e.count));return`<ul class="pn-bars">${c.filter(e=>e.count>0).sort((e,u)=>u.count-e.count).map((e,u)=>`
            <li><a class="pn-bar-row" href="${M({tab:"resoluciones",filters:f(e)})}" data-tip="${a(`${e.label}: ${q(e.count)} ${m}. Ver cuáles`)}" style="--i:${u}">
                <span class="pn-bar-label">${a(e.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(e.count/v*100))}%"></span></span>
                <span class="pn-bar-value">${q(e.count)}<span class="sr-only"> ${m}</span></span>
            </a></li>`).join("")}</ul>`};function h(c,m,f){const v=Math.max(1,...c.perYear.map(e=>e.count));l.textContent=`Actualizado ${new Date(c.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,g.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${M({tab:"permisos"})}"><b>${q(c.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${M({tab:"resoluciones"})}"><b>${q(c.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${q(c.thisYear)}</b><span>resoluciones en ${c.year}</span></div>
                ${f?`<a class="pn-kpi" href="${M({tab:"resoluciones"})}"><b>${a(O(f.date))}</b><span>última sesión (${a(f.acta)})${f.count?`: ${D(f.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${c.perYear.map((e,u)=>`
                    <li><a href="${M({tab:"resoluciones",filters:{fecha:String(e.year)}})}" data-tip="${a(`${e.year}: ${q(e.count)} resoluciones. Ver cuáles`)}" style="--i:${u}">
                        <span class="pn-col-value">${q(e.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(e.count/v*100))}%"></span>
                        <span class="pn-col-label">${e.year===c.year?`${e.year}*`:e.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${c.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${c.year} por tipo</h3>${n(c.byType,"resoluciones",e=>({fecha:String(c.year),tipo:e.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${c.year} por modalidad</h3>${n(c.byMode,"resoluciones",e=>{var u;return{fecha:String(c.year),modalidad:((u=X.find(d=>d.label===e.label))==null?void 0:u.filter)||e.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${m.length?`<ol class="pn-latest">${m.map(e=>`
                    <li><a href="${M({resolution:e.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${a(e.NumeroResolucion)}</b><time>${a(O(e.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${a(e.TipoResolucion||"")}${e.ModalidadResolucion?` · ${a(e.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${a(e.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const c=Q({},{length:8}).then(u=>u.rows).catch(()=>[]);let m=at();m||(m=await ot(),st(m));const f=await c,v=f[0],e=v!=null&&v.NumeroActa?{date:v.FechaResolucion,acta:v.NumeroActa,count:await j({acta:v.NumeroActa}).catch(()=>0)}:null;i&&h(m,f,e)}catch{if(!i)return;l.textContent="",g.innerHTML=ee("las cifras",Y)}})(),{destroy:()=>{i=!1,b.remove()}}}const K={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},it=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function rt(p,i=[],{tramite:b=null,onOpenLaw:l=()=>{},onRoute:g=()=>{}}={}){let n=!0;const h=()=>typeof i=="function"?i()||[]:i,c=d=>d.map(E=>Ee(h(),E)).filter(Boolean),m=document.createElement("div");m.className="pm-panel tr-view",p.replaceChildren(m);function f(){const d=[...new Set(re.map(E=>E.sector))];m.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${d.map(E=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${E}">
                    <h3 id="tr-sector-${E}" class="tr-sector-title">${a(K[E]||E)}</h3>
                    <ul class="pm-list">${re.filter($=>$.sector===E).map($=>{const S=c([...$.base,...$.rules,...$.forms,...$.calls]).length,R=c($.forms).length,o=c($.calls).length;return`<li><a class="pm-card tr-card" href="${M({tramite:$.id})}" data-sector="${$.sector}">
                            <span class="pm-card-top"><span class="pm-num">Guía de trámite</span>${o?'<span class="pm-estado is-info">Con convocatoria</span>':'<span class="pm-estado is-off">Sin convocatoria</span>'}</span>
                            <span class="pm-holder">${a($.title)}</span>
                            ${$.scenario?`<span class="pm-alias">${a($.scenario)}</span>`:""}
                            <span class="pm-meta"><span class="pm-tag">${a(K[$.sector]||"")}</span><span>${q(S)} instrumentos</span>${R?"<span>Formatos oficiales</span>":""}</span>
                            <span class="pm-card-tools tr-card-go">Ver guía <span aria-hidden="true">→</span></span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function v(d){return`<button type="button" class="pm-law" data-law="${a(d.id)}"><b>${a(d.siglas||"")}</b><span>${a(d.titulo)}</span></button>`}function e(d){const E=it.map(o=>{let r=c(d[o.key]);return o.key==="calls"&&(r=r.sort((P,L)=>String(L.fecha_publicacion||"").localeCompare(String(P.fecha_publicacion||"")))),{...o,laws:r}}).filter(o=>o.laws.length);m.innerHTML=`
            <article class="pm-detail" data-sector="${d.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${M({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${a(K[d.sector]||"")}</span></div>
                    <h2 id="tr-title">${a(d.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${E.map(o=>`
                    <section class="pm-section" aria-labelledby="tr-${o.key}">
                        <h3 id="tr-${o.key}">${a(o.title)}</h3>
                        <p class="pm-note">${a(o.note)}</p>
                        <div class="pm-laws">${o.laws.map(v).join("")}</div>
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
            </article>`,m.querySelector(".pm-share").addEventListener("click",o=>{var P;const r=`${location.origin}${location.pathname}${M({tramite:d.id})}`;(P=navigator.clipboard)==null||P.writeText(r).then(()=>{o.target.textContent="Enlace copiado"},()=>{})});const $=c(d.articles.in).map(o=>o.id),S=m.querySelector(".tr-articles");we(d.articles.query,{lawIds:$,limit:24}).then(({data:o})=>{if(!n||!S.isConnected)return;const r=new Map,P=(o||[]).filter(L=>L.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(L.articulo_label||""))).filter(L=>{const H=r.get(L.ley_id)||0;return r.set(L.ley_id,H+1),H<3}).slice(0,8);S.innerHTML=P.length?`<ol class="tr-article-list">${P.map(L=>{var H;return`
                <li><button type="button" class="tr-article" data-article="${a(L.id)}">
                    <span class="tr-article-top"><b>${a(L.siglas_ley||((H=h().find(s=>String(s.id)===String(L.ley_id)))==null?void 0:H.siglas)||"")}</b> ${a(L.articulo_label||"")}</span>
                    <span class="tr-article-text">${a(String(L.fragmento||L.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',S.dataset.ids=JSON.stringify(P.map(L=>L.id))}).catch(()=>{S.isConnected&&(S.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const R=m.querySelector(".tr-res");R&&Q(d.resolutions,{length:6}).then(({rows:o,total:r})=>{!n||!R.isConnected||(R.innerHTML=o.length?`
                    <ol class="pn-latest">${o.map(P=>`
                        <li><a href="${M({resolution:P.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${a(P.NumeroResolucion)}</b><time>${a(O(P.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${a(P.TipoResolucion||"")}${P.ModalidadResolucion?` · ${a(P.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${a(P.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${q(r)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{R.isConnected&&(R.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}m.addEventListener("click",d=>{var S;const E=d.target.closest("[data-law]");if(E){const R=h().find(o=>String(o.id)===E.dataset.law);R&&l(R);return}const $=d.target.closest("[data-article]");if($){let R=[];try{R=JSON.parse(((S=$.closest(".tr-articles"))==null?void 0:S.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:$.dataset.article,list:R.length?R:[$.dataset.article]}}))}});function u(d){const E=d&&Ie(d);E?e(E):f(),m.scrollIntoView({behavior:"smooth",block:"start"})}return u(b),{openTramite:d=>u(d),showList:()=>u(null),destroy:()=>{n=!1,m.remove()},onRoute:g}}const Te="cne-pestanas-vistas",Ce=()=>{try{return new Set(JSON.parse(localStorage.getItem(Te)||"[]"))}catch{return new Set}};function lt(p){const i=Ce();if(!i.has(p)){i.add(p);try{localStorage.setItem(Te,JSON.stringify([...i]))}catch{}}}const G=[{id:"permisos",group:"CNE",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",group:"CNE",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",group:"CNE",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",group:"CNE",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."},{id:"mapa",group:"CNE",label:"Mapa",intro:"Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos."},{id:"sener",group:"SENER",label:"Títulos y permisos",intro:"Títulos y permisos de la Secretaría de Energía: asignaciones, pozos, contratos de exploración y extracción, comercio exterior y biocombustibles, con su fuente oficial."}],he='<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6Z"/><path d="M9 4v14M15 6v14"/></svg>',ct=`<svg class="pm-mapa-art" viewBox="0 0 120 80" aria-hidden="true">
    <rect x="1" y="1" width="118" height="78" rx="12" class="pm-mapa-fondo"/>
    <path class="pm-mapa-calle" d="M-2 52c22-6 34 10 58 2s30-24 66-14M30-2c4 24-6 40 4 84M86-2c-6 30 10 50 0 84"/>
    <g class="pm-mapa-pin" style="--c:var(--rojo)"><path d="M36 38c-6 0-10 4-10 9 0 7 10 15 10 15s10-8 10-15c0-5-4-9-10-9Z"/><circle cx="36" cy="47" r="3.4"/></g>
    <g class="pm-mapa-pin" style="--c:var(--col-acuerdos)"><path d="M78 16c-5 0-8 3.5-8 7.5 0 6 8 12.5 8 12.5s8-6.5 8-12.5c0-4-3-7.5-8-7.5Z"/><circle cx="78" cy="23.5" r="2.8"/></g>
    <g class="pm-mapa-pin" style="--c:var(--col-convocatorias)"><path d="M96 46c-4 0-7 3-7 6.5 0 5 7 11 7 11s7-6 7-11c0-3.5-3-6.5-7-6.5Z"/><circle cx="96" cy="52.5" r="2.4"/></g>
</svg>`,z=[{id:"cne",short:"CNE",name:"Comisión Nacional de Energía"},{id:"sener",short:"SENER",name:"Secretaría de Energía"}];function Ne(p){const i=z.find(b=>b.id===p)||z[0];return`<b>${i.short}</b>${i.name}`}function pt(p,i,{route:b={tab:"permisos"},onOpenLaw:l=()=>{},setHash:g=()=>{}}={}){let n=null,h=null;const c=document.createElement("section");c.className="pm-view",c.setAttribute("aria-labelledby","pm-title"),c.innerHTML=`
        <div class="pm-head">
            <nav class="bu-seg pm-aut-switch" aria-label="Autoridad">${z.map(e=>`<a href="${e.id==="sener"?"#sener":"#permisos"}" data-aut-link="${e.id}">${e.short}</a>`).join("")}</nav>
            <p class="pm-autoridad" data-authority></p>
            <h1 id="pm-title">Permisos de energía</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de permisos">
                ${z.map(e=>`<div class="pm-tab-grupo" data-aut="${e.id}"><span class="pm-tab-group" aria-hidden="true">${e.short}</span>${G.filter(u=>u.group===e.short).map(u=>`<a role="tab" class="pm-tab${u.id==="mapa"?" is-destacado":""}" id="pm-tab-${u.id}" href="${M({tab:u.id})}" data-tab="${u.id}" aria-controls="pm-tabpanel" aria-label="${u.label} · ${u.group}">${u.id==="mapa"?he:""}${u.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}</div>`).join("")}
            </nav>
        </div>
        <a class="pm-mapa-promo" href="${M({tab:"mapa"})}">
            ${ct}
            <span class="pm-mapa-texto"><strong>Ve los permisos en el mapa</strong><span>Centrales, gasolineras, ductos y almacenes, con su estatus y sus resoluciones. Filtra por estado o por tipo.</span></span>
            <span class="bu-btn bu-btn-primario pm-mapa-cta">${he}Abrir el mapa</span>
        </a>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,p.replaceChildren(c);const m=c.querySelector(".pm-tabpanel");function f(e,u){n==null||n.destroy(),h=e,lt(e);const d=Ce();c.querySelectorAll(".pm-tab").forEach(o=>{const r=!d.has(o.dataset.tab)&&o.dataset.tab!=="permisos";o.classList.toggle("is-new",r),r?o.setAttribute("aria-description","Nueva sección"):o.removeAttribute("aria-description")});const E=G.find(o=>o.id===e)||G[0];c.querySelector(".pm-intro").textContent=E.intro,c.querySelector("[data-authority]").innerHTML=Ne(e==="sener"?"sener":"cne"),c.classList.toggle("en-sener",e==="sener");const $=e==="sener"?"sener":"cne";c.querySelectorAll(".pm-tab-grupo").forEach(o=>{o.hidden=o.dataset.aut!==$}),c.querySelector(".pm-tabs").hidden=G.filter(o=>o.group===$.toUpperCase()).length<2,c.querySelectorAll("[data-aut-link]").forEach(o=>{o.dataset.autLink===$?o.setAttribute("aria-current","page"):o.removeAttribute("aria-current")}),c.classList.toggle("en-mapa",e==="mapa"),c.querySelector(".pm-mapa-promo").hidden=e!=="permisos",c.querySelectorAll(".pm-tab").forEach(o=>{const r=o.dataset.tab===e;o.setAttribute("aria-selected",String(r)),o.classList.toggle("is-on",r)});const S=c.querySelector(".pm-tabs"),R=c.querySelector(".pm-tab.is-on");if(R&&(S.scrollLeft+=R.getBoundingClientRect().left-S.getBoundingClientRect().left-(S.clientWidth-R.offsetWidth)/2),m.setAttribute("aria-labelledby",`pm-tab-${e}`),e==="resoluciones")n=Qe(m,i,{resolution:u.resolution||null,filters:u.filters||null,onRoute:o=>g(M({tab:e,resolution:o}))});else if(e==="tramites")n=rt(m,i,{tramite:u.tramite||null,onOpenLaw:l});else if(e==="panorama")n=nt(m);else if(e==="sener"){const o={destroyed:!1,view:null,record:u.record||null,destroy(){var r;this.destroyed=!0,(r=this.view)==null||r.destroy()},openRecord(r){this.view?this.view.openRecord(r):this.record=r},showList(){var r;this.record=null,(r=this.view)==null||r.showList()}};n=o,m.innerHTML='<p class="pm-loading">Cargando los títulos de la SENER…</p>',le(()=>import("./cne-sener-view-SHAcA_6o.js"),__vite__mapDeps([0,1,2,3,4,5,6,7])).then(r=>r.renderCneSenerView(m,{catalog:i,onOpenLaw:l,record:o.record,onRoute:P=>g(M(P?{record:P}:{tab:"sener"}))})).then(r=>{o.destroyed?r.destroy():o.view=r}).catch(()=>{o.destroyed||(m.innerHTML='<p class="pm-loading">No se pudo cargar esta sección. Revisa tu conexión e intenta de nuevo.</p>')})}else if(e==="mapa"){const o={destroyed:!1,view:null,permit:u.mapPermit||null,destroy(){var r;this.destroyed=!0,(r=this.view)==null||r.destroy()},focusPermit(r){this.view?this.view.focusPermit(r):this.permit=r}};n=o,m.innerHTML='<p class="pm-loading">Cargando el mapa…</p>',le(()=>import("./permits-map-view-BO_j-3xr.js"),__vite__mapDeps([8,1,2,9,10,5,3,4,6,11,12,13])).then(r=>r.renderPermitsMapView(m,{permit:o.permit})).then(r=>{o.destroyed?r.destroy():o.view=r}).catch(()=>{o.destroyed||(m.innerHTML='<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>')})}else n=Ke(m,i,{permit:u.permit||null,onOpenLaw:l,onRoute:o=>g(M({tab:e,permit:o}))})}function v(e={tab:"permisos"}){const u=e.tab||"permisos";if(u!==h){f(u,e);return}u==="permisos"?e.permit?n.openPermit(e.permit):n.showList():u==="resoluciones"?e.resolution?n.openResolution(e.resolution):e.filters&&Object.keys(e.filters).length?n.applyFilters(e.filters):n.showList():u==="tramites"?e.tramite?n.openTramite(e.tramite):n.showList():u==="mapa"&&e.mapPermit?n.focusPermit(e.mapPermit):u==="sener"&&(e.record?n.openRecord(e.record):n.showList())}return v(b),{go:v,destroy:()=>{n==null||n.destroy(),c.remove()}}}const ft=Object.freeze(Object.defineProperty({__proto__:null,authorityTag:Ne,renderCneView:pt},Symbol.toStringTag,{value:"Module"}));export{ft as c,De as p,Ge as t};
