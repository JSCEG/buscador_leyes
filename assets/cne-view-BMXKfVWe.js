const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/permits-map-view-CoyJaumk.js","assets/index-BnypqSFB.js","assets/index-C6S-ueIS.css","assets/_commonjsHelpers-Cpj98o6Y.js","assets/permits-map-view-Dsdqs5xq.css"])))=>i.map(i=>d[i]);
import{R as de,k as z,p as Z,t as ve,l as ee,m as te,n as ae,q as ye,r as J,v as k,w as ge,x as Ee,y as B,z as W,B as Ne,C as Se,D as Ce,E as se,F as Re,G as j,H as Te,I as Le,T as oe,_ as Pe}from"./index-BnypqSFB.js";const e=l=>String(l??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n]),I=l=>String(l??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),x=l=>Number(l||0).toLocaleString("es-MX"),D=(l,n,h)=>`${x(l)} ${Number(l)===1?n:h}`,Me=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],w=l=>{const n=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(l||"").trim());return n?`${Number(n[1])} ${Me[Number(n[2])-1]} ${n[3]}`:""},_=l=>`<div class="pm-list">${'<div class="pm-card pm-skel"><i></i><i></i><i></i></div>'.repeat(l)}</div>`,X=(l,n)=>`
    <div class="pm-error">
        <p><strong>No pudimos consultar ${l}.</strong> El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>
        <a class="pm-btn" href="${n}" target="_blank" rel="noopener">Abrir el sitio de la CNE</a>
    </div>`,ne={LSE:"ley del sector electrico",LSH:"ley del sector hidrocarburos",LCNE:"ley de la comision nacional de energia"};function ue(l,n){return l.find(h=>I(h.siglas)===I(n))||ne[n]&&l.find(h=>I(h.titulo).startsWith(ne[n]))||null}function Ae(l,n){const h=S=>I(S).replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(o=>o&&!/^(de|del|la|las|los|el|y)$/.test(o)).join(" "),C=h(n);return C&&l.find(S=>h(S.titulo)===C)||null}const me='<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',xe='<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 8h6M9 12h4"/></svg>';function fe(l,n="Guía de trámite"){return`<a class="pm-guide-link" href="#tramite=${encodeURIComponent(l.id)}">${xe}<span><small>${e(n)}</small>${e(l.title)}</span><b aria-hidden="true">→</b></a>`}const ie=20,V=l=>X(l,de),ke={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function He(l,n=[],{onOpenLaw:h=()=>{},permit:C=null,onRoute:S=()=>{}}={}){const o={numero:"",titular:"",proyecto:"",start:0};let v=[],c=0,p=0,u=!0;const f=document.createElement("div");f.className="pm-panel",f.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${de}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,l.replaceChildren(f);const t=f.querySelector(".pm-form"),m=f.querySelector(".pm-status"),i=f.querySelector(".pm-body");function $(a){return a?`<span class="pm-estado is-${ke[a]||"off"}">${e(a)}</span>`:""}function r(a){const{sector:y,activity:E}=Z(a.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${e(a.PermisoId)}" data-sector="${(y==null?void 0:y.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${e(a.Numero)}</span>${$(a.Estado)}</span>
                <span class="pm-holder">${e(a.Persona||"Titular sin dato")}</span>
                ${a.AliasProyecto?`<span class="pm-alias">${e(a.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${y?`<span class="pm-tag">${e(y.label)}${E?` · ${e(E)}`:""}</span>`:""}
                    <span>${D(a.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${a.AnexosAsociados?`<span>${D(a.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${te(ae(a.Numero),{compact:!0})}<a class="pm-card-pdf" href="${ee(a.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${e(a.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function d(){if(!v.length){m.textContent="",i.innerHTML='<p class="pm-empty">Ningún permiso coincide con la búsqueda. Revisa el número o prueba con una parte del nombre del titular.</p>';return}const a=o.start+1,y=o.start+v.length;m.textContent=`${x(a)}–${x(y)} de ${D(c,"permiso","permisos")}`,i.innerHTML=`
            <ul class="pm-list">${v.map(r).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${o.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${y<c?"":"disabled"}>Siguientes →</button>
            </nav>`}async function L(){const a=++p;i.innerHTML=_(6),m.textContent="Consultando el registro de la CNE…";try{const y=await z({...o,length:ie});if(!u||a!==p)return;v=y.rows,c=y.total,d()}catch{if(!u||a!==p)return;m.textContent="",i.innerHTML=V("los permisos")}}function g(a){if(!a)return[];const y=typeof n=="function"?n()||[]:n;return a.laws.map(E=>ue(y,E)).filter((E,H,s)=>E&&s.indexOf(E)===H)}async function P(a,{updateRoute:y=!0}={}){y&&S(a.Numero);const{sector:E,activity:H}=Z(a.Numero),s=g(E),R=ve(a.Numero);m.textContent="",i.innerHTML=`
            <article class="pm-detail" data-sector="${(E==null?void 0:E.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${E?`${e(E.label)}${H?` · ${e(H)}`:""}`:"Permiso"}</span>${$(a.Estado)}</div>
                    <h2 id="pm-detail-title">${e(a.Numero)}</h2>
                    <p class="pm-holder">${e(a.Persona||"Titular sin dato")}</p>
                    ${a.AliasProyecto?`<p class="pm-alias">${e(a.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${ee(a.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${te(ae(a.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${e(a.NumeroExpediente||"—")}</dd></div>
                    <div><dt>Último acuse</dt><dd>${e(w(a.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${x(a.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${x(a.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${x(a.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${x(a.AnexosAsociados)}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Línea de resoluciones</h3>
                    <div class="pm-res">${_(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-anx-title">
                    <h3 id="pm-anx-title">Anexos</h3>
                    <div class="pm-anx">${a.AnexosAsociados?_(1):'<p class="pm-note">Este permiso no tiene anexos publicados.</p>'}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${s.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${s.map(N=>`<button type="button" class="pm-law" data-law="${e(N.id)}"><b>${e(N.siglas||"")}</b><span>${e(N.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${R?fe(R):""}
                </section>
            </article>`,i.scrollIntoView({behavior:"smooth",block:"start"});const A=i.querySelector(".pm-res");if(ye(a.ExpedienteId).then(N=>{!u||!A.isConnected||(A.innerHTML=N.length?`<ol class="pm-timeline">${N.map((b,T)=>{const q=J(b.REsolucionId);return`
                <li class="${T===0?"is-first":""}">
                    <time>${e(w(b.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${e(b.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${e(b.NumeroResolucion||"")}</b>${b.Acta?` · Acta ${e(b.Acta)}`:""}${b.Modalidad?` · ${e(b.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${q?`<a class="pm-res-pdf" href="${e(q)}" target="_blank" rel="noopener" aria-label="Ver resolución ${e(b.NumeroResolucion||"")} en PDF">${me}Ver resolución (PDF)</a>`:""}
                            ${b.NumeroResolucion?`<a class="pm-res-more" href="${k({resolution:b.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{A.isConnected&&(A.innerHTML=V("las resoluciones"))}),a.AnexosAsociados){const N=i.querySelector(".pm-anx");ge(a.PermisoId).then(b=>{!u||!N.isConnected||(N.innerHTML=b.length?`<ul class="pm-annexes">${b.map(T=>{const q=Ee(T),F=e(T.Descripcion||"Anexo");return`<li>${q?`<a href="${e(q)}" target="_blank" rel="noopener">${F}</a>`:`<span>${F}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{N.isConnected&&(N.innerHTML=V("los anexos"))})}i.querySelector(".pm-back").addEventListener("click",()=>{S(null),v.length?d():L()}),i.querySelector(".pm-share").addEventListener("click",N=>{var T;const b=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(a.Numero)}`;(T=navigator.clipboard)==null||T.writeText(b).then(()=>{N.target.textContent="Enlace copiado"},()=>{})}),i.querySelectorAll("[data-law]").forEach(N=>N.addEventListener("click",()=>{const b=s.find(T=>String(T.id)===N.dataset.law);b&&h(b)}))}async function M(a){const y=++p;i.innerHTML=_(2),m.textContent="Buscando el permiso…";try{const E=await z({numero:a,length:10});if(!u||y!==p)return;const H=E.rows.find(s=>I(s.Numero)===I(a))||(E.rows.length===1?E.rows[0]:null);if(H){v=[],P(H,{updateRoute:!1});return}t.numero.value=a,o.numero=a,v=E.rows,c=E.total,d()}catch{if(!u||y!==p)return;m.textContent="",i.innerHTML=V("el permiso")}}return t.addEventListener("submit",a=>{a.preventDefault(),Object.assign(o,{numero:t.numero.value.trim(),titular:t.titular.value.trim(),proyecto:t.proyecto.value.trim(),start:0}),S(null),L()}),t.addEventListener("reset",()=>{Object.assign(o,{numero:"",titular:"",proyecto:"",start:0}),S(null),setTimeout(L)}),i.addEventListener("click",a=>{const y=a.target.closest("[data-page]");if(y){o.start=Math.max(0,o.start+Number(y.dataset.page)*ie),L().then(()=>f.scrollIntoView({behavior:"smooth",block:"start"}));return}const E=a.target.closest("[data-permit]"),H=E&&v.find(s=>String(s.PermisoId)===E.dataset.permit);H&&P(H)}),C?M(C):L(),{openPermit:a=>M(a),showList:()=>{v.length?d():L()},destroy:()=>{u=!1,f.remove()}}}const le=20,re=l=>X(l,B),qe=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],Fe=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],we=1995;function Oe(l,n=[],{resolution:h=null,filters:C=null,onRoute:S=()=>{}}={}){const o={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let v=[],c=0,p=0,u=!0;const f=()=>typeof n=="function"?n()||[]:n,t=new Date().getFullYear(),m=Array.from({length:t-we+1},(s,R)=>t-R),i=document.createElement("div");i.className="pm-panel",i.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${m.map(s=>`<option>${s}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${qe.map(s=>`<option value="${e(s)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${Fe.map(s=>`<option value="${e(s)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${B}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,l.replaceChildren(i);const $=i.querySelector("form"),r=i.querySelector(".pm-status"),d=i.querySelector(".pm-body");function L(s){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${e(s.NumeroResolucion)}" data-sector="${ce(s.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${e(s.NumeroResolucion)}</span><span class="pm-date">${e(w(s.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${e(s.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${e(s.Proemio||"")}</span>
                <span class="pm-meta">${s.ModalidadResolucion?`<span class="pm-tag">${e(s.ModalidadResolucion)}</span>`:""}${s.NumeroActa?`<span>${e(s.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${e(J(s.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${e(s.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function g(){if(!v.length){r.textContent="",d.innerHTML='<p class="pm-empty">Ninguna resolución coincide. Prueba con menos filtros o con una parte del texto.</p>';return}const s=o.start+v.length;r.textContent=`${x(o.start+1)}–${x(s)} de ${D(c,"resolución","resoluciones")} · más recientes primero`,d.innerHTML=`
            <ul class="pm-list">${v.map(L).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${o.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${s<c?"":"disabled"}>Siguientes →</button>
            </nav>`}async function P(){const s=++p;d.innerHTML=_(6),r.textContent="Consultando las resoluciones de la CNE…";try{const R=await W(o,{start:o.start,length:le});if(!u||s!==p)return;v=R.rows,c=R.total,g()}catch{if(!u||s!==p)return;r.textContent="",d.innerHTML=re("las resoluciones")}}function M(s){const R=se(s);return R.length?`<ul class="pm-found">${R.map((A,N)=>{const b=Ae(f(),A.law);return`<li data-found="${N}" ${b?`data-law-id="${e(b.id)}"`:""}>
                <p class="pm-found-law">${b?`<b>${e(b.siglas||"")}</b> `:""}${e(A.law)}${b?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${A.articles.map(T=>`<span class="pm-art" data-art="${e(T)}">Art. ${e(T)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${e(s)}</p></details>`:s?`<p class="pm-note">${e(s)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function a(s,R){const A=se(R);await Promise.all(A.map(async(N,b)=>{const T=s.querySelector(`[data-found="${b}"][data-law-id]`);if(!T)return;const q=await Re(T.dataset.lawId,N.articles);!u||!T.isConnected||T.querySelectorAll("[data-art]").forEach(F=>{const Q=q[F.dataset.art];if(!Q)return;const O=document.createElement("button");O.type="button",O.className="pm-art is-linked",O.dataset.article=Q,O.textContent=F.textContent,O.title="Abrir el artículo",F.replaceWith(O)})}))}function y(s,{updateRoute:R=!0}={}){R&&S(s.NumeroResolucion);const A=Ne(s.Proemio),N=Se(s),b=J(s.ResolucionId);r.textContent="",d.innerHTML=`
            <article class="pm-detail" data-sector="${ce(s.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e(s.TipoResolucion||"Resolución")}${s.ModalidadResolucion?` · ${e(s.ModalidadResolucion)}`:""}</span><span class="pm-date">${e(w(s.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${e(s.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${e(s.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${b?`<a class="pm-btn pm-btn-primary" href="${e(b)}" target="_blank" rel="noopener">${me}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${e(w(s.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${e(s.NumeroActa||"—")}</dd></div>
                    ${s.Ponente?`<div><dt>Ponente</dt><dd>${e(s.Ponente)}</dd></div>`:""}
                </dl>
                ${A.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${A.map(T=>`<a class="pm-law" href="${k({permit:T})}"><b>Permiso</b><span>${e(T)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${M(s.Fundamentacion||"")}</div>
                    ${N?fe(N,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,d.scrollIntoView({behavior:"smooth",block:"start"}),a(d.querySelector(".pm-found-host"),s.Fundamentacion||"").catch(()=>{}),d.querySelector(".pm-back").addEventListener("click",()=>{S(null),v.length?g():P()}),d.querySelector(".pm-share").addEventListener("click",T=>{var F;const q=`${location.origin}${location.pathname}${k({resolution:s.NumeroResolucion})}`;(F=navigator.clipboard)==null||F.writeText(q).then(()=>{T.target.textContent="Enlace copiado"},()=>{})})}async function E(s){const R=++p;d.innerHTML=_(2),r.textContent="Buscando la resolución…";try{const A=await Ce(s);if(!u||R!==p)return;if(A){v=[],y(A,{updateRoute:!1});return}$.numero.value=s,o.numero=s,P()}catch{if(!u||R!==p)return;r.textContent="",d.innerHTML=re("la resolución")}}$.addEventListener("submit",s=>{s.preventDefault(),Object.assign(o,{numero:$.numero.value.trim(),texto:$.texto.value.trim(),fecha:$.fecha.value,tipo:$.tipo.value.trim(),modalidad:$.modalidad.value.trim(),start:0}),S(null),P()}),$.addEventListener("reset",()=>{Object.assign(o,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),S(null),setTimeout(P)}),d.addEventListener("click",s=>{const R=s.target.closest("[data-article]");if(R){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:R.dataset.article,list:[R.dataset.article]}}));return}const A=s.target.closest("[data-page]");if(A){o.start=Math.max(0,o.start+Number(A.dataset.page)*le),P().then(()=>i.scrollIntoView({behavior:"smooth",block:"start"}));return}const N=s.target.closest("[data-resolution]"),b=N&&v.find(T=>T.NumeroResolucion===N.dataset.resolution);b&&y(b)});function H(s={}){Object.assign(o,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...s,start:0});for(const R of["numero","texto","fecha","tipo","modalidad"])$[R].value=o[R]||"";P()}return h?E(h):C&&Object.keys(C).length?H(C):P(),{openResolution:s=>E(s),applyFilters:H,showList:()=>{v.length?g():P()},destroy:()=>{u=!1,i.remove()}}}function ce(l=""){const n=l.toLowerCase();return/el[eé]ctric/.test(n)?"electricidad":/licuado/.test(n)?"gaslp":/gas natural/.test(n)?"gasnatural":/petrol|hidrocarb/.test(n)?"petroliferos":"otro"}const be="cne-panorama-v1",_e=12*60*60*1e3,pe=12,G=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],K=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function Ie(l,n=3){const h=[];for(let C=0;C<l.length;C+=n)h.push(...await Promise.all(l.slice(C,C+n).map(S=>S())));return h}function je(){try{const l=JSON.parse(localStorage.getItem(be)||"null");return l&&Date.now()-l.at<_e?l.data:null}catch{return null}}function De(l){try{localStorage.setItem(be,JSON.stringify({at:Date.now(),data:l}))}catch{}}async function Ve(){const n=new Date().getFullYear(),h=Array.from({length:pe},(u,f)=>n-pe+1+f),[C,S,...o]=await Ie([()=>z({length:1}).then(u=>u.total),()=>j({}),...h.map(u=>()=>j({fecha:String(u)})),...G.map(u=>()=>j({fecha:String(n),tipo:u})),...K.map(u=>()=>j({fecha:String(n),modalidad:u.filter}))]),v=h.map((u,f)=>({year:u,count:o[f]})),c=G.map((u,f)=>({label:u,count:o[h.length+f]})),p=K.map((u,f)=>({label:u.label,count:o[h.length+G.length+f]}));return{year:n,permits:C,resolutions:S,thisYear:v.at(-1).count,perYear:v,byType:c,byMode:p,at:Date.now()}}function Be(l){let n=!0;const h=document.createElement("div");h.className="pm-panel pn-view",h.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${B}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,l.replaceChildren(h);const C=h.querySelector(".pm-status"),S=h.querySelector(".pn-body"),o=(c,p,u)=>{const f=Math.max(1,...c.map(t=>t.count));return`<ul class="pn-bars">${c.filter(t=>t.count>0).sort((t,m)=>m.count-t.count).map((t,m)=>`
            <li><a class="pn-bar-row" href="${k({tab:"resoluciones",filters:u(t)})}" data-tip="${e(`${t.label}: ${x(t.count)} ${p}. Ver cuáles`)}" style="--i:${m}">
                <span class="pn-bar-label">${e(t.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(t.count/f*100))}%"></span></span>
                <span class="pn-bar-value">${x(t.count)}<span class="sr-only"> ${p}</span></span>
            </a></li>`).join("")}</ul>`};function v(c,p,u){const f=Math.max(1,...c.perYear.map(t=>t.count));C.textContent=`Actualizado ${new Date(c.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,S.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${k({tab:"permisos"})}"><b>${x(c.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${k({tab:"resoluciones"})}"><b>${x(c.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${x(c.thisYear)}</b><span>resoluciones en ${c.year}</span></div>
                ${u?`<a class="pn-kpi" href="${k({tab:"resoluciones"})}"><b>${e(w(u.date))}</b><span>última sesión (${e(u.acta)})${u.count?`: ${D(u.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${c.perYear.map((t,m)=>`
                    <li><a href="${k({tab:"resoluciones",filters:{fecha:String(t.year)}})}" data-tip="${e(`${t.year}: ${x(t.count)} resoluciones. Ver cuáles`)}" style="--i:${m}">
                        <span class="pn-col-value">${x(t.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(t.count/f*100))}%"></span>
                        <span class="pn-col-label">${t.year===c.year?`${t.year}*`:t.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${c.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${c.year} por tipo</h3>${o(c.byType,"resoluciones",t=>({fecha:String(c.year),tipo:t.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${c.year} por modalidad</h3>${o(c.byMode,"resoluciones",t=>{var m;return{fecha:String(c.year),modalidad:((m=K.find(i=>i.label===t.label))==null?void 0:m.filter)||t.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${p.length?`<ol class="pn-latest">${p.map(t=>`
                    <li><a href="${k({resolution:t.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${e(t.NumeroResolucion)}</b><time>${e(w(t.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${e(t.TipoResolucion||"")}${t.ModalidadResolucion?` · ${e(t.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${e(t.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const c=W({},{length:8}).then(m=>m.rows).catch(()=>[]);let p=je();p||(p=await Ve(),De(p));const u=await c,f=u[0],t=f!=null&&f.NumeroActa?{date:f.FechaResolucion,acta:f.NumeroActa,count:await j({acta:f.NumeroActa}).catch(()=>0)}:null;n&&v(p,u,t)}catch{if(!n)return;C.textContent="",S.innerHTML=X("las cifras",B)}})(),{destroy:()=>{n=!1,h.remove()}}}const Y={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},Ge=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function Ye(l,n=[],{tramite:h=null,onOpenLaw:C=()=>{},onRoute:S=()=>{}}={}){let o=!0;const v=()=>typeof n=="function"?n()||[]:n,c=i=>i.map($=>ue(v(),$)).filter(Boolean),p=document.createElement("div");p.className="pm-panel tr-view",l.replaceChildren(p);function u(){const i=[...new Set(oe.map($=>$.sector))];p.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${i.map($=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${$}">
                    <h3 id="tr-sector-${$}" class="tr-sector-title">${e(Y[$]||$)}</h3>
                    <ul class="pm-list">${oe.filter(r=>r.sector===$).map(r=>{const d=c([...r.base,...r.rules,...r.forms,...r.calls]).length,L=c(r.forms).length;return`<li><a class="pm-card tr-card" href="${k({tramite:r.id})}" data-sector="${r.sector}">
                            <span class="pm-num">${e(Y[r.sector]||"")}</span>
                            <span class="pm-holder">${e(r.title)}</span>
                            <span class="pm-meta"><span class="pm-tag">${x(d)} instrumentos</span>${L?"<span>Con formatos oficiales</span>":""}${c(r.calls).length?"<span>Con convocatoria</span>":""}</span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function f(i){return`<button type="button" class="pm-law" data-law="${e(i.id)}"><b>${e(i.siglas||"")}</b><span>${e(i.titulo)}</span></button>`}function t(i){const $=Ge.map(g=>{let P=c(i[g.key]);return g.key==="calls"&&(P=P.sort((M,a)=>String(a.fecha_publicacion||"").localeCompare(String(M.fecha_publicacion||"")))),{...g,laws:P}}).filter(g=>g.laws.length);p.innerHTML=`
            <article class="pm-detail" data-sector="${i.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${k({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${e(Y[i.sector]||"")}</span></div>
                    <h2 id="tr-title">${e(i.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${$.map(g=>`
                    <section class="pm-section" aria-labelledby="tr-${g.key}">
                        <h3 id="tr-${g.key}">${e(g.title)}</h3>
                        <p class="pm-note">${e(g.note)}</p>
                        <div class="pm-laws">${g.laws.map(f).join("")}</div>
                    </section>`).join("")}
                <section class="pm-section" aria-labelledby="tr-articles">
                    <h3 id="tr-articles">Artículos clave</h3>
                    <p class="pm-note">Artículos y numerales del acervo que tratan este trámite, por relevancia.</p>
                    <div class="tr-articles"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>
                ${i.resolutions?`<section class="pm-section" aria-labelledby="tr-res">
                    <h3 id="tr-res">Resoluciones recientes de la CNE</h3>
                    <p class="pm-note">Antecedentes de este tipo de trámite, de lo más reciente a lo más antiguo.</p>
                    <div class="tr-res"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>`:""}
            </article>`,p.querySelector(".pm-share").addEventListener("click",g=>{var M;const P=`${location.origin}${location.pathname}${k({tramite:i.id})}`;(M=navigator.clipboard)==null||M.writeText(P).then(()=>{g.target.textContent="Enlace copiado"},()=>{})});const r=c(i.articles.in).map(g=>g.id),d=p.querySelector(".tr-articles");Le(i.articles.query,{lawIds:r,limit:24}).then(({data:g})=>{if(!o||!d.isConnected)return;const P=new Map,M=(g||[]).filter(a=>a.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(a.articulo_label||""))).filter(a=>{const y=P.get(a.ley_id)||0;return P.set(a.ley_id,y+1),y<3}).slice(0,8);d.innerHTML=M.length?`<ol class="tr-article-list">${M.map(a=>{var y;return`
                <li><button type="button" class="tr-article" data-article="${e(a.id)}">
                    <span class="tr-article-top"><b>${e(a.siglas_ley||((y=v().find(E=>String(E.id)===String(a.ley_id)))==null?void 0:y.siglas)||"")}</b> ${e(a.articulo_label||"")}</span>
                    <span class="tr-article-text">${e(String(a.fragmento||a.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',d.dataset.ids=JSON.stringify(M.map(a=>a.id))}).catch(()=>{d.isConnected&&(d.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const L=p.querySelector(".tr-res");L&&W(i.resolutions,{length:6}).then(({rows:g,total:P})=>{!o||!L.isConnected||(L.innerHTML=g.length?`
                    <ol class="pn-latest">${g.map(M=>`
                        <li><a href="${k({resolution:M.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${e(M.NumeroResolucion)}</b><time>${e(w(M.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${e(M.TipoResolucion||"")}${M.ModalidadResolucion?` · ${e(M.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${e(M.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${x(P)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{L.isConnected&&(L.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}p.addEventListener("click",i=>{var d;const $=i.target.closest("[data-law]");if($){const L=v().find(g=>String(g.id)===$.dataset.law);L&&C(L);return}const r=i.target.closest("[data-article]");if(r){let L=[];try{L=JSON.parse(((d=r.closest(".tr-articles"))==null?void 0:d.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:r.dataset.article,list:L.length?L:[r.dataset.article]}}))}});function m(i){const $=i&&Te(i);$?t($):u(),p.scrollIntoView({behavior:"smooth",block:"start"})}return m(h),{openTramite:i=>m(i),showList:()=>m(null),destroy:()=>{o=!1,p.remove()},onRoute:S}}const he="cne-pestanas-vistas",$e=()=>{try{return new Set(JSON.parse(localStorage.getItem(he)||"[]"))}catch{return new Set}};function Ue(l){const n=$e();if(!n.has(l)){n.add(l);try{localStorage.setItem(he,JSON.stringify([...n]))}catch{}}}const U=[{id:"permisos",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."},{id:"mapa",label:"Mapa",intro:"Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos."}];function Je(l,n,{route:h={tab:"permisos"},onOpenLaw:C=()=>{},setHash:S=()=>{}}={}){let o=null,v=null;const c=document.createElement("section");c.className="pm-view",c.setAttribute("aria-labelledby","pm-title"),c.innerHTML=`
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">CNE: permisos y resoluciones</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de la CNE">
                ${U.map(t=>`<a role="tab" class="pm-tab" id="pm-tab-${t.id}" href="${k({tab:t.id})}" data-tab="${t.id}" aria-controls="pm-tabpanel">${t.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,l.replaceChildren(c);const p=c.querySelector(".pm-tabpanel");function u(t,m){o==null||o.destroy(),v=t,Ue(t);const i=$e();c.querySelectorAll(".pm-tab").forEach(r=>{const d=!i.has(r.dataset.tab)&&r.dataset.tab!=="permisos";r.classList.toggle("is-new",d),d?r.setAttribute("aria-description","Nueva sección"):r.removeAttribute("aria-description")});const $=U.find(r=>r.id===t)||U[0];if(c.querySelector(".pm-intro").textContent=$.intro,c.querySelectorAll(".pm-tab").forEach(r=>{const d=r.dataset.tab===t;r.setAttribute("aria-selected",String(d)),r.classList.toggle("is-on",d)}),p.setAttribute("aria-labelledby",`pm-tab-${t}`),t==="resoluciones")o=Oe(p,n,{resolution:m.resolution||null,filters:m.filters||null,onRoute:r=>S(k({tab:t,resolution:r}))});else if(t==="tramites")o=Ye(p,n,{tramite:m.tramite||null,onOpenLaw:C});else if(t==="panorama")o=Be(p);else if(t==="mapa"){const r={destroyed:!1,view:null,permit:m.mapPermit||null,destroy(){var d;this.destroyed=!0,(d=this.view)==null||d.destroy()},focusPermit(d){this.view?this.view.focusPermit(d):this.permit=d}};o=r,p.innerHTML='<p class="pm-loading">Cargando el mapa…</p>',Pe(()=>import("./permits-map-view-CoyJaumk.js"),__vite__mapDeps([0,1,2,3,4])).then(d=>d.renderPermitsMapView(p,{permit:r.permit})).then(d=>{r.destroyed?d.destroy():r.view=d}).catch(()=>{r.destroyed||(p.innerHTML='<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>')})}else o=He(p,n,{permit:m.permit||null,onOpenLaw:C,onRoute:r=>S(k({tab:t,permit:r}))})}function f(t={tab:"permisos"}){const m=t.tab||"permisos";if(m!==v){u(m,t);return}m==="permisos"?t.permit?o.openPermit(t.permit):o.showList():m==="resoluciones"?t.resolution?o.openResolution(t.resolution):t.filters&&Object.keys(t.filters).length?o.applyFilters(t.filters):o.showList():m==="tramites"?t.tramite?o.openTramite(t.tramite):o.showList():m==="mapa"&&t.mapPermit&&o.focusPermit(t.mapPermit)}return f(h),{go:f,destroy:()=>{o==null||o.destroy(),c.remove()}}}export{Je as renderCneView};
