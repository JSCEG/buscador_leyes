const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/permits-map-view-BNkGnj-z.js","assets/index-DlxtLmVH.js","assets/index-10tqktKz.css","assets/_commonjsHelpers-Cpj98o6Y.js","assets/permits-map-view-Bm8jHHMh.css"])))=>i.map(i=>d[i]);
import{R as pe,p as z,q as Z,t as $e,r as ee,v as te,w as ae,x as M,y as ye,z as K,B as ve,C as ge,D as G,E as X,F as Ee,G as Ne,H as Se,I as se,J as Re,K as w,L as Ce,M as Te,T as oe,_ as Le}from"./index-DlxtLmVH.js";import{s as I,e,d as O,n as x,g as de,P as ue,f as V,p as D,a as Q,l as me,b as Pe}from"./cne-shared-BdjQaSa0.js";const ne=20,B=v=>Q(v,pe),Ae={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function Me(v,f=[],{onOpenLaw:S=()=>{},permit:T=null,onRoute:L=()=>{}}={}){const n={numero:"",titular:"",proyecto:"",start:0};let $=[],l=0,r=0,c=!0;const b=document.createElement("div");b.className="pm-panel",b.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${pe}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,v.replaceChildren(b);const t=b.querySelector(".pm-form"),d=b.querySelector(".pm-status"),o=b.querySelector(".pm-body");function h(a){return a?`<span class="pm-estado is-${Ae[a]||"off"}">${e(a)}</span>`:""}function i(a){const{sector:y,activity:E}=Z(a.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${e(a.PermisoId)}" data-sector="${(y==null?void 0:y.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${e(a.Numero)}</span>${h(a.Estado)}</span>
                <span class="pm-holder">${e(a.Persona||"Titular sin dato")}</span>
                ${a.AliasProyecto?`<span class="pm-alias">${e(a.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${y?`<span class="pm-tag">${e(y.label)}${E?` · ${e(E)}`:""}</span>`:""}
                    <span>${D(a.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${a.AnexosAsociados?`<span>${D(a.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${te(ae(a.Numero),{compact:!0})}<a class="pm-card-pdf" href="${ee(a.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${e(a.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function p(){if(!$.length){d.textContent="",o.innerHTML='<p class="pm-empty">Ningún permiso coincide con la búsqueda. Revisa el número o prueba con una parte del nombre del titular.</p>';return}const a=n.start+1,y=n.start+$.length;d.textContent=`${x(a)}–${x(y)} de ${D(l,"permiso","permisos")}`,o.innerHTML=`
            <ul class="pm-list">${$.map(i).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${y<l?"":"disabled"}>Siguientes →</button>
            </nav>`}async function R(){const a=++r;o.innerHTML=I(6),d.textContent="Consultando el registro de la CNE…";try{const y=await z({...n,length:ne});if(!c||a!==r)return;$=y.rows,l=y.total,p()}catch{if(!c||a!==r)return;d.textContent="",o.innerHTML=B("los permisos")}}function g(a){if(!a)return[];const y=typeof f=="function"?f()||[]:f;return a.laws.map(E=>me(y,E)).filter((E,q,s)=>E&&s.indexOf(E)===q)}async function C(a,{updateRoute:y=!0}={}){y&&L(a.Numero);const{sector:E,activity:q}=Z(a.Numero),s=g(E),N=$e(a.Numero);d.textContent="",o.innerHTML=`
            <article class="pm-detail" data-sector="${(E==null?void 0:E.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${E?`${e(E.label)}${q?` · ${e(q)}`:""}`:"Permiso"}</span>${h(a.Estado)}</div>
                    <h2 id="pm-detail-title">${e(a.Numero)}</h2>
                    <p class="pm-holder">${e(a.Persona||"Titular sin dato")}</p>
                    ${a.AliasProyecto?`<p class="pm-alias">${e(a.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${ee(a.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${te(ae(a.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                        <a class="pm-btn" href="${M({mapPermit:a.Numero})}" data-map-link hidden><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Ver en el mapa</a>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${e(a.NumeroExpediente||"—")}</dd></div>
                    <div><dt>Último acuse</dt><dd>${e(O(a.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${x(a.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${x(a.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${x(a.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${x(a.AnexosAsociados)}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Línea de resoluciones</h3>
                    <div class="pm-res">${I(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-anx-title">
                    <h3 id="pm-anx-title">Anexos</h3>
                    <div class="pm-anx">${a.AnexosAsociados?I(1):'<p class="pm-note">Este permiso no tiene anexos publicados.</p>'}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${s.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${s.map(u=>`<button type="button" class="pm-law" data-law="${e(u.id)}"><b>${e(u.siglas||"")}</b><span>${e(u.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${N?de(N):""}
                </section>
            </article>`,o.scrollIntoView({behavior:"smooth",block:"start"});const A=o.querySelector(".pm-res");if(ye(a.ExpedienteId).then(u=>{!c||!A.isConnected||(A.innerHTML=u.length?`<ol class="pm-timeline">${u.map((m,k)=>{const F=K(m.REsolucionId);return`
                <li class="${k===0?"is-first":""}">
                    <time>${e(O(m.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${e(m.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${e(m.NumeroResolucion||"")}</b>${m.Acta?` · Acta ${e(m.Acta)}`:""}${m.Modalidad?` · ${e(m.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${F?`<a class="pm-res-pdf" href="${e(F)}" target="_blank" rel="noopener" aria-label="Ver resolución ${e(m.NumeroResolucion||"")} en PDF">${ue}Ver resolución (PDF)</a>`:""}
                            ${m.NumeroResolucion?`<a class="pm-res-more" href="${M({resolution:m.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{A.isConnected&&(A.innerHTML=B("las resoluciones"))}),a.AnexosAsociados){const u=o.querySelector(".pm-anx");ve(a.PermisoId).then(m=>{!c||!u.isConnected||(u.innerHTML=m.length?`<ul class="pm-annexes">${m.map(k=>{const F=ge(k),j=e(k.Descripcion||"Anexo");return`<li>${F?`<a href="${e(F)}" target="_blank" rel="noopener">${j}</a>`:`<span>${j}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{u.isConnected&&(u.innerHTML=B("los anexos"))})}const H=o.querySelector("[data-map-link]");fetch(`/api/mapa/buscar?q=${encodeURIComponent(a.Numero)}&limite=5`,{credentials:"same-origin"}).then(u=>u.ok?u.json():null).then(u=>{const m=((u==null?void 0:u.resultados)||[]).find(k=>V(k.numeroPermiso)===V(a.Numero)&&k.latitud!=null);!c||!m||!H.isConnected||(H.href=M({mapPermit:m.numeroPermiso}),H.hidden=!1)}).catch(()=>{}),o.querySelector(".pm-back").addEventListener("click",()=>{L(null),$.length?p():R()}),o.querySelector(".pm-share").addEventListener("click",u=>{var k;const m=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(a.Numero)}`;(k=navigator.clipboard)==null||k.writeText(m).then(()=>{u.target.textContent="Enlace copiado"},()=>{})}),o.querySelectorAll("[data-law]").forEach(u=>u.addEventListener("click",()=>{const m=s.find(k=>String(k.id)===u.dataset.law);m&&S(m)}))}async function P(a){const y=++r;o.innerHTML=I(2),d.textContent="Buscando el permiso…";try{const E=await z({numero:a,length:10});if(!c||y!==r)return;const q=E.rows.find(s=>V(s.Numero)===V(a))||(E.rows.length===1?E.rows[0]:null);if(q){$=[],C(q,{updateRoute:!1});return}t.numero.value=a,n.numero=a,$=E.rows,l=E.total,p()}catch{if(!c||y!==r)return;d.textContent="",o.innerHTML=B("el permiso")}}return t.addEventListener("submit",a=>{a.preventDefault(),Object.assign(n,{numero:t.numero.value.trim(),titular:t.titular.value.trim(),proyecto:t.proyecto.value.trim(),start:0}),L(null),R()}),t.addEventListener("reset",()=>{Object.assign(n,{numero:"",titular:"",proyecto:"",start:0}),L(null),setTimeout(R)}),o.addEventListener("click",a=>{const y=a.target.closest("[data-page]");if(y){n.start=Math.max(0,n.start+Number(y.dataset.page)*ne),R().then(()=>b.scrollIntoView({behavior:"smooth",block:"start"}));return}const E=a.target.closest("[data-permit]"),q=E&&$.find(s=>String(s.PermisoId)===E.dataset.permit);q&&C(q)}),T?P(T):R(),{openPermit:a=>P(a),showList:()=>{$.length?p():R()},destroy:()=>{c=!1,b.remove()}}}const ie=20,le=v=>Q(v,G),xe=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],ke=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],qe=1995;function He(v,f=[],{resolution:S=null,filters:T=null,onRoute:L=()=>{}}={}){const n={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let $=[],l=0,r=0,c=!0;const b=()=>typeof f=="function"?f()||[]:f,t=new Date().getFullYear(),d=Array.from({length:t-qe+1},(s,N)=>t-N),o=document.createElement("div");o.className="pm-panel",o.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${d.map(s=>`<option>${s}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${xe.map(s=>`<option value="${e(s)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${ke.map(s=>`<option value="${e(s)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${G}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,v.replaceChildren(o);const h=o.querySelector("form"),i=o.querySelector(".pm-status"),p=o.querySelector(".pm-body");function R(s){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${e(s.NumeroResolucion)}" data-sector="${re(s.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${e(s.NumeroResolucion)}</span><span class="pm-date">${e(O(s.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${e(s.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${e(s.Proemio||"")}</span>
                <span class="pm-meta">${s.ModalidadResolucion?`<span class="pm-tag">${e(s.ModalidadResolucion)}</span>`:""}${s.NumeroActa?`<span>${e(s.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${e(K(s.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${e(s.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function g(){if(!$.length){i.textContent="",p.innerHTML='<p class="pm-empty">Ninguna resolución coincide. Prueba con menos filtros o con una parte del texto.</p>';return}const s=n.start+$.length;i.textContent=`${x(n.start+1)}–${x(s)} de ${D(l,"resolución","resoluciones")} · más recientes primero`,p.innerHTML=`
            <ul class="pm-list">${$.map(R).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${s<l?"":"disabled"}>Siguientes →</button>
            </nav>`}async function C(){const s=++r;p.innerHTML=I(6),i.textContent="Consultando las resoluciones de la CNE…";try{const N=await X(n,{start:n.start,length:ie});if(!c||s!==r)return;$=N.rows,l=N.total,g()}catch{if(!c||s!==r)return;i.textContent="",p.innerHTML=le("las resoluciones")}}function P(s){const N=se(s);return N.length?`<ul class="pm-found">${N.map((A,H)=>{const u=Pe(b(),A.law);return`<li data-found="${H}" ${u?`data-law-id="${e(u.id)}"`:""}>
                <p class="pm-found-law">${u?`<b>${e(u.siglas||"")}</b> `:""}${e(A.law)}${u?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${A.articles.map(m=>`<span class="pm-art" data-art="${e(m)}">Art. ${e(m)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${e(s)}</p></details>`:s?`<p class="pm-note">${e(s)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function a(s,N){const A=se(N);await Promise.all(A.map(async(H,u)=>{const m=s.querySelector(`[data-found="${u}"][data-law-id]`);if(!m)return;const k=await Re(m.dataset.lawId,H.articles);!c||!m.isConnected||m.querySelectorAll("[data-art]").forEach(F=>{const j=k[F.dataset.art];if(!j)return;const _=document.createElement("button");_.type="button",_.className="pm-art is-linked",_.dataset.article=j,_.textContent=F.textContent,_.title="Abrir el artículo",F.replaceWith(_)})}))}function y(s,{updateRoute:N=!0}={}){N&&L(s.NumeroResolucion);const A=Ee(s.Proemio),H=Ne(s),u=K(s.ResolucionId);i.textContent="",p.innerHTML=`
            <article class="pm-detail" data-sector="${re(s.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e(s.TipoResolucion||"Resolución")}${s.ModalidadResolucion?` · ${e(s.ModalidadResolucion)}`:""}</span><span class="pm-date">${e(O(s.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${e(s.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${e(s.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${u?`<a class="pm-btn pm-btn-primary" href="${e(u)}" target="_blank" rel="noopener">${ue}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${e(O(s.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${e(s.NumeroActa||"—")}</dd></div>
                    ${s.Ponente?`<div><dt>Ponente</dt><dd>${e(s.Ponente)}</dd></div>`:""}
                </dl>
                ${A.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${A.map(m=>`<a class="pm-law" href="${M({permit:m})}"><b>Permiso</b><span>${e(m)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${P(s.Fundamentacion||"")}</div>
                    ${H?de(H,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,p.scrollIntoView({behavior:"smooth",block:"start"}),a(p.querySelector(".pm-found-host"),s.Fundamentacion||"").catch(()=>{}),p.querySelector(".pm-back").addEventListener("click",()=>{L(null),$.length?g():C()}),p.querySelector(".pm-share").addEventListener("click",m=>{var F;const k=`${location.origin}${location.pathname}${M({resolution:s.NumeroResolucion})}`;(F=navigator.clipboard)==null||F.writeText(k).then(()=>{m.target.textContent="Enlace copiado"},()=>{})})}async function E(s){const N=++r;p.innerHTML=I(2),i.textContent="Buscando la resolución…";try{const A=await Se(s);if(!c||N!==r)return;if(A){$=[],y(A,{updateRoute:!1});return}h.numero.value=s,n.numero=s,C()}catch{if(!c||N!==r)return;i.textContent="",p.innerHTML=le("la resolución")}}h.addEventListener("submit",s=>{s.preventDefault(),Object.assign(n,{numero:h.numero.value.trim(),texto:h.texto.value.trim(),fecha:h.fecha.value,tipo:h.tipo.value.trim(),modalidad:h.modalidad.value.trim(),start:0}),L(null),C()}),h.addEventListener("reset",()=>{Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),L(null),setTimeout(C)}),p.addEventListener("click",s=>{const N=s.target.closest("[data-article]");if(N){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:N.dataset.article,list:[N.dataset.article]}}));return}const A=s.target.closest("[data-page]");if(A){n.start=Math.max(0,n.start+Number(A.dataset.page)*ie),C().then(()=>o.scrollIntoView({behavior:"smooth",block:"start"}));return}const H=s.target.closest("[data-resolution]"),u=H&&$.find(m=>m.NumeroResolucion===H.dataset.resolution);u&&y(u)});function q(s={}){Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...s,start:0});for(const N of["numero","texto","fecha","tipo","modalidad"])h[N].value=n[N]||"";C()}return S?E(S):T&&Object.keys(T).length?q(T):C(),{openResolution:s=>E(s),applyFilters:q,showList:()=>{$.length?g():C()},destroy:()=>{c=!1,o.remove()}}}function re(v=""){const f=v.toLowerCase();return/el[eé]ctric/.test(f)?"electricidad":/licuado/.test(f)?"gaslp":/gas natural/.test(f)?"gasnatural":/petrol|hidrocarb/.test(f)?"petroliferos":"otro"}const fe="cne-panorama-v1",Fe=12*60*60*1e3,ce=12,Y=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],W=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function Oe(v,f=3){const S=[];for(let T=0;T<v.length;T+=f)S.push(...await Promise.all(v.slice(T,T+f).map(L=>L())));return S}function _e(){try{const v=JSON.parse(localStorage.getItem(fe)||"null");return v&&Date.now()-v.at<Fe?v.data:null}catch{return null}}function Ie(v){try{localStorage.setItem(fe,JSON.stringify({at:Date.now(),data:v}))}catch{}}async function je(){const f=new Date().getFullYear(),S=Array.from({length:ce},(c,b)=>f-ce+1+b),[T,L,...n]=await Oe([()=>z({length:1}).then(c=>c.total),()=>w({}),...S.map(c=>()=>w({fecha:String(c)})),...Y.map(c=>()=>w({fecha:String(f),tipo:c})),...W.map(c=>()=>w({fecha:String(f),modalidad:c.filter}))]),$=S.map((c,b)=>({year:c,count:n[b]})),l=Y.map((c,b)=>({label:c,count:n[S.length+b]})),r=W.map((c,b)=>({label:c.label,count:n[S.length+Y.length+b]}));return{year:f,permits:T,resolutions:L,thisYear:$.at(-1).count,perYear:$,byType:l,byMode:r,at:Date.now()}}function we(v){let f=!0;const S=document.createElement("div");S.className="pm-panel pn-view",S.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${G}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,v.replaceChildren(S);const T=S.querySelector(".pm-status"),L=S.querySelector(".pn-body"),n=(l,r,c)=>{const b=Math.max(1,...l.map(t=>t.count));return`<ul class="pn-bars">${l.filter(t=>t.count>0).sort((t,d)=>d.count-t.count).map((t,d)=>`
            <li><a class="pn-bar-row" href="${M({tab:"resoluciones",filters:c(t)})}" data-tip="${e(`${t.label}: ${x(t.count)} ${r}. Ver cuáles`)}" style="--i:${d}">
                <span class="pn-bar-label">${e(t.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(t.count/b*100))}%"></span></span>
                <span class="pn-bar-value">${x(t.count)}<span class="sr-only"> ${r}</span></span>
            </a></li>`).join("")}</ul>`};function $(l,r,c){const b=Math.max(1,...l.perYear.map(t=>t.count));T.textContent=`Actualizado ${new Date(l.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,L.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${M({tab:"permisos"})}"><b>${x(l.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${M({tab:"resoluciones"})}"><b>${x(l.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${x(l.thisYear)}</b><span>resoluciones en ${l.year}</span></div>
                ${c?`<a class="pn-kpi" href="${M({tab:"resoluciones"})}"><b>${e(O(c.date))}</b><span>última sesión (${e(c.acta)})${c.count?`: ${D(c.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${l.perYear.map((t,d)=>`
                    <li><a href="${M({tab:"resoluciones",filters:{fecha:String(t.year)}})}" data-tip="${e(`${t.year}: ${x(t.count)} resoluciones. Ver cuáles`)}" style="--i:${d}">
                        <span class="pn-col-value">${x(t.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(t.count/b*100))}%"></span>
                        <span class="pn-col-label">${t.year===l.year?`${t.year}*`:t.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${l.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${l.year} por tipo</h3>${n(l.byType,"resoluciones",t=>({fecha:String(l.year),tipo:t.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${l.year} por modalidad</h3>${n(l.byMode,"resoluciones",t=>{var d;return{fecha:String(l.year),modalidad:((d=W.find(o=>o.label===t.label))==null?void 0:d.filter)||t.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${r.length?`<ol class="pn-latest">${r.map(t=>`
                    <li><a href="${M({resolution:t.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${e(t.NumeroResolucion)}</b><time>${e(O(t.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${e(t.TipoResolucion||"")}${t.ModalidadResolucion?` · ${e(t.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${e(t.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const l=X({},{length:8}).then(d=>d.rows).catch(()=>[]);let r=_e();r||(r=await je(),Ie(r));const c=await l,b=c[0],t=b!=null&&b.NumeroActa?{date:b.FechaResolucion,acta:b.NumeroActa,count:await w({acta:b.NumeroActa}).catch(()=>0)}:null;f&&$(r,c,t)}catch{if(!f)return;T.textContent="",L.innerHTML=Q("las cifras",G)}})(),{destroy:()=>{f=!1,S.remove()}}}const U={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},De=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function Ve(v,f=[],{tramite:S=null,onOpenLaw:T=()=>{},onRoute:L=()=>{}}={}){let n=!0;const $=()=>typeof f=="function"?f()||[]:f,l=o=>o.map(h=>me($(),h)).filter(Boolean),r=document.createElement("div");r.className="pm-panel tr-view",v.replaceChildren(r);function c(){const o=[...new Set(oe.map(h=>h.sector))];r.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${o.map(h=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${h}">
                    <h3 id="tr-sector-${h}" class="tr-sector-title">${e(U[h]||h)}</h3>
                    <ul class="pm-list">${oe.filter(i=>i.sector===h).map(i=>{const p=l([...i.base,...i.rules,...i.forms,...i.calls]).length,R=l(i.forms).length;return`<li><a class="pm-card tr-card" href="${M({tramite:i.id})}" data-sector="${i.sector}">
                            <span class="pm-num">${e(U[i.sector]||"")}</span>
                            <span class="pm-holder">${e(i.title)}</span>
                            <span class="pm-meta"><span class="pm-tag">${x(p)} instrumentos</span>${R?"<span>Con formatos oficiales</span>":""}${l(i.calls).length?"<span>Con convocatoria</span>":""}</span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function b(o){return`<button type="button" class="pm-law" data-law="${e(o.id)}"><b>${e(o.siglas||"")}</b><span>${e(o.titulo)}</span></button>`}function t(o){const h=De.map(g=>{let C=l(o[g.key]);return g.key==="calls"&&(C=C.sort((P,a)=>String(a.fecha_publicacion||"").localeCompare(String(P.fecha_publicacion||"")))),{...g,laws:C}}).filter(g=>g.laws.length);r.innerHTML=`
            <article class="pm-detail" data-sector="${o.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${M({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${e(U[o.sector]||"")}</span></div>
                    <h2 id="tr-title">${e(o.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${h.map(g=>`
                    <section class="pm-section" aria-labelledby="tr-${g.key}">
                        <h3 id="tr-${g.key}">${e(g.title)}</h3>
                        <p class="pm-note">${e(g.note)}</p>
                        <div class="pm-laws">${g.laws.map(b).join("")}</div>
                    </section>`).join("")}
                <section class="pm-section" aria-labelledby="tr-articles">
                    <h3 id="tr-articles">Artículos clave</h3>
                    <p class="pm-note">Artículos y numerales del acervo que tratan este trámite, por relevancia.</p>
                    <div class="tr-articles"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>
                ${o.resolutions?`<section class="pm-section" aria-labelledby="tr-res">
                    <h3 id="tr-res">Resoluciones recientes de la CNE</h3>
                    <p class="pm-note">Antecedentes de este tipo de trámite, de lo más reciente a lo más antiguo.</p>
                    <div class="tr-res"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>`:""}
            </article>`,r.querySelector(".pm-share").addEventListener("click",g=>{var P;const C=`${location.origin}${location.pathname}${M({tramite:o.id})}`;(P=navigator.clipboard)==null||P.writeText(C).then(()=>{g.target.textContent="Enlace copiado"},()=>{})});const i=l(o.articles.in).map(g=>g.id),p=r.querySelector(".tr-articles");Te(o.articles.query,{lawIds:i,limit:24}).then(({data:g})=>{if(!n||!p.isConnected)return;const C=new Map,P=(g||[]).filter(a=>a.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(a.articulo_label||""))).filter(a=>{const y=C.get(a.ley_id)||0;return C.set(a.ley_id,y+1),y<3}).slice(0,8);p.innerHTML=P.length?`<ol class="tr-article-list">${P.map(a=>{var y;return`
                <li><button type="button" class="tr-article" data-article="${e(a.id)}">
                    <span class="tr-article-top"><b>${e(a.siglas_ley||((y=$().find(E=>String(E.id)===String(a.ley_id)))==null?void 0:y.siglas)||"")}</b> ${e(a.articulo_label||"")}</span>
                    <span class="tr-article-text">${e(String(a.fragmento||a.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',p.dataset.ids=JSON.stringify(P.map(a=>a.id))}).catch(()=>{p.isConnected&&(p.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const R=r.querySelector(".tr-res");R&&X(o.resolutions,{length:6}).then(({rows:g,total:C})=>{!n||!R.isConnected||(R.innerHTML=g.length?`
                    <ol class="pn-latest">${g.map(P=>`
                        <li><a href="${M({resolution:P.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${e(P.NumeroResolucion)}</b><time>${e(O(P.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${e(P.TipoResolucion||"")}${P.ModalidadResolucion?` · ${e(P.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${e(P.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${x(C)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{R.isConnected&&(R.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}r.addEventListener("click",o=>{var p;const h=o.target.closest("[data-law]");if(h){const R=$().find(g=>String(g.id)===h.dataset.law);R&&T(R);return}const i=o.target.closest("[data-article]");if(i){let R=[];try{R=JSON.parse(((p=i.closest(".tr-articles"))==null?void 0:p.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:i.dataset.article,list:R.length?R:[i.dataset.article]}}))}});function d(o){const h=o&&Ce(o);h?t(h):c(),r.scrollIntoView({behavior:"smooth",block:"start"})}return d(S),{openTramite:o=>d(o),showList:()=>d(null),destroy:()=>{n=!1,r.remove()},onRoute:L}}const be="cne-pestanas-vistas",he=()=>{try{return new Set(JSON.parse(localStorage.getItem(be)||"[]"))}catch{return new Set}};function Be(v){const f=he();if(!f.has(v)){f.add(v);try{localStorage.setItem(be,JSON.stringify([...f]))}catch{}}}const J=[{id:"permisos",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."},{id:"mapa",label:"Mapa",intro:"Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos."}];function Ue(v,f,{route:S={tab:"permisos"},onOpenLaw:T=()=>{},setHash:L=()=>{}}={}){let n=null,$=null;const l=document.createElement("section");l.className="pm-view",l.setAttribute("aria-labelledby","pm-title"),l.innerHTML=`
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">CNE: permisos y resoluciones</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de la CNE">
                ${J.map(t=>`<a role="tab" class="pm-tab" id="pm-tab-${t.id}" href="${M({tab:t.id})}" data-tab="${t.id}" aria-controls="pm-tabpanel">${t.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,v.replaceChildren(l);const r=l.querySelector(".pm-tabpanel");function c(t,d){n==null||n.destroy(),$=t,Be(t);const o=he();l.querySelectorAll(".pm-tab").forEach(i=>{const p=!o.has(i.dataset.tab)&&i.dataset.tab!=="permisos";i.classList.toggle("is-new",p),p?i.setAttribute("aria-description","Nueva sección"):i.removeAttribute("aria-description")});const h=J.find(i=>i.id===t)||J[0];if(l.querySelector(".pm-intro").textContent=h.intro,l.querySelectorAll(".pm-tab").forEach(i=>{const p=i.dataset.tab===t;i.setAttribute("aria-selected",String(p)),i.classList.toggle("is-on",p)}),r.setAttribute("aria-labelledby",`pm-tab-${t}`),t==="resoluciones")n=He(r,f,{resolution:d.resolution||null,filters:d.filters||null,onRoute:i=>L(M({tab:t,resolution:i}))});else if(t==="tramites")n=Ve(r,f,{tramite:d.tramite||null,onOpenLaw:T});else if(t==="panorama")n=we(r);else if(t==="mapa"){const i={destroyed:!1,view:null,permit:d.mapPermit||null,destroy(){var p;this.destroyed=!0,(p=this.view)==null||p.destroy()},focusPermit(p){this.view?this.view.focusPermit(p):this.permit=p}};n=i,r.innerHTML='<p class="pm-loading">Cargando el mapa…</p>',Le(()=>import("./permits-map-view-BNkGnj-z.js"),__vite__mapDeps([0,1,2,3,4])).then(p=>p.renderPermitsMapView(r,{permit:i.permit})).then(p=>{i.destroyed?p.destroy():i.view=p}).catch(()=>{i.destroyed||(r.innerHTML='<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>')})}else n=Me(r,f,{permit:d.permit||null,onOpenLaw:T,onRoute:i=>L(M({tab:t,permit:i}))})}function b(t={tab:"permisos"}){const d=t.tab||"permisos";if(d!==$){c(d,t);return}d==="permisos"?t.permit?n.openPermit(t.permit):n.showList():d==="resoluciones"?t.resolution?n.openResolution(t.resolution):t.filters&&Object.keys(t.filters).length?n.applyFilters(t.filters):n.showList():d==="tramites"?t.tramite?n.openTramite(t.tramite):n.showList():d==="mapa"&&t.mapPermit&&n.focusPermit(t.mapPermit)}return b(S),{go:b,destroy:()=>{n==null||n.destroy(),l.remove()}}}export{Ue as renderCneView};
