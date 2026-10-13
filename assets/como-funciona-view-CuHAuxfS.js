import{J as C,K as x,H as k}from"./index-hOdw7S6r.js";import{l as E}from"./cne-shared-BdjQaSa0.js";const s=i=>String(i??"").replace(/[&<>"']/g,d=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[d]),q=()=>document.documentElement.classList.contains("dark-mode"),S=i=>`/conceptos/${i}${q()?"":"-light"}.html`;function M(i,d,{id:b=null,onOpenLaw:v,onRoute:y}){let u=!0;const p=a=>{var f;if(a.origin!==location.origin||((f=a.data)==null?void 0:f.type)!=="concepto-height")return;const c=i.querySelector(`iframe[data-concepto="${CSS.escape(a.data.id)}"]`);c&&Number.isFinite(a.data.h)&&(c.style.height=`${Math.ceil(a.data.h)}px`)};window.addEventListener("message",p);function m(){i.innerHTML=`
            <section class="cf-view" aria-labelledby="cf-title">
                <header class="cf-head">
                    <p class="cf-kicker">Explicaciones generales · no son texto legal</p>
                    <h1 id="cf-title">¿Cómo funciona?</h1>
                    <p class="cf-intro">Cómo funcionan las instalaciones del sector energético, con una ilustración que puedes mover, las leyes que las regulan y los permisos que necesitan.</p>
                </header>
                <div class="cf-grid">${x.map(a=>`
                    <a class="cf-card" href="#como-funciona=${s(a.id)}">
                        <span class="cf-card-sector">${s(a.sector==="electricidad"?"Electricidad":a.sector==="hidrocarburos"?"Hidrocarburos":"Transición energética")}</span>
                        <strong>${s(a.titulo)}</strong>
                        <span class="cf-card-text">${s(a.resumen)}</span>
                        <span class="cf-card-go">Ver cómo funciona →</span>
                    </a>`).join("")}
                    <div class="cf-card cf-soon" aria-hidden="true"><strong>Próximamente</strong><span class="cf-card-text">Gasolinera e hidrógeno verde.</span></div>
                </div>
            </section>`}function w(a){var $;const c=typeof d=="function"?d()||[]:d,f=a.ley.siglas.map(e=>({siglas:e,law:E(c,e)})),g=a.tramites.map(k).filter(Boolean);i.innerHTML=`
            <article class="cf-view cf-concept" aria-labelledby="cf-title">
                <a class="cf-back" href="#como-funciona">← Todas las explicaciones</a>
                <header class="cf-head">
                    <p class="cf-kicker">¿Cómo funciona?</p>
                    <h1 id="cf-title">${s(a.titulo)}</h1>
                    <p class="cf-intro">${s(a.resumen)}</p>
                    <button type="button" class="cf-share" data-share><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Compartir</span></button>
                </header>
                <div class="cf-figure">
                    <iframe data-concepto="${s(a.id)}" src="${S(a.figura)}" title="Ilustración interactiva: ${s(a.titulo)}" loading="lazy"></iframe>
                </div>
                <section class="cf-section" aria-labelledby="cf-claves">
                    <h2 id="cf-claves">En palabras simples</h2>
                    <ol class="cf-steps">${a.claves.map(e=>`<li>${s(e)}</li>`).join("")}</ol>
                </section>
                <section class="cf-section" aria-labelledby="cf-partes">
                    <h2 id="cf-partes">Sus partes</h2>
                    <dl class="cf-parts">${a.partes.map((e,t)=>`<div><dt><span class="cf-num" aria-hidden="true">${t+1}</span>${s(e.nombre)}</dt><dd>${s(e.texto)}</dd></div>`).join("")}</dl>
                </section>
                <section class="cf-section" aria-labelledby="cf-ley">
                    <h2 id="cf-ley">Qué dice la ley</h2>
                    <p>${s(a.ley.texto)}</p>
                    <div class="cf-links">${f.map(({siglas:e,law:t})=>t?`<button type="button" class="cf-law" data-law="${s(t.id)}"><b>${s(t.siglas||e)}</b><span>${s(t.titulo)}</span></button>`:"").join("")}</div>
                </section>
                ${g.length||a.mapa?`<section class="cf-section" aria-labelledby="cf-permisos">
                    <h2 id="cf-permisos">Permisos y trámites</h2>
                    <div class="cf-links">
                        ${g.map(e=>`<a class="cf-link" href="#tramite=${s(e.id)}"><b>Guía de trámite</b><span>${s(e.title)}</span></a>`).join("")}
                        ${a.mapa?`<a class="cf-link" href="${s(a.mapa.hash)}"><b>Mapa</b><span>${s(a.mapa.texto)}</span></a>`:""}
                    </div>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-prueba">
                    <h2 id="cf-prueba">Ponte a prueba</h2>
                    <div class="cf-quiz">${a.preguntas.map((e,t)=>`
                        <fieldset class="cf-q" data-q="${t}">
                            <legend>${s(e.pregunta)}</legend>
                            ${e.opciones.map((r,o)=>`<button type="button" class="cf-opt" data-opt="${o}">${s(r)}</button>`).join("")}
                            <p class="cf-verdict" aria-live="polite"></p>
                        </fieldset>`).join("")}</div>
                </section>
                <footer class="cf-sources">
                    <p><b>Fuentes:</b> ${a.fuentes.map(e=>`<a href="${s(e.url)}" target="_blank" rel="noopener">${s(e.nombre)}</a>`).join(" · ")}</p>
                    <p>Explicación general con fines informativos; no es texto legal ni sustituye la normativa. ${a.revisado?`Revisado el ${s(a.revisado)}.`:'<span class="cf-draft">Borrador en revisión.</span>'}</p>
                </footer>
            </article>`,($=i.querySelector("[data-share]"))==null||$.addEventListener("click",async e=>{const t=e.currentTarget,r=`${location.origin}/#como-funciona=${a.id}`,o=`¿Cómo funciona una ${a.titulo.toLowerCase()}? Mírala en movimiento:`,n=matchMedia("(pointer: coarse)").matches;if(navigator.share&&n){try{await navigator.share({title:`¿Cómo funciona? · ${a.titulo}`,text:o,url:r})}catch{}return}const l=t.querySelector("span");try{await navigator.clipboard.writeText(r),l.textContent="Enlace copiado"}catch{window.prompt("Copia el enlace:",r)}setTimeout(()=>{l.isConnected&&(l.textContent="Compartir")},2200)}),i.querySelectorAll("[data-law]").forEach(e=>e.addEventListener("click",()=>{var r;const t=(r=f.find(o=>{var n;return String((n=o.law)==null?void 0:n.id)===e.dataset.law}))==null?void 0:r.law;t&&v(t)})),i.querySelectorAll(".cf-q").forEach(e=>{const t=a.preguntas[Number(e.dataset.q)];e.addEventListener("click",r=>{const o=r.target.closest(".cf-opt");if(!o)return;const n=Number(o.dataset.opt)===t.correcta;e.querySelectorAll(".cf-opt").forEach(l=>{l.classList.toggle("is-right",Number(l.dataset.opt)===t.correcta&&n),l.classList.toggle("is-wrong",l===o&&!n)}),e.querySelector(".cf-verdict").textContent=n?"¡Correcto!":"Casi. Revisa «En palabras simples» y vuelve a intentar."})})}function h(a){if(!u)return;const c=a?C[a]:null;if(a&&!c){y("#como-funciona"),m();return}c?w(c):m()}return h(b),{show:h,destroy(){u=!1,window.removeEventListener("message",p),i.replaceChildren()}}}export{M as renderComoFuncionaView};
