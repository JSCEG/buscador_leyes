const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/cne-sener-view-DqtgKVsk.js","assets/index-Dz-yuYgG.js","assets/index-BkUrWud1.css","assets/permits-map-ShbW0NoQ.js","assets/permits-map-CflzZUgv.css","assets/tech-markers-DLyvz8YI.js","assets/map-common-CUgaxD19.js","assets/cne-sener-view-CZwVSzJo.css","assets/permits-map-view-B69w5YzS.js","assets/leaflet-src-De2SSmXW.js","assets/_commonjsHelpers-Cpj98o6Y.js","assets/cne-shared-DMDPvk_7.js","assets/leaflet-Dgihpmma.css","assets/MarkerCluster-4Oo7lyRB.css"])))=>i.map(i=>d[i]);
import{t as G,R as he,v as K,w as Ce,x as se,y as ne,z as oe,B as M,C as Pe,D as W,E as Re,F as Le,q as $e,G as U,H as Z,J as Ae,K as Me,L as xe,M as ie,N as ke,O as j,Q as Ie,S as He,T as re,_ as le}from"./index-Dz-yuYgG.js";import{T as _e,i as qe,a as we}from"./tech-markers-DLyvz8YI.js";import{s as F,e as a,d as O,n as I,g as ye,P as ve,f as V,p as D,a as ee,l as ge,b as Oe}from"./cne-shared-DMDPvk_7.js";const ce={electricidad:"--col-leyes",petroliferos:"--col-convocatorias",gaslp:"--col-normas",gasnatural:"--col-dacg",otro:"--col-otros"},te=l=>String(l??"").toUpperCase().trim().replace(/^CNE\//,"");function Fe(l){const i=te(l).split("/"),b=i.slice(2),r=(...n)=>n.some(h=>b.includes(h)),g=G(l).activity;return i[0]==="E"?r("IMP")?["importacion","Importación"]:r("EXP")?["importacion","Exportación"]:r("COG")?["termica","Cogeneración"]:r("AUT","AUTC")?["autoconsumo","Autoabastecimiento"]:r("PP")?["generacion","Pequeña producción"]:r("PIE")?["generacion","Producción independiente"]:r("GEN")?["generacion","Generación"]:["otro",g||"Permiso"]:r("AE")?["aerodromo",r("ALM")?"Almacenamiento en aeródromo":"Expendio en aeródromo"]:r("ALM")?["almacenamiento","Almacenamiento"]:r("TRA")?r("OM")?["distribucion","Transporte sin ducto"]:r("TM")?["distribucion","Transporte"]:["ducto","Transporte por ducto"]:r("DIST","DIS")?r("PLA")?["planta","Planta de distribución"]:["distribucion","Distribución"]:r("EXP")?r("AUT","ESA")?["autoconsumo","Autoconsumo"]:["estacion","Estación de servicio"]:r("COMP","DESC","LICUE","REG")?["planta",g||"Instalación"]:r("COM")?["comercio","Comercialización"]:["otro",g||"Permiso"]}function je(l,{technology:i=""}={}){var n;const b=((n=G(l).sector)==null?void 0:n.id)||"otro";if(b==="electricidad"&&i){const h=we("electricidad",{tecnologia:i});if(h.tech)return{icon:h.icon,label:h.label,tech:h.tech,sector:b}}const[r,g]=Fe(l);return{icon:r,label:g,sector:b}}function De(l){const i=[1,3,5].map(r=>parseInt(l.slice(r,r+2),16)/255).map(r=>r<=.03928?r/12.92:((r+.055)/1.055)**2.4);return 1.05/(.2126*i[0]+.7152*i[1]+.0722*i[2]+.05)>=3?"#fff":"#0a0707"}function Ve(l){try{return getComputedStyle(document.documentElement).getPropertyValue(l).trim()}catch{return""}}function Be(l,{size:i=""}={}){const b=l.tech?`--tec-${l.tech}`:ce[l.sector]||ce.otro,r=Ve(b),g=/^#[0-9a-f]{6}$/i.test(r)?De(r):"#fff",n=l.tech?`<svg viewBox="0 0 24 24" aria-hidden="true">${_e[l.tech].glyph}</svg>`:qe(l.icon,21);return`<span class="bu-ico${i?` is-${i}`:""}" style="--c:var(${b});--t:${g}" aria-hidden="true">${n}</span>`}let pe=null;function Ge(l=i=>fetch(i,{credentials:"same-origin"}).then(b=>{if(!b.ok)throw new Error(`HTTP ${b.status}`);return b.json()})){return pe??(pe=Promise.resolve().then(()=>l("/api/mapa/capa?tipo=electricidad")).then(i=>{const b=new Map;for(const r of(i==null?void 0:i.features)||[]){const{numeroPermiso:g,tecnologia:n}=r.properties||{};g&&n&&b.set(te(g),n)}return b}).catch(()=>new Map)),pe}function Ue(l,i){return(l==null?void 0:l.get(te(i)))||""}const de=20,Ye=1500,B=l=>ee(l,he),ze={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function Je(l,i=[],{onOpenLaw:b=()=>{},permit:r=null,onRoute:g=()=>{}}={}){const n={numero:"",titular:"",proyecto:"",start:0};let h=[],p=0,d=0,f=!0;const v=document.createElement("div");v.className="pm-panel",v.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${he}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,l.replaceChildren(v);const t=v.querySelector(".pm-form"),u=v.querySelector(".pm-status"),c=v.querySelector(".pm-body");let E=null;const $=async()=>{E??(E=await Promise.race([Ge(),new Promise(s=>setTimeout(()=>s(null),Ye))]))};function T(s){return s?`<span class="pm-estado is-${ze[s]||"off"}">${a(s)}</span>`:""}function m(s){const L=je(s.Numero,{technology:Ue(E,s.Numero)}),{sector:e,activity:y}=G(s.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${a(s.PermisoId)}" data-sector="${(e==null?void 0:e.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${a(s.Numero)}</span>${T(s.Estado)}</span>
                <span class="pm-tipo">${Be(L)}<span class="pm-tipo-t">${a(L.label)}</span></span>
                <span class="pm-holder">${a(s.Persona||"Titular sin dato")}</span>
                ${s.AliasProyecto?`<span class="pm-alias">${a(s.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${e?`<span class="pm-tag">${a(e.label)}${y?` · ${a(y)}`:""}</span>`:""}
                    <span>${D(s.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${s.AnexosAsociados?`<span>${D(s.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${ne(oe(s.Numero),{compact:!0})}<a class="pm-card-pdf" href="${se(s.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${a(s.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function o(){if(!h.length){u.textContent="",c.innerHTML=$e({title:"Ningún permiso coincide",body:"Revisa el número o prueba con una parte del nombre del titular."});return}const s=n.start+1,L=n.start+h.length;u.textContent=`${I(s)}–${I(L)} de ${D(p,"permiso","permisos")}`,c.innerHTML=`
            <ul class="pm-list">${h.map(m).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${L<p?"":"disabled"}>Siguientes →</button>
            </nav>`}async function S(){const s=++d;c.innerHTML=F(6),u.textContent="Consultando el registro de la CNE…";try{const[L]=await Promise.all([K({...n,length:de}),$()]);if(!f||s!==d)return;h=L.rows,p=L.total,o()}catch{if(!f||s!==d)return;u.textContent="",c.innerHTML=B("los permisos")}}function A(s){if(!s)return[];const L=typeof i=="function"?i()||[]:i;return s.laws.map(e=>ge(L,e)).filter((e,y,P)=>e&&P.indexOf(e)===y)}async function R(s,{updateRoute:L=!0}={}){L&&g(s.Numero);const{sector:e,activity:y}=G(s.Numero),P=A(e),_=Ce(s.Numero);u.textContent="",c.innerHTML=`
            <article class="pm-detail" data-sector="${(e==null?void 0:e.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e?`${a(e.label)}${y?` · ${a(y)}`:""}`:"Permiso"}</span>${T(s.Estado)}</div>
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
                    <div><dt>Resoluciones</dt><dd>${I(s.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${I(s.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${I(s.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${I(s.AnexosAsociados)}</dd></div>
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
                    ${P.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${P.map(C=>`<button type="button" class="pm-law" data-law="${a(C.id)}"><b>${a(C.siglas||"")}</b><span>${a(C.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${_?ye(_):""}
                </section>
            </article>`,c.scrollIntoView({behavior:"smooth",block:"start"});const x=c.querySelector(".pm-res");if(Pe(s.ExpedienteId).then(C=>{!f||!x.isConnected||(x.innerHTML=C.length?`<ol class="pm-timeline">${C.map((N,H)=>{const q=W(N.REsolucionId);return`
                <li class="${H===0?"is-first":""}">
                    <time>${a(O(N.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${a(N.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${a(N.NumeroResolucion||"")}</b>${N.Acta?` · Acta ${a(N.Acta)}`:""}${N.Modalidad?` · ${a(N.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${q?`<a class="pm-res-pdf" href="${a(q)}" target="_blank" rel="noopener" aria-label="Ver resolución ${a(N.NumeroResolucion||"")} en PDF">${ve}Ver resolución (PDF)</a>`:""}
                            ${N.NumeroResolucion?`<a class="pm-res-more" href="${M({resolution:N.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{x.isConnected&&(x.innerHTML=B("las resoluciones"))}),s.AnexosAsociados){const C=c.querySelector(".pm-anx");Re(s.PermisoId).then(N=>{!f||!C.isConnected||(C.innerHTML=N.length?`<ul class="pm-annexes">${N.map(H=>{const q=Le(H),ae=a(H.Descripcion||"Anexo");return`<li>${q?`<a href="${a(q)}" target="_blank" rel="noopener">${ae}</a>`:`<span>${ae}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{C.isConnected&&(C.innerHTML=B("los anexos"))})}const k=c.querySelector("[data-map-link]");fetch(`/api/mapa/buscar?q=${encodeURIComponent(s.Numero)}&limite=5`,{credentials:"same-origin"}).then(C=>C.ok?C.json():null).then(C=>{const N=((C==null?void 0:C.resultados)||[]).find(H=>V(H.numeroPermiso)===V(s.Numero)&&H.latitud!=null);!f||!N||!k.isConnected||(k.href=M({mapPermit:N.numeroPermiso}),k.hidden=!1)}).catch(()=>{}),c.querySelector(".pm-back").addEventListener("click",()=>{g(null),h.length?o():S()}),c.querySelector(".pm-share").addEventListener("click",C=>{var H;const N=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(s.Numero)}`;(H=navigator.clipboard)==null||H.writeText(N).then(()=>{C.target.textContent="Enlace copiado"},()=>{})}),c.querySelectorAll("[data-law]").forEach(C=>C.addEventListener("click",()=>{const N=P.find(H=>String(H.id)===C.dataset.law);N&&b(N)}))}async function w(s){const L=++d;c.innerHTML=F(2),u.textContent="Buscando el permiso…";try{const e=await K({numero:s,length:10});if(!f||L!==d)return;const y=e.rows.find(P=>V(P.Numero)===V(s))||(e.rows.length===1?e.rows[0]:null);if(y){h=[],R(y,{updateRoute:!1});return}t.numero.value=s,n.numero=s,h=e.rows,p=e.total,o()}catch{if(!f||L!==d)return;u.textContent="",c.innerHTML=B("el permiso")}}return t.addEventListener("submit",s=>{s.preventDefault(),Object.assign(n,{numero:t.numero.value.trim(),titular:t.titular.value.trim(),proyecto:t.proyecto.value.trim(),start:0}),g(null),S()}),t.addEventListener("reset",()=>{Object.assign(n,{numero:"",titular:"",proyecto:"",start:0}),g(null),setTimeout(S)}),c.addEventListener("click",s=>{const L=s.target.closest("[data-page]");if(L){n.start=Math.max(0,n.start+Number(L.dataset.page)*de),S().then(()=>v.scrollIntoView({behavior:"smooth",block:"start"}));return}const e=s.target.closest("[data-permit]"),y=e&&h.find(P=>String(P.PermisoId)===e.dataset.permit);y&&R(y)}),r?w(r):S(),{openPermit:s=>w(s),showList:()=>{h.length?o():S()},destroy:()=>{f=!1,v.remove()}}}const ue=20,me=l=>ee(l,U),Ke=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],We=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],Xe=1995;function Qe(l,i=[],{resolution:b=null,filters:r=null,onRoute:g=()=>{}}={}){const n={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let h=[],p=0,d=0,f=!0;const v=()=>typeof i=="function"?i()||[]:i,t=new Date().getFullYear(),u=Array.from({length:t-Xe+1},(e,y)=>t-y),c=document.createElement("div");c.className="pm-panel",c.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${u.map(e=>`<option>${e}</option>`).join("")}</select></label>
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
        <p class="pm-source">Fuente: <a href="${U}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,l.replaceChildren(c);const E=c.querySelector("form"),$=c.querySelector(".pm-status"),T=c.querySelector(".pm-body");function m(e){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${a(e.NumeroResolucion)}" data-sector="${fe(e.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${a(e.NumeroResolucion)}</span><span class="pm-date">${a(O(e.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${a(e.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${a(e.Proemio||"")}</span>
                <span class="pm-meta">${e.ModalidadResolucion?`<span class="pm-tag">${a(e.ModalidadResolucion)}</span>`:""}${e.NumeroActa?`<span>${a(e.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${a(W(e.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${a(e.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function o(){if(!h.length){$.textContent="",T.innerHTML=$e({title:"Ninguna resolución coincide",body:"Prueba con menos filtros o con una parte del texto."});return}const e=n.start+h.length;$.textContent=`${I(n.start+1)}–${I(e)} de ${D(p,"resolución","resoluciones")} · más recientes primero`,T.innerHTML=`
            <ul class="pm-list">${h.map(m).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${e<p?"":"disabled"}>Siguientes →</button>
            </nav>`}async function S(){const e=++d;T.innerHTML=F(6),$.textContent="Consultando las resoluciones de la CNE…";try{const y=await Z(n,{start:n.start,length:ue});if(!f||e!==d)return;h=y.rows,p=y.total,o()}catch{if(!f||e!==d)return;$.textContent="",T.innerHTML=me("las resoluciones")}}function A(e){const y=ie(e);return y.length?`<ul class="pm-found">${y.map((P,_)=>{const x=Oe(v(),P.law);return`<li data-found="${_}" ${x?`data-law-id="${a(x.id)}"`:""}>
                <p class="pm-found-law">${x?`<b>${a(x.siglas||"")}</b> `:""}${a(P.law)}${x?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${P.articles.map(k=>`<span class="pm-art" data-art="${a(k)}">Art. ${a(k)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${a(e)}</p></details>`:e?`<p class="pm-note">${a(e)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function R(e,y){const P=ie(y);await Promise.all(P.map(async(_,x)=>{const k=e.querySelector(`[data-found="${x}"][data-law-id]`);if(!k)return;const C=await ke(k.dataset.lawId,_.articles);!f||!k.isConnected||k.querySelectorAll("[data-art]").forEach(N=>{const H=C[N.dataset.art];if(!H)return;const q=document.createElement("button");q.type="button",q.className="pm-art is-linked",q.dataset.article=H,q.textContent=N.textContent,q.title="Abrir el artículo",N.replaceWith(q)})}))}function w(e,{updateRoute:y=!0}={}){y&&g(e.NumeroResolucion);const P=Ae(e.Proemio),_=Me(e),x=W(e.ResolucionId);$.textContent="",T.innerHTML=`
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
                ${P.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${P.map(k=>`<a class="pm-law" href="${M({permit:k})}"><b>Permiso</b><span>${a(k)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${A(e.Fundamentacion||"")}</div>
                    ${_?ye(_,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,T.scrollIntoView({behavior:"smooth",block:"start"}),R(T.querySelector(".pm-found-host"),e.Fundamentacion||"").catch(()=>{}),T.querySelector(".pm-back").addEventListener("click",()=>{g(null),h.length?o():S()}),T.querySelector(".pm-share").addEventListener("click",k=>{var N;const C=`${location.origin}${location.pathname}${M({resolution:e.NumeroResolucion})}`;(N=navigator.clipboard)==null||N.writeText(C).then(()=>{k.target.textContent="Enlace copiado"},()=>{})})}async function s(e){const y=++d;T.innerHTML=F(2),$.textContent="Buscando la resolución…";try{const P=await xe(e);if(!f||y!==d)return;if(P){h=[],w(P,{updateRoute:!1});return}E.numero.value=e,n.numero=e,S()}catch{if(!f||y!==d)return;$.textContent="",T.innerHTML=me("la resolución")}}E.addEventListener("submit",e=>{e.preventDefault(),Object.assign(n,{numero:E.numero.value.trim(),texto:E.texto.value.trim(),fecha:E.fecha.value,tipo:E.tipo.value.trim(),modalidad:E.modalidad.value.trim(),start:0}),g(null),S()}),E.addEventListener("reset",()=>{Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),g(null),setTimeout(S)}),T.addEventListener("click",e=>{const y=e.target.closest("[data-article]");if(y){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:y.dataset.article,list:[y.dataset.article]}}));return}const P=e.target.closest("[data-page]");if(P){n.start=Math.max(0,n.start+Number(P.dataset.page)*ue),S().then(()=>c.scrollIntoView({behavior:"smooth",block:"start"}));return}const _=e.target.closest("[data-resolution]"),x=_&&h.find(k=>k.NumeroResolucion===_.dataset.resolution);x&&w(x)});function L(e={}){Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...e,start:0});for(const y of["numero","texto","fecha","tipo","modalidad"])E[y].value=n[y]||"";S()}return b?s(b):r&&Object.keys(r).length?L(r):S(),{openResolution:e=>s(e),applyFilters:L,showList:()=>{h.length?o():S()},destroy:()=>{f=!1,c.remove()}}}function fe(l=""){const i=l.toLowerCase();return/el[eé]ctric/.test(i)?"electricidad":/licuado/.test(i)?"gaslp":/gas natural/.test(i)?"gasnatural":/petrol|hidrocarb/.test(i)?"petroliferos":"otro"}const Ee="cne-panorama-v1",Ze=12*60*60*1e3,be=12,Y=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],X=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function et(l,i=3){const b=[];for(let r=0;r<l.length;r+=i)b.push(...await Promise.all(l.slice(r,r+i).map(g=>g())));return b}function tt(){try{const l=JSON.parse(localStorage.getItem(Ee)||"null");return l&&Date.now()-l.at<Ze?l.data:null}catch{return null}}function at(l){try{localStorage.setItem(Ee,JSON.stringify({at:Date.now(),data:l}))}catch{}}async function st(){const i=new Date().getFullYear(),b=Array.from({length:be},(f,v)=>i-be+1+v),[r,g,...n]=await et([()=>K({length:1}).then(f=>f.total),()=>j({}),...b.map(f=>()=>j({fecha:String(f)})),...Y.map(f=>()=>j({fecha:String(i),tipo:f})),...X.map(f=>()=>j({fecha:String(i),modalidad:f.filter}))]),h=b.map((f,v)=>({year:f,count:n[v]})),p=Y.map((f,v)=>({label:f,count:n[b.length+v]})),d=X.map((f,v)=>({label:f.label,count:n[b.length+Y.length+v]}));return{year:i,permits:r,resolutions:g,thisYear:h.at(-1).count,perYear:h,byType:p,byMode:d,at:Date.now()}}function nt(l){let i=!0;const b=document.createElement("div");b.className="pm-panel pn-view",b.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${U}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,l.replaceChildren(b);const r=b.querySelector(".pm-status"),g=b.querySelector(".pn-body"),n=(p,d,f)=>{const v=Math.max(1,...p.map(t=>t.count));return`<ul class="pn-bars">${p.filter(t=>t.count>0).sort((t,u)=>u.count-t.count).map((t,u)=>`
            <li><a class="pn-bar-row" href="${M({tab:"resoluciones",filters:f(t)})}" data-tip="${a(`${t.label}: ${I(t.count)} ${d}. Ver cuáles`)}" style="--i:${u}">
                <span class="pn-bar-label">${a(t.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(t.count/v*100))}%"></span></span>
                <span class="pn-bar-value">${I(t.count)}<span class="sr-only"> ${d}</span></span>
            </a></li>`).join("")}</ul>`};function h(p,d,f){const v=Math.max(1,...p.perYear.map(t=>t.count));r.textContent=`Actualizado ${new Date(p.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,g.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${M({tab:"permisos"})}"><b>${I(p.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${M({tab:"resoluciones"})}"><b>${I(p.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${I(p.thisYear)}</b><span>resoluciones en ${p.year}</span></div>
                ${f?`<a class="pn-kpi" href="${M({tab:"resoluciones"})}"><b>${a(O(f.date))}</b><span>última sesión (${a(f.acta)})${f.count?`: ${D(f.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${p.perYear.map((t,u)=>`
                    <li><a href="${M({tab:"resoluciones",filters:{fecha:String(t.year)}})}" data-tip="${a(`${t.year}: ${I(t.count)} resoluciones. Ver cuáles`)}" style="--i:${u}">
                        <span class="pn-col-value">${I(t.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(t.count/v*100))}%"></span>
                        <span class="pn-col-label">${t.year===p.year?`${t.year}*`:t.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${p.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${p.year} por tipo</h3>${n(p.byType,"resoluciones",t=>({fecha:String(p.year),tipo:t.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${p.year} por modalidad</h3>${n(p.byMode,"resoluciones",t=>{var u;return{fecha:String(p.year),modalidad:((u=X.find(c=>c.label===t.label))==null?void 0:u.filter)||t.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${d.length?`<ol class="pn-latest">${d.map(t=>`
                    <li><a href="${M({resolution:t.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${a(t.NumeroResolucion)}</b><time>${a(O(t.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${a(t.TipoResolucion||"")}${t.ModalidadResolucion?` · ${a(t.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${a(t.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const p=Z({},{length:8}).then(u=>u.rows).catch(()=>[]);let d=tt();d||(d=await st(),at(d));const f=await p,v=f[0],t=v!=null&&v.NumeroActa?{date:v.FechaResolucion,acta:v.NumeroActa,count:await j({acta:v.NumeroActa}).catch(()=>0)}:null;i&&h(d,f,t)}catch{if(!i)return;r.textContent="",g.innerHTML=ee("las cifras",U)}})(),{destroy:()=>{i=!1,b.remove()}}}const z={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},ot=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function it(l,i=[],{tramite:b=null,onOpenLaw:r=()=>{},onRoute:g=()=>{}}={}){let n=!0;const h=()=>typeof i=="function"?i()||[]:i,p=c=>c.map(E=>ge(h(),E)).filter(Boolean),d=document.createElement("div");d.className="pm-panel tr-view",l.replaceChildren(d);function f(){const c=[...new Set(re.map(E=>E.sector))];d.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${c.map(E=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${E}">
                    <h3 id="tr-sector-${E}" class="tr-sector-title">${a(z[E]||E)}</h3>
                    <ul class="pm-list">${re.filter($=>$.sector===E).map($=>{const T=p([...$.base,...$.rules,...$.forms,...$.calls]).length,m=p($.forms).length,o=p($.calls).length;return`<li><a class="pm-card tr-card" href="${M({tramite:$.id})}" data-sector="${$.sector}">
                            <span class="pm-card-top"><span class="pm-num">Guía de trámite</span>${o?'<span class="pm-estado is-info">Con convocatoria</span>':'<span class="pm-estado is-off">Sin convocatoria</span>'}</span>
                            <span class="pm-holder">${a($.title)}</span>
                            ${$.scenario?`<span class="pm-alias">${a($.scenario)}</span>`:""}
                            <span class="pm-meta"><span class="pm-tag">${a(z[$.sector]||"")}</span><span>${I(T)} instrumentos</span>${m?"<span>Formatos oficiales</span>":""}</span>
                            <span class="pm-card-tools tr-card-go">Ver guía <span aria-hidden="true">→</span></span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function v(c){return`<button type="button" class="pm-law" data-law="${a(c.id)}"><b>${a(c.siglas||"")}</b><span>${a(c.titulo)}</span></button>`}function t(c){const E=ot.map(o=>{let S=p(c[o.key]);return o.key==="calls"&&(S=S.sort((A,R)=>String(R.fecha_publicacion||"").localeCompare(String(A.fecha_publicacion||"")))),{...o,laws:S}}).filter(o=>o.laws.length);d.innerHTML=`
            <article class="pm-detail" data-sector="${c.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${M({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${a(z[c.sector]||"")}</span></div>
                    <h2 id="tr-title">${a(c.title)}</h2>
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
                ${c.resolutions?`<section class="pm-section" aria-labelledby="tr-res">
                    <h3 id="tr-res">Resoluciones recientes de la CNE</h3>
                    <p class="pm-note">Antecedentes de este tipo de trámite, de lo más reciente a lo más antiguo.</p>
                    <div class="tr-res"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>`:""}
            </article>`,d.querySelector(".pm-share").addEventListener("click",o=>{var A;const S=`${location.origin}${location.pathname}${M({tramite:c.id})}`;(A=navigator.clipboard)==null||A.writeText(S).then(()=>{o.target.textContent="Enlace copiado"},()=>{})});const $=p(c.articles.in).map(o=>o.id),T=d.querySelector(".tr-articles");He(c.articles.query,{lawIds:$,limit:24}).then(({data:o})=>{if(!n||!T.isConnected)return;const S=new Map,A=(o||[]).filter(R=>R.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(R.articulo_label||""))).filter(R=>{const w=S.get(R.ley_id)||0;return S.set(R.ley_id,w+1),w<3}).slice(0,8);T.innerHTML=A.length?`<ol class="tr-article-list">${A.map(R=>{var w;return`
                <li><button type="button" class="tr-article" data-article="${a(R.id)}">
                    <span class="tr-article-top"><b>${a(R.siglas_ley||((w=h().find(s=>String(s.id)===String(R.ley_id)))==null?void 0:w.siglas)||"")}</b> ${a(R.articulo_label||"")}</span>
                    <span class="tr-article-text">${a(String(R.fragmento||R.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',T.dataset.ids=JSON.stringify(A.map(R=>R.id))}).catch(()=>{T.isConnected&&(T.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const m=d.querySelector(".tr-res");m&&Z(c.resolutions,{length:6}).then(({rows:o,total:S})=>{!n||!m.isConnected||(m.innerHTML=o.length?`
                    <ol class="pn-latest">${o.map(A=>`
                        <li><a href="${M({resolution:A.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${a(A.NumeroResolucion)}</b><time>${a(O(A.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${a(A.TipoResolucion||"")}${A.ModalidadResolucion?` · ${a(A.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${a(A.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${I(S)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{m.isConnected&&(m.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}d.addEventListener("click",c=>{var T;const E=c.target.closest("[data-law]");if(E){const m=h().find(o=>String(o.id)===E.dataset.law);m&&r(m);return}const $=c.target.closest("[data-article]");if($){let m=[];try{m=JSON.parse(((T=$.closest(".tr-articles"))==null?void 0:T.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:$.dataset.article,list:m.length?m:[$.dataset.article]}}))}});function u(c){const E=c&&Ie(c);E?t(E):f(),d.scrollIntoView({behavior:"smooth",block:"start"})}return u(b),{openTramite:c=>u(c),showList:()=>u(null),destroy:()=>{n=!1,d.remove()},onRoute:g}}const Te="cne-pestanas-vistas",Se=()=>{try{return new Set(JSON.parse(localStorage.getItem(Te)||"[]"))}catch{return new Set}};function rt(l){const i=Se();if(!i.has(l)){i.add(l);try{localStorage.setItem(Te,JSON.stringify([...i]))}catch{}}}const J=[{id:"permisos",group:"CNE",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",group:"CNE",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",group:"CNE",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",group:"CNE",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."},{id:"mapa",group:"CNE",label:"Mapa",intro:"Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos."},{id:"sener",group:"SENER",label:"Títulos y permisos",intro:"Títulos y permisos de la Secretaría de Energía: asignaciones, pozos, contratos de exploración y extracción, comercio exterior y biocombustibles, con su fuente oficial."}],Q=[{id:"cne",short:"CNE",name:"Comisión Nacional de Energía"},{id:"sener",short:"SENER",name:"Secretaría de Energía"}];function Ne(l){const i=Q.find(b=>b.id===l)||Q[0];return`<b>${i.short}</b>${i.name}`}function lt(l,i,{route:b={tab:"permisos"},onOpenLaw:r=()=>{},setHash:g=()=>{}}={}){let n=null,h=null;const p=document.createElement("section");p.className="pm-view",p.setAttribute("aria-labelledby","pm-title"),p.innerHTML=`
        <div class="pm-head">
            <p class="pm-autoridad" data-authority></p>
            <h1 id="pm-title">Permisos de energía</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de permisos">
                ${Q.map(t=>`<div class="pm-tab-grupo" data-aut="${t.id}"><span class="pm-tab-group" aria-hidden="true">${t.short}</span>${J.filter(u=>u.group===t.short).map(u=>`<a role="tab" class="pm-tab" id="pm-tab-${u.id}" href="${M({tab:u.id})}" data-tab="${u.id}" aria-controls="pm-tabpanel" aria-label="${u.label} · ${u.group}">${u.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}</div>`).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,l.replaceChildren(p);const d=p.querySelector(".pm-tabpanel");function f(t,u){n==null||n.destroy(),h=t,rt(t);const c=Se();p.querySelectorAll(".pm-tab").forEach(m=>{const o=!c.has(m.dataset.tab)&&m.dataset.tab!=="permisos";m.classList.toggle("is-new",o),o?m.setAttribute("aria-description","Nueva sección"):m.removeAttribute("aria-description")});const E=J.find(m=>m.id===t)||J[0];p.querySelector(".pm-intro").textContent=E.intro,p.querySelector("[data-authority]").innerHTML=Ne(t==="sener"?"sener":"cne"),p.classList.toggle("en-sener",t==="sener"),p.classList.toggle("en-mapa",t==="mapa"),p.querySelectorAll(".pm-tab").forEach(m=>{const o=m.dataset.tab===t;m.setAttribute("aria-selected",String(o)),m.classList.toggle("is-on",o)});const $=p.querySelector(".pm-tabs"),T=p.querySelector(".pm-tab.is-on");if(T&&($.scrollLeft+=T.getBoundingClientRect().left-$.getBoundingClientRect().left-($.clientWidth-T.offsetWidth)/2),d.setAttribute("aria-labelledby",`pm-tab-${t}`),t==="resoluciones")n=Qe(d,i,{resolution:u.resolution||null,filters:u.filters||null,onRoute:m=>g(M({tab:t,resolution:m}))});else if(t==="tramites")n=it(d,i,{tramite:u.tramite||null,onOpenLaw:r});else if(t==="panorama")n=nt(d);else if(t==="sener"){const m={destroyed:!1,view:null,record:u.record||null,destroy(){var o;this.destroyed=!0,(o=this.view)==null||o.destroy()},openRecord(o){this.view?this.view.openRecord(o):this.record=o},showList(){var o;this.record=null,(o=this.view)==null||o.showList()}};n=m,d.innerHTML='<p class="pm-loading">Cargando los títulos de la SENER…</p>',le(()=>import("./cne-sener-view-DqtgKVsk.js"),__vite__mapDeps([0,1,2,3,4,5,6,7])).then(o=>o.renderCneSenerView(d,{catalog:i,onOpenLaw:r,record:m.record,onRoute:S=>g(M(S?{record:S}:{tab:"sener"}))})).then(o=>{m.destroyed?o.destroy():m.view=o}).catch(()=>{m.destroyed||(d.innerHTML='<p class="pm-loading">No se pudo cargar esta sección. Revisa tu conexión e intenta de nuevo.</p>')})}else if(t==="mapa"){const m={destroyed:!1,view:null,permit:u.mapPermit||null,destroy(){var o;this.destroyed=!0,(o=this.view)==null||o.destroy()},focusPermit(o){this.view?this.view.focusPermit(o):this.permit=o}};n=m,d.innerHTML='<p class="pm-loading">Cargando el mapa…</p>',le(()=>import("./permits-map-view-B69w5YzS.js"),__vite__mapDeps([8,1,2,9,10,5,3,4,6,11,12,13])).then(o=>o.renderPermitsMapView(d,{permit:m.permit})).then(o=>{m.destroyed?o.destroy():m.view=o}).catch(()=>{m.destroyed||(d.innerHTML='<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>')})}else n=Je(d,i,{permit:u.permit||null,onOpenLaw:r,onRoute:m=>g(M({tab:t,permit:m}))})}function v(t={tab:"permisos"}){const u=t.tab||"permisos";if(u!==h){f(u,t);return}u==="permisos"?t.permit?n.openPermit(t.permit):n.showList():u==="resoluciones"?t.resolution?n.openResolution(t.resolution):t.filters&&Object.keys(t.filters).length?n.applyFilters(t.filters):n.showList():u==="tramites"?t.tramite?n.openTramite(t.tramite):n.showList():u==="mapa"&&t.mapPermit?n.focusPermit(t.mapPermit):u==="sener"&&(t.record?n.openRecord(t.record):n.showList())}return v(b),{go:v,destroy:()=>{n==null||n.destroy(),p.remove()}}}const ut=Object.freeze(Object.defineProperty({__proto__:null,authorityTag:Ne,renderCneView:lt},Symbol.toStringTag,{value:"Module"}));export{ut as c,je as p,Be as t};
