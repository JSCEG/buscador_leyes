const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/permits-map-view-CqBD8hos.js","assets/index-sXNSv3E3.js","assets/index-C6S-ueIS.css","assets/_commonjsHelpers-Cpj98o6Y.js","assets/permits-map-view-Dsdqs5xq.css"])))=>i.map(i=>d[i]);
import{R as de,k as J,p as Z,t as ve,l as ee,m as te,n as ae,q as A,r as ye,v as K,w as ge,x as Ne,y as G,z as X,B as Ee,C as Se,D as Ce,E as se,F as Re,G as D,H as Te,I as Le,T as ne,_ as Pe}from"./index-sXNSv3E3.js";const e=l=>String(l??"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o]),w=l=>String(l??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),k=l=>Number(l||0).toLocaleString("es-MX"),V=(l,o,$)=>`${k(l)} ${Number(l)===1?o:$}`,Me=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],I=l=>{const o=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(l||"").trim());return o?`${Number(o[1])} ${Me[Number(o[2])-1]} ${o[3]}`:""},_=l=>`<div class="pm-list">${'<div class="pm-card pm-skel"><i></i><i></i><i></i></div>'.repeat(l)}</div>`,Q=(l,o)=>`
    <div class="pm-error">
        <p><strong>No pudimos consultar ${l}.</strong> El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>
        <a class="pm-btn" href="${o}" target="_blank" rel="noopener">Abrir el sitio de la CNE</a>
    </div>`,oe={LSE:"ley del sector electrico",LSH:"ley del sector hidrocarburos",LCNE:"ley de la comision nacional de energia"};function ue(l,o){return l.find($=>w($.siglas)===w(o))||oe[o]&&l.find($=>w($.titulo).startsWith(oe[o]))||null}function ke(l,o){const $=S=>w(S).replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(n=>n&&!/^(de|del|la|las|los|el|y)$/.test(n)).join(" "),C=$(o);return C&&l.find(S=>$(S.titulo)===C)||null}const me='<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',Ae='<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 8h6M9 12h4"/></svg>';function fe(l,o="Guía de trámite"){return`<a class="pm-guide-link" href="#tramite=${encodeURIComponent(l.id)}">${Ae}<span><small>${e(o)}</small>${e(l.title)}</span><b aria-hidden="true">→</b></a>`}const ie=20,B=l=>Q(l,de),xe={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function He(l,o=[],{onOpenLaw:$=()=>{},permit:C=null,onRoute:S=()=>{}}={}){const n={numero:"",titular:"",proyecto:"",start:0};let y=[],c=0,p=0,d=!0;const h=document.createElement("div");h.className="pm-panel",h.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${de}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,l.replaceChildren(h);const t=h.querySelector(".pm-form"),m=h.querySelector(".pm-status"),i=h.querySelector(".pm-body");function v(a){return a?`<span class="pm-estado is-${xe[a]||"off"}">${e(a)}</span>`:""}function r(a){const{sector:g,activity:E}=Z(a.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${e(a.PermisoId)}" data-sector="${(g==null?void 0:g.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${e(a.Numero)}</span>${v(a.Estado)}</span>
                <span class="pm-holder">${e(a.Persona||"Titular sin dato")}</span>
                ${a.AliasProyecto?`<span class="pm-alias">${e(a.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${g?`<span class="pm-tag">${e(g.label)}${E?` · ${e(E)}`:""}</span>`:""}
                    <span>${V(a.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${a.AnexosAsociados?`<span>${V(a.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${te(ae(a.Numero),{compact:!0})}<a class="pm-card-pdf" href="${ee(a.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${e(a.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function u(){if(!y.length){m.textContent="",i.innerHTML='<p class="pm-empty">Ningún permiso coincide con la búsqueda. Revisa el número o prueba con una parte del nombre del titular.</p>';return}const a=n.start+1,g=n.start+y.length;m.textContent=`${k(a)}–${k(g)} de ${V(c,"permiso","permisos")}`,i.innerHTML=`
            <ul class="pm-list">${y.map(r).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${g<c?"":"disabled"}>Siguientes →</button>
            </nav>`}async function T(){const a=++p;i.innerHTML=_(6),m.textContent="Consultando el registro de la CNE…";try{const g=await J({...n,length:ie});if(!d||a!==p)return;y=g.rows,c=g.total,u()}catch{if(!d||a!==p)return;m.textContent="",i.innerHTML=B("los permisos")}}function N(a){if(!a)return[];const g=typeof o=="function"?o()||[]:o;return a.laws.map(E=>ue(g,E)).filter((E,H,s)=>E&&s.indexOf(E)===H)}async function L(a,{updateRoute:g=!0}={}){g&&S(a.Numero);const{sector:E,activity:H}=Z(a.Numero),s=N(E),R=ve(a.Numero);m.textContent="",i.innerHTML=`
            <article class="pm-detail" data-sector="${(E==null?void 0:E.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${E?`${e(E.label)}${H?` · ${e(H)}`:""}`:"Permiso"}</span>${v(a.Estado)}</div>
                    <h2 id="pm-detail-title">${e(a.Numero)}</h2>
                    <p class="pm-holder">${e(a.Persona||"Titular sin dato")}</p>
                    ${a.AliasProyecto?`<p class="pm-alias">${e(a.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${ee(a.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${te(ae(a.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                        <a class="pm-btn" href="${A({mapPermit:a.Numero})}" data-map-link hidden><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Ver en el mapa</a>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${e(a.NumeroExpediente||"—")}</dd></div>
                    <div><dt>Último acuse</dt><dd>${e(I(a.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${k(a.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${k(a.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${k(a.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${k(a.AnexosAsociados)}</dd></div>
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
                    <div class="pm-laws">${s.map(f=>`<button type="button" class="pm-law" data-law="${e(f.id)}"><b>${e(f.siglas||"")}</b><span>${e(f.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${R?fe(R):""}
                </section>
            </article>`,i.scrollIntoView({behavior:"smooth",block:"start"});const M=i.querySelector(".pm-res");if(ye(a.ExpedienteId).then(f=>{!d||!M.isConnected||(M.innerHTML=f.length?`<ol class="pm-timeline">${f.map((b,x)=>{const F=K(b.REsolucionId);return`
                <li class="${x===0?"is-first":""}">
                    <time>${e(I(b.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${e(b.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${e(b.NumeroResolucion||"")}</b>${b.Acta?` · Acta ${e(b.Acta)}`:""}${b.Modalidad?` · ${e(b.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${F?`<a class="pm-res-pdf" href="${e(F)}" target="_blank" rel="noopener" aria-label="Ver resolución ${e(b.NumeroResolucion||"")} en PDF">${me}Ver resolución (PDF)</a>`:""}
                            ${b.NumeroResolucion?`<a class="pm-res-more" href="${A({resolution:b.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{M.isConnected&&(M.innerHTML=B("las resoluciones"))}),a.AnexosAsociados){const f=i.querySelector(".pm-anx");ge(a.PermisoId).then(b=>{!d||!f.isConnected||(f.innerHTML=b.length?`<ul class="pm-annexes">${b.map(x=>{const F=Ne(x),j=e(x.Descripcion||"Anexo");return`<li>${F?`<a href="${e(F)}" target="_blank" rel="noopener">${j}</a>`:`<span>${j}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{f.isConnected&&(f.innerHTML=B("los anexos"))})}const q=i.querySelector("[data-map-link]");fetch(`/api/mapa/buscar?q=${encodeURIComponent(a.Numero)}&limite=5`,{credentials:"same-origin"}).then(f=>f.ok?f.json():null).then(f=>{const b=((f==null?void 0:f.resultados)||[]).find(x=>w(x.numeroPermiso)===w(a.Numero)&&x.latitud!=null);!d||!b||!q.isConnected||(q.href=A({mapPermit:b.numeroPermiso}),q.hidden=!1)}).catch(()=>{}),i.querySelector(".pm-back").addEventListener("click",()=>{S(null),y.length?u():T()}),i.querySelector(".pm-share").addEventListener("click",f=>{var x;const b=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(a.Numero)}`;(x=navigator.clipboard)==null||x.writeText(b).then(()=>{f.target.textContent="Enlace copiado"},()=>{})}),i.querySelectorAll("[data-law]").forEach(f=>f.addEventListener("click",()=>{const b=s.find(x=>String(x.id)===f.dataset.law);b&&$(b)}))}async function P(a){const g=++p;i.innerHTML=_(2),m.textContent="Buscando el permiso…";try{const E=await J({numero:a,length:10});if(!d||g!==p)return;const H=E.rows.find(s=>w(s.Numero)===w(a))||(E.rows.length===1?E.rows[0]:null);if(H){y=[],L(H,{updateRoute:!1});return}t.numero.value=a,n.numero=a,y=E.rows,c=E.total,u()}catch{if(!d||g!==p)return;m.textContent="",i.innerHTML=B("el permiso")}}return t.addEventListener("submit",a=>{a.preventDefault(),Object.assign(n,{numero:t.numero.value.trim(),titular:t.titular.value.trim(),proyecto:t.proyecto.value.trim(),start:0}),S(null),T()}),t.addEventListener("reset",()=>{Object.assign(n,{numero:"",titular:"",proyecto:"",start:0}),S(null),setTimeout(T)}),i.addEventListener("click",a=>{const g=a.target.closest("[data-page]");if(g){n.start=Math.max(0,n.start+Number(g.dataset.page)*ie),T().then(()=>h.scrollIntoView({behavior:"smooth",block:"start"}));return}const E=a.target.closest("[data-permit]"),H=E&&y.find(s=>String(s.PermisoId)===E.dataset.permit);H&&L(H)}),C?P(C):T(),{openPermit:a=>P(a),showList:()=>{y.length?u():T()},destroy:()=>{d=!1,h.remove()}}}const le=20,re=l=>Q(l,G),qe=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],Fe=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],we=1995;function Ie(l,o=[],{resolution:$=null,filters:C=null,onRoute:S=()=>{}}={}){const n={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let y=[],c=0,p=0,d=!0;const h=()=>typeof o=="function"?o()||[]:o,t=new Date().getFullYear(),m=Array.from({length:t-we+1},(s,R)=>t-R),i=document.createElement("div");i.className="pm-panel",i.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${G}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,l.replaceChildren(i);const v=i.querySelector("form"),r=i.querySelector(".pm-status"),u=i.querySelector(".pm-body");function T(s){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${e(s.NumeroResolucion)}" data-sector="${ce(s.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${e(s.NumeroResolucion)}</span><span class="pm-date">${e(I(s.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${e(s.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${e(s.Proemio||"")}</span>
                <span class="pm-meta">${s.ModalidadResolucion?`<span class="pm-tag">${e(s.ModalidadResolucion)}</span>`:""}${s.NumeroActa?`<span>${e(s.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${e(K(s.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${e(s.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function N(){if(!y.length){r.textContent="",u.innerHTML='<p class="pm-empty">Ninguna resolución coincide. Prueba con menos filtros o con una parte del texto.</p>';return}const s=n.start+y.length;r.textContent=`${k(n.start+1)}–${k(s)} de ${V(c,"resolución","resoluciones")} · más recientes primero`,u.innerHTML=`
            <ul class="pm-list">${y.map(T).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${n.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${s<c?"":"disabled"}>Siguientes →</button>
            </nav>`}async function L(){const s=++p;u.innerHTML=_(6),r.textContent="Consultando las resoluciones de la CNE…";try{const R=await X(n,{start:n.start,length:le});if(!d||s!==p)return;y=R.rows,c=R.total,N()}catch{if(!d||s!==p)return;r.textContent="",u.innerHTML=re("las resoluciones")}}function P(s){const R=se(s);return R.length?`<ul class="pm-found">${R.map((M,q)=>{const f=ke(h(),M.law);return`<li data-found="${q}" ${f?`data-law-id="${e(f.id)}"`:""}>
                <p class="pm-found-law">${f?`<b>${e(f.siglas||"")}</b> `:""}${e(M.law)}${f?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${M.articles.map(b=>`<span class="pm-art" data-art="${e(b)}">Art. ${e(b)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${e(s)}</p></details>`:s?`<p class="pm-note">${e(s)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function a(s,R){const M=se(R);await Promise.all(M.map(async(q,f)=>{const b=s.querySelector(`[data-found="${f}"][data-law-id]`);if(!b)return;const x=await Re(b.dataset.lawId,q.articles);!d||!b.isConnected||b.querySelectorAll("[data-art]").forEach(F=>{const j=x[F.dataset.art];if(!j)return;const O=document.createElement("button");O.type="button",O.className="pm-art is-linked",O.dataset.article=j,O.textContent=F.textContent,O.title="Abrir el artículo",F.replaceWith(O)})}))}function g(s,{updateRoute:R=!0}={}){R&&S(s.NumeroResolucion);const M=Ee(s.Proemio),q=Se(s),f=K(s.ResolucionId);r.textContent="",u.innerHTML=`
            <article class="pm-detail" data-sector="${ce(s.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e(s.TipoResolucion||"Resolución")}${s.ModalidadResolucion?` · ${e(s.ModalidadResolucion)}`:""}</span><span class="pm-date">${e(I(s.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${e(s.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${e(s.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${f?`<a class="pm-btn pm-btn-primary" href="${e(f)}" target="_blank" rel="noopener">${me}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${e(I(s.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${e(s.NumeroActa||"—")}</dd></div>
                    ${s.Ponente?`<div><dt>Ponente</dt><dd>${e(s.Ponente)}</dd></div>`:""}
                </dl>
                ${M.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${M.map(b=>`<a class="pm-law" href="${A({permit:b})}"><b>Permiso</b><span>${e(b)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${P(s.Fundamentacion||"")}</div>
                    ${q?fe(q,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,u.scrollIntoView({behavior:"smooth",block:"start"}),a(u.querySelector(".pm-found-host"),s.Fundamentacion||"").catch(()=>{}),u.querySelector(".pm-back").addEventListener("click",()=>{S(null),y.length?N():L()}),u.querySelector(".pm-share").addEventListener("click",b=>{var F;const x=`${location.origin}${location.pathname}${A({resolution:s.NumeroResolucion})}`;(F=navigator.clipboard)==null||F.writeText(x).then(()=>{b.target.textContent="Enlace copiado"},()=>{})})}async function E(s){const R=++p;u.innerHTML=_(2),r.textContent="Buscando la resolución…";try{const M=await Ce(s);if(!d||R!==p)return;if(M){y=[],g(M,{updateRoute:!1});return}v.numero.value=s,n.numero=s,L()}catch{if(!d||R!==p)return;r.textContent="",u.innerHTML=re("la resolución")}}v.addEventListener("submit",s=>{s.preventDefault(),Object.assign(n,{numero:v.numero.value.trim(),texto:v.texto.value.trim(),fecha:v.fecha.value,tipo:v.tipo.value.trim(),modalidad:v.modalidad.value.trim(),start:0}),S(null),L()}),v.addEventListener("reset",()=>{Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),S(null),setTimeout(L)}),u.addEventListener("click",s=>{const R=s.target.closest("[data-article]");if(R){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:R.dataset.article,list:[R.dataset.article]}}));return}const M=s.target.closest("[data-page]");if(M){n.start=Math.max(0,n.start+Number(M.dataset.page)*le),L().then(()=>i.scrollIntoView({behavior:"smooth",block:"start"}));return}const q=s.target.closest("[data-resolution]"),f=q&&y.find(b=>b.NumeroResolucion===q.dataset.resolution);f&&g(f)});function H(s={}){Object.assign(n,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...s,start:0});for(const R of["numero","texto","fecha","tipo","modalidad"])v[R].value=n[R]||"";L()}return $?E($):C&&Object.keys(C).length?H(C):L(),{openResolution:s=>E(s),applyFilters:H,showList:()=>{y.length?N():L()},destroy:()=>{d=!1,i.remove()}}}function ce(l=""){const o=l.toLowerCase();return/el[eé]ctric/.test(o)?"electricidad":/licuado/.test(o)?"gaslp":/gas natural/.test(o)?"gasnatural":/petrol|hidrocarb/.test(o)?"petroliferos":"otro"}const be="cne-panorama-v1",Oe=12*60*60*1e3,pe=12,Y=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],W=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function _e(l,o=3){const $=[];for(let C=0;C<l.length;C+=o)$.push(...await Promise.all(l.slice(C,C+o).map(S=>S())));return $}function je(){try{const l=JSON.parse(localStorage.getItem(be)||"null");return l&&Date.now()-l.at<Oe?l.data:null}catch{return null}}function De(l){try{localStorage.setItem(be,JSON.stringify({at:Date.now(),data:l}))}catch{}}async function Ve(){const o=new Date().getFullYear(),$=Array.from({length:pe},(d,h)=>o-pe+1+h),[C,S,...n]=await _e([()=>J({length:1}).then(d=>d.total),()=>D({}),...$.map(d=>()=>D({fecha:String(d)})),...Y.map(d=>()=>D({fecha:String(o),tipo:d})),...W.map(d=>()=>D({fecha:String(o),modalidad:d.filter}))]),y=$.map((d,h)=>({year:d,count:n[h]})),c=Y.map((d,h)=>({label:d,count:n[$.length+h]})),p=W.map((d,h)=>({label:d.label,count:n[$.length+Y.length+h]}));return{year:o,permits:C,resolutions:S,thisYear:y.at(-1).count,perYear:y,byType:c,byMode:p,at:Date.now()}}function Be(l){let o=!0;const $=document.createElement("div");$.className="pm-panel pn-view",$.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${G}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,l.replaceChildren($);const C=$.querySelector(".pm-status"),S=$.querySelector(".pn-body"),n=(c,p,d)=>{const h=Math.max(1,...c.map(t=>t.count));return`<ul class="pn-bars">${c.filter(t=>t.count>0).sort((t,m)=>m.count-t.count).map((t,m)=>`
            <li><a class="pn-bar-row" href="${A({tab:"resoluciones",filters:d(t)})}" data-tip="${e(`${t.label}: ${k(t.count)} ${p}. Ver cuáles`)}" style="--i:${m}">
                <span class="pn-bar-label">${e(t.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(t.count/h*100))}%"></span></span>
                <span class="pn-bar-value">${k(t.count)}<span class="sr-only"> ${p}</span></span>
            </a></li>`).join("")}</ul>`};function y(c,p,d){const h=Math.max(1,...c.perYear.map(t=>t.count));C.textContent=`Actualizado ${new Date(c.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,S.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${A({tab:"permisos"})}"><b>${k(c.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${A({tab:"resoluciones"})}"><b>${k(c.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${k(c.thisYear)}</b><span>resoluciones en ${c.year}</span></div>
                ${d?`<a class="pn-kpi" href="${A({tab:"resoluciones"})}"><b>${e(I(d.date))}</b><span>última sesión (${e(d.acta)})${d.count?`: ${V(d.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${c.perYear.map((t,m)=>`
                    <li><a href="${A({tab:"resoluciones",filters:{fecha:String(t.year)}})}" data-tip="${e(`${t.year}: ${k(t.count)} resoluciones. Ver cuáles`)}" style="--i:${m}">
                        <span class="pn-col-value">${k(t.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(t.count/h*100))}%"></span>
                        <span class="pn-col-label">${t.year===c.year?`${t.year}*`:t.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${c.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${c.year} por tipo</h3>${n(c.byType,"resoluciones",t=>({fecha:String(c.year),tipo:t.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${c.year} por modalidad</h3>${n(c.byMode,"resoluciones",t=>{var m;return{fecha:String(c.year),modalidad:((m=W.find(i=>i.label===t.label))==null?void 0:m.filter)||t.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${p.length?`<ol class="pn-latest">${p.map(t=>`
                    <li><a href="${A({resolution:t.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${e(t.NumeroResolucion)}</b><time>${e(I(t.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${e(t.TipoResolucion||"")}${t.ModalidadResolucion?` · ${e(t.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${e(t.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const c=X({},{length:8}).then(m=>m.rows).catch(()=>[]);let p=je();p||(p=await Ve(),De(p));const d=await c,h=d[0],t=h!=null&&h.NumeroActa?{date:h.FechaResolucion,acta:h.NumeroActa,count:await D({acta:h.NumeroActa}).catch(()=>0)}:null;o&&y(p,d,t)}catch{if(!o)return;C.textContent="",S.innerHTML=Q("las cifras",G)}})(),{destroy:()=>{o=!1,$.remove()}}}const U={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},Ge=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function Ye(l,o=[],{tramite:$=null,onOpenLaw:C=()=>{},onRoute:S=()=>{}}={}){let n=!0;const y=()=>typeof o=="function"?o()||[]:o,c=i=>i.map(v=>ue(y(),v)).filter(Boolean),p=document.createElement("div");p.className="pm-panel tr-view",l.replaceChildren(p);function d(){const i=[...new Set(ne.map(v=>v.sector))];p.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${i.map(v=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${v}">
                    <h3 id="tr-sector-${v}" class="tr-sector-title">${e(U[v]||v)}</h3>
                    <ul class="pm-list">${ne.filter(r=>r.sector===v).map(r=>{const u=c([...r.base,...r.rules,...r.forms,...r.calls]).length,T=c(r.forms).length;return`<li><a class="pm-card tr-card" href="${A({tramite:r.id})}" data-sector="${r.sector}">
                            <span class="pm-num">${e(U[r.sector]||"")}</span>
                            <span class="pm-holder">${e(r.title)}</span>
                            <span class="pm-meta"><span class="pm-tag">${k(u)} instrumentos</span>${T?"<span>Con formatos oficiales</span>":""}${c(r.calls).length?"<span>Con convocatoria</span>":""}</span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function h(i){return`<button type="button" class="pm-law" data-law="${e(i.id)}"><b>${e(i.siglas||"")}</b><span>${e(i.titulo)}</span></button>`}function t(i){const v=Ge.map(N=>{let L=c(i[N.key]);return N.key==="calls"&&(L=L.sort((P,a)=>String(a.fecha_publicacion||"").localeCompare(String(P.fecha_publicacion||"")))),{...N,laws:L}}).filter(N=>N.laws.length);p.innerHTML=`
            <article class="pm-detail" data-sector="${i.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${A({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${e(U[i.sector]||"")}</span></div>
                    <h2 id="tr-title">${e(i.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${v.map(N=>`
                    <section class="pm-section" aria-labelledby="tr-${N.key}">
                        <h3 id="tr-${N.key}">${e(N.title)}</h3>
                        <p class="pm-note">${e(N.note)}</p>
                        <div class="pm-laws">${N.laws.map(h).join("")}</div>
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
            </article>`,p.querySelector(".pm-share").addEventListener("click",N=>{var P;const L=`${location.origin}${location.pathname}${A({tramite:i.id})}`;(P=navigator.clipboard)==null||P.writeText(L).then(()=>{N.target.textContent="Enlace copiado"},()=>{})});const r=c(i.articles.in).map(N=>N.id),u=p.querySelector(".tr-articles");Le(i.articles.query,{lawIds:r,limit:24}).then(({data:N})=>{if(!n||!u.isConnected)return;const L=new Map,P=(N||[]).filter(a=>a.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(a.articulo_label||""))).filter(a=>{const g=L.get(a.ley_id)||0;return L.set(a.ley_id,g+1),g<3}).slice(0,8);u.innerHTML=P.length?`<ol class="tr-article-list">${P.map(a=>{var g;return`
                <li><button type="button" class="tr-article" data-article="${e(a.id)}">
                    <span class="tr-article-top"><b>${e(a.siglas_ley||((g=y().find(E=>String(E.id)===String(a.ley_id)))==null?void 0:g.siglas)||"")}</b> ${e(a.articulo_label||"")}</span>
                    <span class="tr-article-text">${e(String(a.fragmento||a.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',u.dataset.ids=JSON.stringify(P.map(a=>a.id))}).catch(()=>{u.isConnected&&(u.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const T=p.querySelector(".tr-res");T&&X(i.resolutions,{length:6}).then(({rows:N,total:L})=>{!n||!T.isConnected||(T.innerHTML=N.length?`
                    <ol class="pn-latest">${N.map(P=>`
                        <li><a href="${A({resolution:P.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${e(P.NumeroResolucion)}</b><time>${e(I(P.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${e(P.TipoResolucion||"")}${P.ModalidadResolucion?` · ${e(P.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${e(P.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${k(L)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{T.isConnected&&(T.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}p.addEventListener("click",i=>{var u;const v=i.target.closest("[data-law]");if(v){const T=y().find(N=>String(N.id)===v.dataset.law);T&&C(T);return}const r=i.target.closest("[data-article]");if(r){let T=[];try{T=JSON.parse(((u=r.closest(".tr-articles"))==null?void 0:u.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:r.dataset.article,list:T.length?T:[r.dataset.article]}}))}});function m(i){const v=i&&Te(i);v?t(v):d(),p.scrollIntoView({behavior:"smooth",block:"start"})}return m($),{openTramite:i=>m(i),showList:()=>m(null),destroy:()=>{n=!1,p.remove()},onRoute:S}}const he="cne-pestanas-vistas",$e=()=>{try{return new Set(JSON.parse(localStorage.getItem(he)||"[]"))}catch{return new Set}};function Ue(l){const o=$e();if(!o.has(l)){o.add(l);try{localStorage.setItem(he,JSON.stringify([...o]))}catch{}}}const z=[{id:"permisos",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."},{id:"mapa",label:"Mapa",intro:"Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos."}];function Je(l,o,{route:$={tab:"permisos"},onOpenLaw:C=()=>{},setHash:S=()=>{}}={}){let n=null,y=null;const c=document.createElement("section");c.className="pm-view",c.setAttribute("aria-labelledby","pm-title"),c.innerHTML=`
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">CNE: permisos y resoluciones</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de la CNE">
                ${z.map(t=>`<a role="tab" class="pm-tab" id="pm-tab-${t.id}" href="${A({tab:t.id})}" data-tab="${t.id}" aria-controls="pm-tabpanel">${t.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,l.replaceChildren(c);const p=c.querySelector(".pm-tabpanel");function d(t,m){n==null||n.destroy(),y=t,Ue(t);const i=$e();c.querySelectorAll(".pm-tab").forEach(r=>{const u=!i.has(r.dataset.tab)&&r.dataset.tab!=="permisos";r.classList.toggle("is-new",u),u?r.setAttribute("aria-description","Nueva sección"):r.removeAttribute("aria-description")});const v=z.find(r=>r.id===t)||z[0];if(c.querySelector(".pm-intro").textContent=v.intro,c.querySelectorAll(".pm-tab").forEach(r=>{const u=r.dataset.tab===t;r.setAttribute("aria-selected",String(u)),r.classList.toggle("is-on",u)}),p.setAttribute("aria-labelledby",`pm-tab-${t}`),t==="resoluciones")n=Ie(p,o,{resolution:m.resolution||null,filters:m.filters||null,onRoute:r=>S(A({tab:t,resolution:r}))});else if(t==="tramites")n=Ye(p,o,{tramite:m.tramite||null,onOpenLaw:C});else if(t==="panorama")n=Be(p);else if(t==="mapa"){const r={destroyed:!1,view:null,permit:m.mapPermit||null,destroy(){var u;this.destroyed=!0,(u=this.view)==null||u.destroy()},focusPermit(u){this.view?this.view.focusPermit(u):this.permit=u}};n=r,p.innerHTML='<p class="pm-loading">Cargando el mapa…</p>',Pe(()=>import("./permits-map-view-CqBD8hos.js"),__vite__mapDeps([0,1,2,3,4])).then(u=>u.renderPermitsMapView(p,{permit:r.permit})).then(u=>{r.destroyed?u.destroy():r.view=u}).catch(()=>{r.destroyed||(p.innerHTML='<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>')})}else n=He(p,o,{permit:m.permit||null,onOpenLaw:C,onRoute:r=>S(A({tab:t,permit:r}))})}function h(t={tab:"permisos"}){const m=t.tab||"permisos";if(m!==y){d(m,t);return}m==="permisos"?t.permit?n.openPermit(t.permit):n.showList():m==="resoluciones"?t.resolution?n.openResolution(t.resolution):t.filters&&Object.keys(t.filters).length?n.applyFilters(t.filters):n.showList():m==="tramites"?t.tramite?n.openTramite(t.tramite):n.showList():m==="mapa"&&t.mapPermit&&n.focusPermit(t.mapPermit)}return h($),{go:h,destroy:()=>{n==null||n.destroy(),c.remove()}}}export{Je as renderCneView};
