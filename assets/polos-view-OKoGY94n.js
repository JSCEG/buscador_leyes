import{L as m}from"./leaflet-src-De2SSmXW.js";/* empty css                */import{N as W,b as Y,n as aa,i as ea,t as oa}from"./map-common-Bwhukxtl.js";import{V as sa,W as O,X as E,Y as V,Z as ta,$ as _,a0 as la,a1 as ia,B as z}from"./index-DKUJy_rf.js";import"./_commonjsHelpers-Cpj98o6Y.js";const R=[[14.3,-118.4],[32.8,-86.6]],N=25,ra=11,na=[{key:"electricidad",label:"Generación eléctrica",color:"#1E5B4F"},{key:"gas-natural",label:"Gas natural",color:"#2f6690"}],ca={declaratoria:"Declaratoria",convocatoria:"Convocatoria",fallo:"Fallo",cancelacion:"Cancelación",abrogacion:"Abrogación",otro:"Aviso"},t=n=>String(n??"").replace(/[&<>"']/g,p=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[p]),S=(n,p=0)=>Number(n).toLocaleString("es-MX",{maximumFractionDigits:p}),Z=n=>{const p=n?new Date(`${n}T12:00:00`):null;return!p||Number.isNaN(p.getTime())?"":p.toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"})};function da(n,p){const k=(n==null?void 0:n.figura)==="PODEBI"?"Polígono trazado con las coordenadas de la declaratoria":"Polígono de la cartografía de la DGMESNIE (julio de 2026)",$=Number(n==null?void 0:n.superficie_calculada_ha),l=Number(p.superficie_ha),r=$>0&&l>0&&Math.abs($-l)/l>.1;return`${k}.${r?` El polígono suma ${S($)} ha y la declaratoria indica ${S(l,2)} ha.`:""}`}const A='<div class="pl-sep" aria-hidden="true"><span></span><i></i><span></span></div>',pa=n=>{const p=String(n??"").match(/^([^:]{2,40}):\s([\s\S]*)$/);return p?`<b>${t(p[1])}:</b> ${t(p[2])}`:t(n)},U=n=>/^https:\/\//i.test(n||"")?n:"";async function x(n,p){const k=await fetch(n,{signal:p,credentials:"same-origin"});if(!k.ok)throw new Error(`HTTP ${k.status}`);return k.json()}function ha(n,{id:p=null,onRoute:k}){const $=new AbortController,l={data:null,features:new Map,selected:null,figura:"todas",estado:"",permits:{},nearLayer:null};let r=null,F=null;const w=new Map,v=a=>n.querySelector(a);n.innerHTML='<section class="pl-view" aria-busy="true"><div class="pl-loading"><i></i><i></i><i></i></div></section>',Promise.all([x("/polos/polos.json",$.signal),x("/polos/poligonos.geojson",$.signal).catch(()=>({features:[]}))]).then(([a,e])=>{l.data=a,(e.features||[]).forEach(s=>{var i;(i=s.properties)!=null&&i.id&&l.features.set(s.properties.id,s)}),q(),p&&T(p,{route:!1})}).catch(a=>{a.name!=="AbortError"&&(n.innerHTML='<section class="pl-view"><p class="pl-error">No se pudo cargar la información de los polos. Intenta de nuevo en un momento.</p></section>')});function q(){var u;const{data:a}=l,e=sa(a.polos),s=Math.max(...Object.values(e.porFigura),1),i=e.porEstado,d=(a.definicion||"").indexOf(" La figura "),g=d>0?a.definicion.slice(0,d):a.definicion||"",c=d>0?a.definicion.slice(d+1):"";n.innerHTML=`
        <section class="pl-view">
            <header class="pl-head">
                <p class="pl-kicker">Plan México · Información oficial</p>
                <h1 class="pl-title">Polos de Desarrollo para el Bienestar</h1>
                <p class="pl-lead">${t(g)}</p>
                ${c?`<p class="pl-basis">${t(c)}</p>`:""}
                <p class="pl-cut">Corte: ${t(Z(a.corte))} · Fuente: Diario Oficial de la Federación y sitios oficiales del Gobierno de México</p>
                ${A}
            </header>

            <div class="pl-kpis">
                <div class="pl-kpi"><p class="pl-kpi-k">Vigentes</p><b>${e.total}</b><span>polos con declaratoria en el DOF</span>${e.abrogadas?`<small>${e.abrogadas} abrogada</small>`:""}</div>
                <div class="pl-kpi"><p class="pl-kpi-k">Territorio</p><b>${e.estados}</b><span>estados con al menos un polo</span></div>
                <div class="pl-kpi"><p class="pl-kpi-k">Superficie</p><b>${e.hectareas?S(e.hectareas):"—"}<em>ha</em></b><span>declaradas en el DOF</span>${e.conSuperficie<e.total?`<small>${e.conSuperficie} de ${e.total} polos con dato</small>`:""}</div>
                <div class="pl-kpi pl-kpi--bars">
                    <p class="pl-kpi-k">Por figura</p>
                    ${O.map(o=>`<div class="pl-bar"><span class="pl-bar-k">${o.clave}</span><span class="pl-bar-t"><i style="--w:${e.porFigura[o.clave]/s*100}%;--c:var(${o.token})"></i></span><b>${e.porFigura[o.clave]}</b></div>`).join("")}
                </div>
            </div>

            <h2 class="pl-h2">Tres figuras, tres autoridades</h2>
            <div class="pl-figuras">
                ${(a.figuras||[]).map(o=>{var f;return`
                <article class="pl-figura" style="--c:var(${((f=E[o.clave])==null?void 0:f.token)||"--brand"})">
                    <p class="pl-figura-k">${t(o.clave)} · ${e.porFigura[o.clave]??0} vigentes</p>
                    <h3>${t(o.nombre)}</h3>
                    <p>${t(o.descripcion)}</p>
                    <dl><dt>Declara</dt><dd>${t(o.autoridad)}</dd>${o.fundamento?`<dt>Fundamento</dt><dd>${t(o.fundamento)}</dd>`:""}</dl>
                </article>`}).join("")}
            </div>

            <h2 class="pl-h2">Mapa de los polos</h2>
            <div class="pl-mapbox">
                <aside class="pl-side">
                    <div class="pl-filters">
                        <div class="pl-chips" role="group" aria-label="Figura">
                            <button type="button" data-figura="todas" class="is-on">Todas</button>
                            ${O.map(o=>`<button type="button" data-figura="${o.clave}" style="--c:${o.color}"><i></i>${o.clave}</button>`).join("")}
                        </div>
                        <label class="pl-sr" for="pl-estado">Estado</label>
                        <select id="pl-estado" class="pl-select"><option value="">Todos los estados</option>${i.map(([o,f])=>`<option value="${t(o)}">${t(o)} (${f})</option>`).join("")}</select>
                    </div>
                    <ol class="pl-list" data-list></ol>
                    <div class="pl-layers">
                        <p class="pl-mini">Capas de infraestructura</p>
                        ${W.filter(o=>o.key!=="petroliferos").map(o=>`<label><input type="checkbox" data-network="${o.key}"> <span class="pl-swatch" style="--c:${o.swatch}"></span>${t(o.label)}</label>`).join("")}
                    </div>
                </aside>
                <div class="pl-mapcol">
                    <div class="pl-map" data-map role="region" aria-label="Mapa de polos de desarrollo"></div>
                    <p class="pl-legend">${O.map(o=>`<span class="pl-legend-pin">${V(o.clave)}${o.clave}</span>`).join("")}<span><i class="is-area"></i>Polígono del polo (al acercar)</span><span>Polo sin polígono: ubicación aproximada en su municipio</span></p>
                </div>
                <article class="pl-detail" data-detail hidden></article>
            </div>

            ${A}<h2 class="pl-h2">Polos por estado</h2>
            <ol class="pl-estados">
                ${i.map(([o,f])=>`<li><button type="button" data-estado="${t(o)}"><span>${t(o)}</span><span class="pl-bar-t"><i style="--w:${f/i[0][1]*100}%"></i></span><b>${f}</b></button></li>`).join("")}
            </ol>

            ${(u=a.incentivos)!=null&&u.length?`${A}<h2 class="pl-h2">Qué ofrece un polo</h2><ul class="pl-bullets">${a.incentivos.map(o=>`<li>${pa(o)}</li>`).join("")}</ul>`:""}


            ${A}<h2 class="pl-h2">Fuentes oficiales</h2>
            <ul class="pl-bullets pl-fuentes">${(a.fuentes||[]).map(o=>U(o.url)?`<li><a class="pl-link pl-link--external" href="${t(o.url)}" target="_blank" rel="noopener">${t(o.titulo)}</a></li>`:`<li>${t(o.titulo)}</li>`).join("")}</ul>
        </section>`,L(),X(),K()}function B(){return l.data.polos.filter(a=>(l.figura==="todas"||a.figura===l.figura)&&(!l.estado||a.estado===l.estado))}function L(){const a=B().sort((e,s)=>(e.estatus==="abrogada")-(s.estatus==="abrogada")||e.estado.localeCompare(s.estado,"es")||e.nombre.localeCompare(s.nombre,"es"));v("[data-list]").innerHTML=a.map(e=>{var s;return`
            <li><button type="button" data-polo="${t(e.id)}" class="${e.id===l.selected?"is-on":""} ${e.estatus==="abrogada"?"is-off":""}" style="--c:${(s=E[e.figura])==null?void 0:s.color}">
                <i></i><span><b>${t(e.nombre)}</b><small>${t(e.figura)} · ${t(e.estado)}${e.estatus==="abrogada"?" · abrogada":""}</small></span>
            </button></li>`}).join("")||'<li class="pl-empty">Sin polos con este filtro.</li>'}function X(){r=m.map(v("[data-map]"),{zoomControl:!0,attributionControl:!0,minZoom:4}).fitBounds(R),Y(m,r)("mapa"),F=aa(m,r),r.createPane("polos").style.zIndex=420,l.data.polos.forEach(a=>{var u;const e=((u=E[a.figura])==null?void 0:u.color)||E.PODEBI.color,s=l.features.get(a.id),i=ta(a,s);if(!i)return;const d=m.featureGroup(),g=s?m.geoJSON(s,{pane:"polos",style:{color:e,weight:2,fillColor:e,fillOpacity:.22}}).bindTooltip(`${t(a.nombre)} · polígono de la declaratoria`,{sticky:!0}).on("click",()=>T(a.id)):null,c=m.marker(i.latlng,{icon:C(a,!1),riseOnHover:!0,keyboard:!0,title:a.nombre,alt:`${a.nombre}, ${a.figura}`}).bindTooltip(`${t(a.nombre)} · ${t(a.figura)}`,{direction:"top",offset:[0,-40]}).addTo(d);d.on("click",()=>T(a.id)),d.addTo(r),w.set(a.id,{group:d,pin:c,area:g,where:i,feature:s,polo:a})}),r.on("zoomend",D),setTimeout(()=>r==null?void 0:r.invalidateSize(),50)}function C(a,e){return m.divIcon({className:"pl-pin",html:V(a.figura,{abrogada:a.estatus==="abrogada",selected:e}),iconSize:[36,46],iconAnchor:[18,42],tooltipAnchor:[0,0]})}function j(a){w.forEach((e,s)=>{e.pin.setIcon(C(e.polo,s===a)),e.pin.setZIndexOffset(s===a?1e3:0)})}function D(){if(!r)return;const a=r.getZoom()>=ra;w.forEach(e=>{e.area&&(a&&r.hasLayer(e.group)?e.area.addTo(r):r.removeLayer(e.area))})}const H=a=>a.area?a.area.getBounds():a.group.getBounds();function I(){const a=new Set(B().map(s=>s.id));w.forEach((s,i)=>{a.has(i)?s.group.addTo(r):r.removeLayer(s.group)}),D(),L();const e=m.latLngBounds([]);a.forEach(s=>{const i=w.get(s);i&&e.extend(H(i))}),e.isValid()&&(l.figura!=="todas"||l.estado)?r.fitBounds(e.pad(.3),{maxZoom:10}):l.figura==="todas"&&!l.estado&&r.fitBounds(R)}function K(){n.addEventListener("click",a=>{const e=a.target.closest("[data-figura]");if(e){l.figura=e.dataset.figura,n.querySelectorAll("[data-figura]").forEach(d=>d.classList.toggle("is-on",d===e)),I();return}const s=a.target.closest("[data-estado]");if(s){l.estado=s.dataset.estado,v("#pl-estado").value=l.estado,I(),v(".pl-mapbox").scrollIntoView({behavior:"smooth",block:"start"});return}const i=a.target.closest("[data-polo]");if(i){T(i.dataset.polo);return}if(a.target.closest("[data-close]")){J();return}a.target.closest("[data-near]")&&Q()}),v("#pl-estado").addEventListener("change",a=>{l.estado=a.target.value,I()}),n.querySelectorAll("[data-network]").forEach(a=>a.addEventListener("change",()=>{a.disabled=!0,F.toggle(a.dataset.network,a.checked,$.signal).catch(()=>{a.checked=!1}).finally(()=>{a.disabled=!1})}))}function J(){l.selected=null,j(null),P(),v("[data-detail]").hidden=!0,L(),k(_(null))}function T(a,{route:e=!0}={}){var o,f,y,b,M,G;const s=(o=l.data)==null?void 0:o.polos.find(h=>h.id===a);if(!s)return;l.selected=a,j(a),P(),e&&k(_(a)),L();const i=w.get(a),d=window.matchMedia("(max-width: 900px)").matches?[0,0]:[380,0];i&&r.fitBounds(H(i).pad(i.area?.4:0),{maxZoom:i.area?15:10,paddingBottomRight:d});const g=v("[data-detail]");g.hidden=!1,g.style.setProperty("--c",(f=E[s.figura])==null?void 0:f.color);const c=(y=l.data.figuras)==null?void 0:y.find(h=>h.clave===s.figura),u=(b=i==null?void 0:i.feature)==null?void 0:b.properties;g.innerHTML=`
            <button type="button" class="pl-x" data-close aria-label="Cerrar ficha">×</button>
            <p class="pl-figura-k">${t(s.figura)}${s.estatus==="abrogada"?' · <span class="pl-off">declaratoria abrogada</span>':""}</p>
            <h3>${t(s.nombre)}</h3>
            <p class="pl-where">${t((s.municipios||[]).join(", "))}${(M=s.municipios)!=null&&M.length?", ":""}${t(s.estado)}</p>
            <dl class="pl-dl">
                ${c?`<dt>Declara</dt><dd>${t(c.autoridad)}</dd>`:""}
                ${s.superficie_ha?`<dt>Superficie</dt><dd>${S(s.superficie_ha,2)} ha</dd>`:""}
                ${(G=s.vocaciones)!=null&&G.length?`<dt>Vocaciones</dt><dd>${s.vocaciones.map(t).join(" · ")}</dd>`:""}
                <dt>Ubicación</dt><dd>${i!=null&&i.feature?da(u,s):"Aproximada, centro del municipio"}</dd>
            </dl>
            <h4>Trazabilidad oficial</h4>
            <ol class="pl-hitos">${la(s).map(h=>`
                <li><time>${t(Z(h.fecha))}</time><b>${t(ca[h.tipo]||"Aviso")}</b><span>${U(h.url)?`<a href="${t(h.url)}" target="_blank" rel="noopener">${t(h.titulo)}</a>`:t(h.titulo)}</span></li>`).join("")||'<li class="pl-empty">Sin publicaciones registradas.</li>'}</ol>
            <h4>Qué hay cerca <small>(${N} km)</small></h4>
            <div data-near-box><button type="button" class="pl-btn" data-near>Ver permisos de energía cercanos</button></div>`,g.scrollTop=0,window.matchMedia("(max-width: 900px)").matches&&g.scrollIntoView({behavior:"smooth",block:"start"})}function P(){l.nearLayer&&(r==null||r.removeLayer(l.nearLayer),l.nearLayer=null)}async function Q(){var i;const a=l.selected,e=(i=w.get(a))==null?void 0:i.where,s=v("[data-near-box]");if(!(!e||!s)){s.innerHTML='<p class="pl-mini">Buscando permisos de la CNE alrededor del polo…</p>';try{const d=await Promise.all(na.map(async c=>{var o,f;(o=l.permits)[f=c.key]||(o[f]=x(`/api/mapa/capa?tipo=${c.key}`,$.signal).then(y=>y.features||[]));const u=await l.permits[c.key];return{m:c,near:ia(u.filter(y=>{var b;return((b=y.properties)==null?void 0:b.vigente)!==!1}),e.latlng,N)}}));if(l.selected!==a)return;P(),l.nearLayer=m.layerGroup().addTo(r),d.forEach(({m:c,near:u})=>u.forEach(({feature:o})=>{const[f,y]=o.geometry.coordinates,b=o.properties,M=c.key==="electricidad"?ea(c.key,b).tech:"";(M?m.marker([y,f],{icon:m.divIcon({className:"pl-pin",html:oa(M,{variant:"dot",size:20}),iconSize:[28,28],iconAnchor:[14,14]})}):m.circleMarker([y,f],{radius:6,color:"#fff",weight:1.5,fillColor:c.color,fillOpacity:.95})).bindPopup(`<strong>${t(b.nombre)}</strong><br><small>${t(b.numeroPermiso)} · ${t(b.tecnologia||b.tipoPermiso||c.label)}</small><br><a href="${z({permit:b.numeroPermiso})}">Ficha del permiso</a>`).addTo(l.nearLayer)})),m.circle(e.latlng,{radius:N*1e3,color:E.PODEBI.color,weight:1,dashArray:"4 4",fill:!1,interactive:!1}).addTo(l.nearLayer);const g=d.flatMap(({m:c,near:u})=>u.map(o=>({...o,m:c}))).sort((c,u)=>c.km-u.km);s.innerHTML=`
                <ul class="pl-near-counts">${d.map(({m:c,near:u})=>`<li style="--c:${c.color}"><b>${u.length}</b> ${t(c.label.toLowerCase())}</li>`).join("")}</ul>
                ${g.length?`<ol class="pl-near">${g.slice(0,8).map(({feature:c,km:u,m:o})=>`<li style="--c:${o.color}"><a href="${z({permit:c.properties.numeroPermiso})}">${t(c.properties.nombre)}</a><small>${S(u,1)} km · ${t(c.properties.tecnologia||o.label)}</small></li>`).join("")}</ol>`:'<p class="pl-mini">No hay permisos vigentes de generación eléctrica ni de gas natural en este radio.</p>'}
                <p class="pl-mini">Permisos vigentes del registro público de la CNE con ubicación conocida.</p>`,r.fitBounds(m.latLng(e.latlng).toBounds(N*2200))}catch(d){d.name!=="AbortError"&&(s.innerHTML='<p class="pl-mini">No se pudieron consultar los permisos cercanos. <button type="button" class="pl-link" data-near>Reintentar</button></p>')}}}return{show(a){if(!l.data){p=a;return}a?T(a,{route:!1}):l.selected&&(l.selected=null,j(null),P(),v("[data-detail]").hidden=!0,L())},destroy(){$.abort(),r==null||r.remove(),r=null}}}export{ha as renderPolosView};
