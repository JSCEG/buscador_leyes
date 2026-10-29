import{L as m}from"./leaflet-src-De2SSmXW.js";/* empty css                */import{N as ea,b as oa,n as ta,i as sa,t as la,s as z,c as ia}from"./map-common-_z3KBPu5.js";import{V as ra,n as na,W as j,X as L,Y as _,Z as ca,$ as R,a0 as da,a1 as pa,B as Z}from"./index-ChQgWHe_.js";import"./_commonjsHelpers-Cpj98o6Y.js";const U=[[14.3,-118.4],[32.8,-86.6]],N=25,ua=11,fa=[{key:"electricidad",label:"Generación eléctrica",color:"#1E5B4F"},{key:"gas-natural",label:"Gas natural",color:"#2f6690"}],ma={declaratoria:"Declaratoria",convocatoria:"Convocatoria",fallo:"Fallo",cancelacion:"Cancelación",abrogacion:"Abrogación",otro:"Aviso"},l=c=>String(c??"").replace(/[&<>"']/g,p=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[p]),M=(c,p=0)=>Number(c).toLocaleString("es-MX",{maximumFractionDigits:p}),q=c=>{const p=c?new Date(`${c}T12:00:00`):null;return!p||Number.isNaN(p.getTime())?"":p.toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"})};function ga(c,p){const k=(c==null?void 0:c.figura)==="PODEBI"?"Polígono trazado con las coordenadas de la declaratoria":"Polígono de la cartografía de la DGMESNIE (julio de 2026)",h=Number(c==null?void 0:c.superficie_calculada_ha),s=Number(p.superficie_ha),i=h>0&&s>0&&Math.abs(h-s)/s>.1;return`${k}.${i?` El polígono suma ${M(h)} ha y la declaratoria indica ${M(s,2)} ha.`:""}`}const x='<div class="pl-sep" aria-hidden="true"><span></span><i></i><span></span></div>',ba=c=>{const p=String(c??"").match(/^([^:]{2,40}):\s([\s\S]*)$/);return p?`<b>${l(p[1])}:</b> ${l(p[2])}`:l(c)},K=c=>/^https:\/\//i.test(c||"")?c:"";async function O(c,p){const k=await fetch(c,{signal:p,credentials:"same-origin"});if(!k.ok)throw new Error(`HTTP ${k.status}`);return k.json()}function wa(c,{id:p=null,onRoute:k}){const h=new AbortController,s={data:null,features:new Map,selected:null,figura:"todas",estado:"",permits:{},nearLayer:null};let i=null,B=null;const w=new Map,y=a=>c.querySelector(a);c.innerHTML='<section class="pl-view" aria-busy="true"><div class="pl-loading"><i></i><i></i><i></i></div></section>',Promise.all([O("/polos/polos.json",h.signal),O("/polos/poligonos.geojson",h.signal).catch(()=>({features:[]}))]).then(([a,e])=>{s.data=a,(e.features||[]).forEach(o=>{var r;(r=o.properties)!=null&&r.id&&s.features.set(o.properties.id,o)}),X(),p&&T(p,{route:!1})}).catch(a=>{a.name!=="AbortError"&&(c.innerHTML='<section class="pl-view"><p class="pl-error">No se pudo cargar la información de los polos. Intenta de nuevo en un momento.</p></section>')});function X(){var u;const{data:a}=s,e=ra(a.polos),o=Math.max(...Object.values(e.porFigura),1),r=e.porEstado,d=(a.definicion||"").indexOf(" La figura "),g=d>0?a.definicion.slice(0,d):a.definicion||"",n=d>0?a.definicion.slice(d+1):"";c.innerHTML=`
        <section class="pl-view">
            <header class="pl-head" data-emblem-host>
                ${na("polos")}
                <p class="pl-kicker">Plan México · Información oficial</p>
                <h1 class="pl-title">Polos de Desarrollo para el Bienestar</h1>
                <p class="pl-lead">${l(g)}</p>
                ${n?`<p class="pl-basis">${l(n)}</p>`:""}
                <p class="pl-cut">Corte: ${l(q(a.corte))} · Fuente: Diario Oficial de la Federación y sitios oficiales del Gobierno de México</p>
            </header>

            <div class="pl-kpis">
                <div class="pl-kpi"><p class="pl-kpi-k">Vigentes</p><b>${e.total}</b><span>polos con declaratoria en el DOF</span>${e.abrogadas?`<small>${e.abrogadas} abrogada</small>`:""}</div>
                <div class="pl-kpi"><p class="pl-kpi-k">Territorio</p><b>${e.estados}</b><span>estados con al menos un polo</span></div>
                <div class="pl-kpi"><p class="pl-kpi-k">Superficie</p><b>${e.hectareas?M(e.hectareas):"—"}<em>ha</em></b><span>declaradas en el DOF</span>${e.conSuperficie<e.total?`<small>${e.conSuperficie} de ${e.total} polos con dato</small>`:""}</div>
                <div class="pl-kpi pl-kpi--bars">
                    <p class="pl-kpi-k">Por figura</p>
                    ${j.map(t=>`<div class="pl-bar"><span class="pl-bar-k">${t.clave}</span><span class="pl-bar-t"><i style="--w:${e.porFigura[t.clave]/o*100}%;--c:var(${t.token})"></i></span><b>${e.porFigura[t.clave]}</b></div>`).join("")}
                </div>
            </div>

            <h2 class="pl-h2">Tres figuras, tres autoridades</h2>
            <div class="pl-figuras">
                ${(a.figuras||[]).map(t=>{var f;return`
                <article class="pl-figura" style="--c:var(${((f=L[t.clave])==null?void 0:f.token)||"--brand"})">
                    <p class="pl-figura-k">${l(t.clave)} · ${e.porFigura[t.clave]??0} vigentes</p>
                    <h3>${l(t.nombre)}</h3>
                    <p>${l(t.descripcion)}</p>
                    <dl><dt>Declara</dt><dd>${l(t.autoridad)}</dd>${t.fundamento?`<dt>Fundamento</dt><dd>${l(t.fundamento)}</dd>`:""}</dl>
                </article>`}).join("")}
            </div>

            <h2 class="pl-h2">Mapa de los polos</h2>
            <div class="pl-mapbox">
                <aside class="pl-side">
                    <div class="pl-filters">
                        <div class="pl-chips" role="group" aria-label="Figura">
                            <button type="button" data-figura="todas" class="is-on">Todas</button>
                            ${j.map(t=>`<button type="button" data-figura="${t.clave}" style="--c:${t.color}"><i></i>${t.clave}</button>`).join("")}
                        </div>
                        <label class="pl-sr" for="pl-estado">Estado</label>
                        <select id="pl-estado" class="pl-select"><option value="">Todos los estados</option>${r.map(([t,f])=>`<option value="${l(t)}">${l(t)} (${f})</option>`).join("")}</select>
                    </div>
                    <ol class="pl-list" data-list></ol>
                    <div class="pl-layers">
                        <p class="pl-mini">Capas de infraestructura</p>
                        ${ea.filter(t=>t.key!=="petroliferos").map(t=>`<label><input type="checkbox" data-network="${t.key}"> <span class="pl-swatch" style="--c:${t.swatch}"></span>${l(t.label)}</label>`).join("")}
                    </div>
                </aside>
                <div class="pl-mapcol">
                    <div class="pl-map" data-map role="region" aria-label="Mapa de polos de desarrollo"></div>
                    <p class="pl-legend">${j.map(t=>`<span class="pl-legend-pin">${_(t.clave)}${t.clave}</span>`).join("")}<span><i class="is-area"></i>Polígono del polo (al acercar)</span><span>Polo sin polígono: ubicación aproximada en su municipio</span></p>
                </div>
                <article class="pl-detail" data-detail hidden></article>
            </div>

            ${x}<h2 class="pl-h2">Polos por estado</h2>
            <ol class="pl-estados">
                ${r.map(([t,f])=>`<li><button type="button" data-estado="${l(t)}"><span>${l(t)}</span><span class="pl-bar-t"><i style="--w:${f/r[0][1]*100}%"></i></span><b>${f}</b></button></li>`).join("")}
            </ol>

            ${(u=a.incentivos)!=null&&u.length?`${x}<h2 class="pl-h2">Qué ofrece un polo</h2><ul class="pl-bullets">${a.incentivos.map(t=>`<li>${ba(t)}</li>`).join("")}</ul>`:""}


            ${x}<h2 class="pl-h2">Fuentes oficiales</h2>
            <ul class="pl-bullets pl-fuentes">${(a.fuentes||[]).map(t=>K(t.url)?`<li><a class="pl-link pl-link--external" href="${l(t.url)}" target="_blank" rel="noopener">${l(t.titulo)}</a></li>`:`<li>${l(t.titulo)}</li>`).join("")}</ul>
        </section>`,E(),J(),W()}function C(){return s.data.polos.filter(a=>(s.figura==="todas"||a.figura===s.figura)&&(!s.estado||a.estado===s.estado))}function E(){const a=C().sort((e,o)=>(e.estatus==="abrogada")-(o.estatus==="abrogada")||e.estado.localeCompare(o.estado,"es")||e.nombre.localeCompare(o.nombre,"es"));y("[data-list]").innerHTML=a.map(e=>{var o;return`
            <li><button type="button" data-polo="${l(e.id)}" class="${e.id===s.selected?"is-on":""} ${e.estatus==="abrogada"?"is-off":""}" style="--c:${(o=L[e.figura])==null?void 0:o.color}">
                <i></i><span><b>${l(e.nombre)}</b><small>${l(e.figura)} · ${l(e.estado)}${e.estatus==="abrogada"?" · abrogada":""}</small></span>
            </button></li>`}).join("")||'<li class="pl-empty">Sin polos con este filtro.</li>'}function J(){i=m.map(y("[data-map]"),{zoomControl:!0,attributionControl:!0,minZoom:4}).fitBounds(U),oa(m,i)("mapa"),B=ta(m,i),i.createPane("polos").style.zIndex=420,i.createPane("estado").style.zIndex=360,s.data.polos.forEach(a=>{var u;const e=((u=L[a.figura])==null?void 0:u.color)||L.PODEBI.color,o=s.features.get(a.id),r=ca(a,o);if(!r)return;const d=m.featureGroup(),g=o?m.geoJSON(o,{pane:"polos",style:{color:e,weight:2,fillColor:e,fillOpacity:.22}}).bindTooltip(`${l(a.nombre)} · polígono de la declaratoria`,{sticky:!0}).on("click",()=>T(a.id)):null,n=m.marker(r.latlng,{icon:F(a,!1),riseOnHover:!0,keyboard:!0,title:a.nombre,alt:`${a.nombre}, ${a.figura}`}).bindTooltip(`${l(a.nombre)} · ${l(a.figura)}`,{direction:"top",offset:[0,-40]}).addTo(d);d.on("click",()=>T(a.id)),d.addTo(i),w.set(a.id,{group:d,pin:n,area:g,where:r,feature:o,polo:a})}),i.on("zoomend",D),setTimeout(()=>i==null?void 0:i.invalidateSize(),50)}function F(a,e){return m.divIcon({className:"pl-pin",html:_(a.figura,{abrogada:a.estatus==="abrogada",selected:e}),iconSize:[36,46],iconAnchor:[18,42],tooltipAnchor:[0,0]})}function A(a){w.forEach((e,o)=>{e.pin.setIcon(F(e.polo,o===a)),e.pin.setZIndexOffset(o===a?1e3:0)})}function D(){if(!i)return;const a=i.getZoom()>=ua;w.forEach(e=>{e.area&&(a&&i.hasLayer(e.group)?e.area.addTo(i):i.removeLayer(e.area))})}const G=a=>a.area?a.area.getBounds():a.group.getBounds();function I(){const a=new Set(C().map(o=>o.id));w.forEach((o,r)=>{a.has(r)?o.group.addTo(i):i.removeLayer(o.group)}),D(),E();const e=m.latLngBounds([]);a.forEach(o=>{const r=w.get(o);r&&e.extend(G(r))}),s.estado?Q(e):(H(),e.isValid()&&s.figura!=="todas"?i.fitBounds(e.pad(.3),{maxZoom:10}):i.fitBounds(U))}function H(){s.stateLayer&&(i==null||i.removeLayer(s.stateLayer),s.stateLayer=null)}async function Q(a){const e=s.estado;a.isValid()&&i.fitBounds(a.pad(.3),{maxZoom:10});try{s.statesGeo||(s.statesGeo=O("/api/mapa/estados",h.signal));const o=await s.statesGeo;if(!i||s.estado!==e)return;const r=(o.features||[]).find(g=>{var n;return z((n=g.properties)==null?void 0:n.NOMGEO)===z(e)});if(H(),!r)return;const d=ia("--brand","#9b2247");s.stateLayer=m.geoJSON(r,{pane:"estado",interactive:!1,style:{color:d,weight:2.5,fillColor:d,fillOpacity:.07}}).addTo(i),i.fitBounds(s.stateLayer.getBounds().pad(.05))}catch(o){o.name!=="AbortError"&&(s.statesGeo=null)}}function W(){c.addEventListener("click",a=>{const e=a.target.closest("[data-figura]");if(e){s.figura=e.dataset.figura,c.querySelectorAll("[data-figura]").forEach(d=>d.classList.toggle("is-on",d===e)),I();return}const o=a.target.closest("[data-estado]");if(o){s.estado=o.dataset.estado,y("#pl-estado").value=s.estado,I(),y(".pl-mapbox").scrollIntoView({behavior:"smooth",block:"start"});return}const r=a.target.closest("[data-polo]");if(r){T(r.dataset.polo);return}if(a.target.closest("[data-close]")){Y();return}a.target.closest("[data-near]")&&aa()}),y("#pl-estado").addEventListener("change",a=>{s.estado=a.target.value,I()}),c.querySelectorAll("[data-network]").forEach(a=>a.addEventListener("change",()=>{a.disabled=!0,B.toggle(a.dataset.network,a.checked,h.signal).catch(()=>{a.checked=!1}).finally(()=>{a.disabled=!1})}))}function Y(){s.selected=null,A(null),P(),y("[data-detail]").hidden=!0,E(),k(R(null))}function T(a,{route:e=!0}={}){var t,f,v,b,S,V;const o=(t=s.data)==null?void 0:t.polos.find($=>$.id===a);if(!o)return;s.selected=a,A(a),P(),e&&k(R(a)),E();const r=w.get(a),d=window.matchMedia("(max-width: 900px)").matches?[0,0]:[380,0];r&&i.fitBounds(G(r).pad(r.area?.4:0),{maxZoom:r.area?15:10,paddingBottomRight:d});const g=y("[data-detail]");g.hidden=!1,g.style.setProperty("--c",(f=L[o.figura])==null?void 0:f.color);const n=(v=s.data.figuras)==null?void 0:v.find($=>$.clave===o.figura),u=(b=r==null?void 0:r.feature)==null?void 0:b.properties;g.innerHTML=`
            <button type="button" class="pl-x" data-close aria-label="Cerrar ficha">×</button>
            <p class="pl-figura-k">${l(o.figura)}${o.estatus==="abrogada"?' · <span class="pl-off">declaratoria abrogada</span>':""}</p>
            <h3>${l(o.nombre)}</h3>
            <p class="pl-where">${l((o.municipios||[]).join(", "))}${(S=o.municipios)!=null&&S.length?", ":""}${l(o.estado)}</p>
            <dl class="pl-dl">
                ${n?`<dt>Declara</dt><dd>${l(n.autoridad)}</dd>`:""}
                ${o.superficie_ha?`<dt>Superficie</dt><dd>${M(o.superficie_ha,2)} ha</dd>`:""}
                ${(V=o.vocaciones)!=null&&V.length?`<dt>Vocaciones</dt><dd>${o.vocaciones.map(l).join(" · ")}</dd>`:""}
                <dt>Ubicación</dt><dd>${r!=null&&r.feature?ga(u,o):"Aproximada, centro del municipio"}</dd>
            </dl>
            <h4>Trazabilidad oficial</h4>
            <ol class="pl-hitos">${da(o).map($=>`
                <li><time>${l(q($.fecha))}</time><b>${l(ma[$.tipo]||"Aviso")}</b><span>${K($.url)?`<a href="${l($.url)}" target="_blank" rel="noopener">${l($.titulo)}</a>`:l($.titulo)}</span></li>`).join("")||'<li class="pl-empty">Sin publicaciones registradas.</li>'}</ol>
            <h4>Qué hay cerca <small>(${N} km)</small></h4>
            <div data-near-box><button type="button" class="pl-btn" data-near>Ver permisos de energía cercanos</button></div>`,g.scrollTop=0,window.matchMedia("(max-width: 900px)").matches&&g.scrollIntoView({behavior:"smooth",block:"start"})}function P(){s.nearLayer&&(i==null||i.removeLayer(s.nearLayer),s.nearLayer=null)}async function aa(){var r;const a=s.selected,e=(r=w.get(a))==null?void 0:r.where,o=y("[data-near-box]");if(!(!e||!o)){o.innerHTML='<p class="pl-mini">Buscando permisos de la CNE alrededor del polo…</p>';try{const d=await Promise.all(fa.map(async n=>{var t,f;(t=s.permits)[f=n.key]||(t[f]=O(`/api/mapa/capa?tipo=${n.key}`,h.signal).then(v=>v.features||[]));const u=await s.permits[n.key];return{m:n,near:pa(u.filter(v=>{var b;return((b=v.properties)==null?void 0:b.vigente)!==!1}),e.latlng,N)}}));if(s.selected!==a)return;P(),s.nearLayer=m.layerGroup().addTo(i),d.forEach(({m:n,near:u})=>u.forEach(({feature:t})=>{const[f,v]=t.geometry.coordinates,b=t.properties,S=n.key==="electricidad"?sa(n.key,b).tech:"";(S?m.marker([v,f],{icon:m.divIcon({className:"pl-pin",html:la(S,{variant:"dot",size:20}),iconSize:[28,28],iconAnchor:[14,14]})}):m.circleMarker([v,f],{radius:6,color:"#fff",weight:1.5,fillColor:n.color,fillOpacity:.95})).bindPopup(`<strong>${l(b.nombre)}</strong><br><small>${l(b.numeroPermiso)} · ${l(b.tecnologia||b.tipoPermiso||n.label)}</small><br><a href="${Z({permit:b.numeroPermiso})}">Ficha del permiso</a>`).addTo(s.nearLayer)})),m.circle(e.latlng,{radius:N*1e3,color:L.PODEBI.color,weight:1,dashArray:"4 4",fill:!1,interactive:!1}).addTo(s.nearLayer);const g=d.flatMap(({m:n,near:u})=>u.map(t=>({...t,m:n}))).sort((n,u)=>n.km-u.km);o.innerHTML=`
                <ul class="pl-near-counts">${d.map(({m:n,near:u})=>`<li style="--c:${n.color}"><b>${u.length}</b> ${l(n.label.toLowerCase())}</li>`).join("")}</ul>
                ${g.length?`<ol class="pl-near">${g.slice(0,8).map(({feature:n,km:u,m:t})=>`<li style="--c:${t.color}"><a href="${Z({permit:n.properties.numeroPermiso})}">${l(n.properties.nombre)}</a><small>${M(u,1)} km · ${l(n.properties.tecnologia||t.label)}</small></li>`).join("")}</ol>`:'<p class="pl-mini">No hay permisos vigentes de generación eléctrica ni de gas natural en este radio.</p>'}
                <p class="pl-mini">Permisos vigentes del registro público de la CNE con ubicación conocida.</p>`,i.fitBounds(m.latLng(e.latlng).toBounds(N*2200))}catch(d){d.name!=="AbortError"&&(o.innerHTML='<p class="pl-mini">No se pudieron consultar los permisos cercanos. <button type="button" class="pl-link" data-near>Reintentar</button></p>')}}}return{show(a){if(!s.data){p=a;return}a?T(a,{route:!1}):s.selected&&(s.selected=null,A(null),P(),y("[data-detail]").hidden=!0,E())},destroy(){h.abort(),i==null||i.remove(),i=null}}}export{wa as renderPolosView};
