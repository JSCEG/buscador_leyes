import{O as N,Q as j,S as ta,m as ia,U as ca,V as z,W as oa,X as ra,Y as la,Z as J,M as na,$ as da,a0 as fa}from"./index-BtprL8Wc.js";import{l as q}from"./cne-shared-DMDPvk_7.js";const e=l=>String(l??"").replace(/[&<>"']/g,y=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[y]),M=()=>document.documentElement.classList.contains("dark-mode"),Z=l=>`/conceptos/${l}${M()?"":"-light"}.html`,Y="cf-vistos";function O(){try{return new Set(JSON.parse(localStorage.getItem(Y)||"[]"))}catch{return new Set}}function ua(l){try{const y=O();y.add(l),localStorage.setItem(Y,JSON.stringify([...y]))}catch{}}const pa={electricidad:{2:"Subestación, inversor y cómo se equilibra la red.",3:"Eólica, hidroeléctrica, geotérmica y nuclear."}};function ba(l,y,{id:K=null,onOpenLaw:I,onRoute:X}){let A=!0,C=null;function T(a,n=!1){var u,E;if(!C)return;const f=Number(a)-1,o=(u=C.partes)==null?void 0:u[f];l.querySelectorAll(".cf-parts [data-part-n]").forEach(h=>{const t=Number(h.dataset.partN)===Number(a);h.classList.toggle("is-selected",t),h.setAttribute("aria-pressed",t?"true":"false")});const p=l.querySelector("#cf-active-part");if(p&&!o?(p.hidden=!0,p.innerHTML=""):p&&(p.hidden=!1,p.innerHTML=`
                <div class="cf-part-banner-head">
                    <span class="cf-num" aria-hidden="true">${f+1}</span>
                    <strong>${e(o.nombre)}</strong>
                    <a class="cf-part-banner-jump" href="#cf-part-card-${f+1}">Ver en listado ↓</a>
                </div>
                <p>${e(o.texto)}</p>`),n){const h=l.querySelector("iframe[data-concepto]");(E=h==null?void 0:h.contentWindow)==null||E.postMessage({type:"concepto-select-part",n:Number(a)},location.origin)}}const H=a=>{var n,f;if(a.origin===location.origin)if(((n=a.data)==null?void 0:n.type)==="concepto-height"){const o=l.querySelector(`iframe[data-concepto="${CSS.escape(a.data.id||"")}"]`)||l.querySelector(`iframe[data-figura="${CSS.escape(a.data.id||"")}"]`)||l.querySelector("iframe[data-concepto]");o&&Number.isFinite(a.data.h)&&(o.style.height=`${Math.ceil(a.data.h)}px`)}else((f=a.data)==null?void 0:f.type)==="concepto-part"&&T(a.data.n,!1)};window.addEventListener("message",H);let R=M();const V=new MutationObserver(()=>{var f;if(M()===R)return;R=M();const a=l.querySelector("iframe[data-concepto]");if(!a||!C)return;const n=Number((f=l.querySelector(".cf-parts [data-part-n].is-selected"))==null?void 0:f.dataset.partN)||0;n&&a.addEventListener("load",()=>{var o;return(o=a.contentWindow)==null?void 0:o.postMessage({type:"concepto-select-part",n},location.origin)},{once:!0}),a.src=Z(C.figura)});V.observe(document.documentElement,{attributes:!0,attributeFilter:["class"]});const x={electricidad:'<svg class="cf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4.5 13.5h6L9.5 22l9-12h-6.5Z"/></svg>',hidrocarburos:'<svg class="cf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5c-3.2 4.3-6.5 8.2-6.5 11.5a6.5 6.5 0 0 0 13 0c0-3.3-3.3-7.2-6.5-11.5Z"/><path d="M12 18.5a4 4 0 0 0 4-4"/></svg>',check:'<svg class="cf-icon cf-check-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg>'};let g="electricidad";function aa(a,n){const f=j.filter(E=>E.sector===a.sector),o=f.indexOf(a)+1,w=a.sector==="hidrocarburos",p=J[a.id],u=w?`<span class="cf-badge-sector cf-badge-hidro">${x.hidrocarburos} Hidrocarburos</span>`:`<span class="cf-badge-sector cf-badge-elec">${x.electricidad} Electricidad</span>`;return`
            <a class="cf-card${n?" is-done":""}" href="#como-funciona=${e(a.id)}">
                <div class="cf-card-top">
                    <span class="cf-card-sector">${n?`<span class="cf-check">${x.check}</span> Paso ${o} · Visto`:`Paso ${o} de ${f.length}`}</span>
                    ${u}
                </div>
                <strong>${e(a.titulo)}</strong>
                ${p!=null&&p.eslabon?`<span class="cf-card-eslabon">${e(p.eslabon)}</span>`:""}
                <span class="cf-card-text">${e(a.resumen)}</span>
                <span class="cf-card-go">${n?"Volver a ver →":"Explorar paso →"}</span>
            </a>`}function ea(){const a=j.filter(o=>o.sector===g),n=a.filter(o=>S.has(o.id)).length,f=g==="hidrocarburos"?"de hidrocarburos":"de electricidad";return n?`Llevas ${n} de ${a.length} conceptos ${f}. Sigue el hilo conductor en orden o salta al eslabón que te interese.`:"Sigue el hilo conductor desde el Paso 1 hasta la regulación y el mercado, o salta directo al eslabón que necesites."}let S=O();function P(){C=null,S=O();const a=typeof y=="function"?y()||[]:y,n=j.filter(t=>t.sector==="electricidad").length,f=j.filter(t=>t.sector==="hidrocarburos").length,o=j.filter(t=>t.sector===g),w=ta.filter(t=>t.sector==="ambos"||t.sector===g),p=ca[g],u=o.find(t=>!S.has(t.id))||o[0],E=o.indexOf(u)+1,h=o.filter(t=>S.has(t.id)).length;l.innerHTML=`
            <section class="cf-view" aria-labelledby="cf-title">
                <header class="cf-head" data-emblem-host>
                    ${ia("como-funciona")}
                    <p class="cf-kicker">Explicaciones generales · interactivo con anatomía técnica y leyes</p>
                    <h1 id="cf-title">¿Cómo funciona el sector energético?</h1>
                    <p class="cf-intro">Aprende paso a paso cómo funcionan la electricidad y los hidrocarburos en México: desde las leyes físicas y las moléculas hasta las centrales, refinerías, ductos y el diseño del nuevo marco regulatorio (Reforma 2025).</p>
                    
                    <div class="cf-sectors-nav" role="group" aria-label="Elegir sector">
                        <button type="button" class="cf-sector-tab ${g==="electricidad"?"is-active":""}" data-sector="electricidad" aria-pressed="${g==="electricidad"}">
                            <span class="cf-tab-icon">${x.electricidad}</span>
                            <span class="cf-tab-text">Mercado Eléctrico (SEN / MEM)</span>
                            <span class="cf-tab-count">${n} conceptos</span>
                        </button>
                        <button type="button" class="cf-sector-tab ${g==="hidrocarburos"?"is-active":""}" data-sector="hidrocarburos" aria-pressed="${g==="hidrocarburos"}">
                            <span class="cf-tab-icon">${x.hidrocarburos}</span>
                            <span class="cf-tab-text">Mercado de Hidrocarburos</span>
                            <span class="cf-tab-count">${f} conceptos</span>
                        </button>
                    </div>
                </header>

                ${p?`
                <section class="cf-thread-map" aria-label="Hilo conductor de la cadena de valor">
                    <div class="cf-thread-top">
                        <div>
                            <p class="cf-kicker">El hilo conductor · Cadena de valor de principio a fin</p>
                            <h2 class="cf-thread-title">${e(p.subtitulo)}</h2>
                            <p class="cf-thread-desc">${e(p.resumen)}</p>
                        </div>
                        ${u?`
                        <a class="cf-thread-cta" href="#como-funciona=${e(u.id)}">
                            <span>${h>0&&h<o.length?`Continuar (${h}/${o.length} vistos)`:"Recorrido guiado"}</span>
                            <strong>Paso ${E}: ${e(u.titulo)} →</strong>
                        </a>`:""}
                    </div>
                    <ol class="cf-thread-stages">
                        ${p.etapas.map(t=>`
                            <li class="cf-thread-stage">
                                <div class="cf-stage-head">
                                    <span class="cf-stage-num">Eslabón ${e(t.num)}</span>
                                    <strong>${e(t.titulo)}</strong>
                                </div>
                                <p>${e(t.desc)}</p>
                                <div class="cf-stage-pills">
                                    ${t.ids.map(d=>{const $=N[d];if(!$)return"";const b=o.indexOf($)+1,v=S.has(d);return`<a class="cf-stage-pill${v?" is-done":""}" href="#como-funciona=${e(d)}"><span class="cf-pill-num">${v?"✓":b}</span><span>${e($.titulo)}</span></a>`}).join("")}
                                </div>
                            </li>`).join("")}
                    </ol>
                </section>`:""}

                <p class="cf-progress">${ea()}</p>
                <ol class="cf-route">${z.map(t=>{var b;const d=o.filter(v=>v.nivel===t.id),$=(b=pa[g])==null?void 0:b[t.id];return!d.length&&!$?"":`
                    <li class="cf-level" aria-labelledby="cf-nivel-${t.id}">
                        <div class="cf-level-head">
                            <span class="cf-level-num" aria-hidden="true">${t.id}</span>
                            <div><h2 id="cf-nivel-${t.id}">Nivel ${t.id} · ${e(t.titulo)}</h2><p>${e(t.texto)}</p></div>
                        </div>
                        <div class="cf-grid">
                            ${d.map(v=>aa(v,S.has(v.id))).join("")}
                            ${$?`<div class="cf-card cf-soon" aria-hidden="true"><strong>Próximamente</strong><span class="cf-card-text">${e($)}</span></div>`:""}
                        </div>
                    </li>`}).filter(Boolean).join("")}
                </ol>

                <section class="cf-section cf-ejes-section" aria-labelledby="cf-ejes-title">
                    <div class="cf-subhead">
                        <p class="cf-kicker">Arquitectura constitucional y legal · DOF 18/03/2025 y 03/10/2025</p>
                        <h2 id="cf-ejes-title">Ejes Rectores del Nuevo Marco Regulatorio (2025)</h2>
                        <p class="cf-subintro">Los cinco pilares transversales que rigen tanto al Sistema Eléctrico Nacional (SEN) como a la cadena de valor de los Hidrocarburos.</p>
                    </div>
                    <div class="cf-ejes-grid">
                        ${oa.map(t=>`
                            <article class="cf-eje-card">
                                <h3>${e(t.titulo)}</h3>
                                <p>${e(t.texto)}</p>
                                <div class="cf-eje-tags">
                                    ${(t.siglas||[]).map(d=>{const $=q(a,d);return $?`<button type="button" class="cf-chip-law" data-open-siglas="${e(d)}" title="${e($.titulo)}">${e(d)}</button>`:`<span class="cf-chip-law">${e(d)}</span>`}).join("")}
                                </div>
                            </article>`).join("")}
                    </div>
                </section>

                <section class="cf-section cf-glosario-section" aria-labelledby="cf-glosario-title">
                    <div class="cf-subhead">
                        <p class="cf-kicker">Diccionario técnico-jurídico integrado</p>
                        <h2 id="cf-glosario-title">Glosario Regulatorio Esencial</h2>
                        <p class="cf-subintro">Conceptos clave vigentes en la LSE, LSH, LPTE y sus Reglamentos para interpretar permisos, asignaciones y despacho.</p>
                    </div>
                    <div class="cf-glosario-grid">
                        ${w.map(t=>{const d=t.conceptoId?N[t.conceptoId]:null,$=(d==null?void 0:d.nivel)===4?"Ver esquema interactivo →":"Ver anatomía 3D →";return`
                            <article class="cf-glosario-card">
                                <div class="cf-glosario-head">
                                    <div class="cf-eje-tags">
                                        ${(Array.isArray(t.siglas)?t.siglas:[t.siglas]).map(b=>{const v=q(a,b);return v?`<button type="button" class="cf-chip-law" data-open-siglas="${e(b)}" title="${e(v.titulo)}">${e(b)}</button>`:`<span class="cf-chip-law">${e(b)}</span>`}).join("")}
                                    </div>
                                    ${t.conceptoId?`<a class="cf-glosario-link" href="#como-funciona=${e(t.conceptoId)}">${$}</a>`:""}
                                </div>
                                <h3>${e(t.termino)}</h3>
                                <p>${e(t.definicion)}</p>
                                <span class="cf-glosario-fund">${e(t.articulos)}</span>
                            </article>`}).join("")}
                    </div>
                </section>
            </section>`,l.querySelectorAll(".cf-sector-tab").forEach(t=>{t.addEventListener("click",()=>{g=t.dataset.sector,P()})}),l.querySelectorAll("[data-open-siglas]").forEach(t=>{t.addEventListener("click",()=>{const d=q(a,t.dataset.openSiglas);d&&I(d)})})}function sa(a){var F,U,D,_,G,Q,W;C=a,a.sector&&(g=a.sector);const n=typeof y=="function"?y()||[]:y;ua(a.id),S=O();const f=j.filter(s=>s.sector===a.sector),o=f.indexOf(a)+1,w=ra(a.id),p=la(a.id),u=J[a.id],E=(a.antes||[]).map(s=>N[s]).filter(Boolean),h=(((F=a.ley)==null?void 0:F.siglas)||[]).map(s=>({siglas:s,law:q(n,s)})),t=a.tramites.map(na).filter(Boolean),d=a.sector==="hidrocarburos"?"Mercado de Hidrocarburos":"Mercado Eléctrico",$=a.sector==="hidrocarburos"?x.hidrocarburos:x.electricidad,b=(U=a.ley)==null?void 0:U.ficha,v=a.nivel===4;l.innerHTML=`
            <article class="cf-view cf-concept" aria-labelledby="cf-title">
                <div class="cf-top-nav">
                    <a class="cf-back" href="#como-funciona">← Volver a la ruta de ${d}</a>
                    <nav class="cf-route-bar" aria-label="Progreso en la ruta de ${d}">
                        <div class="cf-route-bar-meta">
                            <span class="cf-route-step-count">Paso ${o} de ${f.length}</span>
                            ${u!=null&&u.eslabon?`<span class="cf-route-eslabon">${e(u.eslabon)}</span>`:""}
                        </div>
                        <ol class="cf-route-dots">
                            ${f.map((s,i)=>{const c=i+1,r=s.id===a.id,m=S.has(s.id);return`<li><a class="cf-route-dot${r?" is-current":""}${m?" is-done":""}" href="#como-funciona=${e(s.id)}" title="Paso ${c}: ${e(s.titulo)}" aria-current="${r?"step":"false"}"><span class="cf-dot-num">${c}</span><span class="cf-dot-label">${e(s.titulo)}</span></a></li>`}).join("")}
                        </ol>
                    </nav>
                </div>
                <header class="cf-head">
                    <p class="cf-kicker"><span class="cf-kicker-icon">${$}</span> ${d} · Nivel ${a.nivel}: ${e((D=z.find(s=>s.id===a.nivel))==null?void 0:D.titulo)}</p>
                    <h1 id="cf-title">${e(a.titulo)}</h1>
                    <p class="cf-intro">${e(a.resumen)}</p>
                    <button type="button" class="cf-share" data-share><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Compartir</span></button>
                </header>
                ${E.length?`<p class="cf-before">Para entenderlo mejor, antes mira: ${E.map(s=>`<a href="#como-funciona=${e(s.id)}">${e(s.titulo)}</a>`).join(", ")}.</p>`:""}
                <div class="cf-figure">
                    <iframe data-concepto="${e(a.id)}" src="${Z(a.figura)}" title="Ilustración interactiva: ${e(a.titulo)}" loading="lazy"></iframe>
                </div>
                <div id="cf-active-part" class="cf-part-banner" aria-live="polite" hidden></div>
                ${(_=a.definiciones)!=null&&_.length?`<section class="cf-section" aria-labelledby="cf-defs">
                    <h2 id="cf-defs">${a.definiciones.length>1?"Definiciones":"Definición"}</h2>
                    <dl class="cf-defs">${a.definiciones.map(s=>`<div><dt>${e(s.termino)}${s.unidad?` <span class="cf-unit">${e(s.unidad)}</span>`:""}</dt><dd>${e(s.texto)}</dd></div>`).join("")}</dl>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-claves">
                    <h2 id="cf-claves">En palabras simples</h2>
                    <ol class="cf-steps">${a.claves.map(s=>`<li>${e(s)}</li>`).join("")}</ol>
                </section>
                ${(G=a.formulas)!=null&&G.length?`<section class="cf-section" aria-labelledby="cf-formulas">
                    <h2 id="cf-formulas">${a.formulas.length>1?"Las fórmulas":"La fórmula"}</h2>
                    <div class="cf-formulas">${a.formulas.map(s=>`<div class="cf-formula">
                        <p class="cf-expr">${e(s.expresion)}</p>
                        <p class="cf-reading">${e(s.lectura)}</p>
                        ${s.ejemplo?`<p class="cf-example"><b>Ejemplo:</b> ${e(s.ejemplo)}</p>`:""}
                    </div>`).join("")}</div>
                </section>`:""}
                ${(Q=a.errores)!=null&&Q.length?`<section class="cf-section" aria-labelledby="cf-errores">
                    <h2 id="cf-errores">Ideas equivocadas comunes</h2>
                    <ul class="cf-myths">${a.errores.map(s=>`<li><p class="cf-myth"><span aria-hidden="true">✗</span><span class="cf-sr">Idea equivocada: </span>${e(s.idea)}</p><p class="cf-fact"><span aria-hidden="true">✓</span><span class="cf-sr">En realidad: </span>${e(s.realidad)}</p></li>`).join("")}</ul>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-partes">
                    <div class="cf-parts-header">
                        <h2 id="cf-partes">${a.partesTitulo?e(a.partesTitulo):"Sus partes"}</h2>
                        <span class="cf-parts-hint">Haz clic en un número en ${v?"el diagrama interactivo":"la figura 3D"} o en las tarjetas para resaltar cada parte</span>
                    </div>
                    <dl class="cf-parts">${a.partes.map((s,i)=>`<div id="cf-part-card-${i+1}" data-part-n="${i+1}" role="button" tabindex="0" aria-pressed="false"><dt><span class="cf-num" aria-hidden="true">${i+1}</span>${e(s.nombre)}</dt><dd>${e(s.texto)}</dd></div>`).join("")}</dl>
                </section>
                ${a.dato?`<aside class="cf-fun" aria-label="¿Sabías que…?"><b>¿Sabías que…?</b> ${e(a.dato)}</aside>`:""}
                ${a.ley?`<section class="cf-section" aria-labelledby="cf-ley">
                    <h2 id="cf-ley">Qué dice la ley</h2>
                    ${u?`
                    <div class="cf-bridge-box" aria-label="Puente entre realidad física y regulación">
                        <div class="cf-bridge-col">
                            <span class="cf-bridge-tag">Hecho físico y operativo</span>
                            <p>${e(u.fisica)}</p>
                        </div>
                        <div class="cf-bridge-arrow" aria-hidden="true">→</div>
                        <div class="cf-bridge-col cf-bridge-col-law">
                            <span class="cf-bridge-tag">Consecuencia regulatoria</span>
                            <p>${e(u.regulacion)}</p>
                        </div>
                    </div>`:""}
                    <p>${e(a.ley.texto)}</p>
                    ${b?`
                    <div class="cf-ficha" data-ficha>
                        <div class="cf-ficha-tabs" role="tablist" aria-label="Ficha regulatoria y procedimental">
                            <button type="button" class="cf-ficha-tab is-active" role="tab" aria-selected="true" data-ficha-tab="que">1. El Qué (Concepto Técnico)</button>
                            <button type="button" class="cf-ficha-tab" role="tab" aria-selected="false" data-ficha-tab="como">2. El Cómo (Ruta Regulatoria)</button>
                            <button type="button" class="cf-ficha-tab" role="tab" aria-selected="false" data-ficha-tab="articulos">3. Fundamento Legal Vigente</button>
                        </div>
                        <div class="cf-ficha-panel is-active" role="tabpanel" data-ficha-panel="que">
                            <p>${e(b.elQue)}</p>
                        </div>
                        <div class="cf-ficha-panel" role="tabpanel" data-ficha-panel="como" hidden>
                            <p>${e(b.elComo)}</p>
                        </div>
                        <div class="cf-ficha-panel" role="tabpanel" data-ficha-panel="articulos" hidden>
                            <ul class="cf-art-list">
                                ${(b.articulos||[]).map(s=>{var c;const i=((c=h.find(r=>r.siglas===s.siglas))==null?void 0:c.law)||q(n,s.siglas);return`<li class="cf-art-item">
                                        <div class="cf-art-top">
                                            ${i?`<button type="button" class="cf-chip-law" data-law="${e(i.id)}">${e(s.siglas)}</button>`:`<span class="cf-chip-law">${e(s.siglas)}</span>`}
                                            <strong class="cf-art-ref">${e(s.refs)}</strong>
                                        </div>
                                        <p class="cf-art-desc">${e(s.nota)}</p>
                                    </li>`}).join("")}
                            </ul>
                        </div>
                    </div>`:""}
                    <div class="cf-links">${h.map(({siglas:s,law:i})=>i?`<button type="button" class="cf-law" data-law="${e(i.id)}"><b>${e(i.siglas||s)}</b><span>${e(i.titulo)}</span></button>`:"").join("")}</div>
                </section>`:""}
                ${t.length||a.mapa?`<section class="cf-section" aria-labelledby="cf-permisos">
                    <h2 id="cf-permisos">Permisos y trámites</h2>
                    <div class="cf-links">
                        ${t.map(s=>`<a class="cf-link" href="#tramite=${e(s.id)}"><b>Guía de trámite</b><span>${e(s.title)}</span></a>`).join("")}
                        ${a.mapa?`<a class="cf-link" href="${e(a.mapa.hash)}"><b>Mapa</b><span>${e(a.mapa.texto)}</span></a>`:""}
                    </div>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-prueba">
                    <h2 id="cf-prueba">Ponte a prueba</h2>
                    <div class="cf-quiz">${a.preguntas.map((s,i)=>`
                        <fieldset class="cf-q" data-q="${i}">
                            <legend>${e(s.pregunta)}</legend>
                            ${s.opciones.map((c,r)=>`<button type="button" class="cf-opt" data-opt="${r}">${e(c)}</button>`).join("")}
                            <p class="cf-verdict" aria-live="polite"></p>
                        </fieldset>`).join("")}</div>
                </section>
                <div class="cf-journey-footer">
                    ${u!=null&&u.transicion?`
                    <div class="cf-transition-box">
                        <span class="cf-transition-kicker">Hilo conductor · ¿Cómo conecta con el siguiente paso?</span>
                        <p>${e(u.transicion)}</p>
                    </div>`:""}
                    <div class="cf-nav-pair">
                        ${w?`<a class="cf-prev" href="#como-funciona=${e(w.id)}"><span>← Paso ${o-1} (Anterior)</span><strong>${e(w.titulo)}</strong></a>`:""}
                        ${p?`<a class="cf-next" href="#como-funciona=${e(p.id)}"><span>Siguiente en la ruta (Paso ${o+1} de ${f.length})</span><strong>${e(p.titulo)} →</strong></a>`:'<a class="cf-next" href="#como-funciona"><span>Llegaste al final de la ruta por ahora</span><strong>Ver la ruta completa →</strong></a>'}
                    </div>
                </div>
                <section class="cf-sources" aria-labelledby="cf-fuentes">
                    <h2 id="cf-fuentes">Fuentes</h2>
                    <ol class="cf-refs">${a.fuentes.map(s=>{var r;const i=s.acervo?(r=h.find(m=>m.siglas===s.acervo))==null?void 0:r.law:null,c=s.url?`<a href="${e(s.url)}" target="_blank" rel="noopener"><i>${e(s.titulo)}</i></a>`:`<i>${e(s.titulo)}</i>`;return`<li>${e(s.autor)}${s.url?` (${e(s.fecha)}). ${c}${/[?!.]$/.test(s.titulo)?"":"."}${s.editorial?` ${e(s.editorial)}.`:""}`:`. ${c}, ${e(s.fecha)}.`}${s.consulta?` Consultado el ${e(s.consulta)}.`:""}${i?` <button type="button" class="cf-ref-law" data-law="${e(i.id)}">Ver en el acervo</button>`:""}</li>`}).join("")}</ol>
                    <p class="cf-note">Explicación general con fines informativos; no es texto legal ni sustituye la normativa. ${a.revisado?`Revisado el ${e(a.revisado)}.`:'<span class="cf-draft">Borrador en revisión.</span>'}</p>
                </section>
            </article>`,(W=l.querySelector("[data-share]"))==null||W.addEventListener("click",async s=>{const i=s.currentTarget,c=da(fa(a.id),`#como-funciona=${a.id}`,location.origin),r=`¿Cómo funciona? ${a.titulo}. Míralo en movimiento:`,m=matchMedia("(pointer: coarse)").matches;if(navigator.share&&m){try{await navigator.share({title:`¿Cómo funciona? · ${a.titulo}`,text:r,url:c})}catch{}return}const k=i.querySelector("span");try{await navigator.clipboard.writeText(c),k.textContent="Enlace copiado"}catch{window.prompt("Copia el enlace:",c)}setTimeout(()=>{k.isConnected&&(k.textContent="Compartir")},2200)}),l.querySelectorAll(".cf-parts [data-part-n]").forEach(s=>{const i=()=>T(s.dataset.partN,!0);s.addEventListener("click",i),s.addEventListener("keydown",c=>{(c.key==="Enter"||c.key===" ")&&(c.preventDefault(),i())})});const L=l.querySelector("[data-ficha]");L&&L.querySelectorAll("[data-ficha-tab]").forEach(s=>{s.addEventListener("click",()=>{const i=s.dataset.fichaTab;L.querySelectorAll("[data-ficha-tab]").forEach(c=>{const r=c.dataset.fichaTab===i;c.classList.toggle("is-active",r),c.setAttribute("aria-selected",r?"true":"false")}),L.querySelectorAll("[data-ficha-panel]").forEach(c=>{const r=c.dataset.fichaPanel===i;c.classList.toggle("is-active",r),c.hidden=!r})})}),l.querySelectorAll("[data-law]").forEach(s=>s.addEventListener("click",()=>{var c;const i=((c=h.find(r=>{var m;return String((m=r.law)==null?void 0:m.id)===s.dataset.law}))==null?void 0:c.law)||n.find(r=>String(r.id)===s.dataset.law);i&&I(i)})),l.querySelectorAll(".cf-q").forEach(s=>{const i=a.preguntas[Number(s.dataset.q)];s.addEventListener("click",c=>{const r=c.target.closest(".cf-opt");if(!r)return;const m=Number(r.dataset.opt)===i.correcta;s.querySelectorAll(".cf-opt").forEach(k=>{k.classList.toggle("is-right",Number(k.dataset.opt)===i.correcta&&m),k.classList.toggle("is-wrong",k===r&&!m)}),s.querySelector(".cf-verdict").textContent=m?"¡Correcto!":"Casi. Revisa «En palabras simples» y vuelve a intentar."})})}function B(a){if(!A)return;const n=a?N[a]:null;if(a&&!n){X("#como-funciona"),P();return}n?sa(n):P()}return B(K),{show:B,destroy(){A=!1,window.removeEventListener("message",H),V.disconnect(),l.replaceChildren()}}}export{ba as renderComoFuncionaView};
