/* Propuesta navegable aislada. No importa código productivo ni usa Supabase. */
(() => {
  'use strict';
  // Feather Icons 4.29.2, licencia MIT; distribución oficial vendorizada en assets/.
  const iconNames = {search:'search',arrow:'arrow-right',back:'arrow-left',chevron:'chevron-right',moon:'moon',sun:'sun',menu:'menu',close:'x',bookmark:'bookmark',check:'check',copy:'copy',external:'external-link',book:'book-open',bolt:'zap',files:'file-text',filter:'sliders',list:'list'};
  const icon = n => window.feather.icons[iconNames[n] || 'book-open'].toSvg({'aria-hidden':'true','stroke-width':1.8});
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const plain = html => { const p = document.createElement('div'); p.innerHTML = html; return p.textContent.replace(/\s+/g,' ').trim(); };
  const date = iso => new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${iso}T12:00:00Z`));
  const main = document.querySelector('#main');
  const dialog = document.querySelector('#panel-dialog');
  const dialogBody = document.querySelector('#dialog-body');
  let instruments = [], current = null, article = null, query = '', savedOnly = false, sort = 'relevance';
  let selectedTypes = new Set(['acuerdo','ley']);
  let selectedYears = new Set(['2025','2026']);
  let saved = [], preferences = {size:18,leading:'1.8',dark:false};
  let toastTimer;
  try { saved = JSON.parse(localStorage.getItem('sener-prototipo-guardados') || '[]'); if (!Array.isArray(saved)) saved = []; } catch { saved = []; }
  try { preferences = {...preferences,...JSON.parse(localStorage.getItem('sener-prototipo-lectura') || '{}')}; } catch { /* Valores predeterminados disponibles sin almacenamiento. */ }
  if (![16,18,20,22,24].includes(Number(preferences.size))) preferences.size = 18;
  if (!['1.6','1.8','2'].includes(String(preferences.leading))) preferences.leading = '1.8';
  function hydrateIcons(scope=document) { scope.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
  function applyPreferences() {
    document.documentElement.style.setProperty('--reader-size', `${preferences.size}px`);
    document.documentElement.style.setProperty('--reader-leading', preferences.leading);
    document.body.classList.toggle('dark',Boolean(preferences.dark));
    document.querySelectorAll('[data-action="theme"]').forEach(b=> { b.setAttribute('aria-label', `Cambiar a modo ${preferences.dark?'claro':'oscuro'}`); b.innerHTML = icon(preferences.dark?'sun':'moon'); });
  }
  function persistPreferences() { try { localStorage.setItem('sener-prototipo-lectura',JSON.stringify(preferences)); } catch { toast('El navegador no permite guardar preferencias; se aplican durante esta consulta.'); } }
  function toast(message) { const el=document.querySelector('#toast'); el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4200); }
  function navigate(hash) { closeDialog(); if(location.hash === hash) render(); else location.hash=hash; }
  function updateHeader(view) {
    document.querySelectorAll('[data-nav]').forEach(b=>{if(b.dataset.nav===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    document.querySelector('#saved-count').textContent=saved.length;
  }
  function searchForm(value='', label='Buscar en el marco legal') { return `<form class="search-form" role="search"><div class="search-input-group">${icon('search')}<input type="search" name="q" aria-label="${label}" placeholder="Tema, instrumento o artículo" value="${escape(value)}" autocomplete="off"></div><button type="submit" class="primary-button" aria-label="Buscar"><span class="button-label">Buscar</span>${icon('arrow')}</button></form>`; }
  function home() {
    current=null;article=null;updateHeader('home');
    main.innerHTML=`<div class="wrap"><section class="home-top" aria-labelledby="home-title"><div><h1 class="home-title" id="home-title">El marco legal energético,<br>al alcance de una consulta.</h1><p class="home-intro">Leyes, acuerdos y disposiciones para encontrar una referencia, entender su contexto y leer con claridad.</p>${searchForm()}<div class="popular"><span>Consultas frecuentes</span><button data-action="search-topic" data-topic="autoconsumo">Autoconsumo</button><button data-action="search-topic" data-topic="permiso">Permisos de generación</button><button data-action="search-topic" data-topic="sector eléctrico">Sector eléctrico</button></div><p class="scope-note">La búsqueda de esta propuesta explora cuatro instrumentos de muestra.</p></div><aside class="catalog-note" aria-label="Resumen del acervo"><h2>Un acervo para<br>consultar a fondo</h2><dl><div><dd class="catalog-count">41</dd><dt>instrumentos</dt></div><div><dd class="catalog-count">3,300</dd><dt>fragmentos</dt></div></dl><p>Catálogo verificado al<br>18 de septiembre de 2026.</p><button class="text-button" data-action="catalog">Explorar la muestra ${icon('arrow')}</button></aside></section><section class="collection-section" aria-labelledby="collection-title"><div class="section-heading"><h2 id="collection-title">Entrar por tema</h2><span class="meta">Colecciones de consulta</span></div><div class="collections"><article class="collection"><span class="collection-icon">${icon('bolt')}</span><h3>Autoconsumo</h3><p>Requisitos, formato de solicitud y Ventanilla Única, en una misma ruta de consulta.</p><button class="text-button" data-action="search-topic" data-topic="autoconsumo">Ver 3 instrumentos ${icon('arrow')}</button></article><article class="collection"><span class="collection-icon">${icon('book')}</span><h3>Sector eléctrico</h3><p>Una entrada a la Ley del Sector Eléctrico y a sus disposiciones relacionadas.</p><button class="text-button" data-action="open" data-law="LSE">Consultar la ley ${icon('arrow')}</button></article><article class="collection"><span class="collection-icon">${icon('files')}</span><h3>Formatos y trámites</h3><p>Documentos para revisar requisitos, tablas, anexos e instrucciones de llenado.</p><button class="text-button" data-action="open" data-law="FORMATO-AUTOCONSUMO">Explorar el formato ${icon('arrow')}</button></article></div></section><section class="recent-section" aria-labelledby="recent-title"><div class="section-heading"><h2 id="recent-title">Incorporaciones recientes</h2><button class="text-button" data-action="catalog">Ver muestra del acervo</button></div>${[...instruments].slice(0,3).reverse().map(l=>`<article class="recent-row"><div><h3><button class="title-link" data-action="open" data-law="${l.siglas}">${escape(l.nombre)}</button></h3><p class="meta"><span>${escape(l.entidad)}</span><span>DOF: ${date(l.fecha_publicacion)}</span><span>${l.fragmentos} fragmentos</span></p></div><button class="row-open" data-action="open" data-law="${l.siglas}" aria-label="Leer ${escape(l.nombre)}">${icon('arrow')}</button></article>`).join('')}</section></div>`;
  }
  function filters() {return `<div class="filter-heading"><h2>Filtrar consulta</h2><button class="text-button" data-action="clear-filters">Restablecer</button></div><fieldset class="filter-group"><legend>Tipo de instrumento</legend>${[['ley','Leyes'],['acuerdo','Acuerdos y lineamientos']].map(([v,t])=>`<label class="check-row"><input type="checkbox" data-filter="type" value="${v}" ${selectedTypes.has(v)?'checked':''}>${t}</label>`).join('')}</fieldset><fieldset class="filter-group"><legend>Año de publicación</legend>${['2026','2025'].map(v=>`<label class="check-row"><input type="checkbox" data-filter="year" value="${v}" ${selectedYears.has(v)?'checked':''}>${v}</label>`).join('')}</fieldset><p class="filter-note">La fecha corresponde a la publicación del documento consultado. No expresa por sí sola su vigencia.</p>`;}
  function highlight(text) {
    const words=query.trim().split(/\s+/).filter(Boolean);if(!words.length)return escape(text);
    const re=new RegExp(`(${words.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})`,'gi');
    return text.split(re).map((t,i)=>i%2?`<mark>${escape(t)}</mark>`:escape(t)).join('');
  }
  function excerpt(l) {
    const a=l.articulos.find(a=>a.orden===l.seleccion)||l.articulos[0];
    const text=plain(a.html);return text.length>265?`${text.slice(0,265).replace(/\s+\S*$/,'')}…`:text;
  }
  function resultCard(l) {const isSaved=saved.includes(l.id);return `<article class="result-item"><div class="result-type"><span class="type-label">${l.tipo==='ley'?'Ley':'Acuerdo'}</span><span class="meta">${l.fragmentos} fragmentos en el acervo</span></div><h3><button class="title-link" data-action="open" data-law="${l.siglas}">${highlight(l.nombre)}</button></h3><div class="meta"><span>${escape(l.entidad)}</span><span>Publicación: ${date(l.fecha_publicacion)}</span></div><p class="result-excerpt">${highlight(excerpt(l))}</p><div class="result-bottom"><a href="${escape(l.url_original)}" target="_blank" rel="noopener noreferrer">Fuente oficial ${icon('external')}</a><div class="result-actions"><button class="icon-button" data-action="save-law" data-law="${l.siglas}" aria-pressed="${isSaved}" aria-label="${isSaved?'Quitar de':'Guardar en'} Mi consulta: ${escape(l.nombre)}">${icon(isSaved?'check':'bookmark')}</button><button class="secondary-button" data-action="open" data-law="${l.siglas}">Leer instrumento ${icon('arrow')}</button></div></div></article>`;}
  function filtered() {
    const words=normalize(query).split(/\s+/).filter(Boolean);
    const matches=instruments.filter(l=>selectedTypes.has(l.tipo)&&selectedYears.has(l.fecha_publicacion.slice(0,4))&&(!savedOnly||saved.includes(l.id))&&words.every(w=>normalize(l.searchText).includes(w)));
    if(sort==='newest') matches.sort((a,b)=>b.fecha_publicacion.localeCompare(a.fecha_publicacion));
    if(sort==='title') matches.sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
    return matches;
  }
  function resultList() {
    const items=filtered();
    return `<div class="result-summary"><h2>${items.length} ${items.length===1?'instrumento':'instrumentos'}</h2><button class="secondary-button mobile-filter-button" data-action="filters">${icon('filter')} Filtros</button><label class="visually-hidden" for="sort-results">Ordenar resultados</label><select id="sort-results" aria-label="Ordenar resultados"><option value="relevance" ${sort==='relevance'?'selected':''}>Orden de la muestra</option><option value="newest" ${sort==='newest'?'selected':''}>Publicación más reciente</option><option value="title" ${sort==='title'?'selected':''}>Título de A a Z</option></select></div><p class="query-label">${savedOnly?'Guardados únicamente en este navegador de demostración.':query?`Resultados para «${escape(query)}» en cuatro instrumentos de muestra.`:'Selección para explorar el diseño y los recorridos de consulta.'}</p>${items.length?items.map(resultCard).join(''):`<div class="empty-state"><h2>${savedOnly?'La siguiente consulta empieza aquí.':'No se encontraron coincidencias.'}</h2><p>${savedOnly?'Al guardar un instrumento, aparecerá en este espacio. Los guardados de esta propuesta son locales y no modifican los favoritos de la aplicación.':'Prueba con «autoconsumo» o restablece los filtros. Esta propuesta contiene cuatro instrumentos y no consulta el acervo completo.'}</p><button class="primary-button" data-action="${savedOnly?'catalog':'reset-search'}">${savedOnly?'Explorar instrumentos':'Ver toda la muestra'}</button></div>`}`;
  }
  function results(params) {
    current=null;article=null;query=params.get('q')||'';savedOnly=params.get('guardados')==='1';updateHeader(savedOnly?'saved':'results');
    main.innerHTML=`<div class="wrap"><div class="results-search"><h1>${savedOnly?'Mi consulta':'Explorar el acervo'}</h1>${searchForm(query)}</div><div class="results-layout"><aside class="filters" aria-label="Filtros de consulta">${filters()}</aside><section id="result-list" aria-label="Resultados de consulta">${resultList()}</section></div></div>`;
  }
  function toc() {return `<h2>Contenido del instrumento</h2><p class="toc-sub">${current.articulos.length} ${current.siglas==='LSE'?'fragmentos de muestra':'fragmentos disponibles'}${current.siglas==='LSE'?' de 207 en el acervo':''}</p><ol class="toc-list">${current.articulos.map(a=>`<li><button data-action="article" data-order="${a.orden}" ${a.id===article.id?'aria-current="true"':''}>${escape(a.identificador.replace(' · ',' — '))}</button></li>`).join('')}</ol>`;}
  function reader(params) {
    current=instruments.find(l=>l.siglas===(params.get('ley')||'AUTOCONSUMO-0.7-20'))||instruments[0];
    article=current.articulos.find(a=>a.orden===Number(params.get('art')??current.seleccion))||current.articulos[0];
    updateHeader('results');
    const index=current.articulos.indexOf(article);const isSaved=saved.includes(current.id);
    main.innerHTML=`<div class="reader-wrap"><div class="reader-crumb"><button data-action="catalog">Acervo</button>${icon('chevron')}<span>${current.siglas==='LSE'?'Sector eléctrico':'Autoconsumo'}</span></div><section class="reader-heading"><div class="meta"><span class="type-label">${current.tipo==='ley'?'Ley':'Acuerdo'}</span><span>Versión publicada</span></div><h1>${escape(current.nombre)}</h1><div class="meta"><span class="reader-entity">${escape(current.entidad)}</span><span>DOF: ${date(current.fecha_publicacion)}</span><span>${current.fragmentos} fragmentos en el acervo</span></div><details class="reader-official-title"><summary>Título completo y autoridad</summary><p>${escape(current.titulo)}</p><p>${escape(current.entidad)}</p></details></section><div class="reader-toolbar" aria-label="Herramientas de lectura"><button class="toolbar-button reader-mobile-toc" data-action="toc">${icon('list')} Índice</button><button class="toolbar-button" data-action="settings" aria-label="Ajustar tamaño de letra e interlineado"><span class="aa">Aa</span><span class="tool-label">Lectura</span></button><button class="toolbar-button" data-action="save-law" data-law="${current.siglas}" aria-pressed="${isSaved}" aria-label="${isSaved?'Quitar de':'Guardar en'} Mi consulta">${icon(isSaved?'check':'bookmark')}<span class="tool-label">${isSaved?'Guardado':'Guardar'}</span></button><button class="toolbar-button" data-action="copy" aria-label="Copiar texto y referencia del fragmento">${icon('copy')}<span class="tool-label">Copiar cita</span></button><a class="secondary-button source-button" aria-label="Abrir fuente oficial" title="Fuente oficial" href="${escape(current.url_original)}" target="_blank" rel="noopener noreferrer">Fuente oficial ${icon('external')}</a></div><div class="reader-columns"><aside class="toc-panel" aria-label="Índice del instrumento">${toc()}</aside><article class="reading-paper"><div class="article-context"><span>${article.identificador.startsWith('Nota editorial')?'Información editorial':'Texto de la publicación oficial'}</span><span>${index+1} de ${current.articulos.length}</span></div><h2 class="article-heading">${escape(article.identificador)}</h2>${article.identificador.startsWith('Nota editorial')?'<p class="editorial-badge">Esta nota es información editorial del buscador y no forma parte del texto oficial.</p>':''}<div class="legal-text" id="legal-text">${article.html}</div><p class="article-footnote">Fuente: ${escape(current.entidad)}. Publicación del ${date(current.fecha_publicacion)}. Esta vista conserva el texto de la publicación; la versión consultada no determina por sí sola su vigencia.${current.siglas==='LSE'?' Para este prototipo se muestran tres fragmentos de la ley.':''}</p><nav class="article-navigation" aria-label="Navegar entre fragmentos"><button class="secondary-button" data-action="article" data-order="${current.articulos[index-1]?.orden??0}" ${index===0?'disabled':''}>${icon('back')} Anterior</button><button class="secondary-button" data-action="article" data-order="${current.articulos[index+1]?.orden??0}" ${index===current.articulos.length-1?'disabled':''}>Siguiente fragmento ${icon('arrow')}</button></nav></article></div></div>`;
    main.querySelectorAll('.legal-text table').forEach((table,i)=>{
      if(table.parentElement.closest('table'))return;
      const wrapper=document.createElement('div');wrapper.className='table-scroll';wrapper.tabIndex=0;wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label',`Tabla ${i+1} del documento. Desplazamiento horizontal disponible.`);
      table.before(wrapper);wrapper.append(table);
      const hint=document.createElement('p');hint.className='table-hint';hint.textContent='Tabla del documento. Deslice horizontalmente para consultar todas las columnas.';wrapper.after(hint);
    });
  }
  function render() {
    const [route,raw='']=location.hash.slice(1).split('?');const params=new URLSearchParams(raw);
    document.body.dataset.view=route==='lector'?'reader':route==='resultados'?'results':'home';
    if(route==='lector')reader(params);else if(route==='resultados')results(params);else home();
    hydrateIcons();applyPreferences();window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});
  }
  function openDialog(title,html) { document.querySelector('#dialog-title').textContent=title;dialogBody.innerHTML=html;hydrateIcons(dialog);if(!dialog.open)dialog.showModal(); }
  function closeDialog() {if(dialog.open)dialog.close();}
  function settings() {openDialog('Ajustar lectura',`<p class="settings-footnote">Los ajustes se aplican al texto del documento, incluidos sus incisos y tablas.</p><div class="settings-label"><span>Tamaño de letra</span><strong id="size-value">${preferences.size} px</strong></div><div class="size-options" aria-label="Tamaño de letra">${[16,18,20,22,24].map(n=>`<button data-action="font-size" data-size="${n}" aria-label="${n} píxeles" aria-pressed="${Number(preferences.size)===n}">${n}</button>`).join('')}</div><label class="settings-label" for="line-height">Interlineado</label><select id="line-height" class="settings-select"><option value="1.6" ${preferences.leading==='1.6'?'selected':''}>Compacto (1.6)</option><option value="1.8" ${preferences.leading==='1.8'?'selected':''}>Cómodo (1.8)</option><option value="2" ${preferences.leading==='2'?'selected':''}>Amplio (2.0)</option></select><label class="check-row" style="margin-top:20px"><input id="dark-reading" type="checkbox" ${preferences.dark?'checked':''}>Fondo oscuro</label><div class="type-preview">Una lectura clara permite concentrarse en lo que importa.</div><p class="settings-footnote">Preferencias guardadas en este navegador de demostración. No afectan la aplicación actual.</p>`);}
  function openLaw(siglas,order) {const law=instruments.find(l=>l.siglas===siglas);if(law)navigate(`#lector?ley=${encodeURIComponent(siglas)}&art=${order??law.seleccion}`);}
  function saveLaw(siglas) {
    const law=instruments.find(l=>l.siglas===siglas);if(!law)return;
    const existed=saved.includes(law.id);saved=existed?saved.filter(id=>id!==law.id):[...saved,law.id];
    try{localStorage.setItem('sener-prototipo-guardados',JSON.stringify(saved));}catch{toast('Guardado durante esta sesión; el navegador no permite persistirlo.');}
    document.querySelector('#saved-count').textContent=saved.length;
    document.querySelectorAll(`[data-action="save-law"][data-law="${law.siglas}"]`).forEach(b=>{b.setAttribute('aria-pressed',String(!existed));b.setAttribute('aria-label',`${existed?'Guardar en':'Quitar de'} Mi consulta: ${law.nombre}`);b.innerHTML=icon(existed?'bookmark':'check')+(b.classList.contains('toolbar-button')?`<span class="tool-label">${existed?'Guardar':'Guardado'}</span>`:'');});
    if(savedOnly)document.querySelector('#result-list').innerHTML=resultList();
    toast(existed?'Instrumento quitado de Mi consulta de demostración.':'Guardado en Mi consulta de demostración, en este navegador.');
  }
  document.addEventListener('submit',event=>{if(!event.target.matches('.search-form'))return;event.preventDefault();selectedTypes=new Set(['acuerdo','ley']);selectedYears=new Set(['2025','2026']);navigate(`#resultados?q=${encodeURIComponent(new FormData(event.target).get('q').trim())}`);});
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
    if(action==='home')navigate('#inicio');
    if(action==='catalog')navigate('#resultados');
    if(action==='saved')navigate('#resultados?guardados=1');
    if(action==='search-topic')navigate(`#resultados?q=${encodeURIComponent(button.dataset.topic)}`);
    if(action==='open')openLaw(button.dataset.law);
    if(action==='article')openLaw(current.siglas,Number(button.dataset.order));
    if(action==='save-law')saveLaw(button.dataset.law);
    if(action==='theme'){preferences.dark=!preferences.dark;applyPreferences();persistPreferences();}
    if(action==='settings')settings();
    if(action==='font-size'){preferences.size=Number(button.dataset.size);applyPreferences();persistPreferences();dialog.querySelector('#size-value').textContent=`${preferences.size} px`;dialog.querySelectorAll('[data-action="font-size"]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.size)===preferences.size)));}
    if(action==='close-dialog')closeDialog();
    if(action==='toc')openDialog('Índice del instrumento',toc());
    if(action==='filters')openDialog('Filtros',`${filters()}<button class="primary-button" data-action="close-dialog" style="width:100%;margin-top:20px">Ver resultados</button>`);
    if(action==='clear-filters'||action==='reset-search'){selectedTypes=new Set(['acuerdo','ley']);selectedYears=new Set(['2025','2026']);if(action==='reset-search')navigate('#resultados');else{document.querySelectorAll('[data-filter]').forEach(el=>el.checked=true);document.querySelector('#result-list').innerHTML=resultList();}}
    if(action==='copy'){
      const citation=`${article.identificador}\n\n${plain(article.html)}\n\n${current.titulo}. Publicación: ${date(current.fecha_publicacion)}.\nFuente: ${current.url_original}`;
      try{await navigator.clipboard.writeText(citation);toast('Texto y referencia oficial copiados.');}catch{openDialog('Copiar referencia',`<p class="settings-footnote">El navegador bloqueó el portapapeles. Seleccione y copie esta referencia.</p><textarea readonly aria-label="Texto y referencia" style="width:100%;height:240px;font:inherit;padding:12px">${escape(citation)}</textarea>`);}
    }
    if(action==='menu')openDialog('Navegación',`<nav class="dialog-nav" aria-label="Navegación móvil"><button class="secondary-button" data-action="home">Inicio</button><button class="secondary-button" data-action="catalog">Explorar el acervo</button><button class="secondary-button" data-action="saved">Mi consulta (${saved.length})</button><button class="secondary-button" data-action="about">Acerca de esta propuesta</button></nav>`);
    if(action==='about')openDialog('Una propuesta para consultar mejor',`<div class="dialog-content"><p>Este prototipo explora una evolución del buscador: búsqueda visible, resultados con contexto y un lector adaptable a cualquier pantalla.</p><p>Contiene los tres instrumentos de autoconsumo ya cotejados y tres fragmentos de la Ley del Sector Eléctrico. Los títulos cortos y las colecciones son ayudas editoriales; el lector identifica la publicación y enlaza la fuente oficial.</p><p>La búsqueda opera sobre esta muestra local. Mi consulta y los ajustes de lectura se guardan solo en este navegador. No se realizan escrituras a Supabase.</p></div>`);
  });
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.matches('[data-filter]')){const target=el.dataset.filter==='type'?selectedTypes:selectedYears;if(el.checked)target.add(el.value);else target.delete(el.value);document.querySelectorAll(`[data-filter="${el.dataset.filter}"][value="${el.value}"]`).forEach(input=>input.checked=el.checked);document.querySelector('#result-list').innerHTML=resultList();}
    if(el.id==='sort-results'){sort=el.value;document.querySelector('#result-list').innerHTML=resultList();}
    if(el.id==='line-height'){preferences.leading=el.value;applyPreferences();persistPreferences();}
    if(el.id==='dark-reading'){preferences.dark=el.checked;applyPreferences();persistPreferences();}
  });
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  window.addEventListener('hashchange',render);
  hydrateIcons();applyPreferences();
  fetch('./fixture.json').then(response=>{if(!response.ok)throw new Error('No se pudo cargar la muestra');return response.json();}).then(data=>{
    instruments=data.instrumentos.map(l=>({...l,searchText:`${l.titulo} ${l.nombre} ${l.articulos.map(a=>plain(a.html)).join(' ')}`}));render();
  }).catch(()=>{main.innerHTML='<div class="wrap loading-state"><h1>No se pudo abrir la muestra.</h1><p>Abra el prototipo desde el servidor local del proyecto para cargar los documentos de demostración.</p><button class="primary-button" onclick="location.reload()">Volver a intentar</button></div>';});
})();
