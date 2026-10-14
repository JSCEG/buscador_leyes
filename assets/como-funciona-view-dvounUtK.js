import{J as E,N as k,K as f,L as V,H as B}from"./index-CaFKVW0y.js";import{l as z}from"./cne-shared-BdjQaSa0.js";const t=l=>String(l??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]),A=()=>document.documentElement.classList.contains("dark-mode"),F=l=>`/conceptos/${l}${A()?"":"-light"}.html`,L="cf-vistos";function $(){try{return new Set(JSON.parse(localStorage.getItem(L)||"[]"))}catch{return new Set}}function H(l){try{const c=$();c.add(l),localStorage.setItem(L,JSON.stringify([...c]))}catch{}}const q={2:"Subestación, inversor y cómo se equilibra la red.",3:"Eólica, hidroeléctrica, ciclo combinado, geotérmica y nuclear."};function R(l,c,{id:N=null,onOpenLaw:j,onRoute:M}){let h=!0;const g=a=>{var u;if(a.origin!==location.origin||((u=a.data)==null?void 0:u.type)!=="concepto-height")return;const s=l.querySelector(`iframe[data-concepto="${CSS.escape(a.data.id)}"]`);s&&Number.isFinite(a.data.h)&&(s.style.height=`${Math.ceil(a.data.h)}px`)};window.addEventListener("message",g);function O(a,s){return`
            <a class="cf-card${s?" is-done":""}" href="#como-funciona=${t(a.id)}">
                <span class="cf-card-sector">${s?'<span class="cf-check" aria-hidden="true">✓</span> Visto':`Paso ${f.indexOf(a)+1}`}</span>
                <strong>${t(a.titulo)}</strong>
                <span class="cf-card-text">${t(a.resumen)}</span>
                <span class="cf-card-go">${s?"Volver a ver →":"Ver cómo funciona →"}</span>
            </a>`}function P(){const a=f.filter(s=>p.has(s.id)).length;return a?`Llevas ${a} de ${f.length}. Sigue la ruta en orden o salta a lo que te interese.`:"Empieza por lo básico y sube hasta las centrales, o salta a lo que te interese."}let p=$();function v(){p=$(),l.innerHTML=`
            <section class="cf-view" aria-labelledby="cf-title">
                <header class="cf-head">
                    <p class="cf-kicker">Explicaciones generales · no son texto legal</p>
                    <h1 id="cf-title">¿Cómo funciona?</h1>
                    <p class="cf-intro">Una ruta para entender la electricidad paso a paso: de las ideas básicas a las centrales, con ilustraciones que puedes mover, las leyes que las regulan y los permisos que necesitan.</p>
                </header>
                <p class="cf-progress">${P()}</p>
                <ol class="cf-route">${k.map(a=>`
                    <li class="cf-level" aria-labelledby="cf-nivel-${a.id}">
                        <div class="cf-level-head">
                            <span class="cf-level-num" aria-hidden="true">${a.id}</span>
                            <div><h2 id="cf-nivel-${a.id}">Nivel ${a.id} · ${t(a.titulo)}</h2><p>${t(a.texto)}</p></div>
                        </div>
                        <div class="cf-grid">${f.filter(s=>s.nivel===a.id).map(s=>O(s,p.has(s.id))).join("")}
                            ${q[a.id]?`<div class="cf-card cf-soon" aria-hidden="true"><strong>Próximamente</strong><span class="cf-card-text">${t(q[a.id])}</span></div>`:""}
                        </div>
                    </li>`).join("")}
                </ol>
            </section>`}function T(a){var S,x,C;const s=typeof c=="function"?c()||[]:c;H(a.id);const u=V(a.id),y=(a.antes||[]).map(e=>E[e]).filter(Boolean),m=(((S=a.ley)==null?void 0:S.siglas)||[]).map(e=>({siglas:e,law:z(s,e)})),w=a.tramites.map(B).filter(Boolean);l.innerHTML=`
            <article class="cf-view cf-concept" aria-labelledby="cf-title">
                <a class="cf-back" href="#como-funciona">← Ruta de aprendizaje</a>
                <header class="cf-head">
                    <p class="cf-kicker">¿Cómo funciona? · Nivel ${a.nivel} · ${t((x=k.find(e=>e.id===a.nivel))==null?void 0:x.titulo)}</p>
                    <h1 id="cf-title">${t(a.titulo)}</h1>
                    <p class="cf-intro">${t(a.resumen)}</p>
                    <button type="button" class="cf-share" data-share><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Compartir</span></button>
                </header>
                ${y.length?`<p class="cf-before">Para entenderlo mejor, antes mira: ${y.map(e=>`<a href="#como-funciona=${t(e.id)}">${t(e.titulo)}</a>`).join(", ")}.</p>`:""}
                <div class="cf-figure">
                    <iframe data-concepto="${t(a.id)}" src="${F(a.figura)}" title="Ilustración interactiva: ${t(a.titulo)}" loading="lazy"></iframe>
                </div>
                <section class="cf-section" aria-labelledby="cf-claves">
                    <h2 id="cf-claves">En palabras simples</h2>
                    <ol class="cf-steps">${a.claves.map(e=>`<li>${t(e)}</li>`).join("")}</ol>
                </section>
                <section class="cf-section" aria-labelledby="cf-partes">
                    <h2 id="cf-partes">Sus partes</h2>
                    <dl class="cf-parts">${a.partes.map((e,i)=>`<div><dt><span class="cf-num" aria-hidden="true">${i+1}</span>${t(e.nombre)}</dt><dd>${t(e.texto)}</dd></div>`).join("")}</dl>
                </section>
                ${a.ley?`<section class="cf-section" aria-labelledby="cf-ley">
                    <h2 id="cf-ley">Qué dice la ley</h2>
                    <p>${t(a.ley.texto)}</p>
                    <div class="cf-links">${m.map(({siglas:e,law:i})=>i?`<button type="button" class="cf-law" data-law="${t(i.id)}"><b>${t(i.siglas||e)}</b><span>${t(i.titulo)}</span></button>`:"").join("")}</div>
                </section>`:""}
                ${w.length||a.mapa?`<section class="cf-section" aria-labelledby="cf-permisos">
                    <h2 id="cf-permisos">Permisos y trámites</h2>
                    <div class="cf-links">
                        ${w.map(e=>`<a class="cf-link" href="#tramite=${t(e.id)}"><b>Guía de trámite</b><span>${t(e.title)}</span></a>`).join("")}
                        ${a.mapa?`<a class="cf-link" href="${t(a.mapa.hash)}"><b>Mapa</b><span>${t(a.mapa.texto)}</span></a>`:""}
                    </div>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-prueba">
                    <h2 id="cf-prueba">Ponte a prueba</h2>
                    <div class="cf-quiz">${a.preguntas.map((e,i)=>`
                        <fieldset class="cf-q" data-q="${i}">
                            <legend>${t(e.pregunta)}</legend>
                            ${e.opciones.map((o,r)=>`<button type="button" class="cf-opt" data-opt="${r}">${t(o)}</button>`).join("")}
                            <p class="cf-verdict" aria-live="polite"></p>
                        </fieldset>`).join("")}</div>
                </section>
                ${u?`<a class="cf-next" href="#como-funciona=${t(u.id)}"><span>Siguiente en la ruta</span><strong>${t(u.titulo)} →</strong></a>`:'<a class="cf-next" href="#como-funciona"><span>Llegaste al final de la ruta por ahora</span><strong>Ver la ruta completa →</strong></a>'}
                <section class="cf-sources" aria-labelledby="cf-fuentes">
                    <h2 id="cf-fuentes">Fuentes</h2>
                    <ol class="cf-refs">${a.fuentes.map(e=>{var r;const i=e.acervo?(r=m.find(n=>n.siglas===e.acervo))==null?void 0:r.law:null,o=e.url?`<a href="${t(e.url)}" target="_blank" rel="noopener"><i>${t(e.titulo)}</i></a>`:`<i>${t(e.titulo)}</i>`;return`<li>${t(e.autor)}${e.url?` (${t(e.fecha)}). ${o}${/[?!.]$/.test(e.titulo)?"":"."}${e.editorial?` ${t(e.editorial)}.`:""}`:`. ${o}, ${t(e.fecha)}.`}${e.consulta?` Consultado el ${t(e.consulta)}.`:""}${i?` <button type="button" class="cf-ref-law" data-law="${t(i.id)}">Ver en el acervo</button>`:""}</li>`}).join("")}</ol>
                    <p class="cf-note">Explicación general con fines informativos; no es texto legal ni sustituye la normativa. ${a.revisado?`Revisado el ${t(a.revisado)}.`:'<span class="cf-draft">Borrador en revisión.</span>'}</p>
                </section>
            </article>`,(C=l.querySelector("[data-share]"))==null||C.addEventListener("click",async e=>{const i=e.currentTarget,o=`${location.origin}/#como-funciona=${a.id}`,r=`¿Cómo funciona? ${a.titulo}. Míralo en movimiento:`,n=matchMedia("(pointer: coarse)").matches;if(navigator.share&&n){try{await navigator.share({title:`¿Cómo funciona? · ${a.titulo}`,text:r,url:o})}catch{}return}const d=i.querySelector("span");try{await navigator.clipboard.writeText(o),d.textContent="Enlace copiado"}catch{window.prompt("Copia el enlace:",o)}setTimeout(()=>{d.isConnected&&(d.textContent="Compartir")},2200)}),l.querySelectorAll("[data-law]").forEach(e=>e.addEventListener("click",()=>{var o;const i=(o=m.find(r=>{var n;return String((n=r.law)==null?void 0:n.id)===e.dataset.law}))==null?void 0:o.law;i&&j(i)})),l.querySelectorAll(".cf-q").forEach(e=>{const i=a.preguntas[Number(e.dataset.q)];e.addEventListener("click",o=>{const r=o.target.closest(".cf-opt");if(!r)return;const n=Number(r.dataset.opt)===i.correcta;e.querySelectorAll(".cf-opt").forEach(d=>{d.classList.toggle("is-right",Number(d.dataset.opt)===i.correcta&&n),d.classList.toggle("is-wrong",d===r&&!n)}),e.querySelector(".cf-verdict").textContent=n?"¡Correcto!":"Casi. Revisa «En palabras simples» y vuelve a intentar."})})}function b(a){if(!h)return;const s=a?E[a]:null;if(a&&!s){M("#como-funciona"),v();return}s?T(s):v()}return b(N),{show:b,destroy(){h=!1,window.removeEventListener("message",g),l.replaceChildren()}}}export{R as renderComoFuncionaView};
