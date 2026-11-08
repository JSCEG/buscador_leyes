# Landing de inicio: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Ejecución en línea en esta sesión, elegida por el usuario.

**Goal:** El sitio abre en una landing estática e inmediata con galería por scroll; el búho 3D solo se carga si alguien lo pide.

**Architecture:** La primera pantalla vive en `index.html` y un script en `<head>` marca `html.landing-on` para mostrarla antes del JavaScript. `landing-view.js` la conecta y pinta la galería con datos de `search-ready`. `ui.js` añade `showLandingView` como portada y pasa el estante a `#estante`.

**Tech Stack:** JS sin framework, Vite, CSS con tokens Búho, Vitest (jsdom).

**Spec:** `docs/superpowers/specs/2026-11-08-landing-inicio-design.md`

## Global Constraints

- Sin push, merge ni PR. Sin commit hasta que el usuario lo pida: los pasos de commit de esta plantilla se omiten a propósito.
- No tocar cambios ajenos: `.claude/settings.local.json`, `package*.json`, `public/data/manifest.json`, `server/reader-pdf-sources.json`, `src/lib/motion.js`, `supabase/.temp/`, `docs/propuestas-*`, `conceptos-3d/`, `public/conceptos/hidrogeno*`, `src/data/como-funciona.js`, `scripts/build-concept-thumbs.mjs`, `tests/hidrogeno.test.js`.
- Ninguna consulta nueva a Supabase. Datos solo de `search-ready`, `/polos/polos.json` y archivos estáticos.
- Pruebas con `npx vitest run` (nunca `npm test`).
- Colores solo por tokens: `tests/design-leftovers.test.js` limita hex y `!important`. Sin `!important` nuevos.
- Acción principal en tinta (`--accion`); guinda (`--rojo`) solo para acento del titular y seleccionados. Sin difuminados rojos.
- Textos públicos exactos de la spec, en español llano.

## Review Focus

1. Teclear y pulsar Enter antes de que cargue el JavaScript: la búsqueda debe correr al arrancar, una sola vez. Prueba en Task 3.
2. Tocar «Ver los documentos» o una portada antes del JavaScript: al arrancar se abre esa dirección y la landing se oculta. Prueba en Task 4.
3. Títulos del catálogo con `<`, `&`, sin fecha o sin siglas: se escapan y no rompen la galería. Prueba en Task 1 y 3.
4. Volver a la landing varias veces: no duplica galería ni oyentes, ni repite búsquedas. Prueba en Task 3.
5. Cerrar una ficha abierta por enlace directo: queda en `#estante`, no salta a la landing. Prueba en Task 4.

---

### Task 1: Modelo de datos

**Files:** Create `src/lib/landing-model.js`; Test `tests/landing-model.test.js`.

**Interfaces — Produces:**
- `catalogFigures(summaries) -> { documentos: number, articulos: number }`: ignora `articulos` no finitos o negativos.
- `typeBars(summaries) -> [{ id, label, count, share }]`: de `groupAcervo`, sin grupos vacíos, en orden de `ACERVO_GROUPS`; `share = count / max` en 0–1.
- `recentDocuments(summaries, n = 5) -> [{ id, name, date, year }]`: los `n` con fecha más reciente; `name` son las siglas o el título; ignora sin fecha.
- `figuresLine({ documentos, articulos }) -> string`: «5,879 artículos en 126 documentos» con formato `es-MX`.

- [ ] **Step 1:** Pruebas `tests/landing-model.test.js`: suma con `articulos` nulo, negativo y `NaN`; `typeBars` sin grupos vacíos y con `share` 1 en el mayor; `recentDocuments` ordena, recorta y descarta sin fecha; `figuresLine({ documentos: 126, articulos: 5879 })` es `'5,879 artículos en 126 documentos'`; lista vacía da `{ documentos: 0, articulos: 0 }` y `[]`.
- [ ] **Step 2:** `npx vitest run tests/landing-model.test.js`. Esperado: FAIL, módulo inexistente.
- [ ] **Step 3:** Implementar reutilizando `groupAcervo`, `selectAcervo` y `ACERVO_GROUPS` de `acervo-model.js`.
- [ ] **Step 4:** Repetir. Esperado: PASS.

### Task 2: Primera pantalla estática

**Files:** Modify `index.html` (head y antes de `<main`); Create `src/styles/landing.css`; Modify `src/styles/index.css` para importarla; Test `tests/landing-static.test.js`.

**Interfaces — Produces:** `html.landing-on`; `#landing-view` con `form#landing-search`, `[data-landing-books]`, `[data-landing-bars]`, `[data-landing-figures]`, `[data-landing-desk]`, `[data-landing-gallery]`, `[data-landing-foot]`; `window.__landingQuery` (consulta enviada antes del arranque).

- [ ] **Step 1:** Elegir la tercera portada: del catálogo real, el `acuerdo` o `dacg` con siglas y más artículos. Abanico: RLSH `bdfc48ed-5ff9-4746-9251-6e1fdc989c58` (izquierda), LSE `8e404121-3502-4f47-937d-a43762c52da8` (centro), esa tercera (derecha).
- [ ] **Step 2:** Pruebas `tests/landing-static.test.js`:
  - El script de `<head>` que contiene `landing-on` se evalúa con `new Function('location','document','window', código)` y marca solo `/` y `/index.html` sin hash; no marca `/#acervo`, `/ley/x`, `/instalar`, `/otra`.
  - `#landing-view h1` contiene `Las reglas de la energía en México,` y `a la mano.`.
  - Los tres enlaces de `[data-landing-books]` llevan `href` `#ficha-<id>` y clase `.sh-cover` dentro.
  - `#landing-view` trae los 4 `data-theme-choice`.
  - `index.html` no referencia `/intro/buho.html`.
- [ ] **Step 3:** `npx vitest run tests/landing-static.test.js`. Esperado: FAIL.
- [ ] **Step 4:** Implementar:
  - Script de `<head>`: marca `landing-on` según la regla; añade un `submit` en `document` para `#landing-search` que hace `preventDefault` y guarda `window.__landingQuery`.
  - `<style>` en línea: `#landing-view{display:none}html.landing-on #landing-view{display:block}html.landing-on #main-container,html.landing-on #institutional-footer{display:none}`.
  - Marcado con los textos exactos de la spec, portadas con el mismo HTML que da `coverHTML` (sin logos), `bu-btn bu-btn-primario`, `bu-campo`, `bu-seg`, tarjeta con estado de espera (`data-state="loading"`).
- [ ] **Step 5:** `landing.css`: rejilla de dos columnas desde 1024 px, una sola columna por debajo, titular `clamp` en Fraunces, abanico con transformaciones, tarjeta `bu-cristal`, sin scroll horizontal, `prefers-reduced-motion` respetado. Barras: color `--ac` por `data-category`, altura fija, línea base en cero.
- [ ] **Step 6:** Repetir pruebas y `tests/design-leftovers.test.js`. Esperado: PASS.

### Task 3: Vista y galería

**Files:** Create `src/scripts/landing-view.js`; Modify `src/styles/landing.css`; Test `tests/landing-view.test.js`.

**Interfaces:**
- Consumes: Task 1 y marcado de Task 2; `coverHTML`, `ACERVO_GROUPS`; `MEXICO_VIEWBOX`, `MEXICO_STATES`; `stats` de `lib/polos.js`; `typeTile`; `savedFigures` exportada por `site-intro.js`.
- Produces: `renderLandingView(host, { summaries, status, onSearch, onLegal, onFeedback, onOpenDesk, fetchPolos }) -> { setCatalog(summaries), setFailed(), destroy() }`.

- [ ] **Step 1:** Pruebas `tests/landing-view.test.js` (host armado con el `#landing-view` de `index.html`):
  - `setCatalog` llena barras con enlaces `#acervo?grupo=<id>` y la cifra con `figuresLine`.
  - Antes del catálogo, con `intro-cifras` guardado, muestra esas cifras; sin ellas, no muestra número.
  - `setFailed` oculta tarjeta y cifra y deja usable el formulario.
  - Enviar el formulario llama `onSearch('interconexión')`; vacío no llama.
  - `window.__landingQuery` al montar llama `onSearch` una vez y se borra; un segundo montaje no repite.
  - Un título con `<img src=x>` no crea `img` en cronología ni acervo.
  - `destroy` y otro montaje dejan exactamente 6 secciones en la galería y un solo `onSearch` por envío.
  - `fetchPolos` rechazado deja la sección Polos sin conteo y sin error.
  - La galería incluye `[data-abrir-buho]` y dos `img[loading="lazy"]` del búho.
- [ ] **Step 2:** `npx vitest run tests/landing-view.test.js`. Esperado: FAIL.
- [ ] **Step 3:** Implementar. Enlaces de sección con `data-landing-go="<id del riel>"` que hacen clic en `nav-inicio`, `nav-leyes`, `nav-cronologia`, `nav-permisos`, `nav-polos`, `nav-como-funciona`. Polos se pide al acercarse la sección; sin `IntersectionObserver`, todas las secciones visibles y sin petición. Aprende: `eolica`, `fotovoltaica`, `ciclo-combinado`, con imagen clara y oscura diferidas y CSS por `data-theme`. Portada ausente del catálogo: su enlace pasa a `#acervo`.
- [ ] **Step 4:** Estilos: filas alternadas desde 768 px, una columna en celular, entrada de 320 ms (`opacity`, `transform`) con `.is-in`.
- [ ] **Step 5:** Repetir. Esperado: PASS.

### Task 4: Arranque, rutas y búho

**Files:** Modify `src/scripts/ui.js`, `src/main.js`, `src/scripts/site-intro.js`, `src/scripts/shelf-view.js:536`, `tests/ui-home.test.js`, `tests/site-intro-video.test.js`, `tests/shelf-view.test.js:21,95`, `CLAUDE.md`, `DESIGN.md`.

**Interfaces — Consumes:** `renderLandingView` de Task 3. **Produces:** `showLandingView({ updateHistory = true })` y `releaseLanding()` internos de `initUI`; ruta `#estante`.

- [ ] **Step 1:** Actualizar `tests/ui-home.test.js`:
  - Sin hash, `/` muestra `html.landing-on` y no crea `.sh-tome`; el logo vuelve a la landing con hash vacío.
  - `#estante` muestra el estante; «Estante 3D» de Acervo lleva a `#estante`.
  - `#ficha-ley-a` abre estante y ficha; cerrar deja `#estante` y el estante sigue.
  - Arrancar con `#acervo` estando `html.landing-on` quita la clase (Review Focus 2).
  - Atrás a dirección vacía muestra la landing.
  - El tour no se dispara con la landing activa.
  - Ajustar los pasos existentes que daban por hecho que `/` era el estante.
- [ ] **Step 2:** En `tests/site-intro-video.test.js`: el logo ya no crea `#site-intro`; `[data-abrir-buho]` sí; quitar las pruebas de `shouldShowIntro`. En `tests/shelf-view.test.js`: quitar `__introDone`.
- [ ] **Step 3:** `npx vitest run tests/ui-home.test.js tests/site-intro-video.test.js tests/shelf-view.test.js`. Esperado: FAIL.
- [ ] **Step 4:** `ui.js`:
  - `showHomeView` usa `#estante` por omisión; `handleInitialHash` atiende `#estante`; la línea 722 lo añade; `onSheetChange` y la ficha desconocida usan `history.replaceState(null, '', '#estante')`.
  - `showLandingView` con los mismos `onSearch`, `onLegal`, `onFeedback` que el estante; `releaseHome` llama `releaseLanding`.
  - Logo, `crumb-inicio`, `popstate` sin hash y la línea 4780 van a la landing.
  - `search-ready` y `search-failed` avisan también a `landingView`.
  - Línea 373: sin `__introDone` y con `!landingView`.
  - Al inicio de `initUI`, si hay hash, quitar `landing-on`.
- [ ] **Step 5:** `main.js`: quitar `shouldShowIntro`/`playIntro`. `site-intro.js`: quitar `shouldShowIntro`, `KEY` y el logo del oyente; exportar `savedFigures`; actualizar el comentario inicial. `shelf-view.js:536`: añadir `is-entered` directamente.
- [ ] **Step 6:** Repetir Step 3. Esperado: PASS.
- [ ] **Step 7:** `CLAUDE.md` (vista `#landing-view`, estante en `#estante`, búho solo como guía) y `DESIGN.md` (fila `.lp-*`).

### Task 5: Verificación

- [ ] **Step 1:** `npm run lint`, `npx vitest run`, `npm run build`. Esperado: todo pasa, salvo fallos ajenos previos, que se reportan. Revisar `git status` por si el build tocó archivos ajenos.
- [ ] **Step 2:** Navegador con servidor `preview`: 1440, 820 y 390 px por `light`, `dark`, `sepia`, `contraste`. Comprobar sin scroll horizontal (`scrollWidth <= innerWidth`), contraste, búsqueda, enlaces de galería, tema, mesa y «Abrir la guía». Capturas.
- [ ] **Step 3:** `measure-load.mjs` contra `preview`, mismos perfiles, y también contra producción como control de red. Esperado: sin petición a `/intro/buho.html` hasta tocar la guía; FCP y LCP de la landing en celular por debajo del primer texto de hoy (3.2–6.0 s). Si la hoja de 333 KB resulta ser el freno, reportarlo como seguimiento.
- [ ] **Step 4:** Anotar en la nota de sesión y en el resumen la limpieza pendiente: video, emblema e intro CSS sin uso.
