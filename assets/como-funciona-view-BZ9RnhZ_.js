import{O as N,Q as C,S as X,m as aa,U as sa,V as G,W as ea,X as ta,Y as ia,Z as Q,M as ca,$ as oa,a0 as ra}from"./index-DG3nroan.js";import{l as j}from"./cne-shared-DMDPvk_7.js";const a=l=>String(l??"").replace(/[&<>"']/g,y=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[y]),la=()=>document.documentElement.classList.contains("dark-mode"),na=l=>`/conceptos/${l}${la()?"":"-light"}.html`,z="cf-vistos";function M(){try{return new Set(JSON.parse(localStorage.getItem(z)||"[]"))}catch{return new Set}}function da(l){try{const y=M();y.add(l),localStorage.setItem(z,JSON.stringify([...y]))}catch{}}const fa={electricidad:{2:"Subestación, inversor y cómo se equilibra la red.",3:"Eólica, hidroeléctrica, geotérmica y nuclear."}};function ha(l,y,{id:J=null,onOpenLaw:P,onRoute:Z}){let I=!0,q=null;function A(s,d=!1){var f,E;if(!q)return;const p=Number(s)-1,o=(f=q.partes)==null?void 0:f[p];l.querySelectorAll(".cf-parts [data-part-n]").forEach(h=>{const t=Number(h.dataset.partN)===Number(s);h.classList.toggle("is-selected",t),h.setAttribute("aria-pressed",t?"true":"false")});const u=l.querySelector("#cf-active-part");if(u&&!o?(u.hidden=!0,u.innerHTML=""):u&&(u.hidden=!1,u.innerHTML=`
                <div class="cf-part-banner-head">
                    <span class="cf-num" aria-hidden="true">${p+1}</span>
                    <strong>${a(o.nombre)}</strong>
                    <a class="cf-part-banner-jump" href="#cf-part-card-${p+1}">Ver en listado ↓</a>
                </div>
                <p>${a(o.texto)}</p>`),d){const h=l.querySelector("iframe[data-concepto]");(E=h==null?void 0:h.contentWindow)==null||E.postMessage({type:"concepto-select-part",n:Number(s)},location.origin)}}const T=s=>{var d,p;if(s.origin===location.origin)if(((d=s.data)==null?void 0:d.type)==="concepto-height"){const o=l.querySelector(`iframe[data-concepto="${CSS.escape(s.data.id||"")}"]`)||l.querySelector(`iframe[data-figura="${CSS.escape(s.data.id||"")}"]`)||l.querySelector("iframe[data-concepto]");o&&Number.isFinite(s.data.h)&&(o.style.height=`${Math.ceil(s.data.h)}px`)}else((p=s.data)==null?void 0:p.type)==="concepto-part"&&A(s.data.n,!1)};window.addEventListener("message",T);const x={electricidad:'<svg class="cf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4.5 13.5h6L9.5 22l9-12h-6.5Z"/></svg>',hidrocarburos:'<svg class="cf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5c-3.2 4.3-6.5 8.2-6.5 11.5a6.5 6.5 0 0 0 13 0c0-3.3-3.3-7.2-6.5-11.5Z"/><path d="M12 18.5a4 4 0 0 0 4-4"/></svg>',check:'<svg class="cf-icon cf-check-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg>'};let g="electricidad";function W(s,d){const p=C.filter(E=>E.sector===s.sector),o=p.indexOf(s)+1,w=s.sector==="hidrocarburos",u=Q[s.id],f=w?`<span class="cf-badge-sector cf-badge-hidro">${x.hidrocarburos} Hidrocarburos</span>`:`<span class="cf-badge-sector cf-badge-elec">${x.electricidad} Electricidad</span>`;return`
            <a class="cf-card${d?" is-done":""}" href="#como-funciona=${a(s.id)}">
                <div class="cf-card-top">
                    <span class="cf-card-sector">${d?`<span class="cf-check">${x.check}</span> Paso ${o} · Visto`:`Paso ${o} de ${p.length}`}</span>
                    ${f}
                </div>
                <strong>${a(s.titulo)}</strong>
                ${u!=null&&u.eslabon?`<span class="cf-card-eslabon">${a(u.eslabon)}</span>`:""}
                <span class="cf-card-text">${a(s.resumen)}</span>
                <span class="cf-card-go">${d?"Volver a ver →":"Explorar paso →"}</span>
            </a>`}function Y(){const s=C.filter(o=>o.sector===g),d=s.filter(o=>S.has(o.id)).length,p=g==="hidrocarburos"?"de hidrocarburos":"de electricidad";return d?`Llevas ${d} de ${s.length} conceptos ${p}. Sigue el hilo conductor en orden o salta al eslabón que te interese.`:"Sigue el hilo conductor desde el Paso 1 hasta la regulación y el mercado, o salta directo al eslabón que necesites."}let S=M();function O(){q=null,S=M();const s=typeof y=="function"?y()||[]:y,d=C.filter(t=>t.sector==="electricidad").length,p=C.filter(t=>t.sector==="hidrocarburos").length,o=C.filter(t=>t.sector===g),w=X.filter(t=>t.sector==="ambos"||t.sector===g),u=sa[g],f=o.find(t=>!S.has(t.id))||o[0],E=o.indexOf(f)+1,h=o.filter(t=>S.has(t.id)).length;l.innerHTML=`
            <section class="cf-view" aria-labelledby="cf-title">
                <header class="cf-head" data-emblem-host>
                    ${aa("como-funciona")}
                    <p class="cf-kicker">Explicaciones generales · interactivo con anatomía técnica y leyes</p>
                    <h1 id="cf-title">¿Cómo funciona el sector energético?</h1>
                    <p class="cf-intro">Aprende paso a paso cómo funcionan la electricidad y los hidrocarburos en México: desde las leyes físicas y las moléculas hasta las centrales, refinerías, ductos y el diseño del nuevo marco regulatorio (Reforma 2025).</p>
                    
                    <div class="cf-sectors-nav" role="group" aria-label="Elegir sector">
                        <button type="button" class="cf-sector-tab ${g==="electricidad"?"is-active":""}" data-sector="electricidad" aria-pressed="${g==="electricidad"}">
                            <span class="cf-tab-icon">${x.electricidad}</span>
                            <span class="cf-tab-text">Mercado Eléctrico (SEN / MEM)</span>
                            <span class="cf-tab-count">${d} conceptos</span>
                        </button>
                        <button type="button" class="cf-sector-tab ${g==="hidrocarburos"?"is-active":""}" data-sector="hidrocarburos" aria-pressed="${g==="hidrocarburos"}">
                            <span class="cf-tab-icon">${x.hidrocarburos}</span>
                            <span class="cf-tab-text">Mercado de Hidrocarburos</span>
                            <span class="cf-tab-count">${p} conceptos</span>
                        </button>
                    </div>
                </header>

                ${u?`
                <section class="cf-thread-map" aria-label="Hilo conductor de la cadena de valor">
                    <div class="cf-thread-top">
                        <div>
                            <p class="cf-kicker">El hilo conductor · Cadena de valor de principio a fin</p>
                            <h2 class="cf-thread-title">${a(u.subtitulo)}</h2>
                            <p class="cf-thread-desc">${a(u.resumen)}</p>
                        </div>
                        ${f?`
                        <a class="cf-thread-cta" href="#como-funciona=${a(f.id)}">
                            <span>${h>0&&h<o.length?`Continuar (${h}/${o.length} vistos)`:"Recorrido guiado"}</span>
                            <strong>Paso ${E}: ${a(f.titulo)} →</strong>
                        </a>`:""}
                    </div>
                    <ol class="cf-thread-stages">
                        ${u.etapas.map(t=>`
                            <li class="cf-thread-stage">
                                <div class="cf-stage-head">
                                    <span class="cf-stage-num">Eslabón ${a(t.num)}</span>
                                    <strong>${a(t.titulo)}</strong>
                                </div>
                                <p>${a(t.desc)}</p>
                                <div class="cf-stage-pills">
                                    ${t.ids.map(n=>{const $=N[n];if(!$)return"";const b=o.indexOf($)+1,v=S.has(n);return`<a class="cf-stage-pill${v?" is-done":""}" href="#como-funciona=${a(n)}"><span class="cf-pill-num">${v?"✓":b}</span><span>${a($.titulo)}</span></a>`}).join("")}
                                </div>
                            </li>`).join("")}
                    </ol>
                </section>`:""}

                <p class="cf-progress">${Y()}</p>
                <ol class="cf-route">${G.map(t=>{var b;const n=o.filter(v=>v.nivel===t.id),$=(b=fa[g])==null?void 0:b[t.id];return!n.length&&!$?"":`
                    <li class="cf-level" aria-labelledby="cf-nivel-${t.id}">
                        <div class="cf-level-head">
                            <span class="cf-level-num" aria-hidden="true">${t.id}</span>
                            <div><h2 id="cf-nivel-${t.id}">Nivel ${t.id} · ${a(t.titulo)}</h2><p>${a(t.texto)}</p></div>
                        </div>
                        <div class="cf-grid">
                            ${n.map(v=>W(v,S.has(v.id))).join("")}
                            ${$?`<div class="cf-card cf-soon" aria-hidden="true"><strong>Próximamente</strong><span class="cf-card-text">${a($)}</span></div>`:""}
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
                        ${ea.map(t=>`
                            <article class="cf-eje-card">
                                <h3>${a(t.titulo)}</h3>
                                <p>${a(t.texto)}</p>
                                <div class="cf-eje-tags">
                                    ${(t.siglas||[]).map(n=>{const $=j(s,n);return $?`<button type="button" class="cf-chip-law" data-open-siglas="${a(n)}" title="${a($.titulo)}">${a(n)}</button>`:`<span class="cf-chip-law">${a(n)}</span>`}).join("")}
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
                        ${w.map(t=>{const n=t.conceptoId?N[t.conceptoId]:null,$=(n==null?void 0:n.nivel)===4?"Ver esquema interactivo →":"Ver anatomía 3D →";return`
                            <article class="cf-glosario-card">
                                <div class="cf-glosario-head">
                                    <div class="cf-eje-tags">
                                        ${(Array.isArray(t.siglas)?t.siglas:[t.siglas]).map(b=>{const v=j(s,b);return v?`<button type="button" class="cf-chip-law" data-open-siglas="${a(b)}" title="${a(v.titulo)}">${a(b)}</button>`:`<span class="cf-chip-law">${a(b)}</span>`}).join("")}
                                    </div>
                                    ${t.conceptoId?`<a class="cf-glosario-link" href="#como-funciona=${a(t.conceptoId)}">${$}</a>`:""}
                                </div>
                                <h3>${a(t.termino)}</h3>
                                <p>${a(t.definicion)}</p>
                                <span class="cf-glosario-fund">${a(t.articulos)}</span>
                            </article>`}).join("")}
                    </div>
                </section>
            </section>`,l.querySelectorAll(".cf-sector-tab").forEach(t=>{t.addEventListener("click",()=>{g=t.dataset.sector,O()})}),l.querySelectorAll("[data-open-siglas]").forEach(t=>{t.addEventListener("click",()=>{const n=j(s,t.dataset.openSiglas);n&&P(n)})})}function K(s){var R,V,B,U,F,_,D;q=s,s.sector&&(g=s.sector);const d=typeof y=="function"?y()||[]:y;da(s.id),S=M();const p=C.filter(e=>e.sector===s.sector),o=p.indexOf(s)+1,w=ta(s.id),u=ia(s.id),f=Q[s.id],E=(s.antes||[]).map(e=>N[e]).filter(Boolean),h=(((R=s.ley)==null?void 0:R.siglas)||[]).map(e=>({siglas:e,law:j(d,e)})),t=s.tramites.map(ca).filter(Boolean),n=s.sector==="hidrocarburos"?"Mercado de Hidrocarburos":"Mercado Eléctrico",$=s.sector==="hidrocarburos"?x.hidrocarburos:x.electricidad,b=(V=s.ley)==null?void 0:V.ficha,v=s.nivel===4;l.innerHTML=`
            <article class="cf-view cf-concept" aria-labelledby="cf-title">
                <div class="cf-top-nav">
                    <a class="cf-back" href="#como-funciona">← Volver a la ruta de ${n}</a>
                    <nav class="cf-route-bar" aria-label="Progreso en la ruta de ${n}">
                        <div class="cf-route-bar-meta">
                            <span class="cf-route-step-count">Paso ${o} de ${p.length}</span>
                            ${f!=null&&f.eslabon?`<span class="cf-route-eslabon">${a(f.eslabon)}</span>`:""}
                        </div>
                        <ol class="cf-route-dots">
                            ${p.map((e,i)=>{const c=i+1,r=e.id===s.id,m=S.has(e.id);return`<li><a class="cf-route-dot${r?" is-current":""}${m?" is-done":""}" href="#como-funciona=${a(e.id)}" title="Paso ${c}: ${a(e.titulo)}" aria-current="${r?"step":"false"}"><span class="cf-dot-num">${c}</span><span class="cf-dot-label">${a(e.titulo)}</span></a></li>`}).join("")}
                        </ol>
                    </nav>
                </div>
                <header class="cf-head">
                    <p class="cf-kicker"><span class="cf-kicker-icon">${$}</span> ${n} · Nivel ${s.nivel}: ${a((B=G.find(e=>e.id===s.nivel))==null?void 0:B.titulo)}</p>
                    <h1 id="cf-title">${a(s.titulo)}</h1>
                    <p class="cf-intro">${a(s.resumen)}</p>
                    <button type="button" class="cf-share" data-share><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Compartir</span></button>
                </header>
                ${E.length?`<p class="cf-before">Para entenderlo mejor, antes mira: ${E.map(e=>`<a href="#como-funciona=${a(e.id)}">${a(e.titulo)}</a>`).join(", ")}.</p>`:""}
                <div class="cf-figure">
                    <iframe data-concepto="${a(s.id)}" src="${na(s.figura)}" title="Ilustración interactiva: ${a(s.titulo)}" loading="lazy"></iframe>
                </div>
                <div id="cf-active-part" class="cf-part-banner" aria-live="polite" hidden></div>
                ${(U=s.definiciones)!=null&&U.length?`<section class="cf-section" aria-labelledby="cf-defs">
                    <h2 id="cf-defs">${s.definiciones.length>1?"Definiciones":"Definición"}</h2>
                    <dl class="cf-defs">${s.definiciones.map(e=>`<div><dt>${a(e.termino)}${e.unidad?` <span class="cf-unit">${a(e.unidad)}</span>`:""}</dt><dd>${a(e.texto)}</dd></div>`).join("")}</dl>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-claves">
                    <h2 id="cf-claves">En palabras simples</h2>
                    <ol class="cf-steps">${s.claves.map(e=>`<li>${a(e)}</li>`).join("")}</ol>
                </section>
                ${(F=s.formulas)!=null&&F.length?`<section class="cf-section" aria-labelledby="cf-formulas">
                    <h2 id="cf-formulas">${s.formulas.length>1?"Las fórmulas":"La fórmula"}</h2>
                    <div class="cf-formulas">${s.formulas.map(e=>`<div class="cf-formula">
                        <p class="cf-expr">${a(e.expresion)}</p>
                        <p class="cf-reading">${a(e.lectura)}</p>
                        ${e.ejemplo?`<p class="cf-example"><b>Ejemplo:</b> ${a(e.ejemplo)}</p>`:""}
                    </div>`).join("")}</div>
                </section>`:""}
                ${(_=s.errores)!=null&&_.length?`<section class="cf-section" aria-labelledby="cf-errores">
                    <h2 id="cf-errores">Ideas equivocadas comunes</h2>
                    <ul class="cf-myths">${s.errores.map(e=>`<li><p class="cf-myth"><span aria-hidden="true">✗</span><span class="cf-sr">Idea equivocada: </span>${a(e.idea)}</p><p class="cf-fact"><span aria-hidden="true">✓</span><span class="cf-sr">En realidad: </span>${a(e.realidad)}</p></li>`).join("")}</ul>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-partes">
                    <div class="cf-parts-header">
                        <h2 id="cf-partes">${s.partesTitulo?a(s.partesTitulo):"Sus partes"}</h2>
                        <span class="cf-parts-hint">Haz clic en un número en ${v?"el diagrama interactivo":"la figura 3D"} o en las tarjetas para resaltar cada parte</span>
                    </div>
                    <dl class="cf-parts">${s.partes.map((e,i)=>`<div id="cf-part-card-${i+1}" data-part-n="${i+1}" role="button" tabindex="0" aria-pressed="false"><dt><span class="cf-num" aria-hidden="true">${i+1}</span>${a(e.nombre)}</dt><dd>${a(e.texto)}</dd></div>`).join("")}</dl>
                </section>
                ${s.dato?`<aside class="cf-fun" aria-label="¿Sabías que…?"><b>¿Sabías que…?</b> ${a(s.dato)}</aside>`:""}
                ${s.ley?`<section class="cf-section" aria-labelledby="cf-ley">
                    <h2 id="cf-ley">Qué dice la ley</h2>
                    ${f?`
                    <div class="cf-bridge-box" aria-label="Puente entre realidad física y regulación">
                        <div class="cf-bridge-col">
                            <span class="cf-bridge-tag">Hecho físico y operativo</span>
                            <p>${a(f.fisica)}</p>
                        </div>
                        <div class="cf-bridge-arrow" aria-hidden="true">→</div>
                        <div class="cf-bridge-col cf-bridge-col-law">
                            <span class="cf-bridge-tag">Consecuencia regulatoria</span>
                            <p>${a(f.regulacion)}</p>
                        </div>
                    </div>`:""}
                    <p>${a(s.ley.texto)}</p>
                    ${b?`
                    <div class="cf-ficha" data-ficha>
                        <div class="cf-ficha-tabs" role="tablist" aria-label="Ficha regulatoria y procedimental">
                            <button type="button" class="cf-ficha-tab is-active" role="tab" aria-selected="true" data-ficha-tab="que">1. El Qué (Concepto Técnico)</button>
                            <button type="button" class="cf-ficha-tab" role="tab" aria-selected="false" data-ficha-tab="como">2. El Cómo (Ruta Regulatoria)</button>
                            <button type="button" class="cf-ficha-tab" role="tab" aria-selected="false" data-ficha-tab="articulos">3. Fundamento Legal Vigente</button>
                        </div>
                        <div class="cf-ficha-panel is-active" role="tabpanel" data-ficha-panel="que">
                            <p>${a(b.elQue)}</p>
                        </div>
                        <div class="cf-ficha-panel" role="tabpanel" data-ficha-panel="como" hidden>
                            <p>${a(b.elComo)}</p>
                        </div>
                        <div class="cf-ficha-panel" role="tabpanel" data-ficha-panel="articulos" hidden>
                            <ul class="cf-art-list">
                                ${(b.articulos||[]).map(e=>{var c;const i=((c=h.find(r=>r.siglas===e.siglas))==null?void 0:c.law)||j(d,e.siglas);return`<li class="cf-art-item">
                                        <div class="cf-art-top">
                                            ${i?`<button type="button" class="cf-chip-law" data-law="${a(i.id)}">${a(e.siglas)}</button>`:`<span class="cf-chip-law">${a(e.siglas)}</span>`}
                                            <strong class="cf-art-ref">${a(e.refs)}</strong>
                                        </div>
                                        <p class="cf-art-desc">${a(e.nota)}</p>
                                    </li>`}).join("")}
                            </ul>
                        </div>
                    </div>`:""}
                    <div class="cf-links">${h.map(({siglas:e,law:i})=>i?`<button type="button" class="cf-law" data-law="${a(i.id)}"><b>${a(i.siglas||e)}</b><span>${a(i.titulo)}</span></button>`:"").join("")}</div>
                </section>`:""}
                ${t.length||s.mapa?`<section class="cf-section" aria-labelledby="cf-permisos">
                    <h2 id="cf-permisos">Permisos y trámites</h2>
                    <div class="cf-links">
                        ${t.map(e=>`<a class="cf-link" href="#tramite=${a(e.id)}"><b>Guía de trámite</b><span>${a(e.title)}</span></a>`).join("")}
                        ${s.mapa?`<a class="cf-link" href="${a(s.mapa.hash)}"><b>Mapa</b><span>${a(s.mapa.texto)}</span></a>`:""}
                    </div>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-prueba">
                    <h2 id="cf-prueba">Ponte a prueba</h2>
                    <div class="cf-quiz">${s.preguntas.map((e,i)=>`
                        <fieldset class="cf-q" data-q="${i}">
                            <legend>${a(e.pregunta)}</legend>
                            ${e.opciones.map((c,r)=>`<button type="button" class="cf-opt" data-opt="${r}">${a(c)}</button>`).join("")}
                            <p class="cf-verdict" aria-live="polite"></p>
                        </fieldset>`).join("")}</div>
                </section>
                <div class="cf-journey-footer">
                    ${f!=null&&f.transicion?`
                    <div class="cf-transition-box">
                        <span class="cf-transition-kicker">Hilo conductor · ¿Cómo conecta con el siguiente paso?</span>
                        <p>${a(f.transicion)}</p>
                    </div>`:""}
                    <div class="cf-nav-pair">
                        ${w?`<a class="cf-prev" href="#como-funciona=${a(w.id)}"><span>← Paso ${o-1} (Anterior)</span><strong>${a(w.titulo)}</strong></a>`:""}
                        ${u?`<a class="cf-next" href="#como-funciona=${a(u.id)}"><span>Siguiente en la ruta (Paso ${o+1} de ${p.length})</span><strong>${a(u.titulo)} →</strong></a>`:'<a class="cf-next" href="#como-funciona"><span>Llegaste al final de la ruta por ahora</span><strong>Ver la ruta completa →</strong></a>'}
                    </div>
                </div>
                <section class="cf-sources" aria-labelledby="cf-fuentes">
                    <h2 id="cf-fuentes">Fuentes</h2>
                    <ol class="cf-refs">${s.fuentes.map(e=>{var r;const i=e.acervo?(r=h.find(m=>m.siglas===e.acervo))==null?void 0:r.law:null,c=e.url?`<a href="${a(e.url)}" target="_blank" rel="noopener"><i>${a(e.titulo)}</i></a>`:`<i>${a(e.titulo)}</i>`;return`<li>${a(e.autor)}${e.url?` (${a(e.fecha)}). ${c}${/[?!.]$/.test(e.titulo)?"":"."}${e.editorial?` ${a(e.editorial)}.`:""}`:`. ${c}, ${a(e.fecha)}.`}${e.consulta?` Consultado el ${a(e.consulta)}.`:""}${i?` <button type="button" class="cf-ref-law" data-law="${a(i.id)}">Ver en el acervo</button>`:""}</li>`}).join("")}</ol>
                    <p class="cf-note">Explicación general con fines informativos; no es texto legal ni sustituye la normativa. ${s.revisado?`Revisado el ${a(s.revisado)}.`:'<span class="cf-draft">Borrador en revisión.</span>'}</p>
                </section>
            </article>`,(D=l.querySelector("[data-share]"))==null||D.addEventListener("click",async e=>{const i=e.currentTarget,c=oa(ra(s.id),`#como-funciona=${s.id}`,location.origin),r=`¿Cómo funciona? ${s.titulo}. Míralo en movimiento:`,m=matchMedia("(pointer: coarse)").matches;if(navigator.share&&m){try{await navigator.share({title:`¿Cómo funciona? · ${s.titulo}`,text:r,url:c})}catch{}return}const k=i.querySelector("span");try{await navigator.clipboard.writeText(c),k.textContent="Enlace copiado"}catch{window.prompt("Copia el enlace:",c)}setTimeout(()=>{k.isConnected&&(k.textContent="Compartir")},2200)}),l.querySelectorAll(".cf-parts [data-part-n]").forEach(e=>{const i=()=>A(e.dataset.partN,!0);e.addEventListener("click",i),e.addEventListener("keydown",c=>{(c.key==="Enter"||c.key===" ")&&(c.preventDefault(),i())})});const L=l.querySelector("[data-ficha]");L&&L.querySelectorAll("[data-ficha-tab]").forEach(e=>{e.addEventListener("click",()=>{const i=e.dataset.fichaTab;L.querySelectorAll("[data-ficha-tab]").forEach(c=>{const r=c.dataset.fichaTab===i;c.classList.toggle("is-active",r),c.setAttribute("aria-selected",r?"true":"false")}),L.querySelectorAll("[data-ficha-panel]").forEach(c=>{const r=c.dataset.fichaPanel===i;c.classList.toggle("is-active",r),c.hidden=!r})})}),l.querySelectorAll("[data-law]").forEach(e=>e.addEventListener("click",()=>{var c;const i=((c=h.find(r=>{var m;return String((m=r.law)==null?void 0:m.id)===e.dataset.law}))==null?void 0:c.law)||d.find(r=>String(r.id)===e.dataset.law);i&&P(i)})),l.querySelectorAll(".cf-q").forEach(e=>{const i=s.preguntas[Number(e.dataset.q)];e.addEventListener("click",c=>{const r=c.target.closest(".cf-opt");if(!r)return;const m=Number(r.dataset.opt)===i.correcta;e.querySelectorAll(".cf-opt").forEach(k=>{k.classList.toggle("is-right",Number(k.dataset.opt)===i.correcta&&m),k.classList.toggle("is-wrong",k===r&&!m)}),e.querySelector(".cf-verdict").textContent=m?"¡Correcto!":"Casi. Revisa «En palabras simples» y vuelve a intentar."})})}function H(s){if(!I)return;const d=s?N[s]:null;if(s&&!d){Z("#como-funciona"),O();return}d?K(d):O()}return H(J),{show:H,destroy(){I=!1,window.removeEventListener("message",T),l.replaceChildren()}}}export{ha as renderComoFuncionaView};
