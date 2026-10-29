import{L as g}from"./leaflet-src-De2SSmXW.js";/* empty css                */import{N as X,b as K,n as J}from"./map-common-CNjabjrx.js";import{V as Q,W as S,X as N,Y as W,Z as D,$ as Y,a0 as aa,B as I}from"./index-CPybcEPe.js";import"./_commonjsHelpers-Cpj98o6Y.js";const _=[[14.3,-118.4],[32.8,-86.6]],j=25,ea=11,oa=[{key:"electricidad",label:"Generación eléctrica",color:"#1E5B4F"},{key:"gas-natural",label:"Gas natural",color:"#2f6690"}],sa={declaratoria:"Declaratoria",convocatoria:"Convocatoria",fallo:"Fallo",cancelacion:"Cancelación",abrogacion:"Abrogación",otro:"Aviso"},l=n=>String(n??"").replace(/[&<>"']/g,p=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[p]),E=(n,p=0)=>Number(n).toLocaleString("es-MX",{maximumFractionDigits:p}),G=n=>{const p=n?new Date(`${n}T12:00:00`):null;return!p||Number.isNaN(p.getTime())?"":p.toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"})};function ta(n,p){const v=(n==null?void 0:n.figura)==="PODEBI"?"Polígono trazado con las coordenadas de la declaratoria":"Polígono de la cartografía de la DGMESNIE (julio de 2026)",b=Number(n==null?void 0:n.superficie_calculada_ha),t=Number(p.superficie_ha),r=b>0&&t>0&&Math.abs(b-t)/t>.1;return`${v}.${r?` El polígono suma ${E(b)} ha y la declaratoria indica ${E(t,2)} ha.`:""}`}const R=n=>/^https:\/\//i.test(n||"")?n:"";async function A(n,p){const v=await fetch(n,{signal:p,credentials:"same-origin"});if(!v.ok)throw new Error(`HTTP ${v.status}`);return v.json()}function da(n,{id:p=null,onRoute:v}){const b=new AbortController,t={data:null,features:new Map,selected:null,figura:"todas",estado:"",permits:{},nearLayer:null};let r=null,P=null;const k=new Map,$=a=>n.querySelector(a);n.innerHTML='<section class="pl-view" aria-busy="true"><div class="pl-loading"><i></i><i></i><i></i></div></section>',Promise.all([A("/polos/polos.json",b.signal),A("/polos/poligonos.geojson",b.signal).catch(()=>({features:[]}))]).then(([a,o])=>{t.data=a,(o.features||[]).forEach(s=>{var i;(i=s.properties)!=null&&i.id&&t.features.set(s.properties.id,s)}),V(),p&&T(p,{route:!1})}).catch(a=>{a.name!=="AbortError"&&(n.innerHTML='<section class="pl-view"><p class="pl-error">No se pudo cargar la información de los polos. Intenta de nuevo en un momento.</p></section>')});function V(){var d,u;const{data:a}=t,o=Q(a.polos),s=Math.max(...Object.values(o.porFigura),1),i=o.porEstado;n.innerHTML=`
        <section class="pl-view">
            <header class="pl-head">
                <p class="pl-eyebrow">Plan México · información oficial</p>
                <h1>Polos de Desarrollo para el Bienestar</h1>
                <p class="pl-intro">${l(a.definicion)}</p>
                <p class="pl-cut">Corte: ${l(G(a.corte))}. Fuente: Diario Oficial de la Federación y sitios oficiales del Gobierno de México.</p>
            </header>

            <div class="pl-kpis">
                <div class="pl-kpi"><b>${o.total}</b><span>polos con declaratoria vigente</span></div>
                <div class="pl-kpi"><b>${o.estados}</b><span>estados con al menos un polo</span></div>
                <div class="pl-kpi"><b>${o.hectareas?E(o.hectareas):"—"}</b><span>hectáreas declaradas${o.conSuperficie<o.total?` <small>(${o.conSuperficie} de ${o.total} polos)</small>`:""}</span></div>
                <div class="pl-kpi pl-kpi--bars">
                    ${S.map(e=>`<div class="pl-bar"><span class="pl-bar-k">${e.clave}</span><span class="pl-bar-t"><i style="--w:${o.porFigura[e.clave]/s*100}%;--c:${e.color}"></i></span><b>${o.porFigura[e.clave]}</b></div>`).join("")}
                </div>
            </div>

            <h2 class="pl-h2">Tres figuras, tres autoridades</h2>
            <div class="pl-figuras">
                ${(a.figuras||[]).map(e=>{var c;return`
                <article class="pl-figura" style="--c:${((c=N[e.clave])==null?void 0:c.color)||"var(--brand)"}">
                    <p class="pl-figura-k">${l(e.clave)} · ${o.porFigura[e.clave]??0} vigentes</p>
                    <h3>${l(e.nombre)}</h3>
                    <p>${l(e.descripcion)}</p>
                    <dl><dt>Declara</dt><dd>${l(e.autoridad)}</dd>${e.fundamento?`<dt>Fundamento</dt><dd>${l(e.fundamento)}</dd>`:""}</dl>
                </article>`}).join("")}
            </div>

            <h2 class="pl-h2">Mapa de los polos</h2>
            <div class="pl-mapbox">
                <aside class="pl-side">
                    <div class="pl-filters">
                        <div class="pl-chips" role="group" aria-label="Figura">
                            <button type="button" data-figura="todas" class="is-on">Todas</button>
                            ${S.map(e=>`<button type="button" data-figura="${e.clave}" style="--c:${e.color}"><i></i>${e.clave}</button>`).join("")}
                        </div>
                        <label class="pl-sr" for="pl-estado">Estado</label>
                        <select id="pl-estado" class="pl-select"><option value="">Todos los estados</option>${i.map(([e,c])=>`<option value="${l(e)}">${l(e)} (${c})</option>`).join("")}</select>
                    </div>
                    <ol class="pl-list" data-list></ol>
                    <div class="pl-layers">
                        <p class="pl-mini">Capas de infraestructura</p>
                        ${X.filter(e=>e.key!=="petroliferos").map(e=>`<label><input type="checkbox" data-network="${e.key}"> <span class="pl-swatch" style="--c:${e.swatch}"></span>${l(e.label)}</label>`).join("")}
                    </div>
                </aside>
                <div class="pl-mapcol">
                    <div class="pl-map" data-map role="region" aria-label="Mapa de polos de desarrollo"></div>
                    <p class="pl-legend">${S.map(e=>`<span><i style="--c:${e.color}"></i>${e.clave}</span>`).join("")}<span><i class="is-area"></i>Polígono del polo</span><span><i class="is-aprox"></i>Ubicación aproximada (municipio)</span></p>
                </div>
                <article class="pl-detail" data-detail hidden></article>
            </div>

            <h2 class="pl-h2">Polos por estado</h2>
            <ol class="pl-estados">
                ${i.map(([e,c])=>`<li><button type="button" data-estado="${l(e)}"><span>${l(e)}</span><span class="pl-bar-t"><i style="--w:${c/i[0][1]*100}%"></i></span><b>${c}</b></button></li>`).join("")}
            </ol>

            ${(d=a.incentivos)!=null&&d.length?`<h2 class="pl-h2">Qué ofrece un polo</h2><ul class="pl-incentivos">${a.incentivos.map(e=>`<li>${l(e)}</li>`).join("")}</ul>`:""}

            ${(u=a.aclaraciones)!=null&&u.length?`<h2 class="pl-h2">Notas sobre los datos</h2><ul class="pl-incentivos">${a.aclaraciones.map(e=>`<li>${l(e)}</li>`).join("")}</ul>`:""}

            <h2 class="pl-h2">Fuentes oficiales</h2>
            <ul class="pl-fuentes">${(a.fuentes||[]).map(e=>R(e.url)?`<li><a href="${l(e.url)}" target="_blank" rel="noopener">${l(e.titulo)}</a></li>`:`<li>${l(e.titulo)}</li>`).join("")}</ul>        </section>`,L(),z(),U()}function C(){return t.data.polos.filter(a=>(t.figura==="todas"||a.figura===t.figura)&&(!t.estado||a.estado===t.estado))}function L(){const a=C().sort((o,s)=>(o.estatus==="abrogada")-(s.estatus==="abrogada")||o.estado.localeCompare(s.estado,"es")||o.nombre.localeCompare(s.nombre,"es"));$("[data-list]").innerHTML=a.map(o=>{var s;return`
            <li><button type="button" data-polo="${l(o.id)}" class="${o.id===t.selected?"is-on":""} ${o.estatus==="abrogada"?"is-off":""}" style="--c:${(s=N[o.figura])==null?void 0:s.color}">
                <i></i><span><b>${l(o.nombre)}</b><small>${l(o.figura)} · ${l(o.estado)}${o.estatus==="abrogada"?" · abrogada":""}</small></span>
            </button></li>`}).join("")||'<li class="pl-empty">Sin polos con este filtro.</li>'}function z(){r=g.map($("[data-map]"),{zoomControl:!0,attributionControl:!0,minZoom:4}).fitBounds(_),K(g,r)("mapa"),P=J(g,r),r.createPane("polos").style.zIndex=420,t.data.polos.forEach(a=>{var e;const o=((e=N[a.figura])==null?void 0:e.color)||"#9B2247",s=t.features.get(a.id),i=W(a,s);if(!i)return;const d=g.featureGroup(),u=s?g.geoJSON(s,{pane:"polos",style:{color:o,weight:2,fillColor:o,fillOpacity:.22}}).bindTooltip(`${l(a.nombre)} · polígono de la declaratoria`,{sticky:!0}).on("click",()=>T(a.id)):null;g.circleMarker(i.latlng,{pane:"polos",radius:8,color:"#fff",weight:2,fillColor:o,fillOpacity:a.estatus==="abrogada"?.35:1,dashArray:i.exacta?null:"3 3",className:i.exacta?"":"pl-aprox"}).bindTooltip(`${l(a.nombre)} · ${l(a.figura)}`,{direction:"top"}).addTo(d),d.on("click",()=>T(a.id)),d.addTo(r),k.set(a.id,{group:d,area:u,where:i,feature:s})}),r.on("zoomend",B),setTimeout(()=>r==null?void 0:r.invalidateSize(),50)}function B(){if(!r)return;const a=r.getZoom()>=ea;k.forEach(o=>{o.area&&(a&&r.hasLayer(o.group)?o.area.addTo(r):r.removeLayer(o.area))})}const F=a=>a.area?a.area.getBounds():a.group.getBounds();function x(){const a=new Set(C().map(s=>s.id));k.forEach((s,i)=>{a.has(i)?s.group.addTo(r):r.removeLayer(s.group)}),B(),L();const o=g.latLngBounds([]);a.forEach(s=>{const i=k.get(s);i&&o.extend(F(i))}),o.isValid()&&(t.figura!=="todas"||t.estado)?r.fitBounds(o.pad(.3),{maxZoom:10}):t.figura==="todas"&&!t.estado&&r.fitBounds(_)}function U(){n.addEventListener("click",a=>{const o=a.target.closest("[data-figura]");if(o){t.figura=o.dataset.figura,n.querySelectorAll("[data-figura]").forEach(d=>d.classList.toggle("is-on",d===o)),x();return}const s=a.target.closest("[data-estado]");if(s){t.estado=s.dataset.estado,$("#pl-estado").value=t.estado,x(),$(".pl-mapbox").scrollIntoView({behavior:"smooth",block:"start"});return}const i=a.target.closest("[data-polo]");if(i){T(i.dataset.polo);return}if(a.target.closest("[data-close]")){Z();return}a.target.closest("[data-near]")&&q()}),$("#pl-estado").addEventListener("change",a=>{t.estado=a.target.value,x()}),n.querySelectorAll("[data-network]").forEach(a=>a.addEventListener("change",()=>{a.disabled=!0,P.toggle(a.dataset.network,a.checked,b.signal).catch(()=>{a.checked=!1}).finally(()=>{a.disabled=!1})}))}function Z(){t.selected=null,M(),$("[data-detail]").hidden=!0,L(),v(D(null))}function T(a,{route:o=!0}={}){var f,w,y,m,O,H;const s=(f=t.data)==null?void 0:f.polos.find(h=>h.id===a);if(!s)return;t.selected=a,M(),o&&v(D(a)),L();const i=k.get(a),d=window.matchMedia("(max-width: 900px)").matches?[0,0]:[380,0];i&&r.fitBounds(F(i).pad(i.area?.4:0),{maxZoom:i.area?15:10,paddingBottomRight:d});const u=$("[data-detail]");u.hidden=!1,u.style.setProperty("--c",(w=N[s.figura])==null?void 0:w.color);const e=(y=t.data.figuras)==null?void 0:y.find(h=>h.clave===s.figura),c=(m=i==null?void 0:i.feature)==null?void 0:m.properties;u.innerHTML=`
            <button type="button" class="pl-x" data-close aria-label="Cerrar ficha">×</button>
            <p class="pl-figura-k">${l(s.figura)}${s.estatus==="abrogada"?' · <span class="pl-off">declaratoria abrogada</span>':""}</p>
            <h3>${l(s.nombre)}</h3>
            <p class="pl-where">${l((s.municipios||[]).join(", "))}${(O=s.municipios)!=null&&O.length?", ":""}${l(s.estado)}</p>
            <dl class="pl-dl">
                ${e?`<dt>Declara</dt><dd>${l(e.autoridad)}</dd>`:""}
                ${s.superficie_ha?`<dt>Superficie</dt><dd>${E(s.superficie_ha,2)} ha</dd>`:""}
                ${(H=s.vocaciones)!=null&&H.length?`<dt>Vocaciones</dt><dd>${s.vocaciones.map(l).join(" · ")}</dd>`:""}
                <dt>Ubicación</dt><dd>${i!=null&&i.feature?ta(c,s):"Aproximada, centro del municipio"}</dd>
            </dl>
            <h4>Trazabilidad oficial</h4>
            <ol class="pl-hitos">${Y(s).map(h=>`
                <li><time>${l(G(h.fecha))}</time><b>${l(sa[h.tipo]||"Aviso")}</b><span>${R(h.url)?`<a href="${l(h.url)}" target="_blank" rel="noopener">${l(h.titulo)}</a>`:l(h.titulo)}</span></li>`).join("")||'<li class="pl-empty">Sin publicaciones registradas.</li>'}</ol>
            <h4>Qué hay cerca <small>(${j} km)</small></h4>
            <div data-near-box><button type="button" class="pl-btn" data-near>Ver permisos de energía cercanos</button></div>`,u.scrollTop=0,window.matchMedia("(max-width: 900px)").matches&&u.scrollIntoView({behavior:"smooth",block:"start"})}function M(){t.nearLayer&&(r==null||r.removeLayer(t.nearLayer),t.nearLayer=null)}async function q(){var i;const a=t.selected,o=(i=k.get(a))==null?void 0:i.where,s=$("[data-near-box]");if(!(!o||!s)){s.innerHTML='<p class="pl-mini">Buscando permisos de la CNE alrededor del polo…</p>';try{const d=await Promise.all(oa.map(async e=>{var f,w;(f=t.permits)[w=e.key]||(f[w]=A(`/api/mapa/capa?tipo=${e.key}`,b.signal).then(y=>y.features||[]));const c=await t.permits[e.key];return{m:e,near:aa(c.filter(y=>{var m;return((m=y.properties)==null?void 0:m.vigente)!==!1}),o.latlng,j)}}));if(t.selected!==a)return;M(),t.nearLayer=g.layerGroup().addTo(r),d.forEach(({m:e,near:c})=>c.forEach(({feature:f})=>{const[w,y]=f.geometry.coordinates,m=f.properties;g.circleMarker([y,w],{radius:5,color:"#fff",weight:1.5,fillColor:e.color,fillOpacity:.95}).bindPopup(`<strong>${l(m.nombre)}</strong><br><small>${l(m.numeroPermiso)} · ${l(m.tecnologia||m.tipoPermiso||e.label)}</small><br><a href="${I({permit:m.numeroPermiso})}">Ficha del permiso</a>`).addTo(t.nearLayer)})),g.circle(o.latlng,{radius:j*1e3,color:"#9B2247",weight:1,dashArray:"4 4",fill:!1,interactive:!1}).addTo(t.nearLayer);const u=d.flatMap(({m:e,near:c})=>c.map(f=>({...f,m:e}))).sort((e,c)=>e.km-c.km);s.innerHTML=`
                <ul class="pl-near-counts">${d.map(({m:e,near:c})=>`<li style="--c:${e.color}"><b>${c.length}</b> ${l(e.label.toLowerCase())}</li>`).join("")}</ul>
                ${u.length?`<ol class="pl-near">${u.slice(0,8).map(({feature:e,km:c,m:f})=>`<li style="--c:${f.color}"><a href="${I({permit:e.properties.numeroPermiso})}">${l(e.properties.nombre)}</a><small>${E(c,1)} km · ${l(e.properties.tecnologia||f.label)}</small></li>`).join("")}</ol>`:'<p class="pl-mini">No hay permisos vigentes de generación eléctrica ni de gas natural en este radio.</p>'}
                <p class="pl-mini">Permisos vigentes del registro público de la CNE con ubicación conocida.</p>`,r.fitBounds(g.latLng(o.latlng).toBounds(j*2200))}catch(d){d.name!=="AbortError"&&(s.innerHTML='<p class="pl-mini">No se pudieron consultar los permisos cercanos. <button type="button" class="pl-link" data-near>Reintentar</button></p>')}}}return{show(a){if(!t.data){p=a;return}a?T(a,{route:!1}):t.selected&&(t.selected=null,M(),$("[data-detail]").hidden=!0,L())},destroy(){b.abort(),r==null||r.remove(),r=null}}}export{da as renderPolosView};
