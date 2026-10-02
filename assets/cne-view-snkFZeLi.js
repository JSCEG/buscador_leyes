import{R as ce,j as U,p as W,t as he,k as X,l as Q,m as Z,n as $e,r as z,q as k,v as ve,w as ye,x as B,y as J,z as ge,B as Ee,C as Ne,D as ee,E as Se,F as j,G as Ce,H as Re,T as te}from"./index-CeGpHjjy.js";const t=o=>String(o??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n]),w=o=>String(o??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),x=o=>Number(o||0).toLocaleString("es-MX"),_=(o,n,m)=>`${x(o)} ${Number(o)===1?n:m}`,Te=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],I=o=>{const n=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(o||"").trim());return n?`${Number(n[1])} ${Te[Number(n[2])-1]} ${n[3]}`:""},O=o=>`<div class="pm-list">${'<div class="pm-card pm-skel"><i></i><i></i><i></i></div>'.repeat(o)}</div>`,K=(o,n)=>`
    <div class="pm-error">
        <p><strong>No pudimos consultar ${o}.</strong> El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>
        <a class="pm-btn" href="${n}" target="_blank" rel="noopener">Abrir el sitio de la CNE</a>
    </div>`,ae={LSE:"ley del sector electrico",LSH:"ley del sector hidrocarburos",LCNE:"ley de la comision nacional de energia"};function pe(o,n){return o.find(m=>w(m.siglas)===w(n))||ae[n]&&o.find(m=>w(m.titulo).startsWith(ae[n]))||null}function Le(o,n){const m=h=>w(h).replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(r=>r&&!/^(de|del|la|las|los|el|y)$/.test(r)).join(" "),E=m(n);return E&&o.find(h=>m(h.titulo)===E)||null}const de='<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',Me='<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 8h6M9 12h4"/></svg>';function ue(o,n="Guía de trámite"){return`<a class="pm-guide-link" href="#tramite=${encodeURIComponent(o.id)}">${Me}<span><small>${t(n)}</small>${t(o.title)}</span><b aria-hidden="true">→</b></a>`}const se=20,D=o=>K(o,ce),xe={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function Ae(o,n=[],{onOpenLaw:m=()=>{},permit:E=null,onRoute:h=()=>{}}={}){const r={numero:"",titular:"",proyecto:"",start:0};let N=[],c=0,d=0,u=!0;const p=document.createElement("div");p.className="pm-panel",p.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${ce}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,o.replaceChildren(p);const s=p.querySelector(".pm-form"),b=p.querySelector(".pm-status"),i=p.querySelector(".pm-body");function v(a){return a?`<span class="pm-estado is-${xe[a]||"off"}">${t(a)}</span>`:""}function l(a){const{sector:y,activity:e}=W(a.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${t(a.PermisoId)}" data-sector="${(y==null?void 0:y.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${t(a.Numero)}</span>${v(a.Estado)}</span>
                <span class="pm-holder">${t(a.Persona||"Titular sin dato")}</span>
                ${a.AliasProyecto?`<span class="pm-alias">${t(a.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${y?`<span class="pm-tag">${t(y.label)}${e?` · ${t(e)}`:""}</span>`:""}
                    <span>${_(a.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${a.AnexosAsociados?`<span>${_(a.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${Q(Z(a.Numero),{compact:!0})}<a class="pm-card-pdf" href="${X(a.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${t(a.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function R(){if(!N.length){b.textContent="",i.innerHTML='<p class="pm-empty">Ningún permiso coincide con la búsqueda. Revisa el número o prueba con una parte del nombre del titular.</p>';return}const a=r.start+1,y=r.start+N.length;b.textContent=`${x(a)}–${x(y)} de ${_(c,"permiso","permisos")}`,i.innerHTML=`
            <ul class="pm-list">${N.map(l).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${r.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${y<c?"":"disabled"}>Siguientes →</button>
            </nav>`}async function S(){const a=++d;i.innerHTML=O(6),b.textContent="Consultando el registro de la CNE…";try{const y=await U({...r,length:se});if(!u||a!==d)return;N=y.rows,c=y.total,R()}catch{if(!u||a!==d)return;b.textContent="",i.innerHTML=D("los permisos")}}function f(a){if(!a)return[];const y=typeof n=="function"?n()||[]:n;return a.laws.map(e=>pe(y,e)).filter((e,g,C)=>e&&C.indexOf(e)===g)}async function P(a,{updateRoute:y=!0}={}){y&&h(a.Numero);const{sector:e,activity:g}=W(a.Numero),C=f(e),H=he(a.Numero);b.textContent="",i.innerHTML=`
            <article class="pm-detail" data-sector="${(e==null?void 0:e.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e?`${t(e.label)}${g?` · ${t(g)}`:""}`:"Permiso"}</span>${v(a.Estado)}</div>
                    <h2 id="pm-detail-title">${t(a.Numero)}</h2>
                    <p class="pm-holder">${t(a.Persona||"Titular sin dato")}</p>
                    ${a.AliasProyecto?`<p class="pm-alias">${t(a.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${X(a.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${Q(Z(a.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${t(a.NumeroExpediente||"—")}</dd></div>
                    <div><dt>Último acuse</dt><dd>${t(I(a.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${x(a.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${x(a.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${x(a.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${x(a.AnexosAsociados)}</dd></div>
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
                    ${C.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${C.map($=>`<button type="button" class="pm-law" data-law="${t($.id)}"><b>${t($.siglas||"")}</b><span>${t($.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${H?ue(H):""}
                </section>
            </article>`,i.scrollIntoView({behavior:"smooth",block:"start"});const M=i.querySelector(".pm-res");if($e(a.ExpedienteId).then($=>{!u||!M.isConnected||(M.innerHTML=$.length?`<ol class="pm-timeline">${$.map((T,A)=>{const F=z(T.REsolucionId);return`
                <li class="${A===0?"is-first":""}">
                    <time>${t(I(T.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${t(T.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${t(T.NumeroResolucion||"")}</b>${T.Acta?` · Acta ${t(T.Acta)}`:""}${T.Modalidad?` · ${t(T.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${F?`<a class="pm-res-pdf" href="${t(F)}" target="_blank" rel="noopener" aria-label="Ver resolución ${t(T.NumeroResolucion||"")} en PDF">${de}Ver resolución (PDF)</a>`:""}
                            ${T.NumeroResolucion?`<a class="pm-res-more" href="${k({resolution:T.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{M.isConnected&&(M.innerHTML=D("las resoluciones"))}),a.AnexosAsociados){const $=i.querySelector(".pm-anx");ve(a.PermisoId).then(T=>{!u||!$.isConnected||($.innerHTML=T.length?`<ul class="pm-annexes">${T.map(A=>{const F=ye(A),q=t(A.Descripcion||"Anexo");return`<li>${F?`<a href="${t(F)}" target="_blank" rel="noopener">${q}</a>`:`<span>${q}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{$.isConnected&&($.innerHTML=D("los anexos"))})}i.querySelector(".pm-back").addEventListener("click",()=>{h(null),N.length?R():S()}),i.querySelector(".pm-share").addEventListener("click",$=>{var A;const T=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(a.Numero)}`;(A=navigator.clipboard)==null||A.writeText(T).then(()=>{$.target.textContent="Enlace copiado"},()=>{})}),i.querySelectorAll("[data-law]").forEach($=>$.addEventListener("click",()=>{const T=C.find(A=>String(A.id)===$.dataset.law);T&&m(T)}))}async function L(a){const y=++d;i.innerHTML=O(2),b.textContent="Buscando el permiso…";try{const e=await U({numero:a,length:10});if(!u||y!==d)return;const g=e.rows.find(C=>w(C.Numero)===w(a))||(e.rows.length===1?e.rows[0]:null);if(g){N=[],P(g,{updateRoute:!1});return}s.numero.value=a,r.numero=a,N=e.rows,c=e.total,R()}catch{if(!u||y!==d)return;b.textContent="",i.innerHTML=D("el permiso")}}return s.addEventListener("submit",a=>{a.preventDefault(),Object.assign(r,{numero:s.numero.value.trim(),titular:s.titular.value.trim(),proyecto:s.proyecto.value.trim(),start:0}),h(null),S()}),s.addEventListener("reset",()=>{Object.assign(r,{numero:"",titular:"",proyecto:"",start:0}),h(null),setTimeout(S)}),i.addEventListener("click",a=>{const y=a.target.closest("[data-page]");if(y){r.start=Math.max(0,r.start+Number(y.dataset.page)*se),S().then(()=>p.scrollIntoView({behavior:"smooth",block:"start"}));return}const e=a.target.closest("[data-permit]"),g=e&&N.find(C=>String(C.PermisoId)===e.dataset.permit);g&&P(g)}),E?L(E):S(),{openPermit:a=>L(a),showList:()=>{N.length?R():S()},destroy:()=>{u=!1,p.remove()}}}const ne=20,oe=o=>K(o,B),Pe=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],ke=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],He=1995;function qe(o,n=[],{resolution:m=null,onRoute:E=()=>{}}={}){const h={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let r=[],N=0,c=0,d=!0;const u=()=>typeof n=="function"?n()||[]:n,p=new Date().getFullYear(),s=Array.from({length:p-He+1},(e,g)=>p-g),b=document.createElement("div");b.className="pm-panel",b.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${s.map(e=>`<option>${e}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${Pe.map(e=>`<option value="${t(e)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${ke.map(e=>`<option value="${t(e)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${B}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,o.replaceChildren(b);const i=b.querySelector("form"),v=b.querySelector(".pm-status"),l=b.querySelector(".pm-body");function R(e){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${t(e.NumeroResolucion)}" data-sector="${ie(e.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${t(e.NumeroResolucion)}</span><span class="pm-date">${t(I(e.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${t(e.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${t(e.Proemio||"")}</span>
                <span class="pm-meta">${e.ModalidadResolucion?`<span class="pm-tag">${t(e.ModalidadResolucion)}</span>`:""}${e.NumeroActa?`<span>${t(e.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${t(z(e.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${t(e.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function S(){if(!r.length){v.textContent="",l.innerHTML='<p class="pm-empty">Ninguna resolución coincide. Prueba con menos filtros o con una parte del texto.</p>';return}const e=h.start+r.length;v.textContent=`${x(h.start+1)}–${x(e)} de ${_(N,"resolución","resoluciones")} · más recientes primero`,l.innerHTML=`
            <ul class="pm-list">${r.map(R).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${h.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${e<N?"":"disabled"}>Siguientes →</button>
            </nav>`}async function f(){const e=++c;l.innerHTML=O(6),v.textContent="Consultando las resoluciones de la CNE…";try{const g=await J(h,{start:h.start,length:ne});if(!d||e!==c)return;r=g.rows,N=g.total,S()}catch{if(!d||e!==c)return;v.textContent="",l.innerHTML=oe("las resoluciones")}}function P(e){const g=ee(e);return g.length?`<ul class="pm-found">${g.map((C,H)=>{const M=Le(u(),C.law);return`<li data-found="${H}" ${M?`data-law-id="${t(M.id)}"`:""}>
                <p class="pm-found-law">${M?`<b>${t(M.siglas||"")}</b> `:""}${t(C.law)}${M?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${C.articles.map($=>`<span class="pm-art" data-art="${t($)}">Art. ${t($)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${t(e)}</p></details>`:e?`<p class="pm-note">${t(e)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function L(e,g){const C=ee(g);await Promise.all(C.map(async(H,M)=>{const $=e.querySelector(`[data-found="${M}"][data-law-id]`);if(!$)return;const T=await Se($.dataset.lawId,H.articles);!d||!$.isConnected||$.querySelectorAll("[data-art]").forEach(A=>{const F=T[A.dataset.art];if(!F)return;const q=document.createElement("button");q.type="button",q.className="pm-art is-linked",q.dataset.article=F,q.textContent=A.textContent,q.title="Abrir el artículo",A.replaceWith(q)})}))}function a(e,{updateRoute:g=!0}={}){g&&E(e.NumeroResolucion);const C=ge(e.Proemio),H=Ee(e),M=z(e.ResolucionId);v.textContent="",l.innerHTML=`
            <article class="pm-detail" data-sector="${ie(e.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${t(e.TipoResolucion||"Resolución")}${e.ModalidadResolucion?` · ${t(e.ModalidadResolucion)}`:""}</span><span class="pm-date">${t(I(e.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${t(e.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${t(e.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${M?`<a class="pm-btn pm-btn-primary" href="${t(M)}" target="_blank" rel="noopener">${de}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${t(I(e.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${t(e.NumeroActa||"—")}</dd></div>
                    ${e.Ponente?`<div><dt>Ponente</dt><dd>${t(e.Ponente)}</dd></div>`:""}
                </dl>
                ${C.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${C.map($=>`<a class="pm-law" href="${k({permit:$})}"><b>Permiso</b><span>${t($)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${P(e.Fundamentacion||"")}</div>
                    ${H?ue(H,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,l.scrollIntoView({behavior:"smooth",block:"start"}),L(l.querySelector(".pm-found-host"),e.Fundamentacion||"").catch(()=>{}),l.querySelector(".pm-back").addEventListener("click",()=>{E(null),r.length?S():f()}),l.querySelector(".pm-share").addEventListener("click",$=>{var A;const T=`${location.origin}${location.pathname}${k({resolution:e.NumeroResolucion})}`;(A=navigator.clipboard)==null||A.writeText(T).then(()=>{$.target.textContent="Enlace copiado"},()=>{})})}async function y(e){const g=++c;l.innerHTML=O(2),v.textContent="Buscando la resolución…";try{const C=await Ne(e);if(!d||g!==c)return;if(C){r=[],a(C,{updateRoute:!1});return}i.numero.value=e,h.numero=e,f()}catch{if(!d||g!==c)return;v.textContent="",l.innerHTML=oe("la resolución")}}return i.addEventListener("submit",e=>{e.preventDefault(),Object.assign(h,{numero:i.numero.value.trim(),texto:i.texto.value.trim(),fecha:i.fecha.value,tipo:i.tipo.value.trim(),modalidad:i.modalidad.value.trim(),start:0}),E(null),f()}),i.addEventListener("reset",()=>{Object.assign(h,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),E(null),setTimeout(f)}),l.addEventListener("click",e=>{const g=e.target.closest("[data-article]");if(g){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:g.dataset.article,list:[g.dataset.article]}}));return}const C=e.target.closest("[data-page]");if(C){h.start=Math.max(0,h.start+Number(C.dataset.page)*ne),f().then(()=>b.scrollIntoView({behavior:"smooth",block:"start"}));return}const H=e.target.closest("[data-resolution]"),M=H&&r.find($=>$.NumeroResolucion===H.dataset.resolution);M&&a(M)}),m?y(m):f(),{openResolution:e=>y(e),showList:()=>{r.length?S():f()},destroy:()=>{d=!1,b.remove()}}}function ie(o=""){const n=o.toLowerCase();return/el[eé]ctric/.test(n)?"electricidad":/licuado/.test(n)?"gaslp":/gas natural/.test(n)?"gasnatural":/petrol|hidrocarb/.test(n)?"petroliferos":"otro"}const me="cne-panorama-v1",Fe=12*60*60*1e3,le=12,G=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],re=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function Ie(o,n=3){const m=[];for(let E=0;E<o.length;E+=n)m.push(...await Promise.all(o.slice(E,E+n).map(h=>h())));return m}function Oe(){try{const o=JSON.parse(localStorage.getItem(me)||"null");return o&&Date.now()-o.at<Fe?o.data:null}catch{return null}}function we(o){try{localStorage.setItem(me,JSON.stringify({at:Date.now(),data:o}))}catch{}}async function je(){const n=new Date().getFullYear(),m=Array.from({length:le},(u,p)=>n-le+1+p),[E,h,...r]=await Ie([()=>U({length:1}).then(u=>u.total),()=>j({}),...m.map(u=>()=>j({fecha:String(u)})),...G.map(u=>()=>j({fecha:String(n),tipo:u})),...re.map(u=>()=>j({fecha:String(n),modalidad:u.filter}))]),N=m.map((u,p)=>({year:u,count:r[p]})),c=G.map((u,p)=>({label:u,count:r[m.length+p]})),d=re.map((u,p)=>({label:u.label,count:r[m.length+G.length+p]}));return{year:n,permits:E,resolutions:h,thisYear:N.at(-1).count,perYear:N,byType:c,byMode:d,at:Date.now()}}function _e(o){let n=!0;const m=document.createElement("div");m.className="pm-panel pn-view",m.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${B}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,o.replaceChildren(m);const E=m.querySelector(".pm-status"),h=m.querySelector(".pn-body"),r=(c,d)=>{const u=Math.max(1,...c.map(p=>p.count));return`<ul class="pn-bars">${c.filter(p=>p.count>0).sort((p,s)=>s.count-p.count).map(p=>`
            <li><span class="pn-bar-label">${t(p.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(p.count/u*100))}%"></span></span>
                <span class="pn-bar-value">${x(p.count)}<span class="sr-only"> ${d}</span></span></li>`).join("")}</ul>`};function N(c,d,u){const p=Math.max(1,...c.perYear.map(s=>s.count));E.textContent=`Actualizado ${new Date(c.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,h.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${k({tab:"permisos"})}"><b>${x(c.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${k({tab:"resoluciones"})}"><b>${x(c.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${x(c.thisYear)}</b><span>resoluciones en ${c.year}</span></div>
                ${u?`<a class="pn-kpi" href="${k({tab:"resoluciones"})}"><b>${t(I(u.date))}</b><span>última sesión (${t(u.acta)})${u.count?`: ${_(u.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${c.perYear.map(s=>`
                    <li title="${s.year}: ${x(s.count)} resoluciones">
                        <span class="pn-col-value">${x(s.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(s.count/p*100))}%"></span>
                        <span class="pn-col-label">${s.year===c.year?`${s.year}*`:s.year}</span>
                    </li>`).join("")}</ol>
                <p class="pm-note">* ${c.year} va en curso.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${c.year} por tipo</h3>${r(c.byType,"resoluciones")}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${c.year} por modalidad</h3>${r(c.byMode,"resoluciones")}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${d.length?`<ol class="pn-latest">${d.map(s=>`
                    <li><a href="${k({resolution:s.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${t(s.NumeroResolucion)}</b><time>${t(I(s.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${t(s.TipoResolucion||"")}${s.ModalidadResolucion?` · ${t(s.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${t(s.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const c=J({},{length:8}).then(b=>b.rows).catch(()=>[]);let d=Oe();d||(d=await je(),we(d));const u=await c,p=u[0],s=p!=null&&p.NumeroActa?{date:p.FechaResolucion,acta:p.NumeroActa,count:await j({acta:p.NumeroActa}).catch(()=>0)}:null;n&&N(d,u,s)}catch{if(!n)return;E.textContent="",h.innerHTML=K("las cifras",B)}})(),{destroy:()=>{n=!1,m.remove()}}}const V={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},De=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function Be(o,n=[],{tramite:m=null,onOpenLaw:E=()=>{},onRoute:h=()=>{}}={}){let r=!0;const N=()=>typeof n=="function"?n()||[]:n,c=i=>i.map(v=>pe(N(),v)).filter(Boolean),d=document.createElement("div");d.className="pm-panel tr-view",o.replaceChildren(d);function u(){const i=[...new Set(te.map(v=>v.sector))];d.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${i.map(v=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${v}">
                    <h3 id="tr-sector-${v}" class="tr-sector-title">${t(V[v]||v)}</h3>
                    <ul class="pm-list">${te.filter(l=>l.sector===v).map(l=>{const R=c([...l.base,...l.rules,...l.forms,...l.calls]).length,S=c(l.forms).length;return`<li><a class="pm-card tr-card" href="${k({tramite:l.id})}" data-sector="${l.sector}">
                            <span class="pm-num">${t(V[l.sector]||"")}</span>
                            <span class="pm-holder">${t(l.title)}</span>
                            <span class="pm-meta"><span class="pm-tag">${x(R)} instrumentos</span>${S?"<span>Con formatos oficiales</span>":""}${c(l.calls).length?"<span>Con convocatoria</span>":""}</span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function p(i){return`<button type="button" class="pm-law" data-law="${t(i.id)}"><b>${t(i.siglas||"")}</b><span>${t(i.titulo)}</span></button>`}function s(i){const v=De.map(f=>{let P=c(i[f.key]);return f.key==="calls"&&(P=P.sort((L,a)=>String(a.fecha_publicacion||"").localeCompare(String(L.fecha_publicacion||"")))),{...f,laws:P}}).filter(f=>f.laws.length);d.innerHTML=`
            <article class="pm-detail" data-sector="${i.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${k({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${t(V[i.sector]||"")}</span></div>
                    <h2 id="tr-title">${t(i.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${v.map(f=>`
                    <section class="pm-section" aria-labelledby="tr-${f.key}">
                        <h3 id="tr-${f.key}">${t(f.title)}</h3>
                        <p class="pm-note">${t(f.note)}</p>
                        <div class="pm-laws">${f.laws.map(p).join("")}</div>
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
            </article>`,d.querySelector(".pm-share").addEventListener("click",f=>{var L;const P=`${location.origin}${location.pathname}${k({tramite:i.id})}`;(L=navigator.clipboard)==null||L.writeText(P).then(()=>{f.target.textContent="Enlace copiado"},()=>{})});const l=c(i.articles.in).map(f=>f.id),R=d.querySelector(".tr-articles");Re(i.articles.query,{lawIds:l,limit:24}).then(({data:f})=>{if(!r||!R.isConnected)return;const P=new Map,L=(f||[]).filter(a=>a.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(a.articulo_label||""))).filter(a=>{const y=P.get(a.ley_id)||0;return P.set(a.ley_id,y+1),y<3}).slice(0,8);R.innerHTML=L.length?`<ol class="tr-article-list">${L.map(a=>{var y;return`
                <li><button type="button" class="tr-article" data-article="${t(a.id)}">
                    <span class="tr-article-top"><b>${t(a.siglas_ley||((y=N().find(e=>String(e.id)===String(a.ley_id)))==null?void 0:y.siglas)||"")}</b> ${t(a.articulo_label||"")}</span>
                    <span class="tr-article-text">${t(String(a.fragmento||a.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',R.dataset.ids=JSON.stringify(L.map(a=>a.id))}).catch(()=>{R.isConnected&&(R.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const S=d.querySelector(".tr-res");S&&J(i.resolutions,{length:6}).then(({rows:f,total:P})=>{!r||!S.isConnected||(S.innerHTML=f.length?`
                    <ol class="pn-latest">${f.map(L=>`
                        <li><a href="${k({resolution:L.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${t(L.NumeroResolucion)}</b><time>${t(I(L.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${t(L.TipoResolucion||"")}${L.ModalidadResolucion?` · ${t(L.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${t(L.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${x(P)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{S.isConnected&&(S.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}d.addEventListener("click",i=>{var R;const v=i.target.closest("[data-law]");if(v){const S=N().find(f=>String(f.id)===v.dataset.law);S&&E(S);return}const l=i.target.closest("[data-article]");if(l){let S=[];try{S=JSON.parse(((R=l.closest(".tr-articles"))==null?void 0:R.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:l.dataset.article,list:S.length?S:[l.dataset.article]}}))}});function b(i){const v=i&&Ce(i);v?s(v):u(),d.scrollIntoView({behavior:"smooth",block:"start"})}return b(m),{openTramite:i=>b(i),showList:()=>b(null),destroy:()=>{r=!1,d.remove()},onRoute:h}}const be="cne-pestanas-vistas",fe=()=>{try{return new Set(JSON.parse(localStorage.getItem(be)||"[]"))}catch{return new Set}};function Ge(o){const n=fe();if(!n.has(o)){n.add(o);try{localStorage.setItem(be,JSON.stringify([...n]))}catch{}}}const Y=[{id:"permisos",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."}];function Ye(o,n,{route:m={tab:"permisos"},onOpenLaw:E=()=>{},setHash:h=()=>{}}={}){let r=null,N=null;const c=document.createElement("section");c.className="pm-view",c.setAttribute("aria-labelledby","pm-title"),c.innerHTML=`
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">CNE: permisos y resoluciones</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de la CNE">
                ${Y.map(s=>`<a role="tab" class="pm-tab" id="pm-tab-${s.id}" href="${k({tab:s.id})}" data-tab="${s.id}" aria-controls="pm-tabpanel">${s.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,o.replaceChildren(c);const d=c.querySelector(".pm-tabpanel");function u(s,b){r==null||r.destroy(),N=s,Ge(s);const i=fe();c.querySelectorAll(".pm-tab").forEach(l=>{const R=!i.has(l.dataset.tab)&&l.dataset.tab!=="permisos";l.classList.toggle("is-new",R),R?l.setAttribute("aria-description","Nueva sección"):l.removeAttribute("aria-description")});const v=Y.find(l=>l.id===s)||Y[0];c.querySelector(".pm-intro").textContent=v.intro,c.querySelectorAll(".pm-tab").forEach(l=>{const R=l.dataset.tab===s;l.setAttribute("aria-selected",String(R)),l.classList.toggle("is-on",R)}),d.setAttribute("aria-labelledby",`pm-tab-${s}`),s==="resoluciones"?r=qe(d,n,{resolution:b.resolution||null,onRoute:l=>h(k({tab:s,resolution:l}))}):s==="tramites"?r=Be(d,n,{tramite:b.tramite||null,onOpenLaw:E}):s==="panorama"?r=_e(d):r=Ae(d,n,{permit:b.permit||null,onOpenLaw:E,onRoute:l=>h(k({tab:s,permit:l}))})}function p(s={tab:"permisos"}){const b=s.tab||"permisos";if(b!==N){u(b,s);return}b==="permisos"?s.permit?r.openPermit(s.permit):r.showList():b==="resoluciones"?s.resolution?r.openResolution(s.resolution):r.showList():b==="tramites"&&(s.tramite?r.openTramite(s.tramite):r.showList())}return p(m),{go:p,destroy:()=>{r==null||r.destroy(),c.remove()}}}export{Ye as renderCneView};
