const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/cne-sener-view-BZibYtx7.js","assets/index-rUaJkMiz.js","assets/index-CnlJOI7I.css","assets/permits-map-C0gzd0i7.js","assets/permits-map-Bln1_gGG.css","assets/tech-markers-DLyvz8YI.js","assets/map-common-CUgaxD19.js","assets/cne-sener-view-D1VdRSfV.css","assets/permits-map-view-BoC7mqad.js","assets/leaflet-src-De2SSmXW.js","assets/_commonjsHelpers-Cpj98o6Y.js","assets/cne-shared-DMDPvk_7.js","assets/leaflet-Dgihpmma.css","assets/MarkerCluster-4Oo7lyRB.css"])))=>i.map(i=>d[i]);
import{t as G,R as he,v as K,w as Ce,x as se,y as ne,z as oe,B as M,C as Pe,D as X,E as Re,F as Le,q as $e,G as U,H as Z,J as Ae,K as Me,L as xe,M as ie,N as ke,O as j,Q as Ie,S as He,T as re,_ as le}from"./index-rUaJkMiz.js";import{T as _e,i as Oe,a as qe}from"./tech-markers-DLyvz8YI.js";import{s as F,e as a,d as w,n as I,g as ye,P as ve,f as V,p as D,a as ee,l as ge,b as we}from"./cne-shared-DMDPvk_7.js";const ce={electricidad:"--col-leyes",petroliferos:"--col-convocatorias",gaslp:"--col-normas",gasnatural:"--col-dacg",otro:"--col-otros"},te=c=>String(c??"").toUpperCase().trim().replace(/^CNE\//,"");function Fe(c){const o=te(c).split("/"),b=o.slice(2),l=(...n)=>n.some(h=>b.includes(h)),v=G(c).activity;return o[0]==="E"?l("IMP")?["importacion","Importación"]:l("EXP")?["importacion","Exportación"]:l("COG")?["termica","Cogeneración"]:l("AUT","AUTC")?["autoconsumo","Autoabastecimiento"]:l("PP")?["generacion","Pequeña producción"]:l("PIE")?["generacion","Producción independiente"]:l("GEN")?["generacion","Generación"]:["otro",v||"Permiso"]:l("AE")?["aerodromo",l("ALM")?"Almacenamiento en aeródromo":"Expendio en aeródromo"]:l("ALM")?["almacenamiento","Almacenamiento"]:l("TRA")?l("OM")?["distribucion","Transporte sin ducto"]:l("TM")?["distribucion","Transporte"]:["ducto","Transporte por ducto"]:l("DIST","DIS")?l("PLA")?["planta","Planta de distribución"]:["distribucion","Distribución"]:l("EXP")?l("AUT","ESA")?["autoconsumo","Autoconsumo"]:["estacion","Estación de servicio"]:l("COMP","DESC","LICUE","REG")?["planta",v||"Instalación"]:l("COM")?["comercio","Comercialización"]:["otro",v||"Permiso"]}function je(c,{technology:o=""}={}){var n;const b=((n=G(c).sector)==null?void 0:n.id)||"otro";if(b==="electricidad"&&o){const h=qe("electricidad",{tecnologia:o});if(h.tech)return{icon:h.icon,label:h.label,tech:h.tech,sector:b}}const[l,v]=Fe(c);return{icon:l,label:v,sector:b}}function De(c){const o=[1,3,5].map(l=>parseInt(c.slice(l,l+2),16)/255).map(l=>l<=.03928?l/12.92:((l+.055)/1.055)**2.4);return 1.05/(.2126*o[0]+.7152*o[1]+.0722*o[2]+.05)>=3?"#fff":"#0a0707"}function Ve(c){try{return getComputedStyle(document.documentElement).getPropertyValue(c).trim()}catch{return""}}function Be(c,{size:o=""}={}){const b=c.tech?`--tec-${c.tech}`:ce[c.sector]||ce.otro,l=Ve(b),v=/^#[0-9a-f]{6}$/i.test(l)?De(l):"#fff",n=c.tech?`<svg viewBox="0 0 24 24" aria-hidden="true">${_e[c.tech].glyph}</svg>`:Oe(c.icon,21);return`<span class="bu-ico${o?` is-${o}`:""}" style="--c:var(${b});--t:${v}" aria-hidden="true">${n}</span>`}let pe=null;function Ge(c=o=>fetch(o,{credentials:"same-origin"}).then(b=>{if(!b.ok)throw new Error(`HTTP ${b.status}`);return b.json()})){return pe??(pe=Promise.resolve().then(()=>c("/api/mapa/capa?tipo=electricidad")).then(o=>{const b=new Map;for(const l of(o==null?void 0:o.features)||[]){const{numeroPermiso:v,tecnologia:n}=l.properties||{};v&&n&&b.set(te(v),n)}return b}).catch(()=>new Map)),pe}function Ue(c,o){return(c==null?void 0:c.get(te(o)))||""}const de=20,Ye=1500,B=c=>ee(c,he),ze={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function Je(c,o=[],{onOpenLaw:b=()=>{},permit:l=null,onRoute:v=()=>{}}={}){const n={numero:"",titular:"",proyecto:"",start:0};let h=[],d=0,u=0,f=!0;const y=document.createElement("div");y.className="pm-panel",y.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${he}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,c.replaceChildren(y);const t=y.querySelector(".pm-form"),m=y.querySelector(".pm-status"),p=y.querySelector(".pm-body");let E=null;const i=async()=>{E??(E=await Promise.race([Ge(),new Promise(s=>setTimeout(()=>s(null),Ye))]))};function r(s){return s?`<span class="pm-estado is-${ze[s]||"off"}">${a(s)}</span>`:""}function P(s){const L=je(s.Numero,{technology:Ue(E,s.Numero)}),{sector:e,activity:$}=G(s.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${a(s.PermisoId)}" data-sector="${(e==null?void 0:e.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${a(s.Numero)}</span>${r(s.Estado)}</span>
                <span class="pm-tipo">${Be(L)}<span class="pm-tipo-t">${a(L.label)}</span></span>
                <span class="pm-holder">${a(s.Persona||"Titular sin dato")}</span>
                ${s.AliasProyecto?`<span class="pm-alias">${a(s.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${e?`<span class="pm-tag">${a(e.label)}${$?` · ${a($)}`:""}</span>`:""}
                    <span>${D(s.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${s.AnexosAsociados?`<span>${D(s.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${ne(oe(s.Numero),{compact:!0})}<a class="pm-card-pdf" href="${se(s.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${a(s.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function g(){if(!h.length){m.textContent="",p.innerHTML=$e({title:"Ningún permiso coincide",body:"Revisa el número o prueba con una parte del nombre del titular."});return}const s=n.start+1,L=n.start+h.length;m.textContent=`${I(s)}–${I(L)} de ${D(d,"permiso","permisos")}`,p.innerHTML=`
            <ul class="pm-list">${h.map(P).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${L<d?"":"disabled"}>Siguientes →</button>
            </nav>`}async function N(){const s=++u;p.innerHTML=F(6),m.textContent="Consultando el registro de la CNE…";try{const[L]=await Promise.all([K({...n,length:de}),i()]);if(!f||s!==u)return;h=L.rows,d=L.total,g()}catch{if(!f||s!==u)return;m.textContent="",p.innerHTML=B("los permisos")}}function A(s){if(!s)return[];const L=typeof o=="function"?o()||[]:o;return s.laws.map(e=>ge(L,e)).filter((e,$,C)=>e&&C.indexOf(e)===$)}async function R(s,{updateRoute:L=!0}={}){L&&v(s.Numero);const{sector:e,activity:$}=G(s.Numero),C=A(e),_=Ce(s.Numero);m.textContent="",p.innerHTML=`
            <article class="pm-detail" data-sector="${(e==null?void 0:e.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e?`${a(e.label)}${$?` · ${a($)}`:""}`:"Permiso"}</span>${r(s.Estado)}</div>
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
                    <div><dt>Último acuse</dt><dd>${a(w(s.FechaAcuse)||"—")}</dd></div>
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
                    ${C.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${C.map(S=>`<button type="button" class="pm-law" data-law="${a(S.id)}"><b>${a(S.siglas||"")}</b><span>${a(S.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${_?ye(_):""}
                </section>
            </article>`,p.scrollIntoView({behavior:"smooth",block:"start"});const x=p.querySelector(".pm-res");if(Pe(s.ExpedienteId).then(S=>{!f||!x.isConnected||(x.innerHTML=S.length?`<ol class="pm-timeline">${S.map((T,H)=>{const O=X(T.REsolucionId);return`
                <li class="${H===0?"is-first":""}">
                    <time>${a(w(T.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${a(T.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${a(T.NumeroResolucion||"")}</b>${T.Acta?` · Acta ${a(T.Acta)}`:""}${T.Modalidad?` · ${a(T.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${O?`<a class="pm-res-pdf" href="${a(O)}" target="_blank" rel="noopener" aria-label="Ver resolución ${a(T.NumeroResolucion||"")} en PDF">${ve}Ver resolución (PDF)</a>`:""}
                            ${T.NumeroResolucion?`<a class="pm-res-more" href="${M({resolution:T.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{x.isConnected&&(x.innerHTML=B("las resoluciones"))}),s.AnexosAsociados){const S=p.querySelector(".pm-anx");Re(s.PermisoId).then(T=>{!f||!S.isConnected||(S.innerHTML=T.length?`<ul class="pm-annexes">${T.map(H=>{const O=Le(H),ae=a(H.Descripcion||"Anexo");return`<li>${O?`<a href="${a(O)}" target="_blank" rel="noopener">${ae}</a>`:`<span>${ae}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{S.isConnected&&(S.innerHTML=B("los anexos"))})}const k=p.querySelector("[data-map-link]");fetch(`/api/mapa/buscar?q=${encodeURIComponent(s.Numero)}&limite=5`,{credentials:"same-origin"}).then(S=>S.ok?S.json():null).then(S=>{const T=((S==null?void 0:S.resultados)||[]).find(H=>V(H.numeroPermiso)===V(s.Numero)&&H.latitud!=null);!f||!T||!k.isConnected||(k.href=M({mapPermit:T.numeroPermiso}),k.hidden=!1)}).catch(()=>{}),p.querySelector(".pm-back").addEventListener("click",()=>{v(null),h.length?g():N()}),p.querySelector(".pm-share").addEventListener("click",S=>{var H;const T=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(s.Numero)}`;(H=navigator.clipboard)==null||H.writeText(T).then(()=>{S.target.textContent="Enlace copiado"},()=>{})}),p.querySelectorAll("[data-law]").forEach(S=>S.addEventListener("click",()=>{const T=C.find(H=>String(H.id)===S.dataset.law);T&&b(T)}))}async function q(s){const L=++u;p.innerHTML=F(2),m.textContent="Buscando el permiso…";try{const e=await K({numero:s,length:10});if(!f||L!==u)return;const $=e.rows.find(C=>V(C.Numero)===V(s))||(e.rows.length===1?e.rows[0]:null);if($){h=[],R($,{updateRoute:!1});return}t.numero.value=s,n.numero=s,h=e.rows,d=e.total,g()}catch{if(!f||L!==u)return;m.textContent="",p.innerHTML=B("el permiso")}}return t.addEventListener("submit",s=>{s.preventDefault(),Object.assign(n,{numero:t.numero.value.trim(),titular:t.titular.value.trim(),proyecto:t.proyecto.value.trim(),start:0}),v(null),N()}),t.addEventListener("reset",()=>{Object.assign(n,{numero:"",titular:"",proyecto:"",start:0}),v(null),setTimeout(N)}),p.addEventListener("click",s=>{const L=s.target.closest("[data-page]");if(L){n.start=Math.max(0,n.start+Number(L.dataset.page)*de),N().then(()=>y.scrollIntoView({behavior:"smooth",block:"start"}));return}const e=s.target.closest("[data-permit]"),$=e&&h.find(C=>String(C.PermisoId)===e.dataset.permit);$&&R($)}),l?q(l):N(),{openPermit:s=>q(s),showList:()=>{h.length?g():N()},destroy:()=>{f=!1,y.remove()}}}const ue=20,me=c=>ee(c,U),Ke=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],Xe=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],We=1995;function Qe(c,o=[],{resolution:b=null,filters:l=null,onRoute:v=()=>{}}={}){const n={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let h=[],d=0,u=0,f=!0;const y=()=>typeof o=="function"?o()||[]:o,t=new Date().getFullYear(),m=Array.from({length:t-We+1},(e,$)=>t-$),p=document.createElement("div");p.className="pm-panel",p.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${m.map(e=>`<option>${e}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${Ke.map(e=>`<option value="${a(e)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${Xe.map(e=>`<option value="${a(e)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${U}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,c.replaceChildren(p);const E=p.querySelector("form"),i=p.querySelector(".pm-status"),r=p.querySelector(".pm-body");function P(e){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${a(e.NumeroResolucion)}" data-sector="${fe(e.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${a(e.NumeroResolucion)}</span><span class="pm-date">${a(w(e.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${a(e.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${a(e.Proemio||"")}</span>
                <span class="pm-meta">${e.ModalidadResolucion?`<span class="pm-tag">${a(e.ModalidadResolucion)}</span>`:""}${e.NumeroActa?`<span>${a(e.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${a(X(e.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${a(e.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function g(){if(!h.length){i.textContent="",r.innerHTML=$e({title:"Ninguna resolución coincide",body:"Prueba con menos filtros o con una parte del texto."});return}const e=n.start+h.length;i.textContent=`${I(n.start+1)}–${I(e)} de ${D(d,"resolución","resoluciones")} · más recientes primero`,r.innerHTML=`
            <ul class="pm-list">${h.map(P).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${e<d?"":"disabled"}>Siguientes →</button>
            </nav>`}async function N(){const e=++u;r.innerHTML=F(6),i.textContent="Consultando las resoluciones de la CNE…";try{const $=await Z(n,{start:n.start,length:ue});if(!f||e!==u)return;h=$.rows,d=$.total,g()}catch{if(!f||e!==u)return;i.textContent="",r.innerHTML=me("las resoluciones")}}function A(e){const $=ie(e);return $.length?`<ul class="pm-found">${$.map((C,_)=>{const x=we(y(),C.law);return`<li data-found="${_}" ${x?`data-law-id="${a(x.id)}"`:""}>
                <p class="pm-found-law">${x?`<b>${a(x.siglas||"")}</b> `:""}${a(C.law)}${x?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${C.articles.map(k=>`<span class="pm-art" data-art="${a(k)}">Art. ${a(k)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${a(e)}</p></details>`:e?`<p class="pm-note">${a(e)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function R(e,$){const C=ie($);await Promise.all(C.map(async(_,x)=>{const k=e.querySelector(`[data-found="${x}"][data-law-id]`);if(!k)return;const S=await ke(k.dataset.lawId,_.articles);!f||!k.isConnected||k.querySelectorAll("[data-art]").forEach(T=>{const H=S[T.dataset.art];if(!H)return;const O=document.createElement("button");O.type="button",O.className="pm-art is-linked",O.dataset.article=H,O.textContent=T.textContent,O.title="Abrir el artículo",T.replaceWith(O)})}))}function q(e,{updateRoute:$=!0}={}){$&&v(e.NumeroResolucion);const C=Ae(e.Proemio),_=Me(e),x=X(e.ResolucionId);i.textContent="",r.innerHTML=`
            <article class="pm-detail" data-sector="${fe(e.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${a(e.TipoResolucion||"Resolución")}${e.ModalidadResolucion?` · ${a(e.ModalidadResolucion)}`:""}</span><span class="pm-date">${a(w(e.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${a(e.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${a(e.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${x?`<a class="pm-btn pm-btn-primary" href="${a(x)}" target="_blank" rel="noopener">${ve}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${a(w(e.FechaResolucion)||"—")}</dd></div>
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
                    <div class="pm-found-host">${A(e.Fundamentacion||"")}</div>
                    ${_?ye(_,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,r.scrollIntoView({behavior:"smooth",block:"start"}),R(r.querySelector(".pm-found-host"),e.Fundamentacion||"").catch(()=>{}),r.querySelector(".pm-back").addEventListener("click",()=>{v(null),h.length?g():N()}),r.querySelector(".pm-share").addEventListener("click",k=>{var T;const S=`${location.origin}${location.pathname}${M({resolution:e.NumeroResolucion})}`;(T=navigator.clipboard)==null||T.writeText(S).then(()=>{k.target.textContent="Enlace copiado"},()=>{})})}async function s(e){const $=++u;r.innerHTML=F(2),i.textContent="Buscando la resolución…";try{const C=await xe(e);if(!f||$!==u)return;if(C){h=[],q(C,{updateRoute:!1});return}E.numero.value=e,n.numero=e,N()}catch{if(!f||$!==u)return;i.textContent="",r.innerHTML=me("la resolución")}}E.addEventListener("submit",e=>{e.preventDefault(),Object.assign(n,{numero:E.numero.value.trim(),texto:E.texto.value.trim(),fecha:E.fecha.value,tipo:E.tipo.value.trim(),modalidad:E.modalidad.value.trim(),start:0}),v(null),N()}),E.addEventListener("reset",()=>{Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),v(null),setTimeout(N)}),r.addEventListener("click",e=>{const $=e.target.closest("[data-article]");if($){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:$.dataset.article,list:[$.dataset.article]}}));return}const C=e.target.closest("[data-page]");if(C){n.start=Math.max(0,n.start+Number(C.dataset.page)*ue),N().then(()=>p.scrollIntoView({behavior:"smooth",block:"start"}));return}const _=e.target.closest("[data-resolution]"),x=_&&h.find(k=>k.NumeroResolucion===_.dataset.resolution);x&&q(x)});function L(e={}){Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...e,start:0});for(const $ of["numero","texto","fecha","tipo","modalidad"])E[$].value=n[$]||"";N()}return b?s(b):l&&Object.keys(l).length?L(l):N(),{openResolution:e=>s(e),applyFilters:L,showList:()=>{h.length?g():N()},destroy:()=>{f=!1,p.remove()}}}function fe(c=""){const o=c.toLowerCase();return/el[eé]ctric/.test(o)?"electricidad":/licuado/.test(o)?"gaslp":/gas natural/.test(o)?"gasnatural":/petrol|hidrocarb/.test(o)?"petroliferos":"otro"}const Ee="cne-panorama-v1",Ze=12*60*60*1e3,be=12,Y=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],W=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function et(c,o=3){const b=[];for(let l=0;l<c.length;l+=o)b.push(...await Promise.all(c.slice(l,l+o).map(v=>v())));return b}function tt(){try{const c=JSON.parse(localStorage.getItem(Ee)||"null");return c&&Date.now()-c.at<Ze?c.data:null}catch{return null}}function at(c){try{localStorage.setItem(Ee,JSON.stringify({at:Date.now(),data:c}))}catch{}}async function st(){const o=new Date().getFullYear(),b=Array.from({length:be},(f,y)=>o-be+1+y),[l,v,...n]=await et([()=>K({length:1}).then(f=>f.total),()=>j({}),...b.map(f=>()=>j({fecha:String(f)})),...Y.map(f=>()=>j({fecha:String(o),tipo:f})),...W.map(f=>()=>j({fecha:String(o),modalidad:f.filter}))]),h=b.map((f,y)=>({year:f,count:n[y]})),d=Y.map((f,y)=>({label:f,count:n[b.length+y]})),u=W.map((f,y)=>({label:f.label,count:n[b.length+Y.length+y]}));return{year:o,permits:l,resolutions:v,thisYear:h.at(-1).count,perYear:h,byType:d,byMode:u,at:Date.now()}}function nt(c){let o=!0;const b=document.createElement("div");b.className="pm-panel pn-view",b.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${U}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,c.replaceChildren(b);const l=b.querySelector(".pm-status"),v=b.querySelector(".pn-body"),n=(d,u,f)=>{const y=Math.max(1,...d.map(t=>t.count));return`<ul class="pn-bars">${d.filter(t=>t.count>0).sort((t,m)=>m.count-t.count).map((t,m)=>`
            <li><a class="pn-bar-row" href="${M({tab:"resoluciones",filters:f(t)})}" data-tip="${a(`${t.label}: ${I(t.count)} ${u}. Ver cuáles`)}" style="--i:${m}">
                <span class="pn-bar-label">${a(t.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(t.count/y*100))}%"></span></span>
                <span class="pn-bar-value">${I(t.count)}<span class="sr-only"> ${u}</span></span>
            </a></li>`).join("")}</ul>`};function h(d,u,f){const y=Math.max(1,...d.perYear.map(t=>t.count));l.textContent=`Actualizado ${new Date(d.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,v.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${M({tab:"permisos"})}"><b>${I(d.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${M({tab:"resoluciones"})}"><b>${I(d.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${I(d.thisYear)}</b><span>resoluciones en ${d.year}</span></div>
                ${f?`<a class="pn-kpi" href="${M({tab:"resoluciones"})}"><b>${a(w(f.date))}</b><span>última sesión (${a(f.acta)})${f.count?`: ${D(f.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${d.perYear.map((t,m)=>`
                    <li><a href="${M({tab:"resoluciones",filters:{fecha:String(t.year)}})}" data-tip="${a(`${t.year}: ${I(t.count)} resoluciones. Ver cuáles`)}" style="--i:${m}">
                        <span class="pn-col-value">${I(t.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(t.count/y*100))}%"></span>
                        <span class="pn-col-label">${t.year===d.year?`${t.year}*`:t.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${d.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${d.year} por tipo</h3>${n(d.byType,"resoluciones",t=>({fecha:String(d.year),tipo:t.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${d.year} por modalidad</h3>${n(d.byMode,"resoluciones",t=>{var m;return{fecha:String(d.year),modalidad:((m=W.find(p=>p.label===t.label))==null?void 0:m.filter)||t.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${u.length?`<ol class="pn-latest">${u.map(t=>`
                    <li><a href="${M({resolution:t.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${a(t.NumeroResolucion)}</b><time>${a(w(t.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${a(t.TipoResolucion||"")}${t.ModalidadResolucion?` · ${a(t.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${a(t.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const d=Z({},{length:8}).then(m=>m.rows).catch(()=>[]);let u=tt();u||(u=await st(),at(u));const f=await d,y=f[0],t=y!=null&&y.NumeroActa?{date:y.FechaResolucion,acta:y.NumeroActa,count:await j({acta:y.NumeroActa}).catch(()=>0)}:null;o&&h(u,f,t)}catch{if(!o)return;l.textContent="",v.innerHTML=ee("las cifras",U)}})(),{destroy:()=>{o=!1,b.remove()}}}const z={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},ot=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function it(c,o=[],{tramite:b=null,onOpenLaw:l=()=>{},onRoute:v=()=>{}}={}){let n=!0;const h=()=>typeof o=="function"?o()||[]:o,d=p=>p.map(E=>ge(h(),E)).filter(Boolean),u=document.createElement("div");u.className="pm-panel tr-view",c.replaceChildren(u);function f(){const p=[...new Set(re.map(E=>E.sector))];u.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${p.map(E=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${E}">
                    <h3 id="tr-sector-${E}" class="tr-sector-title">${a(z[E]||E)}</h3>
                    <ul class="pm-list">${re.filter(i=>i.sector===E).map(i=>{const r=d([...i.base,...i.rules,...i.forms,...i.calls]).length,P=d(i.forms).length,g=d(i.calls).length;return`<li><a class="pm-card tr-card" href="${M({tramite:i.id})}" data-sector="${i.sector}">
                            <span class="pm-card-top"><span class="pm-num">Guía de trámite</span>${g?'<span class="pm-estado is-info">Con convocatoria</span>':'<span class="pm-estado is-off">Sin convocatoria</span>'}</span>
                            <span class="pm-holder">${a(i.title)}</span>
                            ${i.scenario?`<span class="pm-alias">${a(i.scenario)}</span>`:""}
                            <span class="pm-meta"><span class="pm-tag">${a(z[i.sector]||"")}</span><span>${I(r)} instrumentos</span>${P?"<span>Formatos oficiales</span>":""}</span>
                            <span class="pm-card-tools tr-card-go">Ver guía <span aria-hidden="true">→</span></span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function y(p){return`<button type="button" class="pm-law" data-law="${a(p.id)}"><b>${a(p.siglas||"")}</b><span>${a(p.titulo)}</span></button>`}function t(p){const E=ot.map(g=>{let N=d(p[g.key]);return g.key==="calls"&&(N=N.sort((A,R)=>String(R.fecha_publicacion||"").localeCompare(String(A.fecha_publicacion||"")))),{...g,laws:N}}).filter(g=>g.laws.length);u.innerHTML=`
            <article class="pm-detail" data-sector="${p.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${M({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${a(z[p.sector]||"")}</span></div>
                    <h2 id="tr-title">${a(p.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${E.map(g=>`
                    <section class="pm-section" aria-labelledby="tr-${g.key}">
                        <h3 id="tr-${g.key}">${a(g.title)}</h3>
                        <p class="pm-note">${a(g.note)}</p>
                        <div class="pm-laws">${g.laws.map(y).join("")}</div>
                    </section>`).join("")}
                <section class="pm-section" aria-labelledby="tr-articles">
                    <h3 id="tr-articles">Artículos clave</h3>
                    <p class="pm-note">Artículos y numerales del acervo que tratan este trámite, por relevancia.</p>
                    <div class="tr-articles"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>
                ${p.resolutions?`<section class="pm-section" aria-labelledby="tr-res">
                    <h3 id="tr-res">Resoluciones recientes de la CNE</h3>
                    <p class="pm-note">Antecedentes de este tipo de trámite, de lo más reciente a lo más antiguo.</p>
                    <div class="tr-res"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>`:""}
            </article>`,u.querySelector(".pm-share").addEventListener("click",g=>{var A;const N=`${location.origin}${location.pathname}${M({tramite:p.id})}`;(A=navigator.clipboard)==null||A.writeText(N).then(()=>{g.target.textContent="Enlace copiado"},()=>{})});const i=d(p.articles.in).map(g=>g.id),r=u.querySelector(".tr-articles");He(p.articles.query,{lawIds:i,limit:24}).then(({data:g})=>{if(!n||!r.isConnected)return;const N=new Map,A=(g||[]).filter(R=>R.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(R.articulo_label||""))).filter(R=>{const q=N.get(R.ley_id)||0;return N.set(R.ley_id,q+1),q<3}).slice(0,8);r.innerHTML=A.length?`<ol class="tr-article-list">${A.map(R=>{var q;return`
                <li><button type="button" class="tr-article" data-article="${a(R.id)}">
                    <span class="tr-article-top"><b>${a(R.siglas_ley||((q=h().find(s=>String(s.id)===String(R.ley_id)))==null?void 0:q.siglas)||"")}</b> ${a(R.articulo_label||"")}</span>
                    <span class="tr-article-text">${a(String(R.fragmento||R.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',r.dataset.ids=JSON.stringify(A.map(R=>R.id))}).catch(()=>{r.isConnected&&(r.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const P=u.querySelector(".tr-res");P&&Z(p.resolutions,{length:6}).then(({rows:g,total:N})=>{!n||!P.isConnected||(P.innerHTML=g.length?`
                    <ol class="pn-latest">${g.map(A=>`
                        <li><a href="${M({resolution:A.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${a(A.NumeroResolucion)}</b><time>${a(w(A.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${a(A.TipoResolucion||"")}${A.ModalidadResolucion?` · ${a(A.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${a(A.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${I(N)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{P.isConnected&&(P.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}u.addEventListener("click",p=>{var r;const E=p.target.closest("[data-law]");if(E){const P=h().find(g=>String(g.id)===E.dataset.law);P&&l(P);return}const i=p.target.closest("[data-article]");if(i){let P=[];try{P=JSON.parse(((r=i.closest(".tr-articles"))==null?void 0:r.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:i.dataset.article,list:P.length?P:[i.dataset.article]}}))}});function m(p){const E=p&&Ie(p);E?t(E):f(),u.scrollIntoView({behavior:"smooth",block:"start"})}return m(b),{openTramite:p=>m(p),showList:()=>m(null),destroy:()=>{n=!1,u.remove()},onRoute:v}}const Te="cne-pestanas-vistas",Se=()=>{try{return new Set(JSON.parse(localStorage.getItem(Te)||"[]"))}catch{return new Set}};function rt(c){const o=Se();if(!o.has(c)){o.add(c);try{localStorage.setItem(Te,JSON.stringify([...o]))}catch{}}}const J=[{id:"permisos",group:"CNE",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",group:"CNE",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",group:"CNE",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",group:"CNE",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."},{id:"mapa",group:"CNE",label:"Mapa",intro:"Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos."},{id:"sener",group:"SENER",label:"Títulos y permisos",intro:"Títulos y permisos de la Secretaría de Energía: asignaciones, pozos, contratos de exploración y extracción, comercio exterior y biocombustibles, con su fuente oficial."}],Q=[{id:"cne",short:"CNE",name:"Comisión Nacional de Energía"},{id:"sener",short:"SENER",name:"Secretaría de Energía"}];function Ne(c){const o=Q.find(b=>b.id===c)||Q[0];return`<b>${o.short}</b>${o.name}`}function lt(c,o,{route:b={tab:"permisos"},onOpenLaw:l=()=>{},setHash:v=()=>{}}={}){let n=null,h=null;const d=document.createElement("section");d.className="pm-view",d.setAttribute("aria-labelledby","pm-title"),d.innerHTML=`
        <div class="pm-head">
            <p class="pm-autoridad" data-authority></p>
            <h1 id="pm-title">Permisos de energía</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de permisos">
                ${Q.map(t=>`<div class="pm-tab-grupo" data-aut="${t.id}"><span class="pm-tab-group" aria-hidden="true">${t.short}</span>${J.filter(m=>m.group===t.short).map(m=>`<a role="tab" class="pm-tab" id="pm-tab-${m.id}" href="${M({tab:m.id})}" data-tab="${m.id}" aria-controls="pm-tabpanel" aria-label="${m.label} · ${m.group}">${m.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}</div>`).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,c.replaceChildren(d);const u=d.querySelector(".pm-tabpanel");function f(t,m){n==null||n.destroy(),h=t,rt(t);const p=Se();d.querySelectorAll(".pm-tab").forEach(i=>{const r=!p.has(i.dataset.tab)&&i.dataset.tab!=="permisos";i.classList.toggle("is-new",r),r?i.setAttribute("aria-description","Nueva sección"):i.removeAttribute("aria-description")});const E=J.find(i=>i.id===t)||J[0];if(d.querySelector(".pm-intro").textContent=E.intro,d.querySelector("[data-authority]").innerHTML=Ne(t==="sener"?"sener":"cne"),d.classList.toggle("en-sener",t==="sener"),d.classList.toggle("en-mapa",t==="mapa"),d.querySelectorAll(".pm-tab").forEach(i=>{const r=i.dataset.tab===t;i.setAttribute("aria-selected",String(r)),i.classList.toggle("is-on",r)}),u.setAttribute("aria-labelledby",`pm-tab-${t}`),t==="resoluciones")n=Qe(u,o,{resolution:m.resolution||null,filters:m.filters||null,onRoute:i=>v(M({tab:t,resolution:i}))});else if(t==="tramites")n=it(u,o,{tramite:m.tramite||null,onOpenLaw:l});else if(t==="panorama")n=nt(u);else if(t==="sener"){const i={destroyed:!1,view:null,record:m.record||null,destroy(){var r;this.destroyed=!0,(r=this.view)==null||r.destroy()},openRecord(r){this.view?this.view.openRecord(r):this.record=r},showList(){var r;this.record=null,(r=this.view)==null||r.showList()}};n=i,u.innerHTML='<p class="pm-loading">Cargando los títulos de la SENER…</p>',le(()=>import("./cne-sener-view-BZibYtx7.js"),__vite__mapDeps([0,1,2,3,4,5,6,7])).then(r=>r.renderCneSenerView(u,{catalog:o,onOpenLaw:l,record:i.record,onRoute:P=>v(M(P?{record:P}:{tab:"sener"}))})).then(r=>{i.destroyed?r.destroy():i.view=r}).catch(()=>{i.destroyed||(u.innerHTML='<p class="pm-loading">No se pudo cargar esta sección. Revisa tu conexión e intenta de nuevo.</p>')})}else if(t==="mapa"){const i={destroyed:!1,view:null,permit:m.mapPermit||null,destroy(){var r;this.destroyed=!0,(r=this.view)==null||r.destroy()},focusPermit(r){this.view?this.view.focusPermit(r):this.permit=r}};n=i,u.innerHTML='<p class="pm-loading">Cargando el mapa…</p>',le(()=>import("./permits-map-view-BoC7mqad.js"),__vite__mapDeps([8,1,2,9,10,5,3,4,6,11,12,13])).then(r=>r.renderPermitsMapView(u,{permit:i.permit})).then(r=>{i.destroyed?r.destroy():i.view=r}).catch(()=>{i.destroyed||(u.innerHTML='<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>')})}else n=Je(u,o,{permit:m.permit||null,onOpenLaw:l,onRoute:i=>v(M({tab:t,permit:i}))})}function y(t={tab:"permisos"}){const m=t.tab||"permisos";if(m!==h){f(m,t);return}m==="permisos"?t.permit?n.openPermit(t.permit):n.showList():m==="resoluciones"?t.resolution?n.openResolution(t.resolution):t.filters&&Object.keys(t.filters).length?n.applyFilters(t.filters):n.showList():m==="tramites"?t.tramite?n.openTramite(t.tramite):n.showList():m==="mapa"&&t.mapPermit?n.focusPermit(t.mapPermit):m==="sener"&&(t.record?n.openRecord(t.record):n.showList())}return y(b),{go:y,destroy:()=>{n==null||n.destroy(),d.remove()}}}const ut=Object.freeze(Object.defineProperty({__proto__:null,authorityTag:Ne,renderCneView:lt},Symbol.toStringTag,{value:"Module"}));export{ut as c,je as p,Be as t};
