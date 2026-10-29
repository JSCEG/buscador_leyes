const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/cne-sener-view-c3K12UUk.js","assets/index-7omYeSZN.js","assets/index-bGvTGVpU.css","assets/permits-map-W0P_eNVx.js","assets/permits-map-BI2YnIqp.css","assets/cne-sener-view-VFxqHSE2.css","assets/permits-map-view-t5wOske4.js","assets/leaflet-src-De2SSmXW.js","assets/_commonjsHelpers-Cpj98o6Y.js","assets/leaflet-Dgihpmma.css","assets/MarkerCluster-4Oo7lyRB.css"])))=>i.map(i=>d[i]);
import{R as fe,t as J,v as Z,w as Ne,x as ee,y as te,z as ae,B as k,C as Re,D as K,E as Se,F as Ce,r as be,G as z,H as W,I as Te,J as Le,K as Pe,L as se,M as Me,N as D,O as ke,Q as Ae,T as oe,n as xe,_ as ne}from"./index-7omYeSZN.js";import{s as O,e as t,d as _,n as A,g as he,P as $e,f as B,p as V,a as X,l as ye,b as we}from"./cne-shared-DMDPvk_7.js";const ie=20,G=$=>X($,fe),He={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function qe($,u=[],{onOpenLaw:S=()=>{},permit:C=null,onRoute:T=()=>{}}={}){const l={numero:"",titular:"",proyecto:"",start:0};let y=[],c=0,r=0,p=!0;const b=document.createElement("div");b.className="pm-panel",b.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${fe}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,$.replaceChildren(b);const e=b.querySelector(".pm-form"),d=b.querySelector(".pm-status"),n=b.querySelector(".pm-body");function h(a){return a?`<span class="pm-estado is-${He[a]||"off"}">${t(a)}</span>`:""}function i(a){const{sector:g,activity:E}=Z(a.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${t(a.PermisoId)}" data-sector="${(g==null?void 0:g.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${t(a.Numero)}</span>${h(a.Estado)}</span>
                <span class="pm-holder">${t(a.Persona||"Titular sin dato")}</span>
                ${a.AliasProyecto?`<span class="pm-alias">${t(a.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${g?`<span class="pm-tag">${t(g.label)}${E?` · ${t(E)}`:""}</span>`:""}
                    <span>${V(a.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${a.AnexosAsociados?`<span>${V(a.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${te(ae(a.Numero),{compact:!0})}<a class="pm-card-pdf" href="${ee(a.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${t(a.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function o(){if(!y.length){d.textContent="",n.innerHTML=be({title:"Ningún permiso coincide",body:"Revisa el número o prueba con una parte del nombre del titular."});return}const a=l.start+1,g=l.start+y.length;d.textContent=`${A(a)}–${A(g)} de ${V(c,"permiso","permisos")}`,n.innerHTML=`
            <ul class="pm-list">${y.map(i).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${l.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${g<c?"":"disabled"}>Siguientes →</button>
            </nav>`}async function N(){const a=++r;n.innerHTML=O(6),d.textContent="Consultando el registro de la CNE…";try{const g=await J({...l,length:ie});if(!p||a!==r)return;y=g.rows,c=g.total,o()}catch{if(!p||a!==r)return;d.textContent="",n.innerHTML=G("los permisos")}}function v(a){if(!a)return[];const g=typeof u=="function"?u()||[]:u;return a.laws.map(E=>ye(g,E)).filter((E,w,s)=>E&&s.indexOf(E)===w)}async function L(a,{updateRoute:g=!0}={}){g&&T(a.Numero);const{sector:E,activity:w}=Z(a.Numero),s=v(E),R=Ne(a.Numero);d.textContent="",n.innerHTML=`
            <article class="pm-detail" data-sector="${(E==null?void 0:E.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${E?`${t(E.label)}${w?` · ${t(w)}`:""}`:"Permiso"}</span>${h(a.Estado)}</div>
                    <h2 id="pm-detail-title">${t(a.Numero)}</h2>
                    <p class="pm-holder">${t(a.Persona||"Titular sin dato")}</p>
                    ${a.AliasProyecto?`<p class="pm-alias">${t(a.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${ee(a.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${te(ae(a.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                        <a class="pm-btn" href="${k({mapPermit:a.Numero})}" data-map-link hidden><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Ver en el mapa</a>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${t(a.NumeroExpediente||"—")}</dd></div>
                    <div><dt>Último acuse</dt><dd>${t(_(a.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${A(a.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${A(a.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${A(a.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${A(a.AnexosAsociados)}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Línea de resoluciones</h3>
                    <div class="pm-res">${O(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-anx-title">
                    <h3 id="pm-anx-title">Anexos</h3>
                    <div class="pm-anx">${a.AnexosAsociados?O(1):'<p class="pm-note">Este permiso no tiene anexos publicados.</p>'}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${s.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${s.map(m=>`<button type="button" class="pm-law" data-law="${t(m.id)}"><b>${t(m.siglas||"")}</b><span>${t(m.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${R?he(R):""}
                </section>
            </article>`,n.scrollIntoView({behavior:"smooth",block:"start"});const M=n.querySelector(".pm-res");if(Re(a.ExpedienteId).then(m=>{!p||!M.isConnected||(M.innerHTML=m.length?`<ol class="pm-timeline">${m.map((f,x)=>{const q=K(f.REsolucionId);return`
                <li class="${x===0?"is-first":""}">
                    <time>${t(_(f.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${t(f.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${t(f.NumeroResolucion||"")}</b>${f.Acta?` · Acta ${t(f.Acta)}`:""}${f.Modalidad?` · ${t(f.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${q?`<a class="pm-res-pdf" href="${t(q)}" target="_blank" rel="noopener" aria-label="Ver resolución ${t(f.NumeroResolucion||"")} en PDF">${$e}Ver resolución (PDF)</a>`:""}
                            ${f.NumeroResolucion?`<a class="pm-res-more" href="${k({resolution:f.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{M.isConnected&&(M.innerHTML=G("las resoluciones"))}),a.AnexosAsociados){const m=n.querySelector(".pm-anx");Se(a.PermisoId).then(f=>{!p||!m.isConnected||(m.innerHTML=f.length?`<ul class="pm-annexes">${f.map(x=>{const q=Ce(x),I=t(x.Descripcion||"Anexo");return`<li>${q?`<a href="${t(q)}" target="_blank" rel="noopener">${I}</a>`:`<span>${I}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{m.isConnected&&(m.innerHTML=G("los anexos"))})}const H=n.querySelector("[data-map-link]");fetch(`/api/mapa/buscar?q=${encodeURIComponent(a.Numero)}&limite=5`,{credentials:"same-origin"}).then(m=>m.ok?m.json():null).then(m=>{const f=((m==null?void 0:m.resultados)||[]).find(x=>B(x.numeroPermiso)===B(a.Numero)&&x.latitud!=null);!p||!f||!H.isConnected||(H.href=k({mapPermit:f.numeroPermiso}),H.hidden=!1)}).catch(()=>{}),n.querySelector(".pm-back").addEventListener("click",()=>{T(null),y.length?o():N()}),n.querySelector(".pm-share").addEventListener("click",m=>{var x;const f=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(a.Numero)}`;(x=navigator.clipboard)==null||x.writeText(f).then(()=>{m.target.textContent="Enlace copiado"},()=>{})}),n.querySelectorAll("[data-law]").forEach(m=>m.addEventListener("click",()=>{const f=s.find(x=>String(x.id)===m.dataset.law);f&&S(f)}))}async function P(a){const g=++r;n.innerHTML=O(2),d.textContent="Buscando el permiso…";try{const E=await J({numero:a,length:10});if(!p||g!==r)return;const w=E.rows.find(s=>B(s.Numero)===B(a))||(E.rows.length===1?E.rows[0]:null);if(w){y=[],L(w,{updateRoute:!1});return}e.numero.value=a,l.numero=a,y=E.rows,c=E.total,o()}catch{if(!p||g!==r)return;d.textContent="",n.innerHTML=G("el permiso")}}return e.addEventListener("submit",a=>{a.preventDefault(),Object.assign(l,{numero:e.numero.value.trim(),titular:e.titular.value.trim(),proyecto:e.proyecto.value.trim(),start:0}),T(null),N()}),e.addEventListener("reset",()=>{Object.assign(l,{numero:"",titular:"",proyecto:"",start:0}),T(null),setTimeout(N)}),n.addEventListener("click",a=>{const g=a.target.closest("[data-page]");if(g){l.start=Math.max(0,l.start+Number(g.dataset.page)*ie),N().then(()=>b.scrollIntoView({behavior:"smooth",block:"start"}));return}const E=a.target.closest("[data-permit]"),w=E&&y.find(s=>String(s.PermisoId)===E.dataset.permit);w&&L(w)}),C?P(C):N(),{openPermit:a=>P(a),showList:()=>{y.length?o():N()},destroy:()=>{p=!1,b.remove()}}}const le=20,re=$=>X($,z),_e=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],Fe=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],Oe=1995;function Ie($,u=[],{resolution:S=null,filters:C=null,onRoute:T=()=>{}}={}){const l={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let y=[],c=0,r=0,p=!0;const b=()=>typeof u=="function"?u()||[]:u,e=new Date().getFullYear(),d=Array.from({length:e-Oe+1},(s,R)=>e-R),n=document.createElement("div");n.className="pm-panel",n.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${d.map(s=>`<option>${s}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${_e.map(s=>`<option value="${t(s)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${Fe.map(s=>`<option value="${t(s)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${z}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,$.replaceChildren(n);const h=n.querySelector("form"),i=n.querySelector(".pm-status"),o=n.querySelector(".pm-body");function N(s){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${t(s.NumeroResolucion)}" data-sector="${ce(s.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${t(s.NumeroResolucion)}</span><span class="pm-date">${t(_(s.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${t(s.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${t(s.Proemio||"")}</span>
                <span class="pm-meta">${s.ModalidadResolucion?`<span class="pm-tag">${t(s.ModalidadResolucion)}</span>`:""}${s.NumeroActa?`<span>${t(s.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${t(K(s.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${t(s.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function v(){if(!y.length){i.textContent="",o.innerHTML=be({title:"Ninguna resolución coincide",body:"Prueba con menos filtros o con una parte del texto."});return}const s=l.start+y.length;i.textContent=`${A(l.start+1)}–${A(s)} de ${V(c,"resolución","resoluciones")} · más recientes primero`,o.innerHTML=`
            <ul class="pm-list">${y.map(N).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${l.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${s<c?"":"disabled"}>Siguientes →</button>
            </nav>`}async function L(){const s=++r;o.innerHTML=O(6),i.textContent="Consultando las resoluciones de la CNE…";try{const R=await W(l,{start:l.start,length:le});if(!p||s!==r)return;y=R.rows,c=R.total,v()}catch{if(!p||s!==r)return;i.textContent="",o.innerHTML=re("las resoluciones")}}function P(s){const R=se(s);return R.length?`<ul class="pm-found">${R.map((M,H)=>{const m=we(b(),M.law);return`<li data-found="${H}" ${m?`data-law-id="${t(m.id)}"`:""}>
                <p class="pm-found-law">${m?`<b>${t(m.siglas||"")}</b> `:""}${t(M.law)}${m?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${M.articles.map(f=>`<span class="pm-art" data-art="${t(f)}">Art. ${t(f)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${t(s)}</p></details>`:s?`<p class="pm-note">${t(s)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function a(s,R){const M=se(R);await Promise.all(M.map(async(H,m)=>{const f=s.querySelector(`[data-found="${m}"][data-law-id]`);if(!f)return;const x=await Me(f.dataset.lawId,H.articles);!p||!f.isConnected||f.querySelectorAll("[data-art]").forEach(q=>{const I=x[q.dataset.art];if(!I)return;const F=document.createElement("button");F.type="button",F.className="pm-art is-linked",F.dataset.article=I,F.textContent=q.textContent,F.title="Abrir el artículo",q.replaceWith(F)})}))}function g(s,{updateRoute:R=!0}={}){R&&T(s.NumeroResolucion);const M=Te(s.Proemio),H=Le(s),m=K(s.ResolucionId);i.textContent="",o.innerHTML=`
            <article class="pm-detail" data-sector="${ce(s.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${t(s.TipoResolucion||"Resolución")}${s.ModalidadResolucion?` · ${t(s.ModalidadResolucion)}`:""}</span><span class="pm-date">${t(_(s.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${t(s.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${t(s.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${m?`<a class="pm-btn pm-btn-primary" href="${t(m)}" target="_blank" rel="noopener">${$e}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${t(_(s.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${t(s.NumeroActa||"—")}</dd></div>
                    ${s.Ponente?`<div><dt>Ponente</dt><dd>${t(s.Ponente)}</dd></div>`:""}
                </dl>
                ${M.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${M.map(f=>`<a class="pm-law" href="${k({permit:f})}"><b>Permiso</b><span>${t(f)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${P(s.Fundamentacion||"")}</div>
                    ${H?he(H,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,o.scrollIntoView({behavior:"smooth",block:"start"}),a(o.querySelector(".pm-found-host"),s.Fundamentacion||"").catch(()=>{}),o.querySelector(".pm-back").addEventListener("click",()=>{T(null),y.length?v():L()}),o.querySelector(".pm-share").addEventListener("click",f=>{var q;const x=`${location.origin}${location.pathname}${k({resolution:s.NumeroResolucion})}`;(q=navigator.clipboard)==null||q.writeText(x).then(()=>{f.target.textContent="Enlace copiado"},()=>{})})}async function E(s){const R=++r;o.innerHTML=O(2),i.textContent="Buscando la resolución…";try{const M=await Pe(s);if(!p||R!==r)return;if(M){y=[],g(M,{updateRoute:!1});return}h.numero.value=s,l.numero=s,L()}catch{if(!p||R!==r)return;i.textContent="",o.innerHTML=re("la resolución")}}h.addEventListener("submit",s=>{s.preventDefault(),Object.assign(l,{numero:h.numero.value.trim(),texto:h.texto.value.trim(),fecha:h.fecha.value,tipo:h.tipo.value.trim(),modalidad:h.modalidad.value.trim(),start:0}),T(null),L()}),h.addEventListener("reset",()=>{Object.assign(l,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),T(null),setTimeout(L)}),o.addEventListener("click",s=>{const R=s.target.closest("[data-article]");if(R){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:R.dataset.article,list:[R.dataset.article]}}));return}const M=s.target.closest("[data-page]");if(M){l.start=Math.max(0,l.start+Number(M.dataset.page)*le),L().then(()=>n.scrollIntoView({behavior:"smooth",block:"start"}));return}const H=s.target.closest("[data-resolution]"),m=H&&y.find(f=>f.NumeroResolucion===H.dataset.resolution);m&&g(m)});function w(s={}){Object.assign(l,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...s,start:0});for(const R of["numero","texto","fecha","tipo","modalidad"])h[R].value=l[R]||"";L()}return S?E(S):C&&Object.keys(C).length?w(C):L(),{openResolution:s=>E(s),applyFilters:w,showList:()=>{y.length?v():L()},destroy:()=>{p=!1,n.remove()}}}function ce($=""){const u=$.toLowerCase();return/el[eé]ctric/.test(u)?"electricidad":/licuado/.test(u)?"gaslp":/gas natural/.test(u)?"gasnatural":/petrol|hidrocarb/.test(u)?"petroliferos":"otro"}const ve="cne-panorama-v1",je=12*60*60*1e3,pe=12,U=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],Q=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function De($,u=3){const S=[];for(let C=0;C<$.length;C+=u)S.push(...await Promise.all($.slice(C,C+u).map(T=>T())));return S}function Ve(){try{const $=JSON.parse(localStorage.getItem(ve)||"null");return $&&Date.now()-$.at<je?$.data:null}catch{return null}}function Be($){try{localStorage.setItem(ve,JSON.stringify({at:Date.now(),data:$}))}catch{}}async function Ge(){const u=new Date().getFullYear(),S=Array.from({length:pe},(p,b)=>u-pe+1+b),[C,T,...l]=await De([()=>J({length:1}).then(p=>p.total),()=>D({}),...S.map(p=>()=>D({fecha:String(p)})),...U.map(p=>()=>D({fecha:String(u),tipo:p})),...Q.map(p=>()=>D({fecha:String(u),modalidad:p.filter}))]),y=S.map((p,b)=>({year:p,count:l[b]})),c=U.map((p,b)=>({label:p,count:l[S.length+b]})),r=Q.map((p,b)=>({label:p.label,count:l[S.length+U.length+b]}));return{year:u,permits:C,resolutions:T,thisYear:y.at(-1).count,perYear:y,byType:c,byMode:r,at:Date.now()}}function Ye($){let u=!0;const S=document.createElement("div");S.className="pm-panel pn-view",S.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${z}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,$.replaceChildren(S);const C=S.querySelector(".pm-status"),T=S.querySelector(".pn-body"),l=(c,r,p)=>{const b=Math.max(1,...c.map(e=>e.count));return`<ul class="pn-bars">${c.filter(e=>e.count>0).sort((e,d)=>d.count-e.count).map((e,d)=>`
            <li><a class="pn-bar-row" href="${k({tab:"resoluciones",filters:p(e)})}" data-tip="${t(`${e.label}: ${A(e.count)} ${r}. Ver cuáles`)}" style="--i:${d}">
                <span class="pn-bar-label">${t(e.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(e.count/b*100))}%"></span></span>
                <span class="pn-bar-value">${A(e.count)}<span class="sr-only"> ${r}</span></span>
            </a></li>`).join("")}</ul>`};function y(c,r,p){const b=Math.max(1,...c.perYear.map(e=>e.count));C.textContent=`Actualizado ${new Date(c.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,T.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${k({tab:"permisos"})}"><b>${A(c.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${k({tab:"resoluciones"})}"><b>${A(c.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${A(c.thisYear)}</b><span>resoluciones en ${c.year}</span></div>
                ${p?`<a class="pn-kpi" href="${k({tab:"resoluciones"})}"><b>${t(_(p.date))}</b><span>última sesión (${t(p.acta)})${p.count?`: ${V(p.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${c.perYear.map((e,d)=>`
                    <li><a href="${k({tab:"resoluciones",filters:{fecha:String(e.year)}})}" data-tip="${t(`${e.year}: ${A(e.count)} resoluciones. Ver cuáles`)}" style="--i:${d}">
                        <span class="pn-col-value">${A(e.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(e.count/b*100))}%"></span>
                        <span class="pn-col-label">${e.year===c.year?`${e.year}*`:e.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${c.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${c.year} por tipo</h3>${l(c.byType,"resoluciones",e=>({fecha:String(c.year),tipo:e.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${c.year} por modalidad</h3>${l(c.byMode,"resoluciones",e=>{var d;return{fecha:String(c.year),modalidad:((d=Q.find(n=>n.label===e.label))==null?void 0:d.filter)||e.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${r.length?`<ol class="pn-latest">${r.map(e=>`
                    <li><a href="${k({resolution:e.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${t(e.NumeroResolucion)}</b><time>${t(_(e.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${t(e.TipoResolucion||"")}${e.ModalidadResolucion?` · ${t(e.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${t(e.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const c=W({},{length:8}).then(d=>d.rows).catch(()=>[]);let r=Ve();r||(r=await Ge(),Be(r));const p=await c,b=p[0],e=b!=null&&b.NumeroActa?{date:b.FechaResolucion,acta:b.NumeroActa,count:await D({acta:b.NumeroActa}).catch(()=>0)}:null;u&&y(r,p,e)}catch{if(!u)return;C.textContent="",T.innerHTML=X("las cifras",z)}})(),{destroy:()=>{u=!1,S.remove()}}}const de={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},j=$=>`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${$}</svg>`,ue={electricidad:j('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),petroliferos:j('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>'),gaslp:j('<rect x="7" y="6" width="10" height="15" rx="3"/><path d="M10 6V3h4v3"/>'),gasnatural:j('<path d="M12 22c4 0 7-3 7-7 0-5-5-7-4-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-3 4-3 8 0 4 3 7 7 7z"/>'),otro:j('<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19 13 11"/>')},me='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',ze=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function Ue($,u=[],{tramite:S=null,onOpenLaw:C=()=>{},onRoute:T=()=>{}}={}){let l=!0;const y=()=>typeof u=="function"?u()||[]:u,c=n=>n.map(h=>ye(y(),h)).filter(Boolean),r=document.createElement("div");r.className="pm-panel tr-view",$.replaceChildren(r);function p(){const n=[...new Set(oe.map(h=>h.sector))];r.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${n.map(h=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${h}">
                    <h3 id="tr-sector-${h}" class="tr-sector-title">${t(de[h]||h)}</h3>
                    <ul class="pm-list">${oe.filter(i=>i.sector===h).map(i=>{const o=c([...i.base,...i.rules,...i.forms,...i.calls]).length,N=c(i.forms).length,v=c(i.calls).length;return`<li><a class="tr-card" href="${k({tramite:i.id})}" data-sector="${i.sector}">
                            <span class="tr-card-head"><span class="tr-card-icon" aria-hidden="true">${ue[i.sector]||ue.otro}</span><span class="tr-card-kicker">Guía de trámite</span></span>
                            <span class="tr-card-title">${t(i.title)}</span>
                            <span class="tr-card-stats"><span class="tr-card-count"><b>${A(o)}</b> instrumentos</span>${N?`<span class="tr-card-flag">${me}Formatos</span>`:""}${v?`<span class="tr-card-flag">${me}Convocatoria</span>`:""}</span>
                            <span class="tr-card-foot">Ver guía <span aria-hidden="true">→</span></span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function b(n){return`<button type="button" class="pm-law" data-law="${t(n.id)}"><b>${t(n.siglas||"")}</b><span>${t(n.titulo)}</span></button>`}function e(n){const h=ze.map(v=>{let L=c(n[v.key]);return v.key==="calls"&&(L=L.sort((P,a)=>String(a.fecha_publicacion||"").localeCompare(String(P.fecha_publicacion||"")))),{...v,laws:L}}).filter(v=>v.laws.length);r.innerHTML=`
            <article class="pm-detail" data-sector="${n.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${k({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${t(de[n.sector]||"")}</span></div>
                    <h2 id="tr-title">${t(n.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${h.map(v=>`
                    <section class="pm-section" aria-labelledby="tr-${v.key}">
                        <h3 id="tr-${v.key}">${t(v.title)}</h3>
                        <p class="pm-note">${t(v.note)}</p>
                        <div class="pm-laws">${v.laws.map(b).join("")}</div>
                    </section>`).join("")}
                <section class="pm-section" aria-labelledby="tr-articles">
                    <h3 id="tr-articles">Artículos clave</h3>
                    <p class="pm-note">Artículos y numerales del acervo que tratan este trámite, por relevancia.</p>
                    <div class="tr-articles"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>
                ${n.resolutions?`<section class="pm-section" aria-labelledby="tr-res">
                    <h3 id="tr-res">Resoluciones recientes de la CNE</h3>
                    <p class="pm-note">Antecedentes de este tipo de trámite, de lo más reciente a lo más antiguo.</p>
                    <div class="tr-res"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>`:""}
            </article>`,r.querySelector(".pm-share").addEventListener("click",v=>{var P;const L=`${location.origin}${location.pathname}${k({tramite:n.id})}`;(P=navigator.clipboard)==null||P.writeText(L).then(()=>{v.target.textContent="Enlace copiado"},()=>{})});const i=c(n.articles.in).map(v=>v.id),o=r.querySelector(".tr-articles");Ae(n.articles.query,{lawIds:i,limit:24}).then(({data:v})=>{if(!l||!o.isConnected)return;const L=new Map,P=(v||[]).filter(a=>a.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(a.articulo_label||""))).filter(a=>{const g=L.get(a.ley_id)||0;return L.set(a.ley_id,g+1),g<3}).slice(0,8);o.innerHTML=P.length?`<ol class="tr-article-list">${P.map(a=>{var g;return`
                <li><button type="button" class="tr-article" data-article="${t(a.id)}">
                    <span class="tr-article-top"><b>${t(a.siglas_ley||((g=y().find(E=>String(E.id)===String(a.ley_id)))==null?void 0:g.siglas)||"")}</b> ${t(a.articulo_label||"")}</span>
                    <span class="tr-article-text">${t(String(a.fragmento||a.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',o.dataset.ids=JSON.stringify(P.map(a=>a.id))}).catch(()=>{o.isConnected&&(o.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const N=r.querySelector(".tr-res");N&&W(n.resolutions,{length:6}).then(({rows:v,total:L})=>{!l||!N.isConnected||(N.innerHTML=v.length?`
                    <ol class="pn-latest">${v.map(P=>`
                        <li><a href="${k({resolution:P.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${t(P.NumeroResolucion)}</b><time>${t(_(P.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${t(P.TipoResolucion||"")}${P.ModalidadResolucion?` · ${t(P.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${t(P.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${A(L)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{N.isConnected&&(N.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}r.addEventListener("click",n=>{var o;const h=n.target.closest("[data-law]");if(h){const N=y().find(v=>String(v.id)===h.dataset.law);N&&C(N);return}const i=n.target.closest("[data-article]");if(i){let N=[];try{N=JSON.parse(((o=i.closest(".tr-articles"))==null?void 0:o.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:i.dataset.article,list:N.length?N:[i.dataset.article]}}))}});function d(n){const h=n&&ke(n);h?e(h):p(),r.scrollIntoView({behavior:"smooth",block:"start"})}return d(S),{openTramite:n=>d(n),showList:()=>d(null),destroy:()=>{l=!1,r.remove()},onRoute:T}}const ge="cne-pestanas-vistas",Ee=()=>{try{return new Set(JSON.parse(localStorage.getItem(ge)||"[]"))}catch{return new Set}};function Je($){const u=Ee();if(!u.has($)){u.add($);try{localStorage.setItem(ge,JSON.stringify([...u]))}catch{}}}const Y=[{id:"permisos",group:"CNE",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",group:"CNE",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",group:"CNE",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",group:"CNE",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."},{id:"mapa",group:"CNE",label:"Mapa",intro:"Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos."},{id:"sener",group:"SENER",label:"Títulos y permisos",intro:"Títulos y permisos de la Secretaría de Energía: asignaciones, pozos, contratos de exploración y extracción, comercio exterior y biocombustibles, con su fuente oficial."}];function We($,u,{route:S={tab:"permisos"},onOpenLaw:C=()=>{},setHash:T=()=>{}}={}){let l=null,y=null;const c=document.createElement("section");c.className="pm-view",c.setAttribute("aria-labelledby","pm-title"),c.innerHTML=`
        <div class="pm-head" data-emblem-host>
            ${xe("permisos")}
            <p class="pm-eyebrow">Registro público · CNE y SENER</p>
            <h1 id="pm-title">Permisos de energía</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de permisos">
                ${Y.map((e,d)=>{var n;return`${e.group!==((n=Y[d-1])==null?void 0:n.group)?`<span class="pm-tab-group" aria-hidden="true">${e.group}</span>`:""}<a role="tab" class="pm-tab" id="pm-tab-${e.id}" href="${k({tab:e.id})}" data-tab="${e.id}" aria-controls="pm-tabpanel" aria-label="${e.label} · ${e.group}">${e.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`}).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,$.replaceChildren(c);const r=c.querySelector(".pm-tabpanel");function p(e,d){l==null||l.destroy(),y=e,Je(e);const n=Ee();c.querySelectorAll(".pm-tab").forEach(i=>{const o=!n.has(i.dataset.tab)&&i.dataset.tab!=="permisos";i.classList.toggle("is-new",o),o?i.setAttribute("aria-description","Nueva sección"):i.removeAttribute("aria-description")});const h=Y.find(i=>i.id===e)||Y[0];if(c.querySelector(".pm-intro").textContent=h.intro,c.querySelectorAll(".pm-tab").forEach(i=>{const o=i.dataset.tab===e;i.setAttribute("aria-selected",String(o)),i.classList.toggle("is-on",o)}),r.setAttribute("aria-labelledby",`pm-tab-${e}`),e==="resoluciones")l=Ie(r,u,{resolution:d.resolution||null,filters:d.filters||null,onRoute:i=>T(k({tab:e,resolution:i}))});else if(e==="tramites")l=Ue(r,u,{tramite:d.tramite||null,onOpenLaw:C});else if(e==="panorama")l=Ye(r);else if(e==="sener"){const i={destroyed:!1,view:null,record:d.record||null,destroy(){var o;this.destroyed=!0,(o=this.view)==null||o.destroy()},openRecord(o){this.view?this.view.openRecord(o):this.record=o},showList(){var o;this.record=null,(o=this.view)==null||o.showList()}};l=i,r.innerHTML='<p class="pm-loading">Cargando los títulos de la SENER…</p>',ne(()=>import("./cne-sener-view-c3K12UUk.js"),__vite__mapDeps([0,1,2,3,4,5])).then(o=>o.renderCneSenerView(r,{catalog:u,onOpenLaw:C,record:i.record,onRoute:N=>T(k(N?{record:N}:{tab:"sener"}))})).then(o=>{i.destroyed?o.destroy():i.view=o}).catch(()=>{i.destroyed||(r.innerHTML='<p class="pm-loading">No se pudo cargar esta sección. Revisa tu conexión e intenta de nuevo.</p>')})}else if(e==="mapa"){const i={destroyed:!1,view:null,permit:d.mapPermit||null,destroy(){var o;this.destroyed=!0,(o=this.view)==null||o.destroy()},focusPermit(o){this.view?this.view.focusPermit(o):this.permit=o}};l=i,r.innerHTML='<p class="pm-loading">Cargando el mapa…</p>',ne(()=>import("./permits-map-view-t5wOske4.js"),__vite__mapDeps([6,1,2,7,8,3,4,9,10])).then(o=>o.renderPermitsMapView(r,{permit:i.permit})).then(o=>{i.destroyed?o.destroy():i.view=o}).catch(()=>{i.destroyed||(r.innerHTML='<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>')})}else l=qe(r,u,{permit:d.permit||null,onOpenLaw:C,onRoute:i=>T(k({tab:e,permit:i}))})}function b(e={tab:"permisos"}){const d=e.tab||"permisos";if(d!==y){p(d,e);return}d==="permisos"?e.permit?l.openPermit(e.permit):l.showList():d==="resoluciones"?e.resolution?l.openResolution(e.resolution):e.filters&&Object.keys(e.filters).length?l.applyFilters(e.filters):l.showList():d==="tramites"?e.tramite?l.openTramite(e.tramite):l.showList():d==="mapa"&&e.mapPermit?l.focusPermit(e.mapPermit):d==="sener"&&(e.record?l.openRecord(e.record):l.showList())}return b(S),{go:b,destroy:()=>{l==null||l.destroy(),c.remove()}}}export{We as renderCneView};
