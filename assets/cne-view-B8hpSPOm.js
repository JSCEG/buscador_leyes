import{R as ce,j as Y,p as W,k as Q,l as Z,m as ee,n as fe,r as z,q as I,t as he,v as $e,w as j,x as K,y as ye,z as ve,B as te,C as ge,D as F,E as Ee}from"./index-Dik_a2pq.js";const t=i=>String(i??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o]),H=i=>String(i??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),O=i=>Number(i||0).toLocaleString("es-MX"),V=(i,o,m)=>`${O(i)} ${Number(i)===1?o:m}`,Se=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],G=i=>{const o=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(i||"").trim());return o?`${Number(o[1])} ${Se[Number(o[2])-1]} ${o[3]}`:""},q=i=>`<div class="pm-list">${'<div class="pm-card pm-skel"><i></i><i></i><i></i></div>'.repeat(i)}</div>`,X=(i,o)=>`
    <div class="pm-error">
        <p><strong>No pudimos consultar ${i}.</strong> El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>
        <a class="pm-btn" href="${o}" target="_blank" rel="noopener">Abrir el sitio de la CNE</a>
    </div>`,ae={LSE:"ley del sector electrico",LSH:"ley del sector hidrocarburos",LCNE:"ley de la comision nacional de energia"};function pe(i,o){return i.find(m=>H(m.siglas)===H(o))||ae[o]&&i.find(m=>H(m.titulo).startsWith(ae[o]))||null}function Ne(i,o){const m=$=>H($).replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(r=>r&&!/^(de|del|la|las|los|el|y)$/.test(r)).join(" "),S=m(o);return S&&i.find($=>m($.titulo)===S)||null}const de='<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',se=20,w=i=>X(i,ce),Ce={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function Le(i,o=[],{onOpenLaw:m=()=>{},permit:S=null,onRoute:$=()=>{}}={}){const r={numero:"",titular:"",proyecto:"",start:0};let N=[],c=0,d=0,u=!0;const p=document.createElement("div");p.className="pm-panel",p.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${ce}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,i.replaceChildren(p);const s=p.querySelector(".pm-form"),b=p.querySelector(".pm-status"),n=p.querySelector(".pm-body");function v(a){return a?`<span class="pm-estado is-${Ce[a]||"off"}">${t(a)}</span>`:""}function l(a){const{sector:g,activity:e}=W(a.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${t(a.PermisoId)}" data-sector="${(g==null?void 0:g.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${t(a.Numero)}</span>${v(a.Estado)}</span>
                <span class="pm-holder">${t(a.Persona||"Titular sin dato")}</span>
                ${a.AliasProyecto?`<span class="pm-alias">${t(a.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${g?`<span class="pm-tag">${t(g.label)}${e?` · ${t(e)}`:""}</span>`:""}
                    <span>${V(a.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${a.AnexosAsociados?`<span>${V(a.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${Z(ee(a.Numero),{compact:!0})}<a class="pm-card-pdf" href="${Q(a.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${t(a.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function R(){if(!N.length){b.textContent="",n.innerHTML='<p class="pm-empty">Ningún permiso coincide con la búsqueda. Revisa el número o prueba con una parte del nombre del titular.</p>';return}const a=r.start+1,g=r.start+N.length;b.textContent=`${O(a)}–${O(g)} de ${V(c,"permiso","permisos")}`,n.innerHTML=`
            <ul class="pm-list">${N.map(l).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${r.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${g<c?"":"disabled"}>Siguientes →</button>
            </nav>`}async function C(){const a=++d;n.innerHTML=q(6),b.textContent="Consultando el registro de la CNE…";try{const g=await Y({...r,length:se});if(!u||a!==d)return;N=g.rows,c=g.total,R()}catch{if(!u||a!==d)return;b.textContent="",n.innerHTML=w("los permisos")}}function f(a){if(!a)return[];const g=typeof o=="function"?o()||[]:o;return a.laws.map(e=>pe(g,e)).filter((e,E,L)=>e&&L.indexOf(e)===E)}async function T(a,{updateRoute:g=!0}={}){g&&$(a.Numero);const{sector:e,activity:E}=W(a.Numero),L=f(e);b.textContent="",n.innerHTML=`
            <article class="pm-detail" data-sector="${(e==null?void 0:e.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e?`${t(e.label)}${E?` · ${t(E)}`:""}`:"Permiso"}</span>${v(a.Estado)}</div>
                    <h2 id="pm-detail-title">${t(a.Numero)}</h2>
                    <p class="pm-holder">${t(a.Persona||"Titular sin dato")}</p>
                    ${a.AliasProyecto?`<p class="pm-alias">${t(a.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${Q(a.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${Z(ee(a.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${t(a.NumeroExpediente||"—")}</dd></div>
                    <div><dt>Último acuse</dt><dd>${t(G(a.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${O(a.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${O(a.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${O(a.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${O(a.AnexosAsociados)}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Línea de resoluciones</h3>
                    <div class="pm-res">${q(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-anx-title">
                    <h3 id="pm-anx-title">Anexos</h3>
                    <div class="pm-anx">${a.AnexosAsociados?q(1):'<p class="pm-note">Este permiso no tiene anexos publicados.</p>'}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${L.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${L.map(h=>`<button type="button" class="pm-law" data-law="${t(h.id)}"><b>${t(h.siglas||"")}</b><span>${t(h.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                </section>
            </article>`,n.scrollIntoView({behavior:"smooth",block:"start"});const M=n.querySelector(".pm-res");if(fe(a.ExpedienteId).then(h=>{!u||!M.isConnected||(M.innerHTML=h.length?`<ol class="pm-timeline">${h.map((y,P)=>{const x=z(y.REsolucionId);return`
                <li class="${P===0?"is-first":""}">
                    <time>${t(G(y.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${t(y.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${t(y.NumeroResolucion||"")}</b>${y.Acta?` · Acta ${t(y.Acta)}`:""}${y.Modalidad?` · ${t(y.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${x?`<a class="pm-res-pdf" href="${t(x)}" target="_blank" rel="noopener" aria-label="Ver resolución ${t(y.NumeroResolucion||"")} en PDF">${de}Ver resolución (PDF)</a>`:""}
                            ${y.NumeroResolucion?`<a class="pm-res-more" href="${I({resolution:y.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{M.isConnected&&(M.innerHTML=w("las resoluciones"))}),a.AnexosAsociados){const h=n.querySelector(".pm-anx");he(a.PermisoId).then(y=>{!u||!h.isConnected||(h.innerHTML=y.length?`<ul class="pm-annexes">${y.map(P=>{const x=$e(P),D=t(P.Descripcion||"Anexo");return`<li>${x?`<a href="${t(x)}" target="_blank" rel="noopener">${D}</a>`:`<span>${D}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{h.isConnected&&(h.innerHTML=w("los anexos"))})}n.querySelector(".pm-back").addEventListener("click",()=>{$(null),N.length?R():C()}),n.querySelector(".pm-share").addEventListener("click",h=>{var P;const y=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(a.Numero)}`;(P=navigator.clipboard)==null||P.writeText(y).then(()=>{h.target.textContent="Enlace copiado"},()=>{})}),n.querySelectorAll("[data-law]").forEach(h=>h.addEventListener("click",()=>{const y=L.find(P=>String(P.id)===h.dataset.law);y&&m(y)}))}async function A(a){const g=++d;n.innerHTML=q(2),b.textContent="Buscando el permiso…";try{const e=await Y({numero:a,length:10});if(!u||g!==d)return;const E=e.rows.find(L=>H(L.Numero)===H(a))||(e.rows.length===1?e.rows[0]:null);if(E){N=[],T(E,{updateRoute:!1});return}s.numero.value=a,r.numero=a,N=e.rows,c=e.total,R()}catch{if(!u||g!==d)return;b.textContent="",n.innerHTML=w("el permiso")}}return s.addEventListener("submit",a=>{a.preventDefault(),Object.assign(r,{numero:s.numero.value.trim(),titular:s.titular.value.trim(),proyecto:s.proyecto.value.trim(),start:0}),$(null),C()}),s.addEventListener("reset",()=>{Object.assign(r,{numero:"",titular:"",proyecto:"",start:0}),$(null),setTimeout(C)}),n.addEventListener("click",a=>{const g=a.target.closest("[data-page]");if(g){r.start=Math.max(0,r.start+Number(g.dataset.page)*se),C().then(()=>p.scrollIntoView({behavior:"smooth",block:"start"}));return}const e=a.target.closest("[data-permit]"),E=e&&N.find(L=>String(L.PermisoId)===e.dataset.permit);E&&T(E)}),S?A(S):C(),{openPermit:a=>A(a),showList:()=>{N.length?R():C()},destroy:()=>{u=!1,p.remove()}}}const oe=20,ne=i=>X(i,j),Re=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],Ae=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],Oe=1995;function Te(i,o=[],{resolution:m=null,onRoute:S=()=>{}}={}){const $={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let r=[],N=0,c=0,d=!0;const u=()=>typeof o=="function"?o()||[]:o,p=new Date().getFullYear(),s=Array.from({length:p-Oe+1},(e,E)=>p-E),b=document.createElement("div");b.className="pm-panel",b.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${s.map(e=>`<option>${e}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${Re.map(e=>`<option value="${t(e)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${Ae.map(e=>`<option value="${t(e)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${j}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,i.replaceChildren(b);const n=b.querySelector("form"),v=b.querySelector(".pm-status"),l=b.querySelector(".pm-body");function R(e){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${t(e.NumeroResolucion)}" data-sector="${ie(e.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${t(e.NumeroResolucion)}</span><span class="pm-date">${t(G(e.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${t(e.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${t(e.Proemio||"")}</span>
                <span class="pm-meta">${e.ModalidadResolucion?`<span class="pm-tag">${t(e.ModalidadResolucion)}</span>`:""}${e.NumeroActa?`<span>${t(e.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${t(z(e.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${t(e.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function C(){if(!r.length){v.textContent="",l.innerHTML='<p class="pm-empty">Ninguna resolución coincide. Prueba con menos filtros o con una parte del texto.</p>';return}const e=$.start+r.length;v.textContent=`${O($.start+1)}–${O(e)} de ${V(N,"resolución","resoluciones")} · más recientes primero`,l.innerHTML=`
            <ul class="pm-list">${r.map(R).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${$.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${e<N?"":"disabled"}>Siguientes →</button>
            </nav>`}async function f(){const e=++c;l.innerHTML=q(6),v.textContent="Consultando las resoluciones de la CNE…";try{const E=await K($,{start:$.start,length:oe});if(!d||e!==c)return;r=E.rows,N=E.total,C()}catch{if(!d||e!==c)return;v.textContent="",l.innerHTML=ne("las resoluciones")}}function T(e){const E=te(e);return E.length?`<ul class="pm-found">${E.map((L,M)=>{const h=Ne(u(),L.law);return`<li data-found="${M}" ${h?`data-law-id="${t(h.id)}"`:""}>
                <p class="pm-found-law">${h?`<b>${t(h.siglas||"")}</b> `:""}${t(L.law)}${h?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${L.articles.map(y=>`<span class="pm-art" data-art="${t(y)}">Art. ${t(y)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${t(e)}</p></details>`:e?`<p class="pm-note">${t(e)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function A(e,E){const L=te(E);await Promise.all(L.map(async(M,h)=>{const y=e.querySelector(`[data-found="${h}"][data-law-id]`);if(!y)return;const P=await ge(y.dataset.lawId,M.articles);!d||!y.isConnected||y.querySelectorAll("[data-art]").forEach(x=>{const D=P[x.dataset.art];if(!D)return;const k=document.createElement("button");k.type="button",k.className="pm-art is-linked",k.dataset.article=D,k.textContent=x.textContent,k.title="Abrir el artículo",x.replaceWith(k)})}))}function a(e,{updateRoute:E=!0}={}){E&&S(e.NumeroResolucion);const L=ye(e.Proemio),M=z(e.ResolucionId);v.textContent="",l.innerHTML=`
            <article class="pm-detail" data-sector="${ie(e.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${t(e.TipoResolucion||"Resolución")}${e.ModalidadResolucion?` · ${t(e.ModalidadResolucion)}`:""}</span><span class="pm-date">${t(G(e.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${t(e.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${t(e.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${M?`<a class="pm-btn pm-btn-primary" href="${t(M)}" target="_blank" rel="noopener">${de}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${t(G(e.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${t(e.NumeroActa||"—")}</dd></div>
                    ${e.Ponente?`<div><dt>Ponente</dt><dd>${t(e.Ponente)}</dd></div>`:""}
                </dl>
                ${L.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${L.map(h=>`<a class="pm-law" href="${I({permit:h})}"><b>Permiso</b><span>${t(h)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${T(e.Fundamentacion||"")}</div>
                </section>
            </article>`,l.scrollIntoView({behavior:"smooth",block:"start"}),A(l.querySelector(".pm-found-host"),e.Fundamentacion||"").catch(()=>{}),l.querySelector(".pm-back").addEventListener("click",()=>{S(null),r.length?C():f()}),l.querySelector(".pm-share").addEventListener("click",h=>{var P;const y=`${location.origin}${location.pathname}${I({resolution:e.NumeroResolucion})}`;(P=navigator.clipboard)==null||P.writeText(y).then(()=>{h.target.textContent="Enlace copiado"},()=>{})})}async function g(e){const E=++c;l.innerHTML=q(2),v.textContent="Buscando la resolución…";try{const L=await ve(e);if(!d||E!==c)return;if(L){r=[],a(L,{updateRoute:!1});return}n.numero.value=e,$.numero=e,f()}catch{if(!d||E!==c)return;v.textContent="",l.innerHTML=ne("la resolución")}}return n.addEventListener("submit",e=>{e.preventDefault(),Object.assign($,{numero:n.numero.value.trim(),texto:n.texto.value.trim(),fecha:n.fecha.value,tipo:n.tipo.value.trim(),modalidad:n.modalidad.value.trim(),start:0}),S(null),f()}),n.addEventListener("reset",()=>{Object.assign($,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),S(null),setTimeout(f)}),l.addEventListener("click",e=>{const E=e.target.closest("[data-article]");if(E){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:E.dataset.article,list:[E.dataset.article]}}));return}const L=e.target.closest("[data-page]");if(L){$.start=Math.max(0,$.start+Number(L.dataset.page)*oe),f().then(()=>b.scrollIntoView({behavior:"smooth",block:"start"}));return}const M=e.target.closest("[data-resolution]"),h=M&&r.find(y=>y.NumeroResolucion===M.dataset.resolution);h&&a(h)}),m?g(m):f(),{openResolution:e=>g(e),showList:()=>{r.length?C():f()},destroy:()=>{d=!1,b.remove()}}}function ie(i=""){const o=i.toLowerCase();return/el[eé]ctric/.test(o)?"electricidad":/licuado/.test(o)?"gaslp":/gas natural/.test(o)?"gasnatural":/petrol|hidrocarb/.test(o)?"petroliferos":"otro"}const ue="cne-panorama-v1",Me=12*60*60*1e3,le=12,B=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],re=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function Pe(i,o=3){const m=[];for(let S=0;S<i.length;S+=o)m.push(...await Promise.all(i.slice(S,S+o).map($=>$())));return m}function Ie(){try{const i=JSON.parse(localStorage.getItem(ue)||"null");return i&&Date.now()-i.at<Me?i.data:null}catch{return null}}function xe(i){try{localStorage.setItem(ue,JSON.stringify({at:Date.now(),data:i}))}catch{}}async function Ge(){const o=new Date().getFullYear(),m=Array.from({length:le},(u,p)=>o-le+1+p),[S,$,...r]=await Pe([()=>Y({length:1}).then(u=>u.total),()=>F({}),...m.map(u=>()=>F({fecha:String(u)})),...B.map(u=>()=>F({fecha:String(o),tipo:u})),...re.map(u=>()=>F({fecha:String(o),modalidad:u.filter}))]),N=m.map((u,p)=>({year:u,count:r[p]})),c=B.map((u,p)=>({label:u,count:r[m.length+p]})),d=re.map((u,p)=>({label:u.label,count:r[m.length+B.length+p]}));return{year:o,permits:S,resolutions:$,thisYear:N.at(-1).count,perYear:N,byType:c,byMode:d,at:Date.now()}}function ke(i){let o=!0;const m=document.createElement("div");m.className="pm-panel pn-view",m.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${j}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,i.replaceChildren(m);const S=m.querySelector(".pm-status"),$=m.querySelector(".pn-body"),r=(c,d)=>{const u=Math.max(1,...c.map(p=>p.count));return`<ul class="pn-bars">${c.filter(p=>p.count>0).sort((p,s)=>s.count-p.count).map(p=>`
            <li><span class="pn-bar-label">${t(p.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(p.count/u*100))}%"></span></span>
                <span class="pn-bar-value">${O(p.count)}<span class="sr-only"> ${d}</span></span></li>`).join("")}</ul>`};function N(c,d,u){const p=Math.max(1,...c.perYear.map(s=>s.count));S.textContent=`Actualizado ${new Date(c.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,$.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${I({tab:"permisos"})}"><b>${O(c.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${I({tab:"resoluciones"})}"><b>${O(c.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${O(c.thisYear)}</b><span>resoluciones en ${c.year}</span></div>
                ${u?`<a class="pn-kpi" href="${I({tab:"resoluciones"})}"><b>${t(G(u.date))}</b><span>última sesión (${t(u.acta)})${u.count?`: ${V(u.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${c.perYear.map(s=>`
                    <li title="${s.year}: ${O(s.count)} resoluciones">
                        <span class="pn-col-value">${O(s.count)}</span>
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
                    <li><a href="${I({resolution:s.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${t(s.NumeroResolucion)}</b><time>${t(G(s.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${t(s.TipoResolucion||"")}${s.ModalidadResolucion?` · ${t(s.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${t(s.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const c=K({},{length:8}).then(b=>b.rows).catch(()=>[]);let d=Ie();d||(d=await Ge(),xe(d));const u=await c,p=u[0],s=p!=null&&p.NumeroActa?{date:p.FechaResolucion,acta:p.NumeroActa,count:await F({acta:p.NumeroActa}).catch(()=>0)}:null;o&&N(d,u,s)}catch{if(!o)return;S.textContent="",$.innerHTML=X("las cifras",j)}})(),{destroy:()=>{o=!1,m.remove()}}}const J=[{id:"generacion",title:"Permiso de generación de energía eléctrica",sector:"electricidad",base:["LSE","RLSE","LCNE"],rules:["DACG-PERMISOS-GA","DACG-Planeación Vinculante","MODELOS-INTERCONEXION","DACG-ACCESO-REDES"],forms:[],calls:["CONV-GEN-2","CONV-GEN-2-M1","CONV-GEN-2-M2","CONV-GEN-2-M3","CONV-GEN-2-M4","CONV-GEN-1","CONV-GEN-1-M1","CONV-GEN-1-M2","CONV-GEN-1-M3"],articles:{query:"permiso de generación",in:["LSE","RLSE","DACG-PERMISOS-GA"]},resolutions:{texto:"generación de energía eléctrica",tipo:"Otorgamiento"}},{id:"almacenamiento",title:"Almacenamiento de energía eléctrica",sector:"electricidad",base:["LSE","RLSE","LCNE"],rules:["DACG-PERMISOS-GA","ACUERDO-CNE-16/04/2026-DACG-SAE"],forms:["FORMATOS-SAEE"],calls:["CONV-ESTRATEGICOS","CONV-ESTRATEGICOS-M1","CONV-ESTRATEGICOS-M2","CONV-ESTRATEGICOS-M3"],articles:{query:"almacenamiento de energía",in:["LSE","RLSE","DACG-PERMISOS-GA","ACUERDO-CNE-16/04/2026-DACG-SAE"]},resolutions:null},{id:"autoconsumo",title:"Generación para autoconsumo",sector:"electricidad",base:["LSE","RLSE","LCNE"],rules:["AUTOCONSUMO-0.7-20","VENTANILLA-AUTOCONSUMO"],forms:["FORMATO-AUTOCONSUMO"],calls:[],articles:{query:"autoconsumo",in:["LSE","RLSE","AUTOCONSUMO-0.7-20","VENTANILLA-AUTOCONSUMO"]},resolutions:{texto:"autoconsumo"}},{id:"cogeneracion",title:"Generación en la modalidad de cogeneración",sector:"electricidad",base:["LSE","RLSE","LCNE"],rules:["DACG-COGENERACION"],forms:["FORMATOS-COGENERACION"],calls:[],articles:{query:"cogeneración",in:["LSE","RLSE","DACG-COGENERACION"]},resolutions:{texto:"cogeneración"}},{id:"migracion",title:"Migración de permisos de autoabastecimiento y cogeneración",sector:"electricidad",base:["LSE","RLSE"],rules:["MIGRACION-PERMISOS","MIGRACION-ACLARACION","MIGRACION-MODIFICACION"],forms:[],calls:[],articles:{query:"migración",in:["MIGRACION-PERMISOS","MIGRACION-MODIFICACION","LSE","RLSE"]},resolutions:{texto:"migración"}},{id:"electromovilidad",title:"Electromovilidad: infraestructura de carga",sector:"electricidad",base:["LSE","RLSE"],rules:["DACG-ELECTROMOVILIDAD"],forms:[],calls:[],articles:{query:"carga de vehículos eléctricos",in:["DACG-ELECTROMOVILIDAD","LSE","RLSE"]},resolutions:null},{id:"petroliferos",title:"Permisos de petrolíferos",sector:"petroliferos",base:["LSH","RLSH","LCNE"],rules:[],forms:[],calls:[],articles:{query:"permiso petrolíferos",in:["LSH","RLSH"]},resolutions:{modalidad:"Petrolíferos",tipo:"Otorgamiento"}},{id:"gaslp",title:"Permisos de gas licuado de petróleo",sector:"gaslp",base:["LSH","RLSH","LCNE"],rules:[],forms:[],calls:[],articles:{query:"gas licuado de petróleo permiso",in:["LSH","RLSH"]},resolutions:{modalidad:"Gas licuado",tipo:"Otorgamiento"}},{id:"gasnatural",title:"Permisos de gas natural",sector:"gasnatural",base:["LSH","RLSH","LCNE"],rules:[],forms:[],calls:["CONV-SISTRANGAS"],articles:{query:"gas natural permiso",in:["LSH","RLSH"]},resolutions:{modalidad:"Gas natural",tipo:"Otorgamiento"}},{id:"biocombustibles",title:"Permisos de biocombustibles",sector:"otro",base:["LBio","RLBio"],rules:[],forms:["FORMATOS-BIOCOMBUSTIBLES"],calls:[],articles:{query:"permiso",in:["LBio","RLBio"]},resolutions:null},{id:"geotermia",title:"Geotermia",sector:"otro",base:["LGeo","RLGeo"],rules:[],forms:[],calls:[],articles:{query:"permiso concesión",in:["LGeo","RLGeo"]},resolutions:null}],qe=i=>J.find(o=>o.id===i)||null,_={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},He=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function De(i,o=[],{tramite:m=null,onOpenLaw:S=()=>{},onRoute:$=()=>{}}={}){let r=!0;const N=()=>typeof o=="function"?o()||[]:o,c=n=>n.map(v=>pe(N(),v)).filter(Boolean),d=document.createElement("div");d.className="pm-panel tr-view",i.replaceChildren(d);function u(){const n=[...new Set(J.map(v=>v.sector))];d.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${n.map(v=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${v}">
                    <h3 id="tr-sector-${v}" class="tr-sector-title">${t(_[v]||v)}</h3>
                    <ul class="pm-list">${J.filter(l=>l.sector===v).map(l=>{const R=c([...l.base,...l.rules,...l.forms,...l.calls]).length,C=c(l.forms).length;return`<li><a class="pm-card tr-card" href="${I({tramite:l.id})}" data-sector="${l.sector}">
                            <span class="pm-num">${t(_[l.sector]||"")}</span>
                            <span class="pm-holder">${t(l.title)}</span>
                            <span class="pm-meta"><span class="pm-tag">${O(R)} instrumentos</span>${C?"<span>Con formatos oficiales</span>":""}${c(l.calls).length?"<span>Con convocatoria</span>":""}</span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function p(n){return`<button type="button" class="pm-law" data-law="${t(n.id)}"><b>${t(n.siglas||"")}</b><span>${t(n.titulo)}</span></button>`}function s(n){const v=He.map(f=>{let T=c(n[f.key]);return f.key==="calls"&&(T=T.sort((A,a)=>String(a.fecha_publicacion||"").localeCompare(String(A.fecha_publicacion||"")))),{...f,laws:T}}).filter(f=>f.laws.length);d.innerHTML=`
            <article class="pm-detail" data-sector="${n.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${I({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${t(_[n.sector]||"")}</span></div>
                    <h2 id="tr-title">${t(n.title)}</h2>
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
                ${n.resolutions?`<section class="pm-section" aria-labelledby="tr-res">
                    <h3 id="tr-res">Resoluciones recientes de la CNE</h3>
                    <p class="pm-note">Antecedentes de este tipo de trámite, de lo más reciente a lo más antiguo.</p>
                    <div class="tr-res"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>`:""}
            </article>`,d.querySelector(".pm-share").addEventListener("click",f=>{var A;const T=`${location.origin}${location.pathname}${I({tramite:n.id})}`;(A=navigator.clipboard)==null||A.writeText(T).then(()=>{f.target.textContent="Enlace copiado"},()=>{})});const l=c(n.articles.in).map(f=>f.id),R=d.querySelector(".tr-articles");Ee(n.articles.query,{lawIds:l,limit:24}).then(({data:f})=>{if(!r||!R.isConnected)return;const T=new Map,A=(f||[]).filter(a=>a.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(a.articulo_label||""))).filter(a=>{const g=T.get(a.ley_id)||0;return T.set(a.ley_id,g+1),g<3}).slice(0,8);R.innerHTML=A.length?`<ol class="tr-article-list">${A.map(a=>{var g;return`
                <li><button type="button" class="tr-article" data-article="${t(a.id)}">
                    <span class="tr-article-top"><b>${t(a.siglas_ley||((g=N().find(e=>String(e.id)===String(a.ley_id)))==null?void 0:g.siglas)||"")}</b> ${t(a.articulo_label||"")}</span>
                    <span class="tr-article-text">${t(String(a.fragmento||a.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',R.dataset.ids=JSON.stringify(A.map(a=>a.id))}).catch(()=>{R.isConnected&&(R.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const C=d.querySelector(".tr-res");C&&K(n.resolutions,{length:6}).then(({rows:f,total:T})=>{!r||!C.isConnected||(C.innerHTML=f.length?`
                    <ol class="pn-latest">${f.map(A=>`
                        <li><a href="${I({resolution:A.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${t(A.NumeroResolucion)}</b><time>${t(G(A.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${t(A.TipoResolucion||"")}${A.ModalidadResolucion?` · ${t(A.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${t(A.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${O(T)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{C.isConnected&&(C.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}d.addEventListener("click",n=>{var R;const v=n.target.closest("[data-law]");if(v){const C=N().find(f=>String(f.id)===v.dataset.law);C&&S(C);return}const l=n.target.closest("[data-article]");if(l){let C=[];try{C=JSON.parse(((R=l.closest(".tr-articles"))==null?void 0:R.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:l.dataset.article,list:C.length?C:[l.dataset.article]}}))}});function b(n){const v=n&&qe(n);v?s(v):u(),d.scrollIntoView({behavior:"smooth",block:"start"})}return b(m),{openTramite:n=>b(n),showList:()=>b(null),destroy:()=>{r=!1,d.remove()},onRoute:$}}const me="cne-pestanas-vistas",be=()=>{try{return new Set(JSON.parse(localStorage.getItem(me)||"[]"))}catch{return new Set}};function Fe(i){const o=be();if(!o.has(i)){o.add(i);try{localStorage.setItem(me,JSON.stringify([...o]))}catch{}}}const U=[{id:"permisos",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."}];function we(i,o,{route:m={tab:"permisos"},onOpenLaw:S=()=>{},setHash:$=()=>{}}={}){let r=null,N=null;const c=document.createElement("section");c.className="pm-view",c.setAttribute("aria-labelledby","pm-title"),c.innerHTML=`
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">CNE: permisos y resoluciones</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de la CNE">
                ${U.map(s=>`<a role="tab" class="pm-tab" id="pm-tab-${s.id}" href="${I({tab:s.id})}" data-tab="${s.id}" aria-controls="pm-tabpanel">${s.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,i.replaceChildren(c);const d=c.querySelector(".pm-tabpanel");function u(s,b){r==null||r.destroy(),N=s,Fe(s);const n=be();c.querySelectorAll(".pm-tab").forEach(l=>{const R=!n.has(l.dataset.tab)&&l.dataset.tab!=="permisos";l.classList.toggle("is-new",R),R?l.setAttribute("aria-description","Nueva sección"):l.removeAttribute("aria-description")});const v=U.find(l=>l.id===s)||U[0];c.querySelector(".pm-intro").textContent=v.intro,c.querySelectorAll(".pm-tab").forEach(l=>{const R=l.dataset.tab===s;l.setAttribute("aria-selected",String(R)),l.classList.toggle("is-on",R)}),d.setAttribute("aria-labelledby",`pm-tab-${s}`),s==="resoluciones"?r=Te(d,o,{resolution:b.resolution||null,onRoute:l=>$(I({tab:s,resolution:l}))}):s==="tramites"?r=De(d,o,{tramite:b.tramite||null,onOpenLaw:S}):s==="panorama"?r=ke(d):r=Le(d,o,{permit:b.permit||null,onOpenLaw:S,onRoute:l=>$(I({tab:s,permit:l}))})}function p(s={tab:"permisos"}){const b=s.tab||"permisos";if(b!==N){u(b,s);return}b==="permisos"?s.permit?r.openPermit(s.permit):r.showList():b==="resoluciones"?s.resolution?r.openResolution(s.resolution):r.showList():b==="tramites"&&(s.tramite?r.openTramite(s.tramite):r.showList())}return p(m),{go:p,destroy:()=>{r==null||r.destroy(),c.remove()}}}export{we as renderCneView};
