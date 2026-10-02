import{R as I,j as O,p as _,k as G,l as z,m as W,n as K}from"./index-DQ-STNUd.js";const s=r=>String(r??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]),x=r=>String(r??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(),F=20,X={Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"},Y=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],B=r=>{const c=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(r||"").trim());return c?`${Number(c[1])} ${Y[Number(c[2])-1]} ${c[3]}`:""},$=r=>Number(r||0).toLocaleString("es-MX"),S=(r,c,T)=>`${$(r)} ${Number(r)===1?c:T}`,D={LSE:"ley del sector electrico",LSH:"ley del sector hidrocarburos",LCNE:"ley de la comision nacional de energia"};function J(r,c=[],{onOpenLaw:T=()=>{},permit:M=null,onRoute:A=()=>{}}={}){const p={numero:"",titular:"",proyecto:"",start:0};let d=[],E=0,h=0,f=!0;const m=document.createElement("section");m.className="pm-view",m.setAttribute("aria-labelledby","pm-title"),m.innerHTML=`
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">Permisos CNE</h1>
            <p class="pm-intro">Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula.</p>
        </div>
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
        <p class="pm-source">Fuente: <a href="${I}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`,r.replaceChildren(m);const y=m.querySelector(".pm-form"),v=m.querySelector(".pm-status"),i=m.querySelector(".pm-body"),N=e=>`<div class="pm-list">${'<div class="pm-card pm-skel"><i></i><i></i><i></i></div>'.repeat(e)}</div>`,L=e=>`
        <div class="pm-error">
            <p><strong>No pudimos consultar ${e}.</strong> El registro de la CNE no respondió; intenta de nuevo en un momento.</p>
            <a class="pm-btn" href="${I}" target="_blank" rel="noopener">Abrir el registro de la CNE</a>
        </div>`;function k(e){return e?`<span class="pm-estado is-${X[e]||"off"}">${s(e)}</span>`:""}function V(e){const{sector:a,activity:t}=_(e.Numero);return`
            <li><button type="button" class="pm-card" data-permit="${s(e.PermisoId)}" data-sector="${(a==null?void 0:a.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${s(e.Numero)}</span>${k(e.Estado)}</span>
                <span class="pm-holder">${s(e.Persona||"Titular sin dato")}</span>
                ${e.AliasProyecto?`<span class="pm-alias">${s(e.AliasProyecto)}</span>`:""}
                <span class="pm-meta">
                    ${a?`<span class="pm-tag">${s(a.label)}${t?` · ${s(t)}`:""}</span>`:""}
                    <span>${S(e.ResolucionesAsociadas,"resolución","resoluciones")}</span>
                    ${e.AnexosAsociados?`<span>${S(e.AnexosAsociados,"anexo","anexos")}</span>`:""}
                </span>
            </button></li>`}function C(){if(!d.length){v.textContent="",i.innerHTML='<p class="pm-empty">Ningún permiso coincide con la búsqueda. Revisa el número o prueba con una parte del nombre del titular.</p>';return}const e=p.start+1,a=p.start+d.length;v.textContent=`${$(e)}–${$(a)} de ${S(E,"permiso","permisos")}`,i.innerHTML=`
            <ul class="pm-list">${d.map(V).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${p.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${a<E?"":"disabled"}>Siguientes →</button>
            </nav>`}async function g(){const e=++h;i.innerHTML=N(6),v.textContent="Consultando el registro de la CNE…";try{const a=await O({...p,length:F});if(!f||e!==h)return;d=a.rows,E=a.total,C()}catch{if(!f||e!==h)return;v.textContent="",i.innerHTML=L("los permisos")}}function U(e){if(!e)return[];const a=typeof c=="function"?c()||[]:c;return e.laws.map(t=>a.find(l=>x(l.siglas)===x(t))||D[t]&&a.find(l=>x(l.titulo).startsWith(D[t]))).filter((t,l,u)=>t&&u.indexOf(t)===l)}async function H(e,{updateRoute:a=!0}={}){a&&A(e.Numero);const{sector:t,activity:l}=_(e.Numero),u=U(t);v.textContent="",i.innerHTML=`
            <article class="pm-detail" data-sector="${(t==null?void 0:t.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${t?`${s(t.label)}${l?` · ${s(l)}`:""}`:"Permiso"}</span>${k(e.Estado)}</div>
                    <h2 id="pm-detail-title">${s(e.Numero)}</h2>
                    <p class="pm-holder">${s(e.Persona||"Titular sin dato")}</p>
                    ${e.AliasProyecto?`<p class="pm-alias">${s(e.AliasProyecto)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${G(e.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${s(e.NumeroExpediente||"—")}</dd></div>
                    <div><dt>Último acuse</dt><dd>${s(B(e.FechaAcuse)||"—")}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${$(e.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${$(e.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${$(e.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${$(e.AnexosAsociados)}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Línea de resoluciones</h3>
                    <div class="pm-res">${N(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-anx-title">
                    <h3 id="pm-anx-title">Anexos</h3>
                    <div class="pm-anx">${e.AnexosAsociados?N(1):'<p class="pm-note">Este permiso no tiene anexos publicados.</p>'}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${u.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${u.map(n=>`<button type="button" class="pm-law" data-law="${s(n.id)}"><b>${s(n.siglas||"")}</b><span>${s(n.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                </section>
            </article>`,i.scrollIntoView({behavior:"smooth",block:"start"});const P=i.querySelector(".pm-res");if(z(e.ExpedienteId).then(n=>{!f||!P.isConnected||(P.innerHTML=n.length?`<ol class="pm-timeline">${n.map((o,b)=>`
                <li class="${b===0?"is-first":""}">
                    <time>${s(B(o.FechaResolucion)||"Sin fecha")}</time>
                    <div>
                        <p class="pm-res-type">${s(o.TipoResolucion||"Resolución")}</p>
                        <p class="pm-res-meta"><b>${s(o.NumeroResolucion||"")}</b>${o.Acta?` · Acta ${s(o.Acta)}`:""}${o.Modalidad?` · ${s(o.Modalidad)}`:""}</p>
                    </div>
                </li>`).join("")}</ol>`:'<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>')}).catch(()=>{P.isConnected&&(P.innerHTML=L("las resoluciones"))}),e.AnexosAsociados){const n=i.querySelector(".pm-anx");W(e.PermisoId).then(o=>{!f||!n.isConnected||(n.innerHTML=o.length?`<ul class="pm-annexes">${o.map(b=>{const q=K(b),j=s(b.Descripcion||"Anexo");return`<li>${q?`<a href="${s(q)}" target="_blank" rel="noopener">${j}</a>`:`<span>${j}</span><small>Sin archivo público</small>`}</li>`}).join("")}</ul>`:'<p class="pm-note">Este permiso no tiene anexos publicados.</p>')}).catch(()=>{n.isConnected&&(n.innerHTML=L("los anexos"))})}i.querySelector(".pm-back").addEventListener("click",()=>{A(null),d.length?C():g()}),i.querySelector(".pm-share").addEventListener("click",n=>{var b;const o=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(e.Numero)}`;(b=navigator.clipboard)==null||b.writeText(o).then(()=>{n.target.textContent="Enlace copiado"},()=>{})}),i.querySelectorAll("[data-law]").forEach(n=>n.addEventListener("click",()=>{const o=u.find(b=>String(b.id)===n.dataset.law);o&&T(o)}))}async function R(e){const a=++h;i.innerHTML=N(2),v.textContent="Buscando el permiso…";try{const t=await O({numero:e,length:10});if(!f||a!==h)return;const l=t.rows.find(u=>x(u.Numero)===x(e))||(t.rows.length===1?t.rows[0]:null);if(l){d=[],H(l,{updateRoute:!1});return}y.numero.value=e,p.numero=e,d=t.rows,E=t.total,C()}catch{if(!f||a!==h)return;v.textContent="",i.innerHTML=L("el permiso")}}return y.addEventListener("submit",e=>{e.preventDefault(),Object.assign(p,{numero:y.numero.value.trim(),titular:y.titular.value.trim(),proyecto:y.proyecto.value.trim(),start:0}),A(null),g()}),y.addEventListener("reset",()=>{Object.assign(p,{numero:"",titular:"",proyecto:"",start:0}),A(null),setTimeout(g)}),i.addEventListener("click",e=>{const a=e.target.closest("[data-page]");if(a){p.start=Math.max(0,p.start+Number(a.dataset.page)*F),g().then(()=>m.scrollIntoView({behavior:"smooth",block:"start"}));return}const t=e.target.closest("[data-permit]"),l=t&&d.find(u=>String(u.PermisoId)===t.dataset.permit);l&&H(l)}),M?R(M):g(),{openPermit:e=>R(e),showList:()=>{d.length?C():g()},destroy:()=>{f=!1,m.remove()}}}export{J as renderPermitsView};
