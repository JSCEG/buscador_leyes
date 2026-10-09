import{R as de,k as z,p as Z,t as ve,l as ee,m as te,n as ae,q as ye,r as J,v as k,w as ge,x as Ee,y as V,z as W,B as Ne,C as Se,D as Ce,E as se,F as Re,G as _,H as Te,I as Le,T as ne}from"./index-C5YFT0Ma.js";const e=l=>String(l??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n]),w=l=>String(l??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),P=l=>Number(l||0).toLocaleString("es-MX"),D=(l,n,h)=>`${P(l)} ${Number(l)===1?n:h}`,Me=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],O=l=>{const n=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(l||"").trim());return n?`${Number(n[1])} ${Me[Number(n[2])-1]} ${n[3]}`:""},j=l=>`<div class="pm-list">${'<div class="pm-card pm-skel"><i></i><i></i><i></i></div>'.repeat(l)}</div>`,X=(l,n)=>`
    <div class="pm-error">
        <p><strong>No pudimos consultar ${l}.</strong> El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>
        <a class="pm-btn" href="${n}" target="_blank" rel="noopener">Abrir el sitio de la CNE</a>
    </div>`,oe={LSE:"ley del sector electrico",LSH:"ley del sector hidrocarburos",LCNE:"ley de la comision nacional de energia"};function ue(l,n){return l.find(h=>w(h.siglas)===w(n))||oe[n]&&l.find(h=>w(h.titulo).startsWith(oe[n]))||null}function Ae(l,n){const h=S=>w(S).replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(o=>o&&!/^(de|del|la|las|los|el|y)$/.test(o)).join(" "),C=h(n);return C&&l.find(S=>h(S.titulo)===C)||null}const me='<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',xe='<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 8h6M9 12h4"/></svg>';function fe(l,n="Guía de trámite"){return`<a class="pm-guide-link" href="#tramite=${encodeURIComponent(l.id)}">${xe}<span><small>${e(n)}</small>${e(l.title)}</span><b aria-hidden="true">→</b></a>`}const ie=20,B=l=>X(l,de),Pe={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function ke(l,n=[],{onOpenLaw:h=()=>{},permit:C=null,onRoute:S=()=>{}}={}){const o={numero:"",titular:"",proyecto:"",start:0};let v=[],r=0,d=0,p=!0;const m=document.createElement("div");m.className="pm-panel",m.innerHTML=`
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
        <p class="pm-source">Fuente: <a href="${de}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,l.replaceChildren(m);const t=m.querySelector(".pm-form"),u=m.querySelector(".pm-status"),i=m.querySelector(".pm-body");function $(a){return a?`<span class="pm-estado is-${Pe[a]||"off"}">${e(a)}</span>`:""}function c(a){const{sector:y,activity:E}=Z(a.Numero);return`
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
            <span class="pm-card-tools">${te(ae(a.Numero),{compact:!0})}<a class="pm-card-pdf" href="${ee(a.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${e(a.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`}function f(){if(!v.length){u.textContent="",i.innerHTML='<p class="pm-empty">Ningún permiso coincide con la búsqueda. Revisa el número o prueba con una parte del nombre del titular.</p>';return}const a=o.start+1,y=o.start+v.length;u.textContent=`${P(a)}–${P(y)} de ${D(r,"permiso","permisos")}`,i.innerHTML=`
            <ul class="pm-list">${v.map(c).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${o.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${y<r?"":"disabled"}>Siguientes →</button>
            </nav>`}async function L(){const a=++d;i.innerHTML=j(6),u.textContent="Consultando el registro de la CNE…";try{const y=await z({...o,length:ie});if(!p||a!==d)return;v=y.rows,r=y.total,f()}catch{if(!p||a!==d)return;u.textContent="",i.innerHTML=B("los permisos")}}function g(a){if(!a)return[];const y=typeof n=="function"?n()||[]:n;return a.laws.map(E=>ue(y,E)).filter((E,H,s)=>E&&s.indexOf(E)===H)}async function M(a,{updateRoute:y=!0}={}){y&&S(a.Numero);const{sector:E,activity:H}=Z(a.Numero),s=g(E),R=ve(a.Numero);u.textContent="",i.innerHTML=`
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
                    <div><dt>Último acuse</dt><dd>${e(O(a.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${P(a.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${P(a.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${P(a.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${P(a.AnexosAsociados)}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Línea de resoluciones</h3>
                    <div class="pm-res">${j(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-anx-title">
                    <h3 id="pm-anx-title">Anexos</h3>
                    <div class="pm-anx">${a.AnexosAsociados?j(1):'<p class="pm-note">Este permiso no tiene anexos publicados.</p>'}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${s.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${s.map(N=>`<button type="button" class="pm-law" data-law="${e(N.id)}"><b>${e(N.siglas||"")}</b><span>${e(N.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${R?fe(R):""}
                </section>
            </article>`,i.scrollIntoView({behavior:"smooth",block:"start"});const x=i.querySelector(".pm-res");if(ye(a.ExpedienteId).then(N=>{!p||!x.isConnected||(x.innerHTML=N.length?`<ol class="pm-timeline">${N.map((b,T)=>{const q=J(b.REsolucionId);return`
                <li class="${T===0?"is-first":""}">
                    <time>${e(O(b.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${e(b.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${e(b.NumeroResolucion||"")}</b>${b.Acta?` · Acta ${e(b.Acta)}`:""}${b.Modalidad?` · ${e(b.Modalidad)}`:""}</p>
                        <div class="pm-res-links">
                            ${q?`<a class="pm-res-pdf" href="${e(q)}" target="_blank" rel="noopener" aria-label="Ver resolución ${e(b.NumeroResolucion||"")} en PDF">${me}Ver resolución (PDF)</a>`:""}
                            ${b.NumeroResolucion?`<a class="pm-res-more" href="${k({resolution:b.NumeroResolucion})}">Detalle y fundamento</a>`:""}
                        </div>
                    </div>
                </li>`}).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{x.isConnected&&(x.innerHTML=B("las resoluciones"))}),a.AnexosAsociados){const N=i.querySelector(".pm-anx");ge(a.PermisoId).then(b=>{!p||!N.isConnected||(N.innerHTML=b.length?`<ul class="pm-annexes">${b.map(T=>{const q=Ee(T),F=e(T.Descripcion||"Anexo");return`<li>${q?`<a href="${e(q)}" target="_blank" rel="noopener">${F}</a>`:`<span>${F}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{N.isConnected&&(N.innerHTML=B("los anexos"))})}i.querySelector(".pm-back").addEventListener("click",()=>{S(null),v.length?f():L()}),i.querySelector(".pm-share").addEventListener("click",N=>{var T;const b=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(a.Numero)}`;(T=navigator.clipboard)==null||T.writeText(b).then(()=>{N.target.textContent="Enlace copiado"},()=>{})}),i.querySelectorAll("[data-law]").forEach(N=>N.addEventListener("click",()=>{const b=s.find(T=>String(T.id)===N.dataset.law);b&&h(b)}))}async function A(a){const y=++d;i.innerHTML=j(2),u.textContent="Buscando el permiso…";try{const E=await z({numero:a,length:10});if(!p||y!==d)return;const H=E.rows.find(s=>w(s.Numero)===w(a))||(E.rows.length===1?E.rows[0]:null);if(H){v=[],M(H,{updateRoute:!1});return}t.numero.value=a,o.numero=a,v=E.rows,r=E.total,f()}catch{if(!p||y!==d)return;u.textContent="",i.innerHTML=B("el permiso")}}return t.addEventListener("submit",a=>{a.preventDefault(),Object.assign(o,{numero:t.numero.value.trim(),titular:t.titular.value.trim(),proyecto:t.proyecto.value.trim(),start:0}),S(null),L()}),t.addEventListener("reset",()=>{Object.assign(o,{numero:"",titular:"",proyecto:"",start:0}),S(null),setTimeout(L)}),i.addEventListener("click",a=>{const y=a.target.closest("[data-page]");if(y){o.start=Math.max(0,o.start+Number(y.dataset.page)*ie),L().then(()=>m.scrollIntoView({behavior:"smooth",block:"start"}));return}const E=a.target.closest("[data-permit]"),H=E&&v.find(s=>String(s.PermisoId)===E.dataset.permit);H&&M(H)}),C?A(C):L(),{openPermit:a=>A(a),showList:()=>{v.length?f():L()},destroy:()=>{p=!1,m.remove()}}}const le=20,re=l=>X(l,V),He=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],qe=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],Fe=1995;function Oe(l,n=[],{resolution:h=null,filters:C=null,onRoute:S=()=>{}}={}){const o={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let v=[],r=0,d=0,p=!0;const m=()=>typeof n=="function"?n()||[]:n,t=new Date().getFullYear(),u=Array.from({length:t-Fe+1},(s,R)=>t-R),i=document.createElement("div");i.className="pm-panel",i.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${u.map(s=>`<option>${s}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${He.map(s=>`<option value="${e(s)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${qe.map(s=>`<option value="${e(s)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${V}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,l.replaceChildren(i);const $=i.querySelector("form"),c=i.querySelector(".pm-status"),f=i.querySelector(".pm-body");function L(s){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${e(s.NumeroResolucion)}" data-sector="${ce(s.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${e(s.NumeroResolucion)}</span><span class="pm-date">${e(O(s.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${e(s.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${e(s.Proemio||"")}</span>
                <span class="pm-meta">${s.ModalidadResolucion?`<span class="pm-tag">${e(s.ModalidadResolucion)}</span>`:""}${s.NumeroActa?`<span>${e(s.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${e(J(s.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${e(s.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function g(){if(!v.length){c.textContent="",f.innerHTML='<p class="pm-empty">Ninguna resolución coincide. Prueba con menos filtros o con una parte del texto.</p>';return}const s=o.start+v.length;c.textContent=`${P(o.start+1)}–${P(s)} de ${D(r,"resolución","resoluciones")} · más recientes primero`,f.innerHTML=`
            <ul class="pm-list">${v.map(L).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${o.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${s<r?"":"disabled"}>Siguientes →</button>
            </nav>`}async function M(){const s=++d;f.innerHTML=j(6),c.textContent="Consultando las resoluciones de la CNE…";try{const R=await W(o,{start:o.start,length:le});if(!p||s!==d)return;v=R.rows,r=R.total,g()}catch{if(!p||s!==d)return;c.textContent="",f.innerHTML=re("las resoluciones")}}function A(s){const R=se(s);return R.length?`<ul class="pm-found">${R.map((x,N)=>{const b=Ae(m(),x.law);return`<li data-found="${N}" ${b?`data-law-id="${e(b.id)}"`:""}>
                <p class="pm-found-law">${b?`<b>${e(b.siglas||"")}</b> `:""}${e(x.law)}${b?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${x.articles.map(T=>`<span class="pm-art" data-art="${e(T)}">Art. ${e(T)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${e(s)}</p></details>`:s?`<p class="pm-note">${e(s)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function a(s,R){const x=se(R);await Promise.all(x.map(async(N,b)=>{const T=s.querySelector(`[data-found="${b}"][data-law-id]`);if(!T)return;const q=await Re(T.dataset.lawId,N.articles);!p||!T.isConnected||T.querySelectorAll("[data-art]").forEach(F=>{const Q=q[F.dataset.art];if(!Q)return;const I=document.createElement("button");I.type="button",I.className="pm-art is-linked",I.dataset.article=Q,I.textContent=F.textContent,I.title="Abrir el artículo",F.replaceWith(I)})}))}function y(s,{updateRoute:R=!0}={}){R&&S(s.NumeroResolucion);const x=Ne(s.Proemio),N=Se(s),b=J(s.ResolucionId);c.textContent="",f.innerHTML=`
            <article class="pm-detail" data-sector="${ce(s.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${e(s.TipoResolucion||"Resolución")}${s.ModalidadResolucion?` · ${e(s.ModalidadResolucion)}`:""}</span><span class="pm-date">${e(O(s.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${e(s.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${e(s.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${b?`<a class="pm-btn pm-btn-primary" href="${e(b)}" target="_blank" rel="noopener">${me}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${e(O(s.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${e(s.NumeroActa||"—")}</dd></div>
                    ${s.Ponente?`<div><dt>Ponente</dt><dd>${e(s.Ponente)}</dd></div>`:""}
                </dl>
                ${x.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${x.map(T=>`<a class="pm-law" href="${k({permit:T})}"><b>Permiso</b><span>${e(T)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${A(s.Fundamentacion||"")}</div>
                    ${N?fe(N,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,f.scrollIntoView({behavior:"smooth",block:"start"}),a(f.querySelector(".pm-found-host"),s.Fundamentacion||"").catch(()=>{}),f.querySelector(".pm-back").addEventListener("click",()=>{S(null),v.length?g():M()}),f.querySelector(".pm-share").addEventListener("click",T=>{var F;const q=`${location.origin}${location.pathname}${k({resolution:s.NumeroResolucion})}`;(F=navigator.clipboard)==null||F.writeText(q).then(()=>{T.target.textContent="Enlace copiado"},()=>{})})}async function E(s){const R=++d;f.innerHTML=j(2),c.textContent="Buscando la resolución…";try{const x=await Ce(s);if(!p||R!==d)return;if(x){v=[],y(x,{updateRoute:!1});return}$.numero.value=s,o.numero=s,M()}catch{if(!p||R!==d)return;c.textContent="",f.innerHTML=re("la resolución")}}$.addEventListener("submit",s=>{s.preventDefault(),Object.assign(o,{numero:$.numero.value.trim(),texto:$.texto.value.trim(),fecha:$.fecha.value,tipo:$.tipo.value.trim(),modalidad:$.modalidad.value.trim(),start:0}),S(null),M()}),$.addEventListener("reset",()=>{Object.assign(o,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),S(null),setTimeout(M)}),f.addEventListener("click",s=>{const R=s.target.closest("[data-article]");if(R){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:R.dataset.article,list:[R.dataset.article]}}));return}const x=s.target.closest("[data-page]");if(x){o.start=Math.max(0,o.start+Number(x.dataset.page)*le),M().then(()=>i.scrollIntoView({behavior:"smooth",block:"start"}));return}const N=s.target.closest("[data-resolution]"),b=N&&v.find(T=>T.NumeroResolucion===N.dataset.resolution);b&&y(b)});function H(s={}){Object.assign(o,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...s,start:0});for(const R of["numero","texto","fecha","tipo","modalidad"])$[R].value=o[R]||"";M()}return h?E(h):C&&Object.keys(C).length?H(C):M(),{openResolution:s=>E(s),applyFilters:H,showList:()=>{v.length?g():M()},destroy:()=>{p=!1,i.remove()}}}function ce(l=""){const n=l.toLowerCase();return/el[eé]ctric/.test(n)?"electricidad":/licuado/.test(n)?"gaslp":/gas natural/.test(n)?"gasnatural":/petrol|hidrocarb/.test(n)?"petroliferos":"otro"}const be="cne-panorama-v1",Ie=12*60*60*1e3,pe=12,G=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],K=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function je(l,n=3){const h=[];for(let C=0;C<l.length;C+=n)h.push(...await Promise.all(l.slice(C,C+n).map(S=>S())));return h}function we(){try{const l=JSON.parse(localStorage.getItem(be)||"null");return l&&Date.now()-l.at<Ie?l.data:null}catch{return null}}function _e(l){try{localStorage.setItem(be,JSON.stringify({at:Date.now(),data:l}))}catch{}}async function De(){const n=new Date().getFullYear(),h=Array.from({length:pe},(p,m)=>n-pe+1+m),[C,S,...o]=await je([()=>z({length:1}).then(p=>p.total),()=>_({}),...h.map(p=>()=>_({fecha:String(p)})),...G.map(p=>()=>_({fecha:String(n),tipo:p})),...K.map(p=>()=>_({fecha:String(n),modalidad:p.filter}))]),v=h.map((p,m)=>({year:p,count:o[m]})),r=G.map((p,m)=>({label:p,count:o[h.length+m]})),d=K.map((p,m)=>({label:p.label,count:o[h.length+G.length+m]}));return{year:n,permits:C,resolutions:S,thisYear:v.at(-1).count,perYear:v,byType:r,byMode:d,at:Date.now()}}function Be(l){let n=!0;const h=document.createElement("div");h.className="pm-panel pn-view",h.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${V}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,l.replaceChildren(h);const C=h.querySelector(".pm-status"),S=h.querySelector(".pn-body"),o=(r,d,p)=>{const m=Math.max(1,...r.map(t=>t.count));return`<ul class="pn-bars">${r.filter(t=>t.count>0).sort((t,u)=>u.count-t.count).map((t,u)=>`
            <li><a class="pn-bar-row" href="${k({tab:"resoluciones",filters:p(t)})}" data-tip="${e(`${t.label}: ${P(t.count)} ${d}. Ver cuáles`)}" style="--i:${u}">
                <span class="pn-bar-label">${e(t.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(t.count/m*100))}%"></span></span>
                <span class="pn-bar-value">${P(t.count)}<span class="sr-only"> ${d}</span></span>
            </a></li>`).join("")}</ul>`};function v(r,d,p){const m=Math.max(1,...r.perYear.map(t=>t.count));C.textContent=`Actualizado ${new Date(r.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,S.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${k({tab:"permisos"})}"><b>${P(r.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${k({tab:"resoluciones"})}"><b>${P(r.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${P(r.thisYear)}</b><span>resoluciones en ${r.year}</span></div>
                ${p?`<a class="pn-kpi" href="${k({tab:"resoluciones"})}"><b>${e(O(p.date))}</b><span>última sesión (${e(p.acta)})${p.count?`: ${D(p.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${r.perYear.map((t,u)=>`
                    <li><a href="${k({tab:"resoluciones",filters:{fecha:String(t.year)}})}" data-tip="${e(`${t.year}: ${P(t.count)} resoluciones. Ver cuáles`)}" style="--i:${u}">
                        <span class="pn-col-value">${P(t.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(t.count/m*100))}%"></span>
                        <span class="pn-col-label">${t.year===r.year?`${t.year}*`:t.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${r.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${r.year} por tipo</h3>${o(r.byType,"resoluciones",t=>({fecha:String(r.year),tipo:t.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${r.year} por modalidad</h3>${o(r.byMode,"resoluciones",t=>{var u;return{fecha:String(r.year),modalidad:((u=K.find(i=>i.label===t.label))==null?void 0:u.filter)||t.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${d.length?`<ol class="pn-latest">${d.map(t=>`
                    <li><a href="${k({resolution:t.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${e(t.NumeroResolucion)}</b><time>${e(O(t.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${e(t.TipoResolucion||"")}${t.ModalidadResolucion?` · ${e(t.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${e(t.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const r=W({},{length:8}).then(u=>u.rows).catch(()=>[]);let d=we();d||(d=await De(),_e(d));const p=await r,m=p[0],t=m!=null&&m.NumeroActa?{date:m.FechaResolucion,acta:m.NumeroActa,count:await _({acta:m.NumeroActa}).catch(()=>0)}:null;n&&v(d,p,t)}catch{if(!n)return;C.textContent="",S.innerHTML=X("las cifras",V)}})(),{destroy:()=>{n=!1,h.remove()}}}const Y={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},Ve=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function Ge(l,n=[],{tramite:h=null,onOpenLaw:C=()=>{},onRoute:S=()=>{}}={}){let o=!0;const v=()=>typeof n=="function"?n()||[]:n,r=i=>i.map($=>ue(v(),$)).filter(Boolean),d=document.createElement("div");d.className="pm-panel tr-view",l.replaceChildren(d);function p(){const i=[...new Set(ne.map($=>$.sector))];d.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${i.map($=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${$}">
                    <h3 id="tr-sector-${$}" class="tr-sector-title">${e(Y[$]||$)}</h3>
                    <ul class="pm-list">${ne.filter(c=>c.sector===$).map(c=>{const f=r([...c.base,...c.rules,...c.forms,...c.calls]).length,L=r(c.forms).length;return`<li><a class="pm-card tr-card" href="${k({tramite:c.id})}" data-sector="${c.sector}">
                            <span class="pm-num">${e(Y[c.sector]||"")}</span>
                            <span class="pm-holder">${e(c.title)}</span>
                            <span class="pm-meta"><span class="pm-tag">${P(f)} instrumentos</span>${L?"<span>Con formatos oficiales</span>":""}${r(c.calls).length?"<span>Con convocatoria</span>":""}</span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function m(i){return`<button type="button" class="pm-law" data-law="${e(i.id)}"><b>${e(i.siglas||"")}</b><span>${e(i.titulo)}</span></button>`}function t(i){const $=Ve.map(g=>{let M=r(i[g.key]);return g.key==="calls"&&(M=M.sort((A,a)=>String(a.fecha_publicacion||"").localeCompare(String(A.fecha_publicacion||"")))),{...g,laws:M}}).filter(g=>g.laws.length);d.innerHTML=`
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
                        <div class="pm-laws">${g.laws.map(m).join("")}</div>
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
            </article>`,d.querySelector(".pm-share").addEventListener("click",g=>{var A;const M=`${location.origin}${location.pathname}${k({tramite:i.id})}`;(A=navigator.clipboard)==null||A.writeText(M).then(()=>{g.target.textContent="Enlace copiado"},()=>{})});const c=r(i.articles.in).map(g=>g.id),f=d.querySelector(".tr-articles");Le(i.articles.query,{lawIds:c,limit:24}).then(({data:g})=>{if(!o||!f.isConnected)return;const M=new Map,A=(g||[]).filter(a=>a.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(a.articulo_label||""))).filter(a=>{const y=M.get(a.ley_id)||0;return M.set(a.ley_id,y+1),y<3}).slice(0,8);f.innerHTML=A.length?`<ol class="tr-article-list">${A.map(a=>{var y;return`
                <li><button type="button" class="tr-article" data-article="${e(a.id)}">
                    <span class="tr-article-top"><b>${e(a.siglas_ley||((y=v().find(E=>String(E.id)===String(a.ley_id)))==null?void 0:y.siglas)||"")}</b> ${e(a.articulo_label||"")}</span>
                    <span class="tr-article-text">${e(String(a.fragmento||a.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',f.dataset.ids=JSON.stringify(A.map(a=>a.id))}).catch(()=>{f.isConnected&&(f.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const L=d.querySelector(".tr-res");L&&W(i.resolutions,{length:6}).then(({rows:g,total:M})=>{!o||!L.isConnected||(L.innerHTML=g.length?`
                    <ol class="pn-latest">${g.map(A=>`
                        <li><a href="${k({resolution:A.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${e(A.NumeroResolucion)}</b><time>${e(O(A.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${e(A.TipoResolucion||"")}${A.ModalidadResolucion?` · ${e(A.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${e(A.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${P(M)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{L.isConnected&&(L.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}d.addEventListener("click",i=>{var f;const $=i.target.closest("[data-law]");if($){const L=v().find(g=>String(g.id)===$.dataset.law);L&&C(L);return}const c=i.target.closest("[data-article]");if(c){let L=[];try{L=JSON.parse(((f=c.closest(".tr-articles"))==null?void 0:f.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:c.dataset.article,list:L.length?L:[c.dataset.article]}}))}});function u(i){const $=i&&Te(i);$?t($):p(),d.scrollIntoView({behavior:"smooth",block:"start"})}return u(h),{openTramite:i=>u(i),showList:()=>u(null),destroy:()=>{o=!1,d.remove()},onRoute:S}}const he="cne-pestanas-vistas",$e=()=>{try{return new Set(JSON.parse(localStorage.getItem(he)||"[]"))}catch{return new Set}};function Ye(l){const n=$e();if(!n.has(l)){n.add(l);try{localStorage.setItem(he,JSON.stringify([...n]))}catch{}}}const U=[{id:"permisos",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."}];function ze(l,n,{route:h={tab:"permisos"},onOpenLaw:C=()=>{},setHash:S=()=>{}}={}){let o=null,v=null;const r=document.createElement("section");r.className="pm-view",r.setAttribute("aria-labelledby","pm-title"),r.innerHTML=`
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">CNE: permisos y resoluciones</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de la CNE">
                ${U.map(t=>`<a role="tab" class="pm-tab" id="pm-tab-${t.id}" href="${k({tab:t.id})}" data-tab="${t.id}" aria-controls="pm-tabpanel">${t.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}
            </nav>
        </div>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,l.replaceChildren(r);const d=r.querySelector(".pm-tabpanel");function p(t,u){o==null||o.destroy(),v=t,Ye(t);const i=$e();r.querySelectorAll(".pm-tab").forEach(c=>{const f=!i.has(c.dataset.tab)&&c.dataset.tab!=="permisos";c.classList.toggle("is-new",f),f?c.setAttribute("aria-description","Nueva sección"):c.removeAttribute("aria-description")});const $=U.find(c=>c.id===t)||U[0];r.querySelector(".pm-intro").textContent=$.intro,r.querySelectorAll(".pm-tab").forEach(c=>{const f=c.dataset.tab===t;c.setAttribute("aria-selected",String(f)),c.classList.toggle("is-on",f)}),d.setAttribute("aria-labelledby",`pm-tab-${t}`),t==="resoluciones"?o=Oe(d,n,{resolution:u.resolution||null,filters:u.filters||null,onRoute:c=>S(k({tab:t,resolution:c}))}):t==="tramites"?o=Ge(d,n,{tramite:u.tramite||null,onOpenLaw:C}):t==="panorama"?o=Be(d):o=ke(d,n,{permit:u.permit||null,onOpenLaw:C,onRoute:c=>S(k({tab:t,permit:c}))})}function m(t={tab:"permisos"}){const u=t.tab||"permisos";if(u!==v){p(u,t);return}u==="permisos"?t.permit?o.openPermit(t.permit):o.showList():u==="resoluciones"?t.resolution?o.openResolution(t.resolution):t.filters&&Object.keys(t.filters).length?o.applyFilters(t.filters):o.showList():u==="tramites"&&(t.tramite?o.openTramite(t.tramite):o.showList())}return m(h),{go:m,destroy:()=>{o==null||o.destroy(),r.remove()}}}export{ze as renderCneView};
