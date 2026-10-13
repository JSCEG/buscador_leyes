import{J as C,K as x,H as k}from"./index-DIFrhHnH.js";import{l as E}from"./cne-shared-BdjQaSa0.js";const t=c=>String(c??"").replace(/[&<>"']/g,u=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[u]),q=()=>document.documentElement.classList.contains("dark-mode"),S=c=>`/conceptos/${c}${q()?"":"-light"}.html`;function M(c,u,{id:b=null,onOpenLaw:v,onRoute:y}){let f=!0;const p=e=>{var d;if(e.origin!==location.origin||((d=e.data)==null?void 0:d.type)!=="concepto-height")return;const l=c.querySelector(`iframe[data-concepto="${CSS.escape(e.data.id)}"]`);l&&Number.isFinite(e.data.h)&&(l.style.height=`${Math.ceil(e.data.h)}px`)};window.addEventListener("message",p);function m(){c.innerHTML=`
            <section class="cf-view" aria-labelledby="cf-title">
                <header class="cf-head">
                    <p class="cf-kicker">Explicaciones generales · no son texto legal</p>
                    <h1 id="cf-title">¿Cómo funciona?</h1>
                    <p class="cf-intro">Cómo funcionan las instalaciones del sector energético, con una ilustración que puedes mover, las leyes que las regulan y los permisos que necesitan.</p>
                </header>
                <div class="cf-grid">${x.map(e=>`
                    <a class="cf-card" href="#como-funciona=${t(e.id)}">
                        <span class="cf-card-sector">${t(e.sector==="electricidad"?"Electricidad":e.sector==="hidrocarburos"?"Hidrocarburos":"Transición energética")}</span>
                        <strong>${t(e.titulo)}</strong>
                        <span class="cf-card-text">${t(e.resumen)}</span>
                        <span class="cf-card-go">Ver cómo funciona →</span>
                    </a>`).join("")}
                    <div class="cf-card cf-soon" aria-hidden="true"><strong>Próximamente</strong><span class="cf-card-text">Gasolinera e hidrógeno verde.</span></div>
                </div>
            </section>`}function w(e){var g;const l=typeof u=="function"?u()||[]:u,d=e.ley.siglas.map(a=>({siglas:a,law:E(l,a)})),$=e.tramites.map(k).filter(Boolean);c.innerHTML=`
            <article class="cf-view cf-concept" aria-labelledby="cf-title">
                <a class="cf-back" href="#como-funciona">← Todas las explicaciones</a>
                <header class="cf-head">
                    <p class="cf-kicker">¿Cómo funciona?</p>
                    <h1 id="cf-title">${t(e.titulo)}</h1>
                    <p class="cf-intro">${t(e.resumen)}</p>
                    <button type="button" class="cf-share" data-share><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Compartir</span></button>
                </header>
                <div class="cf-figure">
                    <iframe data-concepto="${t(e.id)}" src="${S(e.figura)}" title="Ilustración interactiva: ${t(e.titulo)}" loading="lazy"></iframe>
                </div>
                <section class="cf-section" aria-labelledby="cf-claves">
                    <h2 id="cf-claves">En palabras simples</h2>
                    <ol class="cf-steps">${e.claves.map(a=>`<li>${t(a)}</li>`).join("")}</ol>
                </section>
                <section class="cf-section" aria-labelledby="cf-partes">
                    <h2 id="cf-partes">Sus partes</h2>
                    <dl class="cf-parts">${e.partes.map((a,s)=>`<div><dt><span class="cf-num" aria-hidden="true">${s+1}</span>${t(a.nombre)}</dt><dd>${t(a.texto)}</dd></div>`).join("")}</dl>
                </section>
                <section class="cf-section" aria-labelledby="cf-ley">
                    <h2 id="cf-ley">Qué dice la ley</h2>
                    <p>${t(e.ley.texto)}</p>
                    <div class="cf-links">${d.map(({siglas:a,law:s})=>s?`<button type="button" class="cf-law" data-law="${t(s.id)}"><b>${t(s.siglas||a)}</b><span>${t(s.titulo)}</span></button>`:"").join("")}</div>
                </section>
                ${$.length||e.mapa?`<section class="cf-section" aria-labelledby="cf-permisos">
                    <h2 id="cf-permisos">Permisos y trámites</h2>
                    <div class="cf-links">
                        ${$.map(a=>`<a class="cf-link" href="#tramite=${t(a.id)}"><b>Guía de trámite</b><span>${t(a.title)}</span></a>`).join("")}
                        ${e.mapa?`<a class="cf-link" href="${t(e.mapa.hash)}"><b>Mapa</b><span>${t(e.mapa.texto)}</span></a>`:""}
                    </div>
                </section>`:""}
                <section class="cf-section" aria-labelledby="cf-prueba">
                    <h2 id="cf-prueba">Ponte a prueba</h2>
                    <div class="cf-quiz">${e.preguntas.map((a,s)=>`
                        <fieldset class="cf-q" data-q="${s}">
                            <legend>${t(a.pregunta)}</legend>
                            ${a.opciones.map((i,o)=>`<button type="button" class="cf-opt" data-opt="${o}">${t(i)}</button>`).join("")}
                            <p class="cf-verdict" aria-live="polite"></p>
                        </fieldset>`).join("")}</div>
                </section>
                <section class="cf-sources" aria-labelledby="cf-fuentes">
                    <h2 id="cf-fuentes">Fuentes</h2>
                    <ol class="cf-refs">${e.fuentes.map(a=>{var o;const s=a.acervo?(o=d.find(r=>r.siglas===a.acervo))==null?void 0:o.law:null,i=a.url?`<a href="${t(a.url)}" target="_blank" rel="noopener"><i>${t(a.titulo)}</i></a>`:`<i>${t(a.titulo)}</i>`;return`<li>${t(a.autor)}${a.url?` (${t(a.fecha)}). ${i}${/[?!.]$/.test(a.titulo)?"":"."}`:`. ${i}, ${t(a.fecha)}.`}${a.consulta?` Consultado el ${t(a.consulta)}.`:""}${s?` <button type="button" class="cf-ref-law" data-law="${t(s.id)}">Ver en el acervo</button>`:""}</li>`}).join("")}</ol>
                    <p class="cf-note">Explicación general con fines informativos; no es texto legal ni sustituye la normativa. ${e.revisado?`Revisado el ${t(e.revisado)}.`:'<span class="cf-draft">Borrador en revisión.</span>'}</p>
                </section>
            </article>`,(g=c.querySelector("[data-share]"))==null||g.addEventListener("click",async a=>{const s=a.currentTarget,i=`${location.origin}/#como-funciona=${e.id}`,o=`¿Cómo funciona una ${e.titulo.toLowerCase()}? Mírala en movimiento:`,r=matchMedia("(pointer: coarse)").matches;if(navigator.share&&r){try{await navigator.share({title:`¿Cómo funciona? · ${e.titulo}`,text:o,url:i})}catch{}return}const n=s.querySelector("span");try{await navigator.clipboard.writeText(i),n.textContent="Enlace copiado"}catch{window.prompt("Copia el enlace:",i)}setTimeout(()=>{n.isConnected&&(n.textContent="Compartir")},2200)}),c.querySelectorAll("[data-law]").forEach(a=>a.addEventListener("click",()=>{var i;const s=(i=d.find(o=>{var r;return String((r=o.law)==null?void 0:r.id)===a.dataset.law}))==null?void 0:i.law;s&&v(s)})),c.querySelectorAll(".cf-q").forEach(a=>{const s=e.preguntas[Number(a.dataset.q)];a.addEventListener("click",i=>{const o=i.target.closest(".cf-opt");if(!o)return;const r=Number(o.dataset.opt)===s.correcta;a.querySelectorAll(".cf-opt").forEach(n=>{n.classList.toggle("is-right",Number(n.dataset.opt)===s.correcta&&r),n.classList.toggle("is-wrong",n===o&&!r)}),a.querySelector(".cf-verdict").textContent=r?"¡Correcto!":"Casi. Revisa «En palabras simples» y vuelve a intentar."})})}function h(e){if(!f)return;const l=e?C[e]:null;if(e&&!l){y("#como-funciona"),m();return}l?w(l):m()}return h(b),{show:h,destroy(){f=!1,window.removeEventListener("message",p),c.replaceChildren()}}}export{M as renderComoFuncionaView};
