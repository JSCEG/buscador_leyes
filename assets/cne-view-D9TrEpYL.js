const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/cne-sener-view-DGn1HaqN.js","assets/index-CFveNp9A.js","assets/index-ClUgN6t9.css","assets/permits-map-DlntHS5b.js","assets/permits-map-CflzZUgv.css","assets/map-common-DZckAVrU.js","assets/cne-sener-view-CZwVSzJo.css","assets/permits-map-view-BlFd8gNW.js","assets/leaflet-src-De2SSmXW.js","assets/_commonjsHelpers-Cpj98o6Y.js","assets/leaflet-Dgihpmma.css","assets/MarkerCluster-4Oo7lyRB.css"])))=>i.map(i=>d[i]);
import{R as Me,S as Oe,t as ue,v as me,w as je,x as D,y as fe,z as te,B as be,C as he,D as x,E as $e,F as Ve,G as De,H as Be,J as we,K as Ge,L as w,q as ne,M as Ue,N as Ye,O as ze,Q as Je,T as Ke,U as Z,V as ie,W as We,X as Ze,Y as ye,Z as Xe,$ as ge,a0 as Qe,a1 as Y,a2 as et,a3 as tt,a4 as at,a5 as ve,_ as Ee}from"./index-CFveNp9A.js";import{e as a,s as z,g as ke,P as xe,n as F,p as le,f as re,l as Ae,d as G,a as st}from"./cne-shared-Y3foXuyV.js";const Se=20,nt=1500,ot=Oe.filter(b=>b.autoridad==="CNE"),Ce=b=>re(b,Me),it={Vigente:"ok",Operando:"ok","Por iniciar operaciones":"info","En Construcción":"info","Por iniciar obras":"info"};function lt(b,f=[],{onOpenLaw:S=()=>{},permit:P=null,onRoute:M=()=>{}}={}){const o={numero:"",titular:"",tabla:"",estatus:"",start:0};let g=[],i=0,d=null,m=0,y=!0;const t=document.createElement("div");t.className="pm-panel",t.innerHTML=`
        <form class="pm-form" role="search" novalidate>
            <label><span>Número de permiso</span><input name="numero" placeholder="Ej. E/1439/GEN/2015" autocomplete="off"></label>
            <label><span>Razón social</span><input name="titular" placeholder="Ej. Eólica Cerritos" autocomplete="off"></label>
            <label><span>Actividad</span><select name="tabla"><option value="">Todas las actividades CNE</option>${ot.map(e=>`<option value="${a(e.key)}">${a(e.label)}</option>`).join("")}</select></label>
            <label><span>Estatus</span><select name="estatus"><option value="">Todos</option><option value="Vigente">Vigente</option><option value="No vigente">No vigente</option></select></label>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${Me}" target="_blank" rel="noopener">Registro Público de la CNE</a>, en la copia que se actualiza cada semana. Para efectos legales, consulta el documento oficial en PDF.</p>`,b.replaceChildren(t);const r=t.querySelector(".pm-form"),u=t.querySelector(".pm-status"),p=t.querySelector(".pm-body");let h=null;const E=async()=>{h??(h=await Promise.race([Ue(),new Promise(e=>setTimeout(()=>e(null),nt))]))},C=e=>`${e.tabla||"cne"}:${e.id||e.numero}`,n=(e,$)=>`<a class="pm-card-pdf" href="${a(e)}" target="_blank" rel="noopener" aria-label="Título de permiso ${a($)} en PDF" title="Título de permiso (PDF)">PDF</a>`;function l(e){return e?`<span class="pm-estado is-${it[e]||"off"}">${a(e)}</span>`:""}function N(e){var j;const $=Ye(e.numero,{technology:ze(h,e.numero)}),{sector:c,activity:v}=me(e.numero),k=D(e.ligaPermiso)||D(e.fuenteUrl),A=e.efId&&e.efId!=="--"?fe(e.efId,e.entidad):e.entidad||"",I=((j=te[e.tabla])==null?void 0:j.label)||$e(e);return`
            <li><button type="button" class="pm-card" data-permit="${a(C(e))}" data-sector="${(c==null?void 0:c.id)||"otro"}">
                <span class="pm-card-top"><span class="pm-num">${a(e.numero)}</span>${l(e.estatus||e.estatusFuente)}</span>
                <span class="pm-tipo">${Je($)}<span class="pm-tipo-t">${a(e.tipo||$.label)}</span></span>
                <span class="pm-holder">${a(e.razonSocial||"Titular sin dato")}</span>
                <span class="pm-meta">
                    ${c?`<span class="pm-tag">${a(c.label)}${v?` · ${a(v)}`:""}</span>`:I?`<span class="pm-tag">${a(I)}</span>`:""}
                    ${A?`<span>${a(A)}</span>`:""}
                </span>
            </button>
            <span class="pm-card-tools">${be(he(e.numero),{compact:!0})}${k?n(k,e.numero):""}</span></li>`}function R(){if(!g.length&&d){u.textContent="",p.innerHTML=ne({title:"Sin permisos recientes con estos filtros",body:"Busca por número de permiso o por razón social (mínimo 2 caracteres)."});return}if(!g.length){u.textContent="",p.innerHTML=ne({title:"Ningún permiso coincide",body:"Revisa el número o prueba con una parte de la razón social (mínimo 2 caracteres)."});return}const e=o.start+1,$=o.start+g.length;u.textContent=`${d?"Últimos permisos otorgados · ":""}${F(e)}–${F($)} de ${le(i,"permiso","permisos")}`,p.innerHTML=`
            <ul class="pm-list">${g.map(N).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${o.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${$<i?"":"disabled"}>Siguientes →</button>
            </nav>`,O()}function O(){const e=g;for(const $ of e.filter(c=>!D(c.ligaPermiso)&&!D(c.fuenteUrl)&&c.numero))Ke($.numero).then(c=>{var k,A;if(!y||g!==e||!c.ligaPermiso)return;$.ligaPermiso=c.ligaPermiso;const v=[...p.querySelectorAll("[data-permit]")].find(I=>I.dataset.permit===C($));(A=(k=v==null?void 0:v.closest("li"))==null?void 0:k.querySelector(".pm-card-tools"))==null||A.insertAdjacentHTML("beforeend",n(c.ligaPermiso,$.numero))}).catch(()=>{})}async function _(){const e=++m;p.innerHTML=z(6),u.textContent="Consultando los permisos de la CNE…";try{const[$]=await Promise.all([ue({...o,pageSize:Se}),E()]);if(!y||e!==m)return;g=$.rows,i=$.total,d=$.recientes||null,R()}catch{if(!y||e!==m)return;u.textContent="",p.innerHTML=Ce("los permisos")}}function J(e){if(!e)return[];const $=typeof f=="function"?f()||[]:f;return e.laws.map(c=>Ae($,c)).filter((c,v,k)=>c&&k.indexOf(c)===v)}async function s(e,{updateRoute:$=!0}={}){var pe,de;$&&M(e.numero);const{sector:c,activity:v}=me(e.numero),k=J(c),A=je(e.numero),I=D(e.ligaPermiso)||D(e.fuenteUrl),_e=[e.efId&&e.efId!=="--"?fe(e.efId,e.entidad):e.entidad||"",e.municipio].filter(Boolean).join(" · ");u.textContent="",p.innerHTML=`
            <article class="pm-detail" data-sector="${(c==null?void 0:c.id)||"otro"}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${c?`${a(c.label)}${v?` · ${a(v)}`:""}`:a(((pe=te[e.tabla])==null?void 0:pe.label)||"Permiso")}</span>${l(e.estatus||e.estatusFuente)}</div>
                    <h2 id="pm-detail-title">${a(e.numero)}</h2>
                    <p class="pm-holder">${a(e.razonSocial||"Titular sin dato")}</p>
                    ${e.tipo?`<p class="pm-alias">${a(e.tipo)}</p>`:""}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" data-pdf-link href="${a(I||"#")}" target="_blank" rel="noopener"${I?"":" hidden"}>Ver título de permiso (PDF)</a>
                        ${be(he(e.numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                        <a class="pm-btn" href="${x({mapPermit:e.numero})}" data-map-link${e.coordenadasValidas?"":" hidden"}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Ver en el mapa</a>
                    </div>
                </div>
                <dl class="pm-facts" data-facts>
                    <div><dt>Actividad</dt><dd>${a(((de=te[e.tabla])==null?void 0:de.label)||"—")}</dd></div>
                    <div><dt>Mercado</dt><dd>${a($e(e)||"—")}</dd></div>
                    <div><dt>Ubicación</dt><dd>${a(_e||"—")}</dd></div>
                    <div><dt>Estatus</dt><dd>${a(Ve(e)||"—")}</dd></div>
                    <div><dt>Actualización</dt><dd>${a(De(e.fechaActualizacion)||"—")}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Resoluciones en PDF</h3>
                    <div class="pm-res">${z(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${k.length?`<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${k.map(L=>`<button type="button" class="pm-law" data-law="${a(L.id)}"><b>${a(L.siglas||"")}</b><span>${a(L.titulo)}</span></button>`).join("")}</div>`:'<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${A?ke(A):""}
                </section>
            </article>`,p.scrollIntoView({behavior:"smooth",block:"start"});const ce=p.querySelector("[data-facts]");e.tabla&&e.numero&&Be("detalle",{tabla:e.tabla,numero:e.numero}).then(L=>{if(!y||!ce.isConnected)return;const q=we((L==null?void 0:L.data)||L);q.length&&ce.insertAdjacentHTML("beforeend",q.map(H=>`<div><dt>${a(H.label)}</dt><dd>${a(H.value)}</dd></div>`).join(""))}).catch(()=>{});const K=p.querySelector(".pm-res"),Q=p.querySelector("[data-pdf-link]");Ge(e.numero).then(L=>{if(!y||!K.isConnected)return;const q=L.ligaPermiso||I;q&&Q.isConnected&&(Q.href=q,Q.hidden=!1);const H=[...L.resoluciones,{numero:null,liga:L.ligaResolucion},{numero:null,liga:D(e.ligaResolucion)}].filter(V=>V.liga).reduce((V,U)=>{const B=V.find(Ie=>Ie.liga===U.liga);return B?B.numero||(B.numero=U.numero):V.push({...U}),V},[]);K.innerHTML=H.length?`<ol class="pm-timeline">${H.map(({numero:V,liga:U},B)=>`
                    <li class="${B===0?"is-first":""}">
                        <div>
                            <p class="pm-res-type">${V?a(V):"Resolución"}</p>
                            <div class="pm-res-links">
                                <a class="pm-res-pdf" href="${a(U)}" target="_blank" rel="noopener" aria-label="Ver resolución ${a(V||"")} en PDF">${xe}Ver resolución (PDF)</a>
                            </div>
                        </div>
                    </li>`).join("")}</ol>`:'<p class="pm-note">No hay ligas a resoluciones registradas para este permiso.</p>'}).catch(()=>{K.isConnected&&(K.innerHTML='<p class="pm-note">No se pudieron cargar las ligas a resoluciones de este permiso.</p>')});const ee=p.querySelector("[data-map-link]");e.coordenadasValidas||fetch(`/api/mapa/buscar?q=${encodeURIComponent(e.numero)}&limite=5`,{credentials:"same-origin"}).then(L=>L.ok?L.json():null).then(L=>{const q=((L==null?void 0:L.resultados)||[]).find(H=>w(H.numeroPermiso)===w(e.numero)&&H.latitud!=null);!y||!q||!ee.isConnected||(ee.href=x({mapPermit:q.numeroPermiso}),ee.hidden=!1)}).catch(()=>{}),p.querySelector(".pm-back").addEventListener("click",()=>{M(null),g.length?R():_()}),p.querySelector(".pm-share").addEventListener("click",L=>{var H;const q=`${location.origin}${location.pathname}#permiso=${encodeURIComponent(e.numero)}`;(H=navigator.clipboard)==null||H.writeText(q).then(()=>{L.target.textContent="Enlace copiado"},()=>{})}),p.querySelectorAll("[data-law]").forEach(L=>L.addEventListener("click",()=>{const q=k.find(H=>String(H.id)===L.dataset.law);q&&S(q)}))}async function T(e){const $=++m;p.innerHTML=z(2),u.textContent="Buscando el permiso…";try{const c=await ue({numero:e,pageSize:10});if(!y||$!==m)return;const v=c.rows.find(k=>w(k.numero)===w(e)||w(k.numeroNorm)===w(e))||(c.rows.length===1?c.rows[0]:null);if(v){g=[],s(v,{updateRoute:!1});return}r.numero.value=e,o.numero=e,g=c.rows,i=c.total,d=c.recientes||null,R()}catch{if(!y||$!==m)return;u.textContent="",p.innerHTML=Ce("el permiso")}}return r.addEventListener("submit",e=>{e.preventDefault(),Object.assign(o,{numero:r.numero.value.trim(),titular:r.titular.value.trim(),tabla:r.tabla.value,estatus:r.estatus.value,start:0}),M(null),_()}),r.addEventListener("reset",()=>{Object.assign(o,{numero:"",titular:"",tabla:"",estatus:"",start:0}),M(null),setTimeout(_)}),p.addEventListener("click",e=>{const $=e.target.closest("[data-page]");if($){o.start=Math.max(0,o.start+Number($.dataset.page)*Se),_().then(()=>t.scrollIntoView({behavior:"smooth",block:"start"}));return}const c=e.target.closest("[data-permit]"),v=c&&g.find(k=>C(k)===c.dataset.permit);v&&s(v)}),P?T(P):_(),{openPermit:e=>T(e),showList:()=>{g.length?R():_()},destroy:()=>{y=!1,t.remove()}}}const Te=20,Le=b=>re(b,Z),rt=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Negativa permiso","Revocación de permiso","Sanción","Visitas de verificación","Regulación","Autorización de tarifas","Recursos de reconsideración","Varios"],ct=["Electricidad","Energía eléctrica","Hidrocarburos","Petrolíferos","Gas natural","Gas licuado de petróleo","Mercados de Hidrocarburos","Otros"],pt=1995;function dt(b={}){return b.desdeExpediente?'<p class="pm-note">La CNE aún no la publica en su buscador: se muestra lo que trae el expediente del permiso. El proemio y el fundamento aparecerán cuando la indexe.</p>':""}function ut(b=""){return String(b).trim()?"Si es reciente, puede que la CNE aún no la publique en su buscador: ábrela desde el expediente de su permiso, en «Detalle y fundamento».":"Prueba con menos filtros o con una parte del texto."}function mt(b,f=[],{resolution:S=null,filters:P=null,onRoute:M=()=>{}}={}){const o={numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0};let g=[],i=0,d=0,m=!0;const y=()=>typeof f=="function"?f()||[]:f,t=new Date().getFullYear(),r=Array.from({length:t-pt+1},(s,T)=>t-T),u=document.createElement("div");u.className="pm-panel",u.innerHTML=`
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${r.map(s=>`<option>${s}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${rt.map(s=>`<option value="${a(s)}">`).join("")}</datalist>
            <datalist id="pm-res-modes">${ct.map(s=>`<option value="${a(s)}">`).join("")}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${Z}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`,b.replaceChildren(u);const p=u.querySelector("form"),h=u.querySelector(".pm-status"),E=u.querySelector(".pm-body");function C(s){return`
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${a(s.NumeroResolucion)}" data-sector="${Ne(s.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${a(s.NumeroResolucion)}</span><span class="pm-date">${a(G(s.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${a(s.TipoResolucion||"Resolución")}</span>
                <span class="pm-alias">${a(s.Proemio||"")}</span>
                <span class="pm-meta">${s.ModalidadResolucion?`<span class="pm-tag">${a(s.ModalidadResolucion)}</span>`:""}${s.NumeroActa?`<span>${a(s.NumeroActa)}</span>`:""}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${a(ye(s.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${a(s.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`}function n(){if(!g.length){h.textContent="",E.innerHTML=ne({title:"Ninguna resolución coincide",body:ut(o.numero)});return}const s=o.start+g.length;h.textContent=`${F(o.start+1)}–${F(s)} de ${le(i,"resolución","resoluciones")} · más recientes primero`,E.innerHTML=`
            <ul class="pm-list">${g.map(C).join("")}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${o.start?"":"disabled"}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${s<i?"":"disabled"}>Siguientes →</button>
            </nav>`}async function l(){const s=++d;E.innerHTML=z(6),h.textContent="Consultando las resoluciones de la CNE…";try{const T=await ie(o,{start:o.start,length:Te});if(!m||s!==d)return;g=T.rows,i=T.total,n()}catch{if(!m||s!==d)return;h.textContent="",E.innerHTML=Le("las resoluciones")}}function N(s){const T=ge(s);return T.length?`<ul class="pm-found">${T.map((e,$)=>{const c=st(y(),e.law);return`<li data-found="${$}" ${c?`data-law-id="${a(c.id)}"`:""}>
                <p class="pm-found-law">${c?`<b>${a(c.siglas||"")}</b> `:""}${a(e.law)}${c?"":" <small>(no está en el acervo)</small>"}</p>
                <p class="pm-found-arts">${e.articles.map(v=>`<span class="pm-art" data-art="${a(v)}">Art. ${a(v)}</span>`).join("")}</p>
            </li>`}).join("")}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${a(s)}</p></details>`:s?`<p class="pm-note">${a(s)}</p>`:'<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>'}async function R(s,T){const e=ge(T);await Promise.all(e.map(async($,c)=>{const v=s.querySelector(`[data-found="${c}"][data-law-id]`);if(!v)return;const k=await Qe(v.dataset.lawId,$.articles);!m||!v.isConnected||v.querySelectorAll("[data-art]").forEach(A=>{const I=k[A.dataset.art];if(!I)return;const j=document.createElement("button");j.type="button",j.className="pm-art is-linked",j.dataset.article=I,j.textContent=A.textContent,j.title="Abrir el artículo",A.replaceWith(j)})}))}function O(s,{updateRoute:T=!0}={}){T&&M(s.NumeroResolucion);const e=We(s.Proemio),$=Ze(s),c=ye(s.ResolucionId);h.textContent="",E.innerHTML=`
            <article class="pm-detail" data-sector="${Ne(s.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${a(s.TipoResolucion||"Resolución")}${s.ModalidadResolucion?` · ${a(s.ModalidadResolucion)}`:""}</span><span class="pm-date">${a(G(s.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${a(s.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${a(s.Proemio||"")}</p>
                    <div class="pm-actions">
                        ${c?`<a class="pm-btn pm-btn-primary" href="${a(c)}" target="_blank" rel="noopener">${xe}Ver resolución (PDF)</a>`:""}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${a(G(s.FechaResolucion)||"—")}</dd></div>
                    <div><dt>Sesión</dt><dd>${a(s.NumeroActa||"—")}</dd></div>
                    ${s.Ponente?`<div><dt>Ponente</dt><dd>${a(s.Ponente)}</dd></div>`:""}
                </dl>
                ${dt(s)}
                ${e.length?`<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${e.map(v=>`<a class="pm-law" href="${x({permit:v})}"><b>Permiso</b><span>${a(v)}</span></a>`).join("")}</div>
                </section>`:""}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">${s.desdeExpediente?"Se verá cuando la CNE publique la resolución en su buscador; mientras, consúltalo en el PDF.":"Artículos que cita la resolución. Los que están en el acervo se pueden abrir."}</p>
                    <div class="pm-found-host">${s.desdeExpediente?"":N(s.Fundamentacion||"")}</div>
                    ${$?ke($,"Guía de este tipo de trámite"):""}
                </section>
            </article>`,E.scrollIntoView({behavior:"smooth",block:"start"}),R(E.querySelector(".pm-found-host"),s.Fundamentacion||"").catch(()=>{}),E.querySelector(".pm-back").addEventListener("click",()=>{M(null),g.length?n():l()}),E.querySelector(".pm-share").addEventListener("click",v=>{var A;const k=`${location.origin}${location.pathname}${x({resolution:s.NumeroResolucion})}`;(A=navigator.clipboard)==null||A.writeText(k).then(()=>{v.target.textContent="Enlace copiado"},()=>{})})}async function _(s){const T=++d;E.innerHTML=z(2),h.textContent="Buscando la resolución…";try{const e=await Xe(s);if(!m||T!==d)return;if(e){g=[],O(e,{updateRoute:!1});return}p.numero.value=s,o.numero=s,l()}catch{if(!m||T!==d)return;h.textContent="",E.innerHTML=Le("la resolución")}}p.addEventListener("submit",s=>{s.preventDefault(),Object.assign(o,{numero:p.numero.value.trim(),texto:p.texto.value.trim(),fecha:p.fecha.value,tipo:p.tipo.value.trim(),modalidad:p.modalidad.value.trim(),start:0}),M(null),l()}),p.addEventListener("reset",()=>{Object.assign(o,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",start:0}),M(null),setTimeout(l)}),E.addEventListener("click",s=>{const T=s.target.closest("[data-article]");if(T){document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:T.dataset.article,list:[T.dataset.article]}}));return}const e=s.target.closest("[data-page]");if(e){o.start=Math.max(0,o.start+Number(e.dataset.page)*Te),l().then(()=>u.scrollIntoView({behavior:"smooth",block:"start"}));return}const $=s.target.closest("[data-resolution]"),c=$&&g.find(v=>v.NumeroResolucion===$.dataset.resolution);c&&O(c)});function J(s={}){Object.assign(o,{numero:"",texto:"",fecha:"",tipo:"",modalidad:"",...s,start:0});for(const T of["numero","texto","fecha","tipo","modalidad"])p[T].value=o[T]||"";l()}return S?_(S):P&&Object.keys(P).length?J(P):l(),{openResolution:s=>_(s),applyFilters:J,showList:()=>{g.length?n():l()},destroy:()=>{m=!1,u.remove()}}}function Ne(b=""){const f=b.toLowerCase();return/el[eé]ctric/.test(f)?"electricidad":/licuado/.test(f)?"gaslp":/gas natural/.test(f)?"gasnatural":/petrol|hidrocarb/.test(f)?"petroliferos":"otro"}const qe="cne-panorama-v1",ft=12*60*60*1e3,Re=12,ae=["Otorgamiento de permiso","Modificación de permiso","Terminación de permiso","Transferencia de permiso","Visitas de verificación","Sanción","Regulación","Varios"],oe=[{label:"Electricidad",filter:"Electricidad"},{label:"Petrolíferos",filter:"Petrolíferos"},{label:"Gas licuado de petróleo",filter:"Gas licuado"},{label:"Gas natural",filter:"Gas natural"},{label:"Hidrocarburos",filter:"Hidrocarburos"},{label:"Otros",filter:"Otros"}];async function bt(b,f=3){const S=[];for(let P=0;P<b.length;P+=f)S.push(...await Promise.all(b.slice(P,P+f).map(M=>M())));return S}function ht(){try{const b=JSON.parse(localStorage.getItem(qe)||"null");return b&&Date.now()-b.at<ft?b.data:null}catch{return null}}function $t(b){try{localStorage.setItem(qe,JSON.stringify({at:Date.now(),data:b}))}catch{}}async function yt(){const f=new Date().getFullYear(),S=Array.from({length:Re},(m,y)=>f-Re+1+y),[P,M,...o]=await bt([()=>et({length:1}).then(m=>m.total),()=>Y({}),...S.map(m=>()=>Y({fecha:String(m)})),...ae.map(m=>()=>Y({fecha:String(f),tipo:m})),...oe.map(m=>()=>Y({fecha:String(f),modalidad:m.filter}))]),g=S.map((m,y)=>({year:m,count:o[y]})),i=ae.map((m,y)=>({label:m,count:o[S.length+y]})),d=oe.map((m,y)=>({label:m.label,count:o[S.length+ae.length+y]}));return{year:f,permits:P,resolutions:M,thisYear:g.at(-1).count,perYear:g,byType:i,byMode:d,at:Date.now()}}function gt(b){let f=!0;const S=document.createElement("div");S.className="pm-panel pn-view",S.innerHTML=`
        <p class="pm-status" role="status" aria-live="polite">Reuniendo las cifras de la CNE…</p>
        <div class="pn-body"><div class="pn-kpis">${'<div class="pn-kpi pm-skel"><i></i><i></i></div>'.repeat(4)}</div></div>
        <p class="pm-source">Fuente: registro público y resoluciones de la <a href="${Z}" target="_blank" rel="noopener">CNE</a>. Cifras calculadas con los filtros públicos de la CNE; se actualizan cada 12 horas.</p>`,b.replaceChildren(S);const P=S.querySelector(".pm-status"),M=S.querySelector(".pn-body"),o=(i,d,m)=>{const y=Math.max(1,...i.map(t=>t.count));return`<ul class="pn-bars">${i.filter(t=>t.count>0).sort((t,r)=>r.count-t.count).map((t,r)=>`
            <li><a class="pn-bar-row" href="${x({tab:"resoluciones",filters:m(t)})}" data-tip="${a(`${t.label}: ${F(t.count)} ${d}. Ver cuáles`)}" style="--i:${r}">
                <span class="pn-bar-label">${a(t.label)}</span>
                <span class="pn-bar-track"><span class="pn-bar" style="width:${Math.max(2,Math.round(t.count/y*100))}%"></span></span>
                <span class="pn-bar-value">${F(t.count)}<span class="sr-only"> ${d}</span></span>
            </a></li>`).join("")}</ul>`};function g(i,d,m){const y=Math.max(1,...i.perYear.map(t=>t.count));P.textContent=`Actualizado ${new Date(i.at).toLocaleString("es-MX",{dateStyle:"medium",timeStyle:"short"})}`,M.innerHTML=`
            <div class="pn-kpis">
                <a class="pn-kpi" href="${x({tab:"permisos"})}"><b>${F(i.permits)}</b><span>permisos en el registro</span></a>
                <a class="pn-kpi" href="${x({tab:"resoluciones"})}"><b>${F(i.resolutions)}</b><span>resoluciones publicadas</span></a>
                <div class="pn-kpi"><b>${F(i.thisYear)}</b><span>resoluciones en ${i.year}</span></div>
                ${m?`<a class="pn-kpi" href="${x({tab:"resoluciones"})}"><b>${a(G(m.date))}</b><span>última sesión (${a(m.acta)})${m.count?`: ${le(m.count,"resolución","resoluciones")}`:""}</span></a>`:""}
            </div>
            <section class="pm-section pn-years" aria-labelledby="pn-years-title">
                <h3 id="pn-years-title">Resoluciones por año</h3>
                <ol class="pn-columns">${i.perYear.map((t,r)=>`
                    <li><a href="${x({tab:"resoluciones",filters:{fecha:String(t.year)}})}" data-tip="${a(`${t.year}: ${F(t.count)} resoluciones. Ver cuáles`)}" style="--i:${r}">
                        <span class="pn-col-value">${F(t.count)}</span>
                        <span class="pn-col" style="height:${Math.max(2,Math.round(t.count/y*100))}%"></span>
                        <span class="pn-col-label">${t.year===i.year?`${t.year}*`:t.year}</span>
                    </a></li>`).join("")}</ol>
                <p class="pm-note">* ${i.year} va en curso. Toca un año o una barra para ver sus resoluciones.</p>
            </section>
            <div class="pn-grid">
                <section class="pm-section" aria-labelledby="pn-type-title"><h3 id="pn-type-title">${i.year} por tipo</h3>${o(i.byType,"resoluciones",t=>({fecha:String(i.year),tipo:t.label}))}</section>
                <section class="pm-section" aria-labelledby="pn-mode-title"><h3 id="pn-mode-title">${i.year} por modalidad</h3>${o(i.byMode,"resoluciones",t=>{var r;return{fecha:String(i.year),modalidad:((r=oe.find(u=>u.label===t.label))==null?void 0:r.filter)||t.label}})}</section>
            </div>
            <section class="pm-section" aria-labelledby="pn-latest-title">
                <h3 id="pn-latest-title">Lo más reciente</h3>
                ${d.length?`<ol class="pn-latest">${d.map(t=>`
                    <li><a href="${x({resolution:t.NumeroResolucion})}">
                        <span class="pn-latest-top"><b>${a(t.NumeroResolucion)}</b><time>${a(G(t.FechaResolucion))}</time></span>
                        <span class="pn-latest-type">${a(t.TipoResolucion||"")}${t.ModalidadResolucion?` · ${a(t.ModalidadResolucion)}`:""}</span>
                        <span class="pn-latest-text">${a(t.Proemio||"")}</span>
                    </a></li>`).join("")}</ol>`:'<p class="pm-note">Sin resoluciones recientes.</p>'}
            </section>`}return(async()=>{try{const i=ie({},{length:8}).then(r=>r.rows).catch(()=>[]);let d=ht();d||(d=await yt(),$t(d));const m=await i,y=m[0],t=y!=null&&y.NumeroActa?{date:y.FechaResolucion,acta:y.NumeroActa,count:await Y({acta:y.NumeroActa}).catch(()=>0)}:null;f&&g(d,m,t)}catch{if(!f)return;P.textContent="",M.innerHTML=re("las cifras",Z)}})(),{destroy:()=>{f=!1,S.remove()}}}const se={electricidad:"Electricidad",petroliferos:"Petrolíferos",gaslp:"Gas LP",gasnatural:"Gas natural",otro:"Otras energías"},vt=[{key:"base",title:"Normativa base",note:"Leyes y reglamentos del sector."},{key:"rules",title:"Disposiciones y requisitos específicos",note:"Disposiciones administrativas y acuerdos que regulan este trámite."},{key:"forms",title:"Formatos oficiales",note:"Formatos publicados para presentar la solicitud."},{key:"calls",title:"Convocatorias",note:"Convocatorias y sus modificaciones, de la más reciente a la más antigua."}];function Et(b,f=[],{tramite:S=null,onOpenLaw:P=()=>{},onRoute:M=()=>{}}={}){let o=!0;const g=()=>typeof f=="function"?f()||[]:f,i=u=>u.map(p=>Ae(g(),p)).filter(Boolean),d=document.createElement("div");d.className="pm-panel tr-view",b.replaceChildren(d);function m(){const u=[...new Set(ve.map(p=>p.sector))];d.innerHTML=`
            <p class="pm-note tr-disclaimer">Guías orientativas armadas con el acervo y el registro de la CNE: reúnen la normativa, los formatos y los antecedentes de cada trámite. No sustituyen los requisitos oficiales vigentes.</p>
            ${u.map(p=>`
                <section class="tr-sector" aria-labelledby="tr-sector-${p}">
                    <h3 id="tr-sector-${p}" class="tr-sector-title">${a(se[p]||p)}</h3>
                    <ul class="pm-list">${ve.filter(h=>h.sector===p).map(h=>{const E=i([...h.base,...h.rules,...h.forms,...h.calls]).length,C=i(h.forms).length,n=i(h.calls).length;return`<li><a class="pm-card tr-card" href="${x({tramite:h.id})}" data-sector="${h.sector}">
                            <span class="pm-card-top"><span class="pm-num">Guía de trámite</span>${n?'<span class="pm-estado is-info">Con convocatoria</span>':'<span class="pm-estado is-off">Sin convocatoria</span>'}</span>
                            <span class="pm-holder">${a(h.title)}</span>
                            ${h.scenario?`<span class="pm-alias">${a(h.scenario)}</span>`:""}
                            <span class="pm-meta"><span class="pm-tag">${a(se[h.sector]||"")}</span><span>${F(E)} instrumentos</span>${C?"<span>Formatos oficiales</span>":""}</span>
                            <span class="pm-card-tools tr-card-go">Ver guía <span aria-hidden="true">→</span></span>
                        </a></li>`}).join("")}</ul>
                </section>`).join("")}`}function y(u){return`<button type="button" class="pm-law" data-law="${a(u.id)}"><b>${a(u.siglas||"")}</b><span>${a(u.titulo)}</span></button>`}function t(u){const p=vt.map(n=>{let l=i(u[n.key]);return n.key==="calls"&&(l=l.sort((N,R)=>String(R.fecha_publicacion||"").localeCompare(String(N.fecha_publicacion||"")))),{...n,laws:l}}).filter(n=>n.laws.length);d.innerHTML=`
            <article class="pm-detail" data-sector="${u.sector}" aria-labelledby="tr-title">
                <a class="pm-back" href="${x({tab:"tramites"})}">← Todos los trámites</a>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">Guía de trámite · ${a(se[u.sector]||"")}</span></div>
                    <h2 id="tr-title">${a(u.title)}</h2>
                    <p class="pm-note">Guía orientativa armada con el acervo y el registro de la CNE. Consulta siempre el texto oficial vigente antes de presentar un trámite.</p>
                    <div class="pm-actions"><button type="button" class="pm-btn pm-share">Copiar enlace</button></div>
                </div>
                ${p.map(n=>`
                    <section class="pm-section" aria-labelledby="tr-${n.key}">
                        <h3 id="tr-${n.key}">${a(n.title)}</h3>
                        <p class="pm-note">${a(n.note)}</p>
                        <div class="pm-laws">${n.laws.map(y).join("")}</div>
                    </section>`).join("")}
                <section class="pm-section" aria-labelledby="tr-articles">
                    <h3 id="tr-articles">Artículos clave</h3>
                    <p class="pm-note">Artículos y numerales del acervo que tratan este trámite, por relevancia.</p>
                    <div class="tr-articles"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>
                ${u.resolutions?`<section class="pm-section" aria-labelledby="tr-res">
                    <h3 id="tr-res">Resoluciones recientes de la CNE</h3>
                    <p class="pm-note">Antecedentes de este tipo de trámite, de lo más reciente a lo más antiguo.</p>
                    <div class="tr-res"><div class="pm-skel tr-skel"><i></i><i></i><i></i></div></div>
                </section>`:""}
            </article>`,d.querySelector(".pm-share").addEventListener("click",n=>{var N;const l=`${location.origin}${location.pathname}${x({tramite:u.id})}`;(N=navigator.clipboard)==null||N.writeText(l).then(()=>{n.target.textContent="Enlace copiado"},()=>{})});const h=i(u.articles.in).map(n=>n.id),E=d.querySelector(".tr-articles");at(u.articles.query,{lawIds:h,limit:24}).then(({data:n})=>{if(!o||!E.isConnected)return;const l=new Map,N=(n||[]).filter(R=>R.id&&!/^(índice|indice|preámbulo|preambulo)/i.test(String(R.articulo_label||""))).filter(R=>{const O=l.get(R.ley_id)||0;return l.set(R.ley_id,O+1),O<3}).slice(0,8);E.innerHTML=N.length?`<ol class="tr-article-list">${N.map(R=>{var O;return`
                <li><button type="button" class="tr-article" data-article="${a(R.id)}">
                    <span class="tr-article-top"><b>${a(R.siglas_ley||((O=g().find(_=>String(_.id)===String(R.ley_id)))==null?void 0:O.siglas)||"")}</b> ${a(R.articulo_label||"")}</span>
                    <span class="tr-article-text">${a(String(R.fragmento||R.texto||"").replace(/\[\[\[|\]\]\]/g,"").slice(0,260))}</span>
                </button></li>`}).join("")}</ol>`:'<p class="pm-note">No encontramos artículos que traten este trámite en el acervo.</p>',E.dataset.ids=JSON.stringify(N.map(R=>R.id))}).catch(()=>{E.isConnected&&(E.innerHTML='<p class="pm-note">No se pudieron cargar los artículos; intenta de nuevo.</p>')});const C=d.querySelector(".tr-res");C&&ie(u.resolutions,{length:6}).then(({rows:n,total:l})=>{!o||!C.isConnected||(C.innerHTML=n.length?`
                    <ol class="pn-latest">${n.map(N=>`
                        <li><a href="${x({resolution:N.NumeroResolucion})}">
                            <span class="pn-latest-top"><b>${a(N.NumeroResolucion)}</b><time>${a(G(N.FechaResolucion))}</time></span>
                            <span class="pn-latest-type">${a(N.TipoResolucion||"")}${N.ModalidadResolucion?` · ${a(N.ModalidadResolucion)}`:""}</span>
                            <span class="pn-latest-text">${a(N.Proemio||"")}</span>
                        </a></li>`).join("")}</ol>
                    <p class="pm-note tr-res-total">${F(l)} resoluciones de este tipo en el registro de la CNE.</p>`:'<p class="pm-note">El registro de la CNE no muestra resoluciones de este tipo.</p>')}).catch(()=>{C.isConnected&&(C.innerHTML='<p class="pm-note">El sitio de la CNE no respondió; intenta de nuevo en un momento.</p>')})}d.addEventListener("click",u=>{var E;const p=u.target.closest("[data-law]");if(p){const C=g().find(n=>String(n.id)===p.dataset.law);C&&P(C);return}const h=u.target.closest("[data-article]");if(h){let C=[];try{C=JSON.parse(((E=h.closest(".tr-articles"))==null?void 0:E.dataset.ids)||"[]")}catch{}document.dispatchEvent(new CustomEvent("analisis:openArticle",{detail:{id:h.dataset.article,list:C.length?C:[h.dataset.article]}}))}});function r(u){const p=u&&tt(u);p?t(p):m(),d.scrollIntoView({behavior:"smooth",block:"start"})}return r(S),{openTramite:u=>r(u),showList:()=>r(null),destroy:()=>{o=!1,d.remove()},onRoute:M}}const He="cne-pestanas-vistas",Fe=()=>{try{return new Set(JSON.parse(localStorage.getItem(He)||"[]"))}catch{return new Set}};function St(b){const f=Fe();if(!f.has(b)){f.add(b);try{localStorage.setItem(He,JSON.stringify([...f]))}catch{}}}const W=[{id:"permisos",group:"CNE",label:"Permisos",intro:"Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula."},{id:"resoluciones",group:"CNE",label:"Resoluciones",intro:"Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo."},{id:"panorama",group:"CNE",label:"Panorama",intro:"Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente."},{id:"tramites",group:"CNE",label:"Trámites",intro:"Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE."},{id:"mapa",group:"CNE",label:"Mapa",intro:"Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos."},{id:"sener",group:"SENER",label:"Títulos y permisos",intro:"Títulos y permisos de la Secretaría de Energía: asignaciones, pozos, contratos de exploración y extracción, comercio exterior y biocombustibles, con su fuente oficial."}],Pe='<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6Z"/><path d="M9 4v14M15 6v14"/></svg>',Ct=`<svg class="pm-mapa-art" viewBox="0 0 120 80" aria-hidden="true">
    <rect x="1" y="1" width="118" height="78" rx="12" class="pm-mapa-fondo"/>
    <path class="pm-mapa-calle" d="M-2 52c22-6 34 10 58 2s30-24 66-14M30-2c4 24-6 40 4 84M86-2c-6 30 10 50 0 84"/>
    <g class="pm-mapa-pin" style="--c:var(--rojo)"><path d="M36 38c-6 0-10 4-10 9 0 7 10 15 10 15s10-8 10-15c0-5-4-9-10-9Z"/><circle cx="36" cy="47" r="3.4"/></g>
    <g class="pm-mapa-pin" style="--c:var(--col-acuerdos)"><path d="M78 16c-5 0-8 3.5-8 7.5 0 6 8 12.5 8 12.5s8-6.5 8-12.5c0-4-3-7.5-8-7.5Z"/><circle cx="78" cy="23.5" r="2.8"/></g>
    <g class="pm-mapa-pin" style="--c:var(--col-convocatorias)"><path d="M96 46c-4 0-7 3-7 6.5 0 5 7 11 7 11s7-6 7-11c0-3.5-3-6.5-7-6.5Z"/><circle cx="96" cy="52.5" r="2.4"/></g>
</svg>`,X=[{id:"cne",short:"CNE",name:"Comisión Nacional de Energía"},{id:"sener",short:"SENER",name:"Secretaría de Energía"}];function Tt(b){const f=X.find(S=>S.id===b)||X[0];return`<b>${f.short}</b>${f.name}`}function Rt(b,f,{route:S={tab:"permisos"},onOpenLaw:P=()=>{},setHash:M=()=>{}}={}){let o=null,g=null;const i=document.createElement("section");i.className="pm-view",i.setAttribute("aria-labelledby","pm-title"),i.innerHTML=`
        <div class="pm-head">
            <nav class="bu-seg pm-aut-switch" aria-label="Autoridad">${X.map(t=>`<a href="${t.id==="sener"?"#sener":"#permisos"}" data-aut-link="${t.id}">${t.short}</a>`).join("")}</nav>
            <p class="pm-autoridad" data-authority></p>
            <h1 id="pm-title">Permisos de energía</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de permisos">
                ${X.map(t=>`<div class="pm-tab-grupo" data-aut="${t.id}"><span class="pm-tab-group" aria-hidden="true">${t.short}</span>${W.filter(r=>r.group===t.short).map(r=>`<a role="tab" class="pm-tab${r.id==="mapa"?" is-destacado":""}" id="pm-tab-${r.id}" href="${x({tab:r.id})}" data-tab="${r.id}" aria-controls="pm-tabpanel" aria-label="${r.label} · ${r.group}">${r.id==="mapa"?Pe:""}${r.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join("")}</div>`).join("")}
            </nav>
        </div>
        <a class="pm-mapa-promo" href="${x({tab:"mapa"})}">
            ${Ct}
            <span class="pm-mapa-texto"><strong>Ve los permisos en el mapa</strong><span>Centrales, gasolineras, ductos y almacenes, con su estatus y sus resoluciones. Filtra por estado o por tipo.</span></span>
            <span class="bu-btn bu-btn-primario pm-mapa-cta">${Pe}Abrir el mapa</span>
        </a>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`,b.replaceChildren(i);const d=i.querySelector(".pm-tabpanel");function m(t,r){o==null||o.destroy(),g=t,St(t);const u=Fe();i.querySelectorAll(".pm-tab").forEach(n=>{const l=!u.has(n.dataset.tab)&&n.dataset.tab!=="permisos";n.classList.toggle("is-new",l),l?n.setAttribute("aria-description","Nueva sección"):n.removeAttribute("aria-description")});const p=W.find(n=>n.id===t)||W[0];i.querySelector(".pm-intro").textContent=p.intro,i.querySelector("[data-authority]").innerHTML=Tt(t==="sener"?"sener":"cne"),i.classList.toggle("en-sener",t==="sener");const h=t==="sener"?"sener":"cne";i.querySelectorAll(".pm-tab-grupo").forEach(n=>{n.hidden=n.dataset.aut!==h}),i.querySelector(".pm-tabs").hidden=W.filter(n=>n.group===h.toUpperCase()).length<2,i.querySelectorAll("[data-aut-link]").forEach(n=>{n.dataset.autLink===h?n.setAttribute("aria-current","page"):n.removeAttribute("aria-current")}),i.classList.toggle("en-mapa",t==="mapa"),i.querySelector(".pm-mapa-promo").hidden=t!=="permisos",i.querySelectorAll(".pm-tab").forEach(n=>{const l=n.dataset.tab===t;n.setAttribute("aria-selected",String(l)),n.classList.toggle("is-on",l)});const E=i.querySelector(".pm-tabs"),C=i.querySelector(".pm-tab.is-on");if(C&&(E.scrollLeft+=C.getBoundingClientRect().left-E.getBoundingClientRect().left-(E.clientWidth-C.offsetWidth)/2),d.setAttribute("aria-labelledby",`pm-tab-${t}`),t==="resoluciones")o=mt(d,f,{resolution:r.resolution||null,filters:r.filters||null,onRoute:n=>M(x({tab:t,resolution:n}))});else if(t==="tramites")o=Et(d,f,{tramite:r.tramite||null,onOpenLaw:P});else if(t==="panorama")o=gt(d);else if(t==="sener"){const n={destroyed:!1,view:null,record:r.record||null,destroy(){var l;this.destroyed=!0,(l=this.view)==null||l.destroy()},openRecord(l){this.view?this.view.openRecord(l):this.record=l},showList(){var l;this.record=null,(l=this.view)==null||l.showList()}};o=n,d.innerHTML='<p class="pm-loading">Cargando los títulos de la SENER…</p>',Ee(()=>import("./cne-sener-view-DGn1HaqN.js"),__vite__mapDeps([0,1,2,3,4,5,6])).then(l=>l.renderCneSenerView(d,{catalog:f,onOpenLaw:P,record:n.record,onRoute:N=>M(x(N?{record:N}:{tab:"sener"}))})).then(l=>{n.destroyed?l.destroy():n.view=l}).catch(()=>{n.destroyed||(d.innerHTML='<p class="pm-loading">No se pudo cargar esta sección. Revisa tu conexión e intenta de nuevo.</p>')})}else if(t==="mapa"){const n={destroyed:!1,view:null,permit:r.mapPermit||null,destroy(){var l;this.destroyed=!0,(l=this.view)==null||l.destroy()},focusPermit(l){this.view?this.view.focusPermit(l):this.permit=l}};o=n,d.innerHTML='<p class="pm-loading">Cargando el mapa…</p>',Ee(()=>import("./permits-map-view-BlFd8gNW.js"),__vite__mapDeps([7,1,2,8,9,3,4,5,10,11])).then(l=>l.renderPermitsMapView(d,{permit:n.permit})).then(l=>{n.destroyed?l.destroy():n.view=l}).catch(()=>{n.destroyed||(d.innerHTML='<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>')})}else o=lt(d,f,{permit:r.permit||null,onOpenLaw:P,onRoute:n=>M(x({tab:t,permit:n}))})}function y(t={tab:"permisos"}){const r=t.tab||"permisos";if(r!==g){m(r,t);return}r==="permisos"?t.permit?o.openPermit(t.permit):o.showList():r==="resoluciones"?t.resolution?o.openResolution(t.resolution):t.filters&&Object.keys(t.filters).length?o.applyFilters(t.filters):o.showList():r==="tramites"?t.tramite?o.openTramite(t.tramite):o.showList():r==="mapa"&&t.mapPermit?o.focusPermit(t.mapPermit):r==="sener"&&(t.record?o.openRecord(t.record):o.showList())}return y(S),{go:y,destroy:()=>{o==null||o.destroy(),i.remove()}}}export{Tt as authorityTag,Rt as renderCneView};
