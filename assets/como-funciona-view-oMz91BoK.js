import{O as M,Q as j,S as ia,m as ca,U as oa,V as W,W as ra,X as la,Y as na,Z as J,M as da,$ as fa,a0 as ua}from"./index-71XzqzT4.js";import{l as q}from"./cne-shared-DMDPvk_7.js";const a=r=>String(r??"").replace(/[&<>"']/g,y=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[y]),L=()=>document.documentElement.classList.contains("dark-mode"),Z=r=>`/conceptos/${r}${L()?"":"-light"}.html`,Y=r=>`/conceptos/miniaturas/${r}${L()?"":"-light"}.webp`,K="cf-vistos";function O(){try{return new Set(JSON.parse(localStorage.getItem(K)||"[]"))}catch{return new Set}}function pa(r){try{const y=O();y.add(r),localStorage.setItem(K,JSON.stringify([...y]))}catch{}}const ha={electricidad:{2:"Subestación, inversor y cómo se equilibra la red.",3:"Eólica, hidroeléctrica, geotérmica y nuclear."}};function ga(r,y,{id:X=null,onOpenLaw:A,onRoute:aa}){let I=!0,C=null;function T(e,n=!1){var p,S;if(!C)return;const u=Number(e)-1,i=(p=C.partes)==null?void 0:p[u];r.querySelectorAll(".cf-parts [data-part-n]").forEach(h=>{const t=Number(h.dataset.partN)===Number(e);h.classList.toggle("is-selected",t),h.setAttribute("aria-pressed",t?"true":"false")});const d=r.querySelector("#cf-active-part");if(d&&!i?(d.hidden=!0,d.innerHTML=""):d&&(d.hidden=!1,d.innerHTML=`
                <div class="cf-part-banner-head">
                    <span class="cf-num" aria-hidden="true">${u+1}</span>
                    <strong>${a(i.nombre)}</strong>
                    <a class="cf-part-banner-jump" href="#cf-part-card-${u+1}">Ver en listado ↓</a>
                </div>
                <p>${a(i.texto)}</p>`),n){const h=r.querySelector("iframe[data-concepto]");(S=h==null?void 0:h.contentWindow)==null||S.postMessage({type:"concepto-select-part",n:Number(e)},location.origin)}}const H=e=>{var n,u;if(e.origin===location.origin)if(((n=e.data)==null?void 0:n.type)==="concepto-height"){const i=r.querySelector(`iframe[data-concepto="${CSS.escape(e.data.id||"")}"]`)||r.querySelector(`iframe[data-figura="${CSS.escape(e.data.id||"")}"]`)||r.querySelector("iframe[data-concepto]");i&&Number.isFinite(e.data.h)&&(i.style.height=`${Math.ceil(e.data.h)}px`)}else((u=e.data)==null?void 0:u.type)==="concepto-part"&&T(e.data.n,!1)};window.addEventListener("message",H);let R=L();const V=new MutationObserver(()=>{var u;if(L()===R)return;R=L(),r.querySelectorAll("img[data-thumb]").forEach(i=>{i.src=Y(i.dataset.thumb)});const e=r.querySelector("iframe[data-concepto]");if(!e||!C)return;const n=Number((u=r.querySelector(".cf-parts [data-part-n].is-selected"))==null?void 0:u.dataset.partN)||0;n&&e.addEventListener("load",()=>{var i;return(i=e.contentWindow)==null?void 0:i.postMessage({type:"concepto-select-part",n},location.origin)},{once:!0}),e.src=Z(C.figura)});V.observe(document.documentElement,{attributes:!0,attributeFilter:["class"]});const x={electricidad:'<svg class="cf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4.5 13.5h6L9.5 22l9-12h-6.5Z"/></svg>',hidrocarburos:'<svg class="cf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5c-3.2 4.3-6.5 8.2-6.5 11.5a6.5 6.5 0 0 0 13 0c0-3.3-3.3-7.2-6.5-11.5Z"/><path d="M12 18.5a4 4 0 0 0 4-4"/></svg>',check:'<svg class="cf-icon cf-check-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg>'};let g="electricidad";function ea(e,n){const u=j.filter(S=>S.sector===e.sector),i=u.indexOf(e)+1,w=e.sector==="hidrocarburos",d=J[e.id],p=w?`<span class="cf-badge-sector cf-badge-hidro">${x.hidrocarburos} Hidrocarburos</span>`:`<span class="cf-badge-sector cf-badge-elec">${x.electricidad} Electricidad</span>`;return`
            <a class="cf-card${n?" is-done":""}" href="#como-funciona=${a(e.id)}">
                <span class="cf-card-thumb"><img data-thumb="${a(e.figura)}" src="${Y(e.figura)}" alt="" loading="lazy" decoding="async"></span>
                <div class="cf-card-top">
                    <span class="cf-card-sector">${n?`<span class="cf-check">${x.check}</span> Paso ${i} · Visto`:`Paso ${i} de ${u.length}`}</span>
                    ${p}
                </div>
                <strong>${a(e.titulo)}</strong>
                ${d!=null&&d.eslabon?`<span class="cf-card-eslabon">${a(d.eslabon)}</span>`:""}
                <span class="cf-card-text">${a(e.resumen)}</span>
                <span class="cf-card-go">${n?"Volver a ver →":"Explorar paso →"}</span>
            </a>`}function sa(){const e=j.filter(i=>i.sector===g),n=e.filter(i=>E.has(i.id)).length,u=g==="hidrocarburos"?"de hidrocarburos":"de electricidad";return n?`Llevas ${n} de ${e.length} conceptos ${u}. Sigue el hilo conductor en orden o salta al eslabón que te interese.`:"Sigue el hilo conductor desde el Paso 1 hasta la regulación y el mercado, o salta directo al eslabón que necesites."}let E=O();function P(){C=null,E=O();const e=typeof y=="function"?y()||[]:y,n=j.filter(t=>t.sector==="electricidad").length,u=j.filter(t=>t.sector==="hidrocarburos").length,i=j.filter(t=>t.sector===g),w=ia.filter(t=>t.sector==="ambos"||t.sector===g),d=oa[g],p=i.find(t=>!E.has(t.id))||i[0],S=i.indexOf(p)+1,h=i.filter(t=>E.has(t.id)).length;r.innerHTML=`
            <section class="cf-view" aria-labelledby="cf-title">
                <header class="cf-head" data-emblem-host>
                    ${ca("como-funciona")}
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
                            <span class="cf-tab-count">${u} conceptos</span>
                        </button>
                    </div>
                </header>

                ${d?`
                <section class="cf-thread-map" aria-label="Hilo conductor de la cadena de valor">
                    <div class="cf-thread-top">
                        <div>
                            <p class="cf-kicker">El hilo conductor · Cadena de valor de principio a fin</p>
                            <h2 class="cf-thread-title">${a(d.subtitulo)}</h2>
                            <p class="cf-thread-desc">${a(d.resumen)}</p>
                        </div>
                        ${p?`
                        <a class="cf-thread-cta" href="#como-funciona=${a(p.id)}">
                            <span>${h>0&&h<i.length?`Continuar (${h}/${i.length} vistos)`:"Recorrido guiado"}</span>
                            <strong>Paso ${S}: ${a(p.titulo)} →</strong>
                        </a>`:""}
                    </div>
                    <ol class="cf-thread-stages">
                        ${d.etapas.map(t=>`
                            <li class="cf-thread-stage">
                                <div class="cf-stage-head">
                                    <span class="cf-stage-num">Eslabón ${a(t.num)}</span>
                                    <strong>${a(t.titulo)}</strong>
                                </div>
                                <p>${a(t.desc)}</p>
                                <div class="cf-stage-pills">
                                    ${t.ids.map(f=>{const $=M[f];if(!$)return"";const b=i.indexOf($)+1,m=E.has(f);return`<a class="cf-stage-pill${m?" is-done":""}" href="#como-funciona=${a(f)}"><span class="cf-pill-num">${m?"✓":b}</span><span>${a($.titulo)}</span></a>`}).join("")}
                                </div>
                            </li>`).join("")}
                    </ol>
                </section>`:""}

                <p class="cf-progress">${sa()}</p>
                <div class="cf-progress-bar" role="img" aria-label="${h} de ${i.length} conceptos vistos">${i.map(t=>`<span${E.has(t.id)?' class="is-done"':""}></span>`).join("")}</div>
                <ol class="cf-route">${W.map(t=>{var b;const f=i.filter(m=>m.nivel===t.id),$=(b=ha[g])==null?void 0:b[t.id];return!f.length&&!$?"":`
                    <li class="cf-level" aria-labelledby="cf-nivel-${t.id}">
                        <div class="cf-level-head">
                            <span class="cf-level-num" aria-hidden="true">${t.id}</span>
                            <div><h2 id="cf-nivel-${t.id}">Nivel ${t.id} · ${a(t.titulo)}</h2><p>${a(t.texto)}</p></div>
                        </div>
                        <div class="cf-grid">
                            ${f.map(m=>ea(m,E.has(m.id))).join("")}
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
                        ${ra.map(t=>`
                            <article class="cf-eje-card">
                                <h3>${a(t.titulo)}</h3>
                                <p>${a(t.texto)}</p>
                                <div class="cf-eje-tags">
                                    ${(t.siglas||[]).map(f=>{const $=q(e,f);return $?`<button type="button" class="cf-chip-law" data-open-siglas="${a(f)}" title="${a($.titulo)}">${a(f)}</button>`:`<span class="cf-chip-law">${a(f)}</span>`}).join("")}
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
                        ${w.map(t=>{const f=t.conceptoId?M[t.conceptoId]:null,$=(f==null?void 0:f.nivel)===4?"Ver esquema interactivo →":"Ver anatomía 3D →";return`
                            <article class="cf-glosario-card">
                                <div class="cf-glosario-head">
                                    <div class="cf-eje-tags">
                                        ${(Array.isArray(t.siglas)?t.siglas:[t.siglas]).map(b=>{const m=q(e,b);return m?`<button type="button" class="cf-chip-law" data-open-siglas="${a(b)}" title="${a(m.titulo)}">${a(b)}</button>`:`<span class="cf-chip-law">${a(b)}</span>`}).join("")}
                                    </div>
                                    ${t.conceptoId?`<a class="cf-glosario-link" href="#como-funciona=${a(t.conceptoId)}">${$}</a>`:""}
                                </div>
                                <h3>${a(t.termino)}</h3>
                                <p>${a(t.definicion)}</p>
                                <span class="cf-glosario-fund">${a(t.articulos)}</span>
                            </article>`}).join("")}
                    </div>
                </section>
            </section>`,r.querySelectorAll(".cf-sector-tab").forEach(t=>{t.addEventListener("click",()=>{g=t.dataset.sector,P()})}),r.querySelectorAll("[data-open-siglas]").forEach(t=>{t.addEventListener("click",()=>{const f=q(e,t.dataset.openSiglas);f&&A(f)})})}function ta(e){var U,F,D,_,G,z,Q;C=e,e.sector&&(g=e.sector);const n=typeof y=="function"?y()||[]:y;pa(e.id),E=O();const u=j.filter(s=>s.sector===e.sector),i=u.indexOf(e)+1,w=la(e.id),d=na(e.id),p=J[e.id],S=(e.antes||[]).map(s=>M[s]).filter(Boolean),h=(((U=e.ley)==null?void 0:U.siglas)||[]).map(s=>({siglas:s,law:q(n,s)})),t=e.tramites.map(da).filter(Boolean),f=e.sector==="hidrocarburos"?"Mercado de Hidrocarburos":"Mercado Eléctrico",$=e.sector==="hidrocarburos"?x.hidrocarburos:x.electricidad,b=(F=e.ley)==null?void 0:F.ficha,m=e.nivel===4;r.innerHTML=`
            <article class="cf-view cf-concept" aria-labelledby="cf-title">
                <div class="cf-top-nav">
                    <a class="cf-back" href="#como-funciona">← Volver a la ruta de ${f}</a>
                    <nav class="cf-route-bar" aria-label="Progreso en la ruta de ${f}">
                        <div class="cf-route-bar-meta">
                            ${w?`<a class="cf-route-arrow" href="#como-funciona=${a(w.id)}" aria-label="Paso anterior: ${a(w.titulo)}">←</a>`:'<span class="cf-route-arrow" aria-hidden="true"></span>'}
                            <span class="cf-route-where"><span class="cf-route-step-count">Paso ${i} de ${u.length}</span>${p!=null&&p.eslabon?`<span class="cf-route-eslabon">${a(p.eslabon)}</span>`:""}</span>
                            ${d?`<a class="cf-route-arrow" href="#como-funciona=${a(d.id)}" aria-label="Paso siguiente: ${a(d.titulo)}">→</a>`:'<span class="cf-route-arrow" aria-hidden="true"></span>'}
                        </div>
                        <ol class="cf-route-dots cf-route-segments">
                            ${u.map((s,c)=>{const o=c+1,l=s.id===e.id,v=E.has(s.id);return`<li><a class="cf-route-dot${l?" is-current":""}${v?" is-done":""}" href="#como-funciona=${a(s.id)}" title="Paso ${o}: ${a(s.titulo)}" aria-current="${l?"step":"false"}"><span class="cf-dot-num">${o}</span><span class="cf-dot-label">${a(s.titulo)}</span></a></li>`}).join("")}
                        </ol>
                    </nav>
                </div>
                <header class="cf-head">
                    <p class="cf-kicker"><span class="cf-kicker-icon">${$}</span> ${f} · Nivel ${e.nivel}: ${a((D=W.find(s=>s.id===e.nivel))==null?void 0:D.titulo)}</p>
                    <h1 id="cf-title">${a(e.titulo)}</h1>
                    <p class="cf-intro">${a(e.resumen)}</p>
                    <button type="button" class="cf-share" data-share><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Compartir</span></button>
                </header>
                <div class="cf-figure">
                    <iframe data-concepto="${a(e.id)}" src="${Z(e.figura)}" title="Ilustración interactiva: ${a(e.titulo)}" loading="lazy" scrolling="no"></iframe>
                </div>
                ${S.length?`<p class="cf-before">Para entenderlo mejor, antes mira: ${S.map(s=>`<a href="#como-funciona=${a(s.id)}">${a(s.titulo)}</a>`).join(", ")}.</p>`:""}
                <div id="cf-active-part" class="cf-part-banner" aria-live="polite" hidden></div>
                ${(_=e.definiciones)!=null&&_.length?`<section class="cf-section" aria-labelledby="cf-defs">
                    <h2 id="cf-defs">${e.definiciones.length>1?"Definiciones":"Definición"}</h2>
                    <dl class="cf-defs">${e.definiciones.map(s=>`<div><dt>${a(s.termino)}${s.unidad?` <span class="cf-unit">${a(s.unidad)}</span>`:""}</dt><dd>${a(s.texto)}</dd></div>`).join("")}</dl>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-claves">
                    <h2 id="cf-claves">En palabras simples</h2>
                    <ol class="cf-steps">${e.claves.map(s=>`<li>${a(s)}</li>`).join("")}</ol>
                </section>
                ${(G=e.formulas)!=null&&G.length?`<section class="cf-section" aria-labelledby="cf-formulas">
                    <h2 id="cf-formulas">${e.formulas.length>1?"Las fórmulas":"La fórmula"}</h2>
                    <div class="cf-formulas">${e.formulas.map(s=>`<div class="cf-formula">
                        <p class="cf-expr">${a(s.expresion)}</p>
                        <p class="cf-reading">${a(s.lectura)}</p>
                        ${s.ejemplo?`<p class="cf-example"><b>Ejemplo:</b> ${a(s.ejemplo)}</p>`:""}
                    </div>`).join("")}</div>
                </section>`:""}
                ${(z=e.errores)!=null&&z.length?`<section class="cf-section" aria-labelledby="cf-errores">
                    <h2 id="cf-errores">Ideas equivocadas comunes</h2>
                    <ul class="cf-myths">${e.errores.map(s=>`<li><p class="cf-myth"><span aria-hidden="true">✗</span><span class="cf-sr">Idea equivocada: </span>${a(s.idea)}</p><p class="cf-fact"><span aria-hidden="true">✓</span><span class="cf-sr">En realidad: </span>${a(s.realidad)}</p></li>`).join("")}</ul>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-partes">
                    <div class="cf-parts-header">
                        <h2 id="cf-partes">${e.partesTitulo?a(e.partesTitulo):"Sus partes"}</h2>
                        <span class="cf-parts-hint">Haz clic en un número en ${m?"el diagrama interactivo":"la figura 3D"} o en las tarjetas para resaltar cada parte</span>
                    </div>
                    <dl class="cf-parts">${e.partes.map((s,c)=>`<div id="cf-part-card-${c+1}" data-part-n="${c+1}" role="button" tabindex="0" aria-pressed="false"><dt><span class="cf-num" aria-hidden="true">${c+1}</span>${a(s.nombre)}</dt><dd>${a(s.texto)}</dd></div>`).join("")}</dl>
                </section>
                ${e.dato?`<aside class="cf-fun" aria-label="¿Sabías que…?"><b>¿Sabías que…?</b> ${a(e.dato)}</aside>`:""}
                ${e.ley?`<section class="cf-section" aria-labelledby="cf-ley">
                    <h2 id="cf-ley">Qué dice la ley</h2>
                    ${p?`
                    <div class="cf-bridge-box" aria-label="Puente entre realidad física y regulación">
                        <div class="cf-bridge-col">
                            <span class="cf-bridge-tag">Hecho físico y operativo</span>
                            <p>${a(p.fisica)}</p>
                        </div>
                        <div class="cf-bridge-arrow" aria-hidden="true">→</div>
                        <div class="cf-bridge-col cf-bridge-col-law">
                            <span class="cf-bridge-tag">Consecuencia regulatoria</span>
                            <p>${a(p.regulacion)}</p>
                        </div>
                    </div>`:""}
                    <p>${a(e.ley.texto)}</p>
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
                                ${(b.articulos||[]).map(s=>{var o;const c=((o=h.find(l=>l.siglas===s.siglas))==null?void 0:o.law)||q(n,s.siglas);return`<li class="cf-art-item">
                                        <div class="cf-art-top">
                                            ${c?`<button type="button" class="cf-chip-law" data-law="${a(c.id)}">${a(s.siglas)}</button>`:`<span class="cf-chip-law">${a(s.siglas)}</span>`}
                                            <strong class="cf-art-ref">${a(s.refs)}</strong>
                                        </div>
                                        <p class="cf-art-desc">${a(s.nota)}</p>
                                    </li>`}).join("")}
                            </ul>
                        </div>
                    </div>`:""}
                    <div class="cf-links">${h.map(({siglas:s,law:c})=>c?`<button type="button" class="cf-law" data-law="${a(c.id)}"><b>${a(c.siglas||s)}</b><span>${a(c.titulo)}</span></button>`:"").join("")}</div>
                </section>`:""}
                ${t.length||e.mapa?`<section class="cf-section" aria-labelledby="cf-permisos">
                    <h2 id="cf-permisos">Permisos y trámites</h2>
                    <div class="cf-links">
                        ${t.map(s=>`<a class="cf-link" href="#tramite=${a(s.id)}"><b>Guía de trámite</b><span>${a(s.title)}</span></a>`).join("")}
                        ${e.mapa?`<a class="cf-link" href="${a(e.mapa.hash)}"><b>Mapa</b><span>${a(e.mapa.texto)}</span></a>`:""}
                    </div>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-prueba">
                    <h2 id="cf-prueba">Ponte a prueba</h2>
                    <div class="cf-quiz">${e.preguntas.map((s,c)=>`
                        <fieldset class="cf-q" data-q="${c}">
                            <legend>${a(s.pregunta)}</legend>
                            ${s.opciones.map((o,l)=>`<button type="button" class="cf-opt" data-opt="${l}">${a(o)}</button>`).join("")}
                            <p class="cf-verdict" aria-live="polite"></p>
                        </fieldset>`).join("")}</div>
                </section>
                <div class="cf-journey-footer">
                    ${p!=null&&p.transicion?`
                    <div class="cf-transition-box">
                        <span class="cf-transition-kicker">Hilo conductor · ¿Cómo conecta con el siguiente paso?</span>
                        <p>${a(p.transicion)}</p>
                    </div>`:""}
                    <div class="cf-nav-pair">
                        ${w?`<a class="cf-prev" href="#como-funciona=${a(w.id)}"><span>← Paso ${i-1} (Anterior)</span><strong>${a(w.titulo)}</strong></a>`:""}
                        ${d?`<a class="cf-next" href="#como-funciona=${a(d.id)}"><span>Siguiente en la ruta (Paso ${i+1} de ${u.length})</span><strong>${a(d.titulo)} →</strong></a>`:'<a class="cf-next" href="#como-funciona"><span>Llegaste al final de la ruta por ahora</span><strong>Ver la ruta completa →</strong></a>'}
                    </div>
                </div>
                <section class="cf-sources" aria-labelledby="cf-fuentes">
                    <h2 id="cf-fuentes">Fuentes</h2>
                    <ol class="cf-refs">${e.fuentes.map(s=>{var l;const c=s.acervo?(l=h.find(v=>v.siglas===s.acervo))==null?void 0:l.law:null,o=s.url?`<a href="${a(s.url)}" target="_blank" rel="noopener"><i>${a(s.titulo)}</i></a>`:`<i>${a(s.titulo)}</i>`;return`<li>${a(s.autor)}${s.url?` (${a(s.fecha)}). ${o}${/[?!.]$/.test(s.titulo)?"":"."}${s.editorial?` ${a(s.editorial)}.`:""}`:`. ${o}, ${a(s.fecha)}.`}${s.consulta?` Consultado el ${a(s.consulta)}.`:""}${c?` <button type="button" class="cf-ref-law" data-law="${a(c.id)}">Ver en el acervo</button>`:""}</li>`}).join("")}</ol>
                    <p class="cf-note">Explicación general con fines informativos; no es texto legal ni sustituye la normativa. ${e.revisado?`Revisado el ${a(e.revisado)}.`:'<span class="cf-draft">Borrador en revisión.</span>'}</p>
                </section>
            </article>`,(Q=r.querySelector("[data-share]"))==null||Q.addEventListener("click",async s=>{const c=s.currentTarget,o=fa(ua(e.id),`#como-funciona=${e.id}`,location.origin),l=`¿Cómo funciona? ${e.titulo}. Míralo en movimiento:`,v=matchMedia("(pointer: coarse)").matches;if(navigator.share&&v){try{await navigator.share({title:`¿Cómo funciona? · ${e.titulo}`,text:l,url:o})}catch{}return}const k=c.querySelector("span");try{await navigator.clipboard.writeText(o),k.textContent="Enlace copiado"}catch{window.prompt("Copia el enlace:",o)}setTimeout(()=>{k.isConnected&&(k.textContent="Compartir")},2200)}),r.querySelectorAll(".cf-parts [data-part-n]").forEach(s=>{const c=()=>T(s.dataset.partN,!0);s.addEventListener("click",c),s.addEventListener("keydown",o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),c())})});const N=r.querySelector("[data-ficha]");N&&N.querySelectorAll("[data-ficha-tab]").forEach(s=>{s.addEventListener("click",()=>{const c=s.dataset.fichaTab;N.querySelectorAll("[data-ficha-tab]").forEach(o=>{const l=o.dataset.fichaTab===c;o.classList.toggle("is-active",l),o.setAttribute("aria-selected",l?"true":"false")}),N.querySelectorAll("[data-ficha-panel]").forEach(o=>{const l=o.dataset.fichaPanel===c;o.classList.toggle("is-active",l),o.hidden=!l})})}),r.querySelectorAll("[data-law]").forEach(s=>s.addEventListener("click",()=>{var o;const c=((o=h.find(l=>{var v;return String((v=l.law)==null?void 0:v.id)===s.dataset.law}))==null?void 0:o.law)||n.find(l=>String(l.id)===s.dataset.law);c&&A(c)})),r.querySelectorAll(".cf-q").forEach(s=>{const c=e.preguntas[Number(s.dataset.q)];s.addEventListener("click",o=>{const l=o.target.closest(".cf-opt");if(!l)return;const v=Number(l.dataset.opt)===c.correcta;s.querySelectorAll(".cf-opt").forEach(k=>{k.classList.toggle("is-right",Number(k.dataset.opt)===c.correcta&&v),k.classList.toggle("is-wrong",k===l&&!v)}),s.querySelector(".cf-verdict").textContent=v?"¡Correcto!":"Casi. Revisa «En palabras simples» y vuelve a intentar."})})}function B(e){if(!I)return;const n=e?M[e]:null;if(e&&!n){aa("#como-funciona"),P();return}n?ta(n):P()}return B(X),{show:B,destroy(){I=!1,window.removeEventListener("message",H),V.disconnect(),r.replaceChildren()}}}export{ga as renderComoFuncionaView};
