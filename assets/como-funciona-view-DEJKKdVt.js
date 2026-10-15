import{J as B,K as v,N as O,L as F,H as J}from"./index-BfK9Bgg1.js";import{l as K}from"./cne-shared-BdjQaSa0.js";const s=o=>String(o??"").replace(/[&<>"']/g,u=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[u]),R=()=>document.documentElement.classList.contains("dark-mode"),Z=o=>`/conceptos/${o}${R()?"":"-light"}.html`,T="cf-vistos";function k(){try{return new Set(JSON.parse(localStorage.getItem(T)||"[]"))}catch{return new Set}}function _(o){try{const u=k();u.add(o),localStorage.setItem(T,JSON.stringify([...u]))}catch{}}const G={electricidad:{2:"Subestación, inversor y cómo se equilibra la red.",3:"Eólica, hidroeléctrica, ciclo combinado, geotérmica y nuclear."}};function Y(o,u,{id:H=null,onOpenLaw:V,onRoute:I}){let C=!0;const x=a=>{var n;if(a.origin!==location.origin||((n=a.data)==null?void 0:n.type)!=="concepto-height")return;const r=o.querySelector(`iframe[data-concepto="${CSS.escape(a.data.id)}"]`);r&&Number.isFinite(a.data.h)&&(r.style.height=`${Math.ceil(a.data.h)}px`)};window.addEventListener("message",x);const $={electricidad:'<svg class="cf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4.5 13.5h6L9.5 22l9-12h-6.5Z"/></svg>',hidrocarburos:'<svg class="cf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5c-3.2 4.3-6.5 8.2-6.5 11.5a6.5 6.5 0 0 0 13 0c0-3.3-3.3-7.2-6.5-11.5Z"/><path d="M12 18.5a4 4 0 0 0 4-4"/></svg>',check:'<svg class="cf-icon cf-check-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg>'};let d="electricidad";function P(a,r){const t=v.filter(b=>b.sector===a.sector).indexOf(a)+1,p=a.sector==="hidrocarburos"?`<span class="cf-badge-sector cf-badge-hidro">${$.hidrocarburos} Hidrocarburos</span>`:`<span class="cf-badge-sector cf-badge-elec">${$.electricidad} Electricidad</span>`;return`
            <a class="cf-card${r?" is-done":""}" href="#como-funciona=${s(a.id)}">
                <div class="cf-card-top">
                    <span class="cf-card-sector">${r?`<span class="cf-check">${$.check}</span> Visto`:`Paso ${t}`}</span>
                    ${p}
                </div>
                <strong>${s(a.titulo)}</strong>
                <span class="cf-card-text">${s(a.resumen)}</span>
                <span class="cf-card-go">${r?"Volver a ver →":"Ver cómo funciona →"}</span>
            </a>`}function A(){const a=v.filter(t=>t.sector===d),r=a.filter(t=>y.has(t.id)).length,n=d==="hidrocarburos"?"de hidrocarburos":"de electricidad";return r?`Llevas ${r} de ${a.length} conceptos ${n}. Sigue la ruta en orden o salta a lo que te interese.`:"Empieza por lo básico y sube hasta las instalaciones y el mercado, o salta a lo que te interese."}let y=k();function w(){y=k();const a=v.filter(t=>t.sector==="electricidad").length,r=v.filter(t=>t.sector==="hidrocarburos").length,n=v.filter(t=>t.sector===d);o.innerHTML=`
            <section class="cf-view" aria-labelledby="cf-title">
                <header class="cf-head">
                    <p class="cf-kicker">Explicaciones generales · interactivo con anatomía técnica y leyes</p>
                    <h1 id="cf-title">¿Cómo funciona el sector energético?</h1>
                    <p class="cf-intro">Aprende paso a paso cómo funcionan la electricidad y los hidrocarburos en México: desde las leyes físicas y las moléculas hasta las centrales, refinerías, ductos y el diseño de los mercados.</p>
                    
                    <div class="cf-sectors-nav" role="group" aria-label="Elegir sector">
                        <button type="button" class="cf-sector-tab ${d==="electricidad"?"is-active":""}" data-sector="electricidad" aria-pressed="${d==="electricidad"}">
                            <span class="cf-tab-icon">${$.electricidad}</span>
                            <span class="cf-tab-text">Mercado Eléctrico (SEN / MEM)</span>
                            <span class="cf-tab-count">${a} conceptos</span>
                        </button>
                        <button type="button" class="cf-sector-tab ${d==="hidrocarburos"?"is-active":""}" data-sector="hidrocarburos" aria-pressed="${d==="hidrocarburos"}">
                            <span class="cf-tab-icon">${$.hidrocarburos}</span>
                            <span class="cf-tab-text">Mercado de Hidrocarburos</span>
                            <span class="cf-tab-count">${r} conceptos</span>
                        </button>
                    </div>
                </header>
                <p class="cf-progress">${A()}</p>
                <ol class="cf-route">${O.map(t=>{var b;const m=n.filter(g=>g.nivel===t.id),p=(b=G[d])==null?void 0:b[t.id];return!m.length&&!p?"":`
                    <li class="cf-level" aria-labelledby="cf-nivel-${t.id}">
                        <div class="cf-level-head">
                            <span class="cf-level-num" aria-hidden="true">${t.id}</span>
                            <div><h2 id="cf-nivel-${t.id}">Nivel ${t.id} · ${s(t.titulo)}</h2><p>${s(t.texto)}</p></div>
                        </div>
                        <div class="cf-grid">
                            ${m.map(g=>P(g,y.has(g.id))).join("")}
                            ${p?`<div class="cf-card cf-soon" aria-hidden="true"><strong>Próximamente</strong><span class="cf-card-text">${s(p)}</span></div>`:""}
                        </div>
                    </li>`}).filter(Boolean).join("")}
                </ol>
            </section>`,o.querySelectorAll(".cf-sector-tab").forEach(t=>{t.addEventListener("click",()=>{d=t.dataset.sector,w()})})}function z(a){var S,j,q,L,M,N;a.sector&&(d=a.sector);const r=typeof u=="function"?u()||[]:u;_(a.id);const n=F(a.id),t=(a.antes||[]).map(e=>B[e]).filter(Boolean),m=(((S=a.ley)==null?void 0:S.siglas)||[]).map(e=>({siglas:e,law:K(r,e)})),p=a.tramites.map(J).filter(Boolean),b=a.sector==="hidrocarburos"?"Mercado de Hidrocarburos":"Mercado Eléctrico",g=a.sector==="hidrocarburos"?$.hidrocarburos:$.electricidad;o.innerHTML=`
            <article class="cf-view cf-concept" aria-labelledby="cf-title">
                <a class="cf-back" href="#como-funciona">← Volver a la ruta de ${b}</a>
                <header class="cf-head">
                    <p class="cf-kicker"><span class="cf-kicker-icon">${g}</span> ${b} · Nivel ${a.nivel}: ${s((j=O.find(e=>e.id===a.nivel))==null?void 0:j.titulo)}</p>
                    <h1 id="cf-title">${s(a.titulo)}</h1>
                    <p class="cf-intro">${s(a.resumen)}</p>
                    <button type="button" class="cf-share" data-share><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Compartir</span></button>
                </header>
                ${t.length?`<p class="cf-before">Para entenderlo mejor, antes mira: ${t.map(e=>`<a href="#como-funciona=${s(e.id)}">${s(e.titulo)}</a>`).join(", ")}.</p>`:""}
                <div class="cf-figure">
                    <iframe data-concepto="${s(a.id)}" src="${Z(a.figura)}" title="Ilustración interactiva: ${s(a.titulo)}" loading="lazy"></iframe>
                </div>
                ${(q=a.definiciones)!=null&&q.length?`<section class="cf-section" aria-labelledby="cf-defs">
                    <h2 id="cf-defs">${a.definiciones.length>1?"Definiciones":"Definición"}</h2>
                    <dl class="cf-defs">${a.definiciones.map(e=>`<div><dt>${s(e.termino)}${e.unidad?` <span class="cf-unit">${s(e.unidad)}</span>`:""}</dt><dd>${s(e.texto)}</dd></div>`).join("")}</dl>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-claves">
                    <h2 id="cf-claves">En palabras simples</h2>
                    <ol class="cf-steps">${a.claves.map(e=>`<li>${s(e)}</li>`).join("")}</ol>
                </section>
                ${(L=a.formulas)!=null&&L.length?`<section class="cf-section" aria-labelledby="cf-formulas">
                    <h2 id="cf-formulas">${a.formulas.length>1?"Las fórmulas":"La fórmula"}</h2>
                    <div class="cf-formulas">${a.formulas.map(e=>`<div class="cf-formula">
                        <p class="cf-expr">${s(e.expresion)}</p>
                        <p class="cf-reading">${s(e.lectura)}</p>
                        ${e.ejemplo?`<p class="cf-example"><b>Ejemplo:</b> ${s(e.ejemplo)}</p>`:""}
                    </div>`).join("")}</div>
                </section>`:""}
                ${(M=a.errores)!=null&&M.length?`<section class="cf-section" aria-labelledby="cf-errores">
                    <h2 id="cf-errores">Ideas equivocadas comunes</h2>
                    <ul class="cf-myths">${a.errores.map(e=>`<li><p class="cf-myth"><span aria-hidden="true">✗</span><span class="cf-sr">Idea equivocada: </span>${s(e.idea)}</p><p class="cf-fact"><span aria-hidden="true">✓</span><span class="cf-sr">En realidad: </span>${s(e.realidad)}</p></li>`).join("")}</ul>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-partes">
                    <h2 id="cf-partes">${a.partesTitulo?s(a.partesTitulo):"Sus partes"}</h2>
                    <dl class="cf-parts">${a.partes.map((e,i)=>`<div><dt><span class="cf-num" aria-hidden="true">${i+1}</span>${s(e.nombre)}</dt><dd>${s(e.texto)}</dd></div>`).join("")}</dl>
                </section>
                ${a.dato?`<aside class="cf-fun" aria-label="¿Sabías que…?"><b>¿Sabías que…?</b> ${s(a.dato)}</aside>`:""}
                ${a.ley?`<section class="cf-section" aria-labelledby="cf-ley">
                    <h2 id="cf-ley">Qué dice la ley</h2>
                    <p>${s(a.ley.texto)}</p>
                    <div class="cf-links">${m.map(({siglas:e,law:i})=>i?`<button type="button" class="cf-law" data-law="${s(i.id)}"><b>${s(i.siglas||e)}</b><span>${s(i.titulo)}</span></button>`:"").join("")}</div>
                </section>`:""}
                ${p.length||a.mapa?`<section class="cf-section" aria-labelledby="cf-permisos">
                    <h2 id="cf-permisos">Permisos y trámites</h2>
                    <div class="cf-links">
                        ${p.map(e=>`<a class="cf-link" href="#tramite=${s(e.id)}"><b>Guía de trámite</b><span>${s(e.title)}</span></a>`).join("")}
                        ${a.mapa?`<a class="cf-link" href="${s(a.mapa.hash)}"><b>Mapa</b><span>${s(a.mapa.texto)}</span></a>`:""}
                    </div>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-prueba">
                    <h2 id="cf-prueba">Ponte a prueba</h2>
                    <div class="cf-quiz">${a.preguntas.map((e,i)=>`
                        <fieldset class="cf-q" data-q="${i}">
                            <legend>${s(e.pregunta)}</legend>
                            ${e.opciones.map((c,l)=>`<button type="button" class="cf-opt" data-opt="${l}">${s(c)}</button>`).join("")}
                            <p class="cf-verdict" aria-live="polite"></p>
                        </fieldset>`).join("")}</div>
                </section>
                ${n?`<a class="cf-next" href="#como-funciona=${s(n.id)}"><span>Siguiente en la ruta</span><strong>${s(n.titulo)} →</strong></a>`:'<a class="cf-next" href="#como-funciona"><span>Llegaste al final de la ruta por ahora</span><strong>Ver la ruta completa →</strong></a>'}
                <section class="cf-sources" aria-labelledby="cf-fuentes">
                    <h2 id="cf-fuentes">Fuentes</h2>
                    <ol class="cf-refs">${a.fuentes.map(e=>{var l;const i=e.acervo?(l=m.find(f=>f.siglas===e.acervo))==null?void 0:l.law:null,c=e.url?`<a href="${s(e.url)}" target="_blank" rel="noopener"><i>${s(e.titulo)}</i></a>`:`<i>${s(e.titulo)}</i>`;return`<li>${s(e.autor)}${e.url?` (${s(e.fecha)}). ${c}${/[?!.]$/.test(e.titulo)?"":"."}${e.editorial?` ${s(e.editorial)}.`:""}`:`. ${c}, ${s(e.fecha)}.`}${e.consulta?` Consultado el ${s(e.consulta)}.`:""}${i?` <button type="button" class="cf-ref-law" data-law="${s(i.id)}">Ver en el acervo</button>`:""}</li>`}).join("")}</ol>
                    <p class="cf-note">Explicación general con fines informativos; no es texto legal ni sustituye la normativa. ${a.revisado?`Revisado el ${s(a.revisado)}.`:'<span class="cf-draft">Borrador en revisión.</span>'}</p>
                </section>
            </article>`,(N=o.querySelector("[data-share]"))==null||N.addEventListener("click",async e=>{const i=e.currentTarget,c=`${location.origin}/#como-funciona=${a.id}`,l=`¿Cómo funciona? ${a.titulo}. Míralo en movimiento:`,f=matchMedia("(pointer: coarse)").matches;if(navigator.share&&f){try{await navigator.share({title:`¿Cómo funciona? · ${a.titulo}`,text:l,url:c})}catch{}return}const h=i.querySelector("span");try{await navigator.clipboard.writeText(c),h.textContent="Enlace copiado"}catch{window.prompt("Copia el enlace:",c)}setTimeout(()=>{h.isConnected&&(h.textContent="Compartir")},2200)}),o.querySelectorAll("[data-law]").forEach(e=>e.addEventListener("click",()=>{var c;const i=(c=m.find(l=>{var f;return String((f=l.law)==null?void 0:f.id)===e.dataset.law}))==null?void 0:c.law;i&&V(i)})),o.querySelectorAll(".cf-q").forEach(e=>{const i=a.preguntas[Number(e.dataset.q)];e.addEventListener("click",c=>{const l=c.target.closest(".cf-opt");if(!l)return;const f=Number(l.dataset.opt)===i.correcta;e.querySelectorAll(".cf-opt").forEach(h=>{h.classList.toggle("is-right",Number(h.dataset.opt)===i.correcta&&f),h.classList.toggle("is-wrong",h===l&&!f)}),e.querySelector(".cf-verdict").textContent=f?"¡Correcto!":"Casi. Revisa «En palabras simples» y vuelve a intentar."})})}function E(a){if(!C)return;const r=a?B[a]:null;if(a&&!r){I("#como-funciona"),w();return}r?z(r):w()}return E(H),{show:E,destroy(){C=!1,window.removeEventListener("message",x),o.replaceChildren()}}}export{Y as renderComoFuncionaView};
