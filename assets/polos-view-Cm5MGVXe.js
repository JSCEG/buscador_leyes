import{L as g}from"./leaflet-src-De2SSmXW.js";/* empty css                */import{N as W,b as Y,n as aa,i as ea,t as oa}from"./map-common-CNjabjrx.js";import{V as sa,W as O,X as E,Y as V,Z as la,$ as _,a0 as ta,a1 as ia,B as z}from"./index-CnNKFb4l.js";import"./_commonjsHelpers-Cpj98o6Y.js";const R=[[14.3,-118.4],[32.8,-86.6]],j=25,ra=11,na=[{key:"electricidad",label:"Generación eléctrica",color:"#1E5B4F"},{key:"gas-natural",label:"Gas natural",color:"#2f6690"}],ca={declaratoria:"Declaratoria",convocatoria:"Convocatoria",fallo:"Fallo",cancelacion:"Cancelación",abrogacion:"Abrogación",otro:"Aviso"},l=n=>String(n??"").replace(/[&<>"']/g,p=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[p]),P=(n,p=0)=>Number(n).toLocaleString("es-MX",{maximumFractionDigits:p}),Z=n=>{const p=n?new Date(`${n}T12:00:00`):null;return!p||Number.isNaN(p.getTime())?"":p.toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"})};function da(n,p){const k=(n==null?void 0:n.figura)==="PODEBI"?"Polígono trazado con las coordenadas de la declaratoria":"Polígono de la cartografía de la DGMESNIE (julio de 2026)",v=Number(n==null?void 0:n.superficie_calculada_ha),t=Number(p.superficie_ha),r=v>0&&t>0&&Math.abs(v-t)/t>.1;return`${k}.${r?` El polígono suma ${P(v)} ha y la declaratoria indica ${P(t,2)} ha.`:""}`}const S='<div class="pl-sep" aria-hidden="true"><span></span><i></i><span></span></div>',pa=n=>{const p=String(n??"").match(/^([^:]{2,40}):\s([\s\S]*)$/);return p?`<b>${l(p[1])}:</b> ${l(p[2])}`:l(n)},U=n=>/^https:\/\//i.test(n||"")?n:"";async function x(n,p){const k=await fetch(n,{signal:p,credentials:"same-origin"});if(!k.ok)throw new Error(`HTTP ${k.status}`);return k.json()}function ha(n,{id:p=null,onRoute:k}){const v=new AbortController,t={data:null,features:new Map,selected:null,figura:"todas",estado:"",permits:{},nearLayer:null};let r=null,F=null;const w=new Map,y=a=>n.querySelector(a);n.innerHTML='<section class="pl-view" aria-busy="true"><div class="pl-loading"><i></i><i></i><i></i></div></section>',Promise.all([x("/polos/polos.json",v.signal),x("/polos/poligonos.geojson",v.signal).catch(()=>({features:[]}))]).then(([a,e])=>{t.data=a,(e.features||[]).forEach(o=>{var i;(i=o.properties)!=null&&i.id&&t.features.set(o.properties.id,o)}),q(),p&&T(p,{route:!1})}).catch(a=>{a.name!=="AbortError"&&(n.innerHTML='<section class="pl-view"><p class="pl-error">No se pudo cargar la información de los polos. Intenta de nuevo en un momento.</p></section>')});function q(){var u,m;const{data:a}=t,e=sa(a.polos),o=Math.max(...Object.values(e.porFigura),1),i=e.porEstado,d=(a.definicion||"").indexOf(" La figura "),b=d>0?a.definicion.slice(0,d):a.definicion||"",c=d>0?a.definicion.slice(d+1):"";n.innerHTML=`
        <section class="pl-view">
            <header class="pl-head">
                <p class="pl-kicker">Plan México · Información oficial</p>
                <h1 class="pl-title">Polos de Desarrollo para el Bienestar</h1>
                <p class="pl-lead">${l(b)}</p>
                ${c?`<p class="pl-basis">${l(c)}</p>`:""}
                <p class="pl-cut">Corte: ${l(Z(a.corte))} · Fuente: Diario Oficial de la Federación y sitios oficiales del Gobierno de México</p>
                ${S}
            </header>

            <div class="pl-kpis">
                <div class="pl-kpi"><p class="pl-kpi-k">Vigentes</p><b>${e.total}</b><span>polos con declaratoria en el DOF</span>${e.abrogadas?`<small>${e.abrogadas} abrogada</small>`:""}</div>
                <div class="pl-kpi"><p class="pl-kpi-k">Territorio</p><b>${e.estados}</b><span>estados con al menos un polo</span></div>
                <div class="pl-kpi"><p class="pl-kpi-k">Superficie</p><b>${e.hectareas?P(e.hectareas):"—"}<em>ha</em></b><span>declaradas en el DOF</span>${e.conSuperficie<e.total?`<small>${e.conSuperficie} de ${e.total} polos con dato</small>`:""}</div>
                <div class="pl-kpi pl-kpi--bars">
                    <p class="pl-kpi-k">Por figura</p>
                    ${O.map(s=>`<div class="pl-bar"><span class="pl-bar-k">${s.clave}</span><span class="pl-bar-t"><i style="--w:${e.porFigura[s.clave]/o*100}%;--c:var(${s.token})"></i></span><b>${e.porFigura[s.clave]}</b></div>`).join("")}
                </div>
            </div>

            <h2 class="pl-h2">Tres figuras, tres autoridades</h2>
            <div class="pl-figuras">
                ${(a.figuras||[]).map(s=>{var f;return`
                <article class="pl-figura" style="--c:var(${((f=E[s.clave])==null?void 0:f.token)||"--brand"})">
                    <p class="pl-figura-k">${l(s.clave)} · ${e.porFigura[s.clave]??0} vigentes</p>
                    <h3>${l(s.nombre)}</h3>
                    <p>${l(s.descripcion)}</p>
                    <dl><dt>Declara</dt><dd>${l(s.autoridad)}</dd>${s.fundamento?`<dt>Fundamento</dt><dd>${l(s.fundamento)}</dd>`:""}</dl>
                </article>`}).join("")}
            </div>

            <h2 class="pl-h2">Mapa de los polos</h2>
            <div class="pl-mapbox">
                <aside class="pl-side">
                    <div class="pl-filters">
                        <div class="pl-chips" role="group" aria-label="Figura">
                            <button type="button" data-figura="todas" class="is-on">Todas</button>
                            ${O.map(s=>`<button type="button" data-figura="${s.clave}" style="--c:${s.color}"><i></i>${s.clave}</button>`).join("")}
                        </div>
                        <label class="pl-sr" for="pl-estado">Estado</label>
                        <select id="pl-estado" class="pl-select"><option value="">Todos los estados</option>${i.map(([s,f])=>`<option value="${l(s)}">${l(s)} (${f})</option>`).join("")}</select>
                    </div>
                    <ol class="pl-list" data-list></ol>
                    <div class="pl-layers">
                        <p class="pl-mini">Capas de infraestructura</p>
                        ${W.filter(s=>s.key!=="petroliferos").map(s=>`<label><input type="checkbox" data-network="${s.key}"> <span class="pl-swatch" style="--c:${s.swatch}"></span>${l(s.label)}</label>`).join("")}
                    </div>
                </aside>
                <div class="pl-mapcol">
                    <div class="pl-map" data-map role="region" aria-label="Mapa de polos de desarrollo"></div>
                    <p class="pl-legend">${O.map(s=>`<span class="pl-legend-pin">${V(s.clave)}${s.clave}</span>`).join("")}<span><i class="is-area"></i>Polígono del polo (al acercar)</span><span>Polo sin polígono: ubicación aproximada en su municipio</span></p>
                </div>
                <article class="pl-detail" data-detail hidden></article>
            </div>

            ${S}<h2 class="pl-h2">Polos por estado</h2>
            <ol class="pl-estados">
                ${i.map(([s,f])=>`<li><button type="button" data-estado="${l(s)}"><span>${l(s)}</span><span class="pl-bar-t"><i style="--w:${f/i[0][1]*100}%"></i></span><b>${f}</b></button></li>`).join("")}
            </ol>

            ${(u=a.incentivos)!=null&&u.length?`${S}<h2 class="pl-h2">Qué ofrece un polo</h2><ul class="pl-bullets">${a.incentivos.map(s=>`<li>${pa(s)}</li>`).join("")}</ul>`:""}

            ${(m=a.aclaraciones)!=null&&m.length?`${S}<h2 class="pl-h2">Notas sobre los datos</h2><ul class="pl-bullets">${a.aclaraciones.map(s=>`<li>${l(s)}</li>`).join("")}</ul>`:""}

            ${S}<h2 class="pl-h2">Fuentes oficiales</h2>
            <ul class="pl-bullets pl-fuentes">${(a.fuentes||[]).map(s=>U(s.url)?`<li><a class="pl-link pl-link--external" href="${l(s.url)}" target="_blank" rel="noopener">${l(s.titulo)}</a></li>`:`<li>${l(s.titulo)}</li>`).join("")}</ul>
        </section>`,L(),X(),K()}function B(){return t.data.polos.filter(a=>(t.figura==="todas"||a.figura===t.figura)&&(!t.estado||a.estado===t.estado))}function L(){const a=B().sort((e,o)=>(e.estatus==="abrogada")-(o.estatus==="abrogada")||e.estado.localeCompare(o.estado,"es")||e.nombre.localeCompare(o.nombre,"es"));y("[data-list]").innerHTML=a.map(e=>{var o;return`
            <li><button type="button" data-polo="${l(e.id)}" class="${e.id===t.selected?"is-on":""} ${e.estatus==="abrogada"?"is-off":""}" style="--c:${(o=E[e.figura])==null?void 0:o.color}">
                <i></i><span><b>${l(e.nombre)}</b><small>${l(e.figura)} · ${l(e.estado)}${e.estatus==="abrogada"?" · abrogada":""}</small></span>
            </button></li>`}).join("")||'<li class="pl-empty">Sin polos con este filtro.</li>'}function X(){r=g.map(y("[data-map]"),{zoomControl:!0,attributionControl:!0,minZoom:4}).fitBounds(R),Y(g,r)("mapa"),F=aa(g,r),r.createPane("polos").style.zIndex=420,t.data.polos.forEach(a=>{var u;const e=((u=E[a.figura])==null?void 0:u.color)||E.PODEBI.color,o=t.features.get(a.id),i=la(a,o);if(!i)return;const d=g.featureGroup(),b=o?g.geoJSON(o,{pane:"polos",style:{color:e,weight:2,fillColor:e,fillOpacity:.22}}).bindTooltip(`${l(a.nombre)} · polígono de la declaratoria`,{sticky:!0}).on("click",()=>T(a.id)):null,c=g.marker(i.latlng,{icon:C(a,!1),riseOnHover:!0,keyboard:!0,title:a.nombre,alt:`${a.nombre}, ${a.figura}`}).bindTooltip(`${l(a.nombre)} · ${l(a.figura)}`,{direction:"top",offset:[0,-40]}).addTo(d);d.on("click",()=>T(a.id)),d.addTo(r),w.set(a.id,{group:d,pin:c,area:b,where:i,feature:o,polo:a})}),r.on("zoomend",D),setTimeout(()=>r==null?void 0:r.invalidateSize(),50)}function C(a,e){return g.divIcon({className:"pl-pin",html:V(a.figura,{abrogada:a.estatus==="abrogada",selected:e}),iconSize:[36,46],iconAnchor:[18,42],tooltipAnchor:[0,0]})}function A(a){w.forEach((e,o)=>{e.pin.setIcon(C(e.polo,o===a)),e.pin.setZIndexOffset(o===a?1e3:0)})}function D(){if(!r)return;const a=r.getZoom()>=ra;w.forEach(e=>{e.area&&(a&&r.hasLayer(e.group)?e.area.addTo(r):r.removeLayer(e.area))})}const H=a=>a.area?a.area.getBounds():a.group.getBounds();function I(){const a=new Set(B().map(o=>o.id));w.forEach((o,i)=>{a.has(i)?o.group.addTo(r):r.removeLayer(o.group)}),D(),L();const e=g.latLngBounds([]);a.forEach(o=>{const i=w.get(o);i&&e.extend(H(i))}),e.isValid()&&(t.figura!=="todas"||t.estado)?r.fitBounds(e.pad(.3),{maxZoom:10}):t.figura==="todas"&&!t.estado&&r.fitBounds(R)}function K(){n.addEventListener("click",a=>{const e=a.target.closest("[data-figura]");if(e){t.figura=e.dataset.figura,n.querySelectorAll("[data-figura]").forEach(d=>d.classList.toggle("is-on",d===e)),I();return}const o=a.target.closest("[data-estado]");if(o){t.estado=o.dataset.estado,y("#pl-estado").value=t.estado,I(),y(".pl-mapbox").scrollIntoView({behavior:"smooth",block:"start"});return}const i=a.target.closest("[data-polo]");if(i){T(i.dataset.polo);return}if(a.target.closest("[data-close]")){J();return}a.target.closest("[data-near]")&&Q()}),y("#pl-estado").addEventListener("change",a=>{t.estado=a.target.value,I()}),n.querySelectorAll("[data-network]").forEach(a=>a.addEventListener("change",()=>{a.disabled=!0,F.toggle(a.dataset.network,a.checked,v.signal).catch(()=>{a.checked=!1}).finally(()=>{a.disabled=!1})}))}function J(){t.selected=null,A(null),N(),y("[data-detail]").hidden=!0,L(),k(_(null))}function T(a,{route:e=!0}={}){var m,s,f,h,M,G;const o=(m=t.data)==null?void 0:m.polos.find($=>$.id===a);if(!o)return;t.selected=a,A(a),N(),e&&k(_(a)),L();const i=w.get(a),d=window.matchMedia("(max-width: 900px)").matches?[0,0]:[380,0];i&&r.fitBounds(H(i).pad(i.area?.4:0),{maxZoom:i.area?15:10,paddingBottomRight:d});const b=y("[data-detail]");b.hidden=!1,b.style.setProperty("--c",(s=E[o.figura])==null?void 0:s.color);const c=(f=t.data.figuras)==null?void 0:f.find($=>$.clave===o.figura),u=(h=i==null?void 0:i.feature)==null?void 0:h.properties;b.innerHTML=`
            <button type="button" class="pl-x" data-close aria-label="Cerrar ficha">×</button>
            <p class="pl-figura-k">${l(o.figura)}${o.estatus==="abrogada"?' · <span class="pl-off">declaratoria abrogada</span>':""}</p>
            <h3>${l(o.nombre)}</h3>
            <p class="pl-where">${l((o.municipios||[]).join(", "))}${(M=o.municipios)!=null&&M.length?", ":""}${l(o.estado)}</p>
            <dl class="pl-dl">
                ${c?`<dt>Declara</dt><dd>${l(c.autoridad)}</dd>`:""}
                ${o.superficie_ha?`<dt>Superficie</dt><dd>${P(o.superficie_ha,2)} ha</dd>`:""}
                ${(G=o.vocaciones)!=null&&G.length?`<dt>Vocaciones</dt><dd>${o.vocaciones.map(l).join(" · ")}</dd>`:""}
                <dt>Ubicación</dt><dd>${i!=null&&i.feature?da(u,o):"Aproximada, centro del municipio"}</dd>
            </dl>
            <h4>Trazabilidad oficial</h4>
            <ol class="pl-hitos">${ta(o).map($=>`
                <li><time>${l(Z($.fecha))}</time><b>${l(ca[$.tipo]||"Aviso")}</b><span>${U($.url)?`<a href="${l($.url)}" target="_blank" rel="noopener">${l($.titulo)}</a>`:l($.titulo)}</span></li>`).join("")||'<li class="pl-empty">Sin publicaciones registradas.</li>'}</ol>
            <h4>Qué hay cerca <small>(${j} km)</small></h4>
            <div data-near-box><button type="button" class="pl-btn" data-near>Ver permisos de energía cercanos</button></div>`,b.scrollTop=0,window.matchMedia("(max-width: 900px)").matches&&b.scrollIntoView({behavior:"smooth",block:"start"})}function N(){t.nearLayer&&(r==null||r.removeLayer(t.nearLayer),t.nearLayer=null)}async function Q(){var i;const a=t.selected,e=(i=w.get(a))==null?void 0:i.where,o=y("[data-near-box]");if(!(!e||!o)){o.innerHTML='<p class="pl-mini">Buscando permisos de la CNE alrededor del polo…</p>';try{const d=await Promise.all(na.map(async c=>{var m,s;(m=t.permits)[s=c.key]||(m[s]=x(`/api/mapa/capa?tipo=${c.key}`,v.signal).then(f=>f.features||[]));const u=await t.permits[c.key];return{m:c,near:ia(u.filter(f=>{var h;return((h=f.properties)==null?void 0:h.vigente)!==!1}),e.latlng,j)}}));if(t.selected!==a)return;N(),t.nearLayer=g.layerGroup().addTo(r),d.forEach(({m:c,near:u})=>u.forEach(({feature:m})=>{const[s,f]=m.geometry.coordinates,h=m.properties,M=c.key==="electricidad"?ea(c.key,h).tech:"";(M?g.marker([f,s],{icon:g.divIcon({className:"pl-pin",html:oa(M,{variant:"dot",size:20}),iconSize:[28,28],iconAnchor:[14,14]})}):g.circleMarker([f,s],{radius:6,color:"#fff",weight:1.5,fillColor:c.color,fillOpacity:.95})).bindPopup(`<strong>${l(h.nombre)}</strong><br><small>${l(h.numeroPermiso)} · ${l(h.tecnologia||h.tipoPermiso||c.label)}</small><br><a href="${z({permit:h.numeroPermiso})}">Ficha del permiso</a>`).addTo(t.nearLayer)})),g.circle(e.latlng,{radius:j*1e3,color:E.PODEBI.color,weight:1,dashArray:"4 4",fill:!1,interactive:!1}).addTo(t.nearLayer);const b=d.flatMap(({m:c,near:u})=>u.map(m=>({...m,m:c}))).sort((c,u)=>c.km-u.km);o.innerHTML=`
                <ul class="pl-near-counts">${d.map(({m:c,near:u})=>`<li style="--c:${c.color}"><b>${u.length}</b> ${l(c.label.toLowerCase())}</li>`).join("")}</ul>
                ${b.length?`<ol class="pl-near">${b.slice(0,8).map(({feature:c,km:u,m})=>`<li style="--c:${m.color}"><a href="${z({permit:c.properties.numeroPermiso})}">${l(c.properties.nombre)}</a><small>${P(u,1)} km · ${l(c.properties.tecnologia||m.label)}</small></li>`).join("")}</ol>`:'<p class="pl-mini">No hay permisos vigentes de generación eléctrica ni de gas natural en este radio.</p>'}
                <p class="pl-mini">Permisos vigentes del registro público de la CNE con ubicación conocida.</p>`,r.fitBounds(g.latLng(e.latlng).toBounds(j*2200))}catch(d){d.name!=="AbortError"&&(o.innerHTML='<p class="pl-mini">No se pudieron consultar los permisos cercanos. <button type="button" class="pl-link" data-near>Reintentar</button></p>')}}}return{show(a){if(!t.data){p=a;return}a?T(a,{route:!1}):t.selected&&(t.selected=null,A(null),N(),y("[data-detail]").hidden=!0,L())},destroy(){v.abort(),r==null||r.remove(),r=null}}}export{ha as renderPolosView};
