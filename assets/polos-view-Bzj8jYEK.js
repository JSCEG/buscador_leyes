import{L as h}from"./leaflet-src-De2SSmXW.js";/* empty css                */import{N as X,b as K,n as J}from"./map-common-CNjabjrx.js";import{V as Q,W as x,X as L,Y as W,Z as I,$ as Y,a0 as aa,B as H}from"./index-CeF33Jdz.js";import"./_commonjsHelpers-Cpj98o6Y.js";const _=[[14.3,-118.4],[32.8,-86.6]],P=25,ea=11,oa=[{key:"electricidad",label:"Generación eléctrica",color:"#1E5B4F"},{key:"gas-natural",label:"Gas natural",color:"#2f6690"}],sa={declaratoria:"Declaratoria",convocatoria:"Convocatoria",fallo:"Fallo",cancelacion:"Cancelación",abrogacion:"Abrogación",otro:"Aviso"},l=c=>String(c??"").replace(/[&<>"']/g,g=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[g]),M=(c,g=0)=>Number(c).toLocaleString("es-MX",{maximumFractionDigits:g}),G=c=>{const g=c?new Date(`${c}T12:00:00`):null;return!g||Number.isNaN(g.getTime())?"":g.toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"})};function la(c,g){const k=(c==null?void 0:c.figura)==="PODEBI"?"Polígono trazado con las coordenadas de la declaratoria":"Polígono de la cartografía de la DGMESNIE (julio de 2026)",v=Number(c==null?void 0:c.superficie_calculada_ha),t=Number(g.superficie_ha),r=v>0&&t>0&&Math.abs(v-t)/t>.1;return`${k}.${r?` El polígono suma ${M(v)} ha y la declaratoria indica ${M(t,2)} ha.`:""}`}const R=c=>/^https:\/\//i.test(c||"")?c:"";async function S(c,g){const k=await fetch(c,{signal:g,credentials:"same-origin"});if(!k.ok)throw new Error(`HTTP ${k.status}`);return k.json()}function da(c,{id:g=null,onRoute:k}){const v=new AbortController,t={data:null,features:new Map,selected:null,figura:"todas",estado:"",permits:{},nearLayer:null};let r=null,A=null;const w=new Map,y=a=>c.querySelector(a);c.innerHTML='<section class="pl-view" aria-busy="true"><div class="pl-loading"><i></i><i></i><i></i></div></section>',Promise.all([S("/polos/polos.json",v.signal),S("/polos/poligonos.geojson",v.signal).catch(()=>({features:[]}))]).then(([a,e])=>{t.data=a,(e.features||[]).forEach(s=>{var i;(i=s.properties)!=null&&i.id&&t.features.set(s.properties.id,s)}),V(),g&&T(g,{route:!1})}).catch(a=>{a.name!=="AbortError"&&(c.innerHTML='<section class="pl-view"><p class="pl-error">No se pudo cargar la información de los polos. Intenta de nuevo en un momento.</p></section>')});function V(){var p,u;const{data:a}=t,e=Q(a.polos),s=Math.max(...Object.values(e.porFigura),1),i=e.porEstado,d=(a.definicion||"").indexOf(" La figura "),m=d>0?a.definicion.slice(0,d):a.definicion||"",n=d>0?a.definicion.slice(d+1):"";c.innerHTML=`
        <section class="pl-view">
            <header class="pl-head">
                <p class="pl-kicker">Plan México · Información oficial</p>
                <h1 class="pl-title">Polos de Desarrollo para el Bienestar</h1>
                <p class="pl-lead">${l(m)}</p>
                ${n?`<p class="pl-basis">${l(n)}</p>`:""}
                <p class="pl-cut">Corte: ${l(G(a.corte))} · Fuente: Diario Oficial de la Federación y sitios oficiales del Gobierno de México</p>
                <div class="pl-sep" aria-hidden="true"><span></span><i></i><span></span></div>
            </header>

            <div class="pl-kpis">
                <div class="pl-kpi"><p class="pl-kpi-k">Vigentes</p><b>${e.total}</b><span>polos con declaratoria en el DOF</span>${e.abrogadas?`<small>${e.abrogadas} abrogada</small>`:""}</div>
                <div class="pl-kpi"><p class="pl-kpi-k">Territorio</p><b>${e.estados}</b><span>estados con al menos un polo</span></div>
                <div class="pl-kpi"><p class="pl-kpi-k">Superficie</p><b>${e.hectareas?M(e.hectareas):"—"}<em>ha</em></b><span>declaradas en el DOF</span>${e.conSuperficie<e.total?`<small>${e.conSuperficie} de ${e.total} polos con dato</small>`:""}</div>
                <div class="pl-kpi pl-kpi--bars">
                    <p class="pl-kpi-k">Por figura</p>
                    ${x.map(o=>`<div class="pl-bar"><span class="pl-bar-k">${o.clave}</span><span class="pl-bar-t"><i style="--w:${e.porFigura[o.clave]/s*100}%;--c:var(${o.token})"></i></span><b>${e.porFigura[o.clave]}</b></div>`).join("")}
                </div>
            </div>

            <h2 class="pl-h2">Tres figuras, tres autoridades</h2>
            <div class="pl-figuras">
                ${(a.figuras||[]).map(o=>{var f;return`
                <article class="pl-figura" style="--c:var(${((f=L[o.clave])==null?void 0:f.token)||"--brand"})">
                    <p class="pl-figura-k">${l(o.clave)} · ${e.porFigura[o.clave]??0} vigentes</p>
                    <h3>${l(o.nombre)}</h3>
                    <p>${l(o.descripcion)}</p>
                    <dl><dt>Declara</dt><dd>${l(o.autoridad)}</dd>${o.fundamento?`<dt>Fundamento</dt><dd>${l(o.fundamento)}</dd>`:""}</dl>
                </article>`}).join("")}
            </div>

            <h2 class="pl-h2">Mapa de los polos</h2>
            <div class="pl-mapbox">
                <aside class="pl-side">
                    <div class="pl-filters">
                        <div class="pl-chips" role="group" aria-label="Figura">
                            <button type="button" data-figura="todas" class="is-on">Todas</button>
                            ${x.map(o=>`<button type="button" data-figura="${o.clave}" style="--c:${o.color}"><i></i>${o.clave}</button>`).join("")}
                        </div>
                        <label class="pl-sr" for="pl-estado">Estado</label>
                        <select id="pl-estado" class="pl-select"><option value="">Todos los estados</option>${i.map(([o,f])=>`<option value="${l(o)}">${l(o)} (${f})</option>`).join("")}</select>
                    </div>
                    <ol class="pl-list" data-list></ol>
                    <div class="pl-layers">
                        <p class="pl-mini">Capas de infraestructura</p>
                        ${X.filter(o=>o.key!=="petroliferos").map(o=>`<label><input type="checkbox" data-network="${o.key}"> <span class="pl-swatch" style="--c:${o.swatch}"></span>${l(o.label)}</label>`).join("")}
                    </div>
                </aside>
                <div class="pl-mapcol">
                    <div class="pl-map" data-map role="region" aria-label="Mapa de polos de desarrollo"></div>
                    <p class="pl-legend">${x.map(o=>`<span><i style="--c:${o.color}"></i>${o.clave}</span>`).join("")}<span><i class="is-area"></i>Polígono del polo</span><span><i class="is-aprox"></i>Ubicación aproximada (municipio)</span></p>
                </div>
                <article class="pl-detail" data-detail hidden></article>
            </div>

            <h2 class="pl-h2">Polos por estado</h2>
            <ol class="pl-estados">
                ${i.map(([o,f])=>`<li><button type="button" data-estado="${l(o)}"><span>${l(o)}</span><span class="pl-bar-t"><i style="--w:${f/i[0][1]*100}%"></i></span><b>${f}</b></button></li>`).join("")}
            </ol>

            ${(p=a.incentivos)!=null&&p.length?`<h2 class="pl-h2">Qué ofrece un polo</h2><ul class="pl-incentivos">${a.incentivos.map(o=>`<li>${l(o)}</li>`).join("")}</ul>`:""}

            ${(u=a.aclaraciones)!=null&&u.length?`<h2 class="pl-h2">Notas sobre los datos</h2><ul class="pl-incentivos">${a.aclaraciones.map(o=>`<li>${l(o)}</li>`).join("")}</ul>`:""}

            <h2 class="pl-h2">Fuentes oficiales</h2>
            <ul class="pl-fuentes">${(a.fuentes||[]).map(o=>R(o.url)?`<li><a href="${l(o.url)}" target="_blank" rel="noopener">${l(o.titulo)}</a></li>`:`<li>${l(o.titulo)}</li>`).join("")}</ul>        </section>`,E(),z(),U()}function O(){return t.data.polos.filter(a=>(t.figura==="todas"||a.figura===t.figura)&&(!t.estado||a.estado===t.estado))}function E(){const a=O().sort((e,s)=>(e.estatus==="abrogada")-(s.estatus==="abrogada")||e.estado.localeCompare(s.estado,"es")||e.nombre.localeCompare(s.nombre,"es"));y("[data-list]").innerHTML=a.map(e=>{var s;return`
            <li><button type="button" data-polo="${l(e.id)}" class="${e.id===t.selected?"is-on":""} ${e.estatus==="abrogada"?"is-off":""}" style="--c:${(s=L[e.figura])==null?void 0:s.color}">
                <i></i><span><b>${l(e.nombre)}</b><small>${l(e.figura)} · ${l(e.estado)}${e.estatus==="abrogada"?" · abrogada":""}</small></span>
            </button></li>`}).join("")||'<li class="pl-empty">Sin polos con este filtro.</li>'}function z(){r=h.map(y("[data-map]"),{zoomControl:!0,attributionControl:!0,minZoom:4}).fitBounds(_),K(h,r)("mapa"),A=J(h,r),r.createPane("polos").style.zIndex=420,t.data.polos.forEach(a=>{var n;const e=((n=L[a.figura])==null?void 0:n.color)||L.PODEBI.color,s=t.features.get(a.id),i=W(a,s);if(!i)return;const d=h.featureGroup(),m=s?h.geoJSON(s,{pane:"polos",style:{color:e,weight:2,fillColor:e,fillOpacity:.22}}).bindTooltip(`${l(a.nombre)} · polígono de la declaratoria`,{sticky:!0}).on("click",()=>T(a.id)):null;h.circleMarker(i.latlng,{pane:"polos",radius:8,color:"#fff",weight:2,fillColor:e,fillOpacity:a.estatus==="abrogada"?.35:1,dashArray:i.exacta?null:"3 3",className:i.exacta?"":"pl-aprox"}).bindTooltip(`${l(a.nombre)} · ${l(a.figura)}`,{direction:"top"}).addTo(d),d.on("click",()=>T(a.id)),d.addTo(r),w.set(a.id,{group:d,area:m,where:i,feature:s})}),r.on("zoomend",C),setTimeout(()=>r==null?void 0:r.invalidateSize(),50)}function C(){if(!r)return;const a=r.getZoom()>=ea;w.forEach(e=>{e.area&&(a&&r.hasLayer(e.group)?e.area.addTo(r):r.removeLayer(e.area))})}const F=a=>a.area?a.area.getBounds():a.group.getBounds();function j(){const a=new Set(O().map(s=>s.id));w.forEach((s,i)=>{a.has(i)?s.group.addTo(r):r.removeLayer(s.group)}),C(),E();const e=h.latLngBounds([]);a.forEach(s=>{const i=w.get(s);i&&e.extend(F(i))}),e.isValid()&&(t.figura!=="todas"||t.estado)?r.fitBounds(e.pad(.3),{maxZoom:10}):t.figura==="todas"&&!t.estado&&r.fitBounds(_)}function U(){c.addEventListener("click",a=>{const e=a.target.closest("[data-figura]");if(e){t.figura=e.dataset.figura,c.querySelectorAll("[data-figura]").forEach(d=>d.classList.toggle("is-on",d===e)),j();return}const s=a.target.closest("[data-estado]");if(s){t.estado=s.dataset.estado,y("#pl-estado").value=t.estado,j(),y(".pl-mapbox").scrollIntoView({behavior:"smooth",block:"start"});return}const i=a.target.closest("[data-polo]");if(i){T(i.dataset.polo);return}if(a.target.closest("[data-close]")){Z();return}a.target.closest("[data-near]")&&q()}),y("#pl-estado").addEventListener("change",a=>{t.estado=a.target.value,j()}),c.querySelectorAll("[data-network]").forEach(a=>a.addEventListener("change",()=>{a.disabled=!0,A.toggle(a.dataset.network,a.checked,v.signal).catch(()=>{a.checked=!1}).finally(()=>{a.disabled=!1})}))}function Z(){t.selected=null,N(),y("[data-detail]").hidden=!0,E(),k(I(null))}function T(a,{route:e=!0}={}){var u,o,f,b,B,D;const s=(u=t.data)==null?void 0:u.polos.find($=>$.id===a);if(!s)return;t.selected=a,N(),e&&k(I(a)),E();const i=w.get(a),d=window.matchMedia("(max-width: 900px)").matches?[0,0]:[380,0];i&&r.fitBounds(F(i).pad(i.area?.4:0),{maxZoom:i.area?15:10,paddingBottomRight:d});const m=y("[data-detail]");m.hidden=!1,m.style.setProperty("--c",(o=L[s.figura])==null?void 0:o.color);const n=(f=t.data.figuras)==null?void 0:f.find($=>$.clave===s.figura),p=(b=i==null?void 0:i.feature)==null?void 0:b.properties;m.innerHTML=`
            <button type="button" class="pl-x" data-close aria-label="Cerrar ficha">×</button>
            <p class="pl-figura-k">${l(s.figura)}${s.estatus==="abrogada"?' · <span class="pl-off">declaratoria abrogada</span>':""}</p>
            <h3>${l(s.nombre)}</h3>
            <p class="pl-where">${l((s.municipios||[]).join(", "))}${(B=s.municipios)!=null&&B.length?", ":""}${l(s.estado)}</p>
            <dl class="pl-dl">
                ${n?`<dt>Declara</dt><dd>${l(n.autoridad)}</dd>`:""}
                ${s.superficie_ha?`<dt>Superficie</dt><dd>${M(s.superficie_ha,2)} ha</dd>`:""}
                ${(D=s.vocaciones)!=null&&D.length?`<dt>Vocaciones</dt><dd>${s.vocaciones.map(l).join(" · ")}</dd>`:""}
                <dt>Ubicación</dt><dd>${i!=null&&i.feature?la(p,s):"Aproximada, centro del municipio"}</dd>
            </dl>
            <h4>Trazabilidad oficial</h4>
            <ol class="pl-hitos">${Y(s).map($=>`
                <li><time>${l(G($.fecha))}</time><b>${l(sa[$.tipo]||"Aviso")}</b><span>${R($.url)?`<a href="${l($.url)}" target="_blank" rel="noopener">${l($.titulo)}</a>`:l($.titulo)}</span></li>`).join("")||'<li class="pl-empty">Sin publicaciones registradas.</li>'}</ol>
            <h4>Qué hay cerca <small>(${P} km)</small></h4>
            <div data-near-box><button type="button" class="pl-btn" data-near>Ver permisos de energía cercanos</button></div>`,m.scrollTop=0,window.matchMedia("(max-width: 900px)").matches&&m.scrollIntoView({behavior:"smooth",block:"start"})}function N(){t.nearLayer&&(r==null||r.removeLayer(t.nearLayer),t.nearLayer=null)}async function q(){var i;const a=t.selected,e=(i=w.get(a))==null?void 0:i.where,s=y("[data-near-box]");if(!(!e||!s)){s.innerHTML='<p class="pl-mini">Buscando permisos de la CNE alrededor del polo…</p>';try{const d=await Promise.all(oa.map(async n=>{var u,o;(u=t.permits)[o=n.key]||(u[o]=S(`/api/mapa/capa?tipo=${n.key}`,v.signal).then(f=>f.features||[]));const p=await t.permits[n.key];return{m:n,near:aa(p.filter(f=>{var b;return((b=f.properties)==null?void 0:b.vigente)!==!1}),e.latlng,P)}}));if(t.selected!==a)return;N(),t.nearLayer=h.layerGroup().addTo(r),d.forEach(({m:n,near:p})=>p.forEach(({feature:u})=>{const[o,f]=u.geometry.coordinates,b=u.properties;h.circleMarker([f,o],{radius:5,color:"#fff",weight:1.5,fillColor:n.color,fillOpacity:.95}).bindPopup(`<strong>${l(b.nombre)}</strong><br><small>${l(b.numeroPermiso)} · ${l(b.tecnologia||b.tipoPermiso||n.label)}</small><br><a href="${H({permit:b.numeroPermiso})}">Ficha del permiso</a>`).addTo(t.nearLayer)})),h.circle(e.latlng,{radius:P*1e3,color:L.PODEBI.color,weight:1,dashArray:"4 4",fill:!1,interactive:!1}).addTo(t.nearLayer);const m=d.flatMap(({m:n,near:p})=>p.map(u=>({...u,m:n}))).sort((n,p)=>n.km-p.km);s.innerHTML=`
                <ul class="pl-near-counts">${d.map(({m:n,near:p})=>`<li style="--c:${n.color}"><b>${p.length}</b> ${l(n.label.toLowerCase())}</li>`).join("")}</ul>
                ${m.length?`<ol class="pl-near">${m.slice(0,8).map(({feature:n,km:p,m:u})=>`<li style="--c:${u.color}"><a href="${H({permit:n.properties.numeroPermiso})}">${l(n.properties.nombre)}</a><small>${M(p,1)} km · ${l(n.properties.tecnologia||u.label)}</small></li>`).join("")}</ol>`:'<p class="pl-mini">No hay permisos vigentes de generación eléctrica ni de gas natural en este radio.</p>'}
                <p class="pl-mini">Permisos vigentes del registro público de la CNE con ubicación conocida.</p>`,r.fitBounds(h.latLng(e.latlng).toBounds(P*2200))}catch(d){d.name!=="AbortError"&&(s.innerHTML='<p class="pl-mini">No se pudieron consultar los permisos cercanos. <button type="button" class="pl-link" data-near>Reintentar</button></p>')}}}return{show(a){if(!t.data){g=a;return}a?T(a,{route:!1}):t.selected&&(t.selected=null,N(),y("[data-detail]").hidden=!0,E())},destroy(){v.abort(),r==null||r.remove(),r=null}}}export{da as renderPolosView};
