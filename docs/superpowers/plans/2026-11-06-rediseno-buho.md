# Rediseño Búho del Buscador Jurídico: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar el sistema Búho a todo el sitio, con navegación en riel, sin perder funciones, y agregar la lectura como libro.

**Architecture:** La capa de tokens de `variables.css` se remapea a Búho y deja alias para migrar por vista. El CSS de componentes se porta de `bundle.css` a `src/styles/design/buho/` sin React. El marcado cambia de clases, nunca de `id` ni `data-*`. Lo nuevo con lógica va en módulos puros y probados (`book-paginate`, `permit-type`, resorte y presencia del estante).

**Tech Stack:** JS sin framework, Vite, Tailwind 3 con preset de variables, Supabase, D3, Leaflet 1.9.4 y markercluster 1.5.3, pdf.js 3.11.174, Vitest con jsdom.

**Spec:** `docs/superpowers/specs/2026-11-06-rediseno-buho-design.md`

**Referencia visual:** maquetas aprobadas en `.superpowers/brainstorm/3428-1793957850/content/`: `navegacion.html` (opción A), `estante.html`, `busqueda.html`, `lector.html`, `mapa.html`. Su CSS y marcado son la referencia exacta de cada vista. Búho: componentes en `https://claude.ai/artifact/WQertACwbzHpoZzwiZ5Vid` (`project/components/bundle.css`).

## Global Constraints

- Conservar todo `id` y `data-*` existente: `ui.js` y las pruebas dependen de ellos.
- Los únicos cambios funcionales son los de la sección 3 del spec.
- Temas: `light`, `dark`, `sepia`, `contraste`; claves `app-theme`, `app-dark-mode`.
- Toda vista funciona en 390, 820, 1280 y 1400 px, y en los 4 temas.
- Cortes de navegación: riel completo de 220 px desde 1200, iconos de 768 a 1199, `MenuInferior` debajo de 768. Panel de filtros desde 900 px; hoja inferior debajo.
- Texto a 4.5:1; controles, iconos y foco a 3:1. Con `prefers-reduced-motion` nada se anima.
- Sin hexadecimales fuera de tokens en lo migrado, salvo tokens de mapa y la hoja blanca del PDF.
- El contenido oficial nunca cambia: reconocer encabezado, total, título o fuente solo añade presentación.
- Textos en español llano para público general: «documento», no «instrumento».
- Comentarios de código en inglés, como el código actual.
- Commits solo en la rama nueva; no se hace push ni merge sin pedirlo.

## Review Focus

1. Enlaces guardados (`#art:`, `#ley:`, `#permiso=`, `#resolucion=`, `#tramite=`, `#lectura-`, `#mapa-permisos`) deben abrir la misma vista con el riel nuevo. Prueba en Task 5.
2. Preferencias ya guardadas (`app-theme`, `app-dark-mode`, `buscador-vista`, `sener-reader-preferences-v1` con `serif` y `sans`) deben seguir valiendo. Prueba en Task 2 y Task 10.
3. Documentos sin sigla, sin fecha o con títulos muy largos no deben romper portada, lomo, tarjeta ni libro. Prueba en Task 6 y Task 14.
4. Tablas con `rowspan`, filas más altas que una página, 449 filas o 17 columnas no deben perder celdas en el libro. Prueba en Task 14.
5. Registro de la CNE lento o caído: la ventana del mapa y la ficha siguen funcionando sin conteos. Prueba en Task 17.

---

## Fase 1: Base

### Task 1: Línea base y rama

**Files:** Modify: `.gitignore`. Test: `tests/ui-acervo.test.js`

- [ ] **Step 1: Comprobar servicios.** Consulta Supabase con `leyes?select=id&limit=1`. Si no responde en 20 s, avisa al usuario: las pruebas usan datos simulados, pero la revisión manual no es posible. No sigas a las fases visuales sin esa revisión.
- [ ] **Step 2: Crear la rama desde `feat/portada-estante`.**

```bash
git switch feat/portada-estante && git switch -c feat/rediseno-buho
```

Los cambios sin commit ajenos (`src/lib/motion.js`, `package.json`, `package-lock.json`, `public/data/manifest.json`, `docs/propuestas-spline-2026-10-24.md`, `supabase/.temp/`, `.claude/settings.local.json`) se quedan sin agregar.

- [ ] **Step 3: Revisar la falla.** Run: `npx vitest run tests/ui-acervo.test.js`. Si pasa sola, fue carga: sube su tiempo límite a 15000 ms en esa prueba. Si falla sola, investígala con superpowers:systematic-debugging.
- [ ] **Step 4: Suite completa.** Run: `npm test && npm run lint && npm run build`. Expected: todo pasa; anota el conteo.
- [ ] **Step 5: Commit.** Agrega `.superpowers/` a `.gitignore`.

```bash
git add .gitignore tests/ui-acervo.test.js docs/superpowers
git commit -m "docs: add Búho redesign spec and plan"
```

### Task 2: Tokens y fuentes

**Files:**
- Modify: `src/styles/design/variables.css`, `src/design/tailwind.preset.js`, `index.html:18-20`, `src/scripts/reader-controls.js`
- Create: `public/fonts/Fraunces-Variable.woff2`, `Fraunces-Variable-Italic.woff2`, `Manrope-Variable.woff2`, `src/styles/design/fonts.css`
- Test: `tests/design-tokens.test.js`

**Interfaces:** Produces: `--papel --papel-alto --ceniza --linea --enlace --tinta --tinta-suave --rojo --rojo-suave --rojo-halo --accion --on-accion --exito --error --cristal --cristal-fuerte --cristal-borde --cristal-borde-hover --cristal-brillo --sombra-cristal --sombra-flotante --blur-cristal --blur-flotante --lb-bg --lb-bg2 --lb-ink --lb-suave --lb-edge --ac --col-leyes --col-reglamentos --col-acuerdos --col-dacg --col-convocatorias --col-normas --col-otros --aut-sener --on-aut-sener --t-rapido --t-medio --t-lento --ease-entrada`.

- [ ] **Step 1: Escribir la prueba.** Lee `variables.css` como texto; por cada `data-theme` verifica los pares de contraste de la sección 5.1 del spec.

```js
it.each(['light', 'dark', 'sepia', 'contraste'])('%s defines every Búho token', theme => {
  for (const name of BUHO_TOKENS) expect(tokenValue(css, theme, name), name).toBeTruthy();
});
it.each(THEMES)('%s keeps text at 4.5:1 on its surfaces', theme => {
  expect(ratio(value(theme, '--tinta'), value(theme, '--papel'))).toBeGreaterThanOrEqual(4.5);
  expect(ratio(value(theme, '--tinta-suave'), value(theme, '--papel-alto'))).toBeGreaterThanOrEqual(4.5);
});
it.each(TYPE_TOKENS)('%s reaches 3:1 on the book surface of each theme', token => { /* usa --lb-bg de cada tema */ });
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/design-tokens.test.js`. Expected: FAIL, faltan tokens.
- [ ] **Step 3: Implementar.** Valores Día y Noche de `project/tokens.json`. Sepia, Contraste, `--lb-*`, tipos de documento y `--aut-sener`: tablas 5.1 y 9.1 del spec. `light` usa Día y `dark` usa Noche. Los nombres actuales se definen como alias (tabla 5.1). En Contraste, `--blur-*: 0px`, sin sombras y bordes sólidos. Regla `[data-category="leyes"] { --ac: var(--col-leyes) }` por tipo. `@font-face` con `font-display: swap`, cargado antes de `variables.css` en `index.css`. Retira el `<link>` de Google Fonts. Etiquetas Fraunces y Manrope en `reader-controls.js`, conservando valores `serif` y `sans`.
- [ ] **Step 4: Verificar.** Run: `npm test && npm run build`. Expected: pasa. Si una prueba afirma «Noto Sans» o «Newsreader», actualízala.
- [ ] **Step 5: Revisar y confirmar.** `npm run dev`: los 4 temas cargan y un `sener-reader-preferences-v1` guardado con `serif` sigue aplicando. Commit `feat: add Búho tokens and fonts`.

### Task 3: Marca oficial

**Files:**
- Modify: `src/lib/brand-mark.js`, `src/scripts/site-intro.js`, `src/styles/site-intro.css`, `index.html:112,155`, `src/styles/design/chrome.css:67`, `src/scripts/law-presentation.js:39,749`
- Create: `scripts/generate-brand-assets.mjs`
- Replace: `public/img/logo-mark.svg`, `logo-mark-claro.svg`, `logo-mark-blanco.png`, `hero-mark.svg`, `favicon-64.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `og-buscador-juridico.jpg`, `logo-buscador.png`, `logo-buscador-claro.png`
- Test: `tests/brand-mark.test.js`

**Interfaces:** Produces: `brandMarkSvg({ color='currentColor', lens='var(--rojo)', title='Buscador Jurídico', className='', shine=false }) -> string`, con `viewBox="33 24 379 448"`.

- [ ] **Step 1: Actualizar la prueba.** Mantén `.bm-bar`, `.bm-page`, `.bm-lens`, `.bm-ripple`, `.bm-shine`, y agrega:

```js
it('draws the official Búho mark in one ink with a red eye', () => {
  const svg = draw();
  expect(svg.getAttribute('viewBox')).toBe('33 24 379 448');
  expect(svg.querySelector('.bm-body').getAttribute('fill')).toBe('currentColor');
  expect(svg.querySelector('.bm-eye').getAttribute('fill')).toBe('var(--rojo)');
});
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/brand-mark.test.js`.
- [ ] **Step 3: Implementar.** Separa las dos subrutas de `buho-mark.svg` (`M279…Z` el cuerpo con clases `bm-body bm-bar`, `M304.6…Z` las cejas con `bm-brow bm-page`) y el ojo `bm-eye` dentro de `.bm-lens`. Ajusta `FRAME` y las coordenadas de `.bm-ripple` al ojo. El script genera los archivos desde el SVG, sin colorear la marca. En `site-intro.js` conserva la animación SVG como vía única hasta la Task 20.
- [ ] **Step 4: Verificar.** Run: `npm test`. Abre la intro en el navegador: alas y ojo coinciden con la marca nueva.
- [ ] **Step 5: Commit** `feat: use the official Búho mark everywhere`.

### Task 4: Componentes base

**Files:** Create: `src/styles/design/buho/scene.css`, `glass.css`, `controls.css`, `dialog.css`, `index.css`. Modify: `src/styles/index.css`.

**Interfaces:** Produces: `.bu-escena`, `.bu-cristal`, `.bu-cristal-fuerte`, `.bu-btn`, `.bu-btn-primario`, `.bu-btn-contorno`, `.bu-chip`, `.bu-insignia`, `.bu-campo`, `.bu-seg`, `.bu-modal`, `.bu-toast`, `.bu-hoja`, `.bu-ico`.

- [ ] **Step 1: Portar el CSS.** Toma las reglas de `bundle.css` y ajusta `.bu-escena` a retícula y sombra neutra, sin mancha roja (`estante.html`, `.pantalla::before`). `.bu-cristal` sin blur ni brillo en Contraste. `.bu-ico` según `mapa.html`, `.ico`. Sin `!important`.
- [ ] **Step 2: Fondo.** `body` usa `.bu-escena` una sola vez. Los `.bg-white` de `index.css` siguen apuntando a superficie.
- [ ] **Step 3: Verificar.** Run: `npm test && npm run build`. Expected: pasa, tamaño de CSS similar.
- [ ] **Step 4: Commit** `feat: add Búho base components`.

## Fase 2: Armazón

### Task 5: Riel, cabecera móvil y menú inferior

**Files:**
- Modify: `index.html:108-210`, `src/scripts/ui.js` (navegación y `dockSearch`), `src/scripts/shelf-view.js:measure`
- Create: `src/styles/design/buho/shell.css`, `src/scripts/shell-more.js`
- Test: `tests/shell-nav.test.js`, `tests/ui-home.test.js`, `tests/ui-explorer.test.js`

**Interfaces:** Produces: `<aside class="bu-riel">`, `<header class="bu-cab-m">`, `<nav class="bu-minf">`; `openMoreSheet()` en `shell-more.js`; variable CSS `--riel-w` (220, 72 o 0 px). Consumes: `id` actuales (`nav-leyes`, `nav-inicio`, `nav-cronologia`, `nav-permisos`, `nav-polos`, `nav-analisis`, `nav-stats`, `nav-reto`, `nav-ayuda`, `nav-como-funciona`, `nav-favorites`, `nav-login-btn`, `darkmode-toggle`, `mobile-menu-btn`, `mobile-menu-drawer`, `mobile-nav-*`, `brand-home`, `desk-toggle`).

- [ ] **Step 1: Escribir la prueba.**

```js
it('offers seven destinations and keeps every id', () => {
  loadIndex();
  expect(document.querySelectorAll('.bu-riel [data-nav]')).toHaveLength(7);
  for (const id of KEPT_IDS) expect(document.getElementById(id), id).not.toBeNull();
});
it.each(LEGACY_HASHES)('%s still opens its view', async (hash, viewId) => {
  location.hash = hash; await boot();
  expect(document.getElementById(viewId).classList.contains('hidden')).toBe(false);
});
it('groups Estadísticas in Análisis and the rest in Aprende', () => { /* hijos de cada destino */ });
```

`LEGACY_HASHES` cubre los hashes del Review Focus 1.

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/shell-nav.test.js`.
- [ ] **Step 3: Implementar.** Marcado de `navegacion.html`, opción A, con grupos Análisis y Aprende desplegables. Pie: `desk-toggle` con contador, Guardados y Cuenta; la cuenta reúne tema, atajos y administración. `main` usa `padding-left: calc(var(--riel-w) + …)`. `mobile-menu-drawer` pasa a ser la hoja «Más», con `id` intacto. Indicador activo en píldora guinda vía `aria-current`, misma lógica actual. `measure()` del estante deja de leer `.site-header`. Aviso legal del pie sin cambios.
- [ ] **Step 4: Verificar.** Run: `npm test`. Expected: pasa, con pruebas de marcado ajustadas solo si la clase cambió, nunca si cambió un `id`.
- [ ] **Step 5: Revisar.** Chrome en 390, 820, 1280 y 1400 px y 4 temas: navegar a cada sección, teclado, foco visible, atajos. Sin errores de consola.
- [ ] **Step 6: Commit** `feat: replace the top bar with the glass rail`.

## Fase 3: Acervo

### Task 6: Portadas y lomos neutros

**Files:** Modify: `src/lib/law-cover.js`, `src/styles/shelf.css`. Test: `tests/law-cover.test.js`.

**Interfaces:** Produces: `coverHTML(law)`, `spineHTML(law)` con `data-category`, sin `--sh-bg` por documento. Elimina `BOOK_COLORS`, `bookColor`, `tomeBackStyle`.

- [ ] **Step 1: Actualizar la prueba.** Sustituye las de `bookColor`:

```js
it('takes its accent from the document type, not its acronym', () => {
  const html = coverHTML({ titulo: 'Ley X', siglas: 'LX', tipo: 'Ley' });
  expect(html).toContain('data-category="leyes"');
  expect(html).not.toContain('--sh-bg');
});
it.each([{}, { titulo: 'x'.repeat(600) }, { siglas: 'NOM-EM-008-ASEA-2026' }])('survives %j', law => {
  expect(() => coverHTML(law)).not.toThrow();
  expect(spineHTML(law)).toContain('sh-spine');
});
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/law-cover.test.js`.
- [ ] **Step 3: Implementar.** Estilos de `estante.html` (`.spine`, `.cover`, `.cv-*`) escalados con `--sh-u`. Banda, listón, regla e icono en `--ac`; fondo `--lb-bg`; texto `--lb-ink`. En `law-sheet.js`, usa el mismo `coverHTML`.
- [ ] **Step 4: Verificar.** Run: `npm test`. Expected: pasa.
- [ ] **Step 5: Commit** `feat: neutral books with type accents`.

### Task 7: Movimiento del estante

**Files:** Modify: `src/lib/shelf-geometry.js`, `src/scripts/shelf-view.js`. Test: `tests/shelf-geometry.test.js`, `tests/shelf-view.test.js`, `tests/shelf-view-input.test.js`.

**Interfaces:** Produces:
- `springStep(state: {x, v}, target: number, dt: number, omega: number, { maxAccel = Infinity, maxSpeed = Infinity } = {}) -> {x, v}`
- `presencePositions(presences: number[]) -> number[]` (suma acumulada)
- `clampIndex(index, visibleIndexes: number[]) -> number`
- Elimina `rel` y `stepSpring`.

- [ ] **Step 1: Escribir la prueba.**

```js
it('starts gently on a long jump', () => {
  const s = springStep({ x: 0, v: 0 }, 26, 1 / 60, 7.5, { maxAccel: 60, maxSpeed: 13 });
  expect(s.x).toBeLessThan(0.02);
});
it('settles without overshoot', () => {
  let s = { x: 0, v: 0 }, max = 0;
  for (let i = 0; i < 600; i++) { s = springStep(s, 5, 1 / 60, 7.5); max = Math.max(max, s.x); }
  expect(s.x).toBeCloseTo(5, 2); expect(max).toBeLessThanOrEqual(5.001);
});
it('never moves faster than its cap', () => { /* |x paso| <= 13/60 */ });
it('stacks positions by presence', () => { expect(presencePositions([1, 0, 0.5, 1])).toEqual([0, 1, 1, 1.5]); });
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/shelf-geometry.test.js`.
- [ ] **Step 3: Implementar.** Valores: posición ω 7.5, tope 60 y 13; presencia ω 11. Paso semiimplícito como en `estante.html`. La posición lineal sustituye al anillo; flechas, teclado, arrastre y rueda se detienen en los extremos. Tomos persistentes por presencia: `opacity` en las caras, nunca en el tomo (rompe `preserve-3d`), y `translateY((1 - p) * -46px)` al salir. Con movimiento reducido, sin resorte. Altura del libro 250 px debajo de 768.
- [ ] **Step 4: Verificar.** Run: `npm test`.
- [ ] **Step 5: Revisar.** Chrome real: salto largo, flechas, arrastre. Sin saltos visibles.
- [ ] **Step 6: Commit** `feat: smooth shelf motion with linear ends`.

### Task 8: Carpetas y ficha

**Files:** Modify: `src/scripts/shelf-view.js`, `src/scripts/law-sheet.js`, `src/styles/shelf.css`, `src/scripts/acervo-view.js`, `src/styles/acervo.css`. Create: `src/lib/folder-html.js`. Test: `tests/folder-html.test.js`, `tests/law-sheet.test.js`, `tests/shelf-view.test.js`.

**Interfaces:** Produces: `folderHtml({ group, label, count, sheets: [{ id, label }], open }) -> string`, con `data-folder`, `data-category`, botón `aria-pressed`.

- [ ] **Step 1: Escribir la prueba.**

```js
it('shows the count and three sheets', () => {
  host.innerHTML = folderHtml({ group: 'leyes', label: 'Leyes', count: 11, sheets: SHEETS, open: false });
  expect(host.querySelectorAll('[data-sheet-doc]')).toHaveLength(3);
  expect(host.querySelector('[aria-pressed]').textContent).toContain('11');
});
it('a second press on a folder clears the filter', async () => { /* en shelf-view */ });
it('sheet opens after the book arrives, and focus returns on close', async () => { /* en shelf-view */ });
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/folder-html.test.js`.
- [ ] **Step 3: Implementar.** Carpetas de `estante.html`; sustituyen `.sh-ruler`, conservando sus datos. Deslizables debajo de 900 px. Las hojas solo reciben foco con la carpeta abierta. Ficha: duración 620 y 480 ms con `cubic-bezier(.32,.72,0,1)`, mismos campos. La vista de lista `acervo-view` usa la tarjeta con librito neutro.
- [ ] **Step 4: Verificar.** Run: `npm test`. Chrome real en 3 tamaños.
- [ ] **Step 5: Commit** `feat: folders filter the shelf`.

## Fase 4: Búsqueda

### Task 9: Portada y sugerencias

**Files:** Modify: `index.html:300-374`, `src/scripts/search-landing.js`, `src/styles/search-landing.css`, `src/scripts/ui.js:957-985,2308-2505`. Test: `tests/ui-home.test.js`, `tests/search-landing.test.js`.

- [ ] **Step 1: Escribir la prueba.**

```js
it('uses the approved headline, without italics', () => {
  const h = document.querySelector('#hero-section h1');
  expect(h.textContent.trim()).toBe('Busca un término en el marco energético');
  expect(h.querySelector('em, i')).toBeNull();
});
it('first suggestion searches the whole archive', () => { /* teclea y mira el primer [data-navigable] */ });
it('recent searches moved to the empty box', () => { /* foco sin texto muestra historial y Borrar todo */ });
it('keeps the key terms map link', () => { /* data-sl-terms */ });
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/ui-home.test.js`.
- [ ] **Step 3: Implementar.** Marcado de `busqueda.html`. Ejemplos tocables. Bloques «Temas para empezar» y «Publicado recientemente». Retira el emblema del hero. La caja viaja animando solo `transform`, midiendo antes y después; conserva `dockSearch`, `undockSearch` y el debounce de 250 ms. Placeholder «Busca una palabra, ley o artículo». Mantiene navegación con teclado.
- [ ] **Step 4: Verificar.** Run: `npm test`.
- [ ] **Step 5: Commit** `feat: one search box that travels`.

### Task 10: Resultados y grafo

**Files:** Modify: `src/scripts/search-results-view.js`, `src/styles/search.css`, `src/scripts/search-graph-view.js:9-12`, `src/styles/search-graph.css`. Test: `tests/search-results-view.test.js`.

- [ ] **Step 1: Escribir la prueba.**

```js
it('opens in the list by default', () => { localStorage.clear(); render(); expect(active()).toBe('lista'); });
it('respects a saved map preference', () => { localStorage.setItem('buscador-vista', 'mapa'); render(); expect(active()).toBe('mapa'); });
it('names documents with a short title and secondary acronym', () => { /* .sr-facet con shortTitle y sigla */ });
it('offers a folder per type with its matches', () => { /* data-facet-group con conteo */ });
it('a filter change keeps the folders in place', () => { /* mismos nodos .cf */ });
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/search-results-view.test.js`.
- [ ] **Step 3: Implementar.** `readMode` devuelve `lista` si no hay preferencia y respeta la guardada. Carpetas con `data-facet-group`; panel desde 900 px; hoja actual debajo; chips activos; grupos con librito. Para no redibujar carpetas, separa `drawResults()` de `drawChrome()`. `«instrumentos»` pasa a `«documentos»` en los textos. En `search-graph-view`, `COLORS` lee tokens `--col-*` y tipografía Manrope y Fraunces. **No toques simulación, fuerzas ni animaciones.**
- [ ] **Step 4: Verificar.** Run: `npm test`. Chrome real: el grafo se mueve igual que antes.
- [ ] **Step 5: Commit** `feat: search results with folders and list first`.

## Fase 5: Lector por artículo

### Task 11: Formato de tablas y justificado

**Files:** Modify: `src/lib/article-html.js`, `src/styles/article-tables.css`, `src/styles/index.css:17-30`, `src/styles/reader.css`, `src/styles/law-reader.css`. Test: `tests/article-html.test.js`. Create: `scripts/audit-tables.mjs`.

**Interfaces:** Produces en `article-html.js`: `enhanceTables(root)` añade `.tb-header` en encabezado reconocido, `tr.lr-total`, `td.lr-nd`, `td.lr-pos`, `td.lr-neg`; `paragraphClass(text) -> 'lr-tit' | 'lr-fue' | ''`; `isHeaderRow(table) -> boolean`.

- [ ] **Step 1: Escribir la prueba.**

```js
const textOf = el => el.textContent.replace(/\s+/g, ' ').trim();
it('never changes official text', () => {
  const box = html(TABLE_WITH_TOTAL); const before = textOf(box);
  enhanceTables(box); expect(textOf(box)).toBe(before);
});
it('marks a total row only when it has figures', () => { /* «Total» con cifras sí; «Total de requisitos» sin cifras no */ });
it('recognizes years as a header, not figures', () => { expect(isHeaderRow(table(['(MW)', '2010', '2011']))).toBe(true); });
it('does not treat a data row as a header', () => { expect(isHeaderRow(table(['Carbo', '5,393']))).toBe(false); });
it('marks missing data only in tables with figures', () => { /* formularios no */ });
it('classifies titles and sources', () => {
  expect(paragraphClass('Tabla 2.1. Capacidad instalada')).toBe('lr-tit');
  expect(paragraphClass('Fuente: Elaboración SENER')).toBe('lr-fue');
});
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/article-html.test.js`.
- [ ] **Step 3: Implementar.** CSS de `lector.html` (`.tb`, `.tb-p`): sin cuadrícula, encabezado guinda, total guinda, primera columna fija desde 5, «Desliza» y «Ver en grande». «–» solo por `::after`. Justificado con `hyphens:auto` y `text-align-last:start` solo en `.reader-text`, comparación y mesas; retira la regla global de `#main-container`.
- [ ] **Step 4: Auditar.** `scripts/audit-tables.mjs` lee las tablas de Supabase (363 artículos), aplica `enhanceTables` con jsdom y compara texto y celdas. Run: `node scripts/audit-tables.mjs`. Expected: 0 diferencias. Si Supabase no responde, repórtalo y no cierres la fase.
- [ ] **Step 5: Commit** `feat: Excel table format and justified reading`.

### Task 12: Índice y selector de artículos

**Files:** Modify: `src/scripts/ui.js:1355-1357,1805-1880`, `src/styles/law-reader.css`, `src/scripts/law-sheet.js`. Create: `src/lib/article-picker.js`. Test: `tests/article-picker.test.js`, `tests/ui-reader.test.js`.

**Interfaces:** Produces: `articlePickerHtml(articles, { indexLabel }) -> string`; `filterPicker(root, query)`; `articleShortLabel(label) -> string`; `openPickerSheet(articles, onPick)`.

- [ ] **Step 1: Escribir la prueba.**

```js
it('shortens labels', () => { expect(articleShortLabel('Artículo 11')).toBe('11'); expect(articleShortLabel('Transitorio Primero')).toBe('T. Primero'); });
it('filters by prefix', () => { filterPicker(root, '11'); expect(visible(root)).toEqual(['11', '110', '111']); });
it('accepts «artículo 11»', () => { filterPicker(root, 'artículo 11'); expect(visible(root)[0]).toBe('11'); });
it('lists long labels when there are no numbers', () => { /* .lg en documentos por apartados */ });
it('with an article open, picking opens that article', () => { /* ui-reader */ });
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/article-picker.test.js`.
- [ ] **Step 3: Implementar.** Panel con pestañas Capítulos (el árbol actual) y Artículos (por defecto). Hoja: botón junto a la mesa en cabecera móvil y riel de tablet; visible solo en vista de documento. Conserva todo lo demás de `lr-panel-texto`.
- [ ] **Step 4: Verificar.** Run: `npm test`. Chrome en 3 tamaños.
- [ ] **Step 5: Commit** `feat: article picker in every size`.

### Task 13: Lector, comparar y mesas

**Files:** Modify: `index.html:680-860` (`#detail-modal`, `#compare-modal`), `src/scripts/ui.js:3463-3800`, `src/scripts/desk-view.js`, `src/styles/reader-modal.css`, `src/styles/reader.css`, `src/styles/reader-source.css`, `src/styles/desk.css`, `src/lib/require-account.js`. Test: `tests/ui-reader.test.js`, `tests/desk.test.js`, `tests/require-account.test.js`.

**Interfaces:** Produces: `requireAccount(what, { reason } = {})`, con texto según `reason`: `'descargas'` (actual) o `'guardar'`.

- [ ] **Step 1: Escribir la prueba.**

```js
it('asks for an account to save, without losing the rules', () => {
  signedOut(); document.getElementById('modal-bookmark-btn').click();
  expect(document.querySelector('.sd-primary').textContent).toBe('Crear cuenta');
});
it('pin stays free without an account', () => { /* data-pin-article agrega a la mesa */ });
it('all actions exist', () => { for (const id of ['share-btn', 'cite-btn', 'copy-btn', 'modal-prev-btn', 'modal-next-btn']) expect(byId(id)).not.toBeNull(); });
it('keeps the source viewer modes', () => { /* data-reader-mode text, original, split */ });
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/ui-reader.test.js`.
- [ ] **Step 3: Implementar.** Capa de `lector.html` sobre los mismos `id`, con candado vía `lockLabel`. `reader-source-view.js` y `reader-pdf.js` solo cambian CSS. Comparar y mesas: estilos de la maqueta; `desk-store`, `desk-sync` y `word-diff` no se tocan. Se conservan compartir, notas, edición de administrador y documento relacionado.
- [ ] **Step 4: Verificar.** Run: `npm test`. Chrome real: abrir el PDF de la Ley del Sector Eléctrico con resaltado, comparar dos leyes, mesa con 3 lado a lado.
- [ ] **Step 5: Commit** `feat: Búho reader with all its actions`.

## Fase 6: Como libro

### Task 14: Paginación

**Files:** Create: `src/lib/book-paginate.js`. Test: `tests/book-paginate.test.js`.

**Interfaces:** Produces:
- `articleBlocks(texto: string) -> Block[]`, donde `Block` es `{type:'text', text}`, `{type:'figure', src, alt}` o `{type:'table', html, cols, rows, head, body: string[], hasRowspan}`.
- `paginate(articles: {id, label, titulo, capitulo, texto}[], { fits: (html: string[]) => boolean, maxTableCols: number }) -> { pages: {html: string, caption: string, articleIds: string[]}[], tables: Record<string, {html, title}> }`
- `paginateInSlices(articles, options, { budgetMs = 16, yieldFn }) -> Promise<sameResult>`
- `pageOfArticle(pages, id) -> number`

`fits` se inyecta para medir en el navegador y simular en pruebas.

- [ ] **Step 1: Escribir la prueba.** Con `fits` simulado por caracteres.

```js
const fits = limit => html => html.join('').replace(/<[^>]+>/g, '').length <= limit;
it.each([300, 1200, 4000])('keeps every character at %i per page', limit => {
  const { pages } = paginate(LSE_SAMPLE, { fits: fits(limit), maxTableCols: 5 });
  expect(normalized(pages)).toBe(normalized(source(LSE_SAMPLE)));
});
it('repeats the header when a table splits, and loses no cell', () => { /* 449 filas, 2 columnas */ });
it('sends wide tables to a card', () => { /* 17 columnas: .tb-card y tables[id].html completo */ });
it('sends rowspan and oversize rows to a card', () => {});
it('keeps images in order', () => {});
it('handles empty, missing title and acronym', () => { expect(paginate([{ id: 'a', label: '', texto: '' }], OPT).pages).toBeDefined(); });
it('never loops on a word longer than the page', () => {});
it('finds the page of an article', () => {});
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/book-paginate.test.js`.
- [ ] **Step 3: Implementar.** Portar el algoritmo de `lector.html` (`paginar`, `ponerTabla`, `bloquesDe`). Usa `articleHtml` y `plainText` existentes como fuente. Palabra más larga que la página: va sola, sin ciclo infinito. `paginateInSlices` cede con `yieldFn` cada `budgetMs`.
- [ ] **Step 4: Verificar.** Run: `npx vitest run tests/book-paginate.test.js`.
- [ ] **Step 5: Commit** `feat: book pagination that never loses text`.

### Task 15: Vista de libro

**Files:** Create: `src/scripts/book-view.js`, `src/styles/book.css`. Modify: `src/scripts/ui.js` (selector en cabecera de documento). Test: `tests/book-view.test.js`.

**Interfaces:** Consumes: Task 14; `articlePickerHtml` (Task 12); `initReaderControls`. Produces: `renderBookView(host, { law, articles, onOpenArticle, onExit }) -> { destroy, goToArticle, currentArticle }`; `localStorage` en `libro-v1:<id>` con `{ page, articleId, marks: [] }`.

- [ ] **Step 1: Escribir la prueba.**

```js
it('offers two reading modes without leaving the document', () => { /* Por artículo y Como libro */ });
it('restores the same article when coming back', () => {});
it('works without localStorage', () => { breakStorage(); expect(() => renderBookView(host, OPT)).not.toThrow(); });
it('shows the legal notice on its last page', () => {});
it('falls back to articles if pagination fails', () => { /* paginate lanza: aviso y onExit */ });
it('announces the page with aria-live', () => {});
it('a fast second turn does not interrupt the next one', () => {});
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/book-view.test.js`.
- [ ] **Step 3: Implementar.** De `lector.html`: dos páginas desde 900 px; giro de 780 ms, 624 ms en una página; flechas, teclado, arrastre y barra. Espera `document.fonts.ready` y repagina si cambia la letra. Caché en memoria por documento, ancho, alto y ajustes. Menú de artículo: Leer por artículo, Ver el original, Copiar cita formal, Copiar, Compartir, Fijar, Guardar. Celular a pantalla completa con botón de regreso. Movimiento reducido: sin giro.
- [ ] **Step 4: Verificar.** Run: `npm test`. Chrome real: Ley del Sector Eléctrico, PROSENER, PLADESE y el DOF más largo; 3 tamaños; 4 temas.
- [ ] **Step 5: Commit** `feat: read any document as a book`.

## Fase 7: Permisos y resto

### Task 16: Tipo de permiso

**Files:** Create: `src/lib/permit-type.js`. Modify: `src/lib/infra-icons.js`. Test: `tests/permit-type.test.js`, `tests/map-markers.test.js`.

**Interfaces:** Produces:
- `permitType(numero: string, { technology = '' } = {}) -> { icon, label, tech?, sector }`
- `typeTile(type, { size = '' } = {}) -> string`
- `tileInk(hex) -> '#fff' | '#0a0707'`
- `loadTechIndex(fetcher?) -> Promise<Map<numero, tecnologia>>`, de `/api/mapa/capa?tipo=electricidad`, una vez en memoria y con mapa vacío si falla.
- `infraIcon('ducto')`; `TECHNOLOGIES` suma `almacen` con `alm`.

- [ ] **Step 1: Escribir la prueba.** Con la tabla exacta de la sección 9.1 del spec:

```js
it.each([
  ['CNE/PL/933/TRA/OM/2026', 'distribucion', 'Transporte sin ducto'],
  ['G/1/TRA/2020', 'ducto', 'Transporte por ducto'],
  ['PL/9/ALM/2020', 'almacenamiento', 'Almacenamiento'],
  ['PL/9/ALM/AE/2020', 'aerodromo', 'Almacenamiento en aeródromo'],
  ['LP/9/DIST/PLA/2020', 'planta', 'Planta de distribución'],
  ['CNE/LP/931/EXP/ES/2026', 'estacion', 'Estación de servicio'],
  ['PL/9/EXP/ESA/2020', 'autoconsumo', 'Autoconsumo'],
  ['H/9/COM/2020', 'comercio', 'Comercialización'],
])('%s', (n, icon, label) => { expect(permitType(n)).toMatchObject({ icon, label }); });
it('uses the technology when known', () => { expect(permitType('E/1/GEN/2020', { technology: 'Fotovoltaica' })).toMatchObject({ tech: 'fv', label: 'Fotovoltaica' }); });
it('never invents a type', () => { expect(permitType('G/1/TUP/2020').icon).toBe('otro'); });
it('picks readable ink', () => { expect(tileInk('#e0a12e')).toBe('#0a0707'); expect(tileInk('#9b2247')).toBe('#fff'); });
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/permit-type.test.js`.
- [ ] **Step 3: Implementar.** Portar `tipoPorNumero` y `mosaico` de `mapa.html`.
- [ ] **Step 4: Verificar.** Run: `npx vitest run tests/permit-type.test.js`.
- [ ] **Step 5: Commit** `feat: permit type tiles`.

### Task 17: Mapa de permisos

**Files:** Modify: `src/scripts/permits-map-view.js`, `src/lib/map-common.js`, `src/styles/permits-map.css`, `src/styles/design/variables.css:73-77,132`. Test: `tests/map-markers.test.js`, `tests/mapa-proxy.test.js`, `tests/permits-map-popup.test.js`.

**Interfaces:** Produces: `popupCounts(row) -> string`; `pinIcon(...)` conserva firma; `sectorCluster(L, sectors, { toneOf })`; `pinSize(capacidad) -> 22 | 26 | 30`. Consumes: `fetchPermit` (`cne-api.js`), `typeTile`, `permitPdfUrl`.

- [ ] **Step 1: Escribir la prueba.**

```js
it('uses the Búho voltage standard', () => {
  expect(KV_CLASSES.map(c => c.label)).toEqual(['400 kV', '230 kV', '161 kV', '138 kV', '115 kV', '85 kV', '69 kV', '35 kV o menor']);
});
it('sizes pins by capacity', () => { expect(pinSize(10)).toBe(22); expect(pinSize(30)).toBe(26); expect(pinSize(300)).toBe(30); });
it('shows resolutions, agreements, letters and annexes', () => { /* popupCounts */ });
it('the popup survives a slow or failed registry', async () => {
  fetchPermit.mockRejectedValue(new Error('caído'));
  const html = await popupFor(PERMIT);
  expect(html).toContain('Ficha y normativa'); expect(html).not.toContain('Resoluciones</dt>');
});
```

Ajusta `kvClass` y las pruebas de `mapa-proxy` a las clases nuevas.

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/permits-map-popup.test.js`.
- [ ] **Step 3: Implementar.** Layout de `mapa.html`: mapa a sangre, márgenes `verMexico` por tamaño, panel de cristal, chips, indicadores, botones flotantes y hoja móvil. Valores `kv-*` de la tabla en `README` de Búho. Dona con mezcla (`iconoGrupo`). Gota con `techMarkerSVG` variante `pin`. Se conservan datos, capas, búsqueda, CSV, ubicación, huracanes, otras actividades y ligas con su lista de resoluciones. Reemplaza cada grupo sin parpadeo. Lazy por capa, como hoy.
- [ ] **Step 4: Verificar.** Run: `npm test`. Chrome real y un celular: encender Petrolíferos, acercar, abrir ventana. Reporta rendimiento.
- [ ] **Step 5: Commit** `feat: full-bleed permits map`.

### Task 18: Pestañas de permisos

**Files:** Modify: `src/scripts/cne-view.js`, `permits-view.js`, `resolutions-view.js`, `cne-panorama-view.js`, `tramites-view.js`, `cne-sener-view.js`, `cne-shared.js`, `src/styles/permits.css`, `cne-sener.css`. Test: `tests/cne-view.test.js`, `tests/cne-api.test.js`.

**Interfaces:** Consumes: `permitType`, `typeTile`, `loadTechIndex` (Task 16). Produces: `.pm-tabs` con grupos `data-aut="cne"` y `data-aut="sener"`; `authorityTag(aut) -> string`; `.en-sener` en `.pm-view`.

- [ ] **Step 1: Escribir la prueba.**

```js
it('groups tabs by authority', () => {
  expect(tabsOf('cne')).toEqual(['Permisos', 'Resoluciones', 'Panorama', 'Trámites', 'Mapa']);
  expect(tabsOf('sener')).toEqual(['Títulos y permisos']);
});
it('labels each view with its authority', () => { /* CNE y SENER con nombre completo */ });
it('permit cards carry a type tile', () => { /* .bu-ico */ });
it('cards still render if the technology index fails', async () => { /* loadTechIndex rechaza */ });
```

- [ ] **Step 2: Verificar que falla.** Run: `npx vitest run tests/cne-view.test.js`.
- [ ] **Step 3: Implementar.** Marcado y CSS de `vistas` en `mapa.html`, con las consultas en vivo actuales. El color de tablas sigue guinda.
- [ ] **Step 4: Verificar.** Run: `npm test`. Chrome en 3 tamaños y 4 temas, con deep links `#permiso=`, `#resolucion=`, `#tramite=`.
- [ ] **Step 5: Commit** `feat: permits section by authority`.

### Task 19: Resto de vistas

**Files:** Modify por vista, según tabla 9 del spec: `timeline-view`, `instrument-timeline-view`, `polos-view`, `explorer-view`, `explorer-editor`, `stats-view`, `terms-view`, `como-funciona-view`, `reto-view`, `help-view`, `auth`, `account-panel`, `password-recovery`, `users-view`, `admin-*`, `law-presentation`, `site-dialogs`, `onboarding`, y sus CSS; `src/lib/empty-art.js`, `acervo-art.js`, `tech-markers.js`, `issuer.js`.

Es un solo patrón de migración. Haz un commit por vista.

- [ ] **Step 1: Migrar.** Por cada vista: clases a `bu-*`; hexadecimales a tokens; `h1` en Fraunces; `Tabla`, `KPI`, `Grafica`, `Modal` y `EstadoVacio` de Búho. Grafos de Análisis y términos: solo colores, sin tocar animaciones. Mapas de Polos: solo layout, sin tocar polígonos. Presentación: constantes de color en web y PPTX.
- [ ] **Step 2: Verificar cada vista.** Run: `npm test`. Chrome en 390, 820 y 1400 px y 4 temas: cotejo de la sección 10 del spec para esa vista, sin errores de consola.
- [ ] **Step 3: Mostrar al usuario.** Al terminar Aprende y Polos, pide revisión antes de seguir.
- [ ] **Step 4: Commit** `feat: Búho style in <vista>` por vista.

## Fase 8: Cierre

### Task 20: Limpieza, intro y documentación

**Files:** Delete: `src/styles/design/legacy-dark.css`, `dark-balance.css`, `chrome.css`, `components-extra.css`, `src/styles/sener-institutional.css` y los selectores `bj-` sin uso. Modify: `src/styles/index.css`, `video-intro/*`, `src/scripts/site-intro.js`, `DESIGN.md`, `CLAUDE.md`, `public/sw.js` si cambia la lista. Test: `tests/design-leftovers.test.js`.

- [ ] **Step 1: Escribir la prueba.**

```js
it('has no raw colors outside tokens', () => { expect(rawHexIn(MIGRATED_CSS, ALLOWED)).toEqual([]); });
it('has no old design classes or fonts', () => {
  expect(grep(/bj-[a-z]|Newsreader|Noto Sans/, SOURCES)).toEqual([]);
});
it('keeps the important budget', () => { expect(countImportant(CSS)).toBeLessThan(40); });
```

- [ ] **Step 2: Verificar que falla y limpiar.** Run: `npx vitest run tests/design-leftovers.test.js`. Retira lo que quede hasta que pase.
- [ ] **Step 3: Video.** Actualiza `video-intro/` con la marca nueva. Run: `node video-intro/render.mjs` (requiere FFmpeg). Verifica los videos publicados. Si no hay FFmpeg, deja el respaldo SVG y avisa.
- [ ] **Step 4: Documentación.** Reescribe `DESIGN.md` según Búho y este spec. En `CLAUDE.md`, actualiza vistas, tema y módulos nuevos.
- [ ] **Step 5: Cotejo final.** Run: `npm test && npm run lint && npm run build && npm run preview`. Recorre la sección 10 completa en 390, 820, 1280 y 1400 px y 4 temas, con Chrome y un celular real. Mide contraste y reporta cualquier resto.
- [ ] **Step 6: Commit** `chore: retire the previous design`. No hagas push ni PR sin pedirlo.
