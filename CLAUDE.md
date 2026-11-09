# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # genera manifest + arranca Vite (puerto 5173)
npm run build     # genera manifest + build de producción en dist/
npm run preview   # sirve el build de producción localmente
npm test          # corre tests con Vitest (jsdom)
npm run lint      # ESLint
```

Correr un solo test:
```bash
npx vitest run tests/search.test.js
```

Video de la intro: el búho mecánico en 3D de `intro-3d/` (skill teardown + FFmpeg; graba en `.local/intro-3d` a 60 cuadros, publica en `public/video/` a 30 y dice dónde queda el ojo para `FILMS` en `src/scripts/site-intro.js`):
```bash
node scripts/render-intro-3d.mjs          # los dos videos
node scripts/render-intro-3d.mjs hojas    # solo hojas de revisión
```
Guía del búho (no sale al cargar; se abre con `data-abrir-buho`: «Abrir la guía» de la landing, «Guía rápida» y Ayuda, y vive también al final de la portada): el búho biomecánico en tiempo real, con menú de secciones, giro, alas, por dentro y desarme. Carga en azul o verde (se turnan por visita, `src/lib/buho-vidrio.js`). Fuente en `buho-bio/vivo/`; `site-intro.js` (a pantalla completa) y `landing-owl.js` (`?modo=portada`, solo cuando la sección se acerca) la cargan en un iframe y hablan con ella por `postMessage` (`buho-listo`, `buho-ir`, `buho-entrar`, `buho-error`, `buho-visible`, `buho-tema`; en la portada también `buho-parte` y `buho-elegir`: ahí no lleva menú propio, su menú es el principal). Si no responde a tiempo, sale la imagen:
```bash
node scripts/build-buho-bio.mjs           # → public/intro/buho-bio.html (?tema=claro|oscuro&vidrio=azul|verde&modo=guia|portada)
node scripts/build-intro-3d.mjs           # el búho mecánico anterior → public/intro/buho.html, ya sin usar
```
`video-intro/` (HyperFrames) es la intro anterior en 2D.

`buho-bio/` por dentro: `motor.js` es el búho sobre un `<canvas>` y no arma interfaz; `node buho-bio/build.mjs` deja en `.local/buho-bio/` la toma para calcar y `buho-bio.js`, el paquete del lienzo de diseño.

Variables de entorno requeridas (archivo `.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Arquitectura

SPA de una sola página (`index.html`) sin framework. Vite como bundler, Tailwind para estilos, Supabase como backend y D3.js para visualizaciones.

### Flujo de arranque

`main.js` → dispara `initUI()`, `initSearch()`, `initAdminIngest()` en `DOMContentLoaded`.

- `initSearch()` llama a Supabase y emite el evento global `search-ready` con metadatos (total de leyes y artículos). `ui.js` escucha ese evento para poblar el contador del hero.
- La comunicación entre módulos usa **CustomEvents del DOM** (`search-ready`, `analisis:openArticle`, `analisis:goHome`), no un store ni estado compartido.

### Módulos principales

| Archivo | Responsabilidad |
|---|---|
| `src/scripts/search-engine.js` | Todo el acceso a Supabase: búsqueda FTS, artículos por ley, conteos, temas |
| `src/scripts/ui.js` | Manejo de todas las vistas (hero, resultados, detalle de ley, favoritos, estadísticas), modo oscuro, deep linking con `history.pushState` |
| `src/scripts/analisis.js` | Vista de Temas Transversales: datos hardcodeados en `TEMAS[]`, renderizado con D3 y HTML dinámico |
| `src/scripts/admin-ingest.js` | Panel para subir PDFs vía drag-and-drop, parsear con pdf.js y escribir artículos a Supabase |
| `src/lib/book-paginate.js`, `src/scripts/book-view.js` | Lectura como libro: paginación que nunca pierde texto y giro 3D |
| `src/lib/article-picker.js` | Selector de artículos del panel y de la hoja |
| `src/lib/permit-type.js` | Tipo de permiso por número y mosaico de icono |
| `src/lib/supabase.js` | Singleton del cliente Supabase (usa `import.meta.env.VITE_*`) |

### Base de datos Supabase

Tablas principales:
- `leyes` — metadatos de cada ley (título, fecha, temas_clave)
- `articulos` — texto de cada artículo con columna `fts` (full-text search en español)
- `temas` — índice de temas por ley (nivel, nombre, orden)

La búsqueda usa `.textSearch('fts', query)` con operador `&` entre palabras.

### Vistas de la SPA

Las vistas son secciones del DOM que se muestran/ocultan con `classList.add/remove('hidden')`. No hay router. Las vistas son:
- `#hero-section` — portada de búsqueda (`#buscar`)
- `#landing-view` — portada: sin dirección y al tocar el logo. Su primera pantalla viene en `index.html` (un script en `<head>` pone `html.landing-on`) para pintarse sin esperar al JavaScript; `landing-view.js` la conecta y dibuja la galería
- `#home-view` — estante 3D de documentos (`shelf-view.js`), en `#estante`; también abre las fichas (`#ficha-…`)
- `#results-container` — resultados de búsqueda y secciones que se pintan ahí; entre ellas `#acervo` (`acervo-view.js`), hileras de portadas con filtros por tipo y dependencia (`acervoReels` en `acervo-model.js`)
- `#law-detail-container` — documento: por artículo o como libro (`book-view.js`)
- `#analisis-container` — Temas Transversales (renderizado por `analisis.js`)
- `#admin-ingest-container` — panel de ingesta

El armazón es `.bu-riel` (riel), `.bu-cab-m` (cabecera de celular) y `#bottom-nav` (menú inferior); la hoja «Más» conserva el `id` `mobile-menu-drawer`.

### Deep linking

Las URLs usan hash: `#art:ID` para artículo, `#ley:NOMBRE` para ley. Al cargar, `handleInitialHash()` en `ui.js` parsea el hash y navega al contenido correcto. Mientras tanto, `html.route-wait` oculta el buscador y dice «Cargando…».

### Service Worker

`public/sw.js` — estrategia diferenciada:
- `index.html` → network-first
- `/assets/*` (hashed) → cache-first
- `/data/*.json` → network-first
- resto → stale-while-revalidate

Solo se registra en producción (`!import.meta.env.DEV`). La versión se pasa como `?v=BUILD_TIMESTAMP` desde `vite.config.js`.

### Tema visual

Sistema Búho (ver `DESIGN.md`). Tokens en `src/styles/design/variables.css` para los 4 temas de `data-theme` (`light`, `dark`, `sepia`, `contraste`); componentes `bu-*` en `src/styles/design/buho/`. Tailwind apunta a esos tokens. Letras: Fraunces y Manrope, servidas desde `public/fonts/`. Marca: `src/lib/brand-mark.js`; los archivos de `public/img` se regeneran con `node scripts/generate-brand-assets.mjs`.

### `generate-manifest.js`

Script Node.js (CommonJS) que lee `public/data/*.json` y genera `public/data/manifest.json`. Se ejecuta antes de cada `dev`/`build`. El plugin `manifestPlugin` en `vite.config.js` lo re-ejecuta cuando se añaden o eliminan JSONs en `public/data/` durante el dev, usando `ready` flag + debounce de 300ms para evitar recargas en bucle al arrancar.

### Scripts de mantenimiento de BD

En la raíz (no son parte del bundle):
- `ingestar_pdf.js` — parsea PDFs con pdf2json y sube artículos a Supabase
- `rechunk_leyes.js` / `fix_rechunk.js` — re-chunking de leyes existentes
- `backfill_temas.js` — rellena tabla `temas` desde los JSONs de `public/data/`

Figuras 3D de «¿Cómo funciona?»: fuentes en `conceptos-3d/<figura>/` (`main.js` con three.js, `style.css` Búho); `node scripts/build-conceptos-3d.mjs [figura]` las arma con la skill teardown (`~/.claude/skills/teardown`) y escribe `public/conceptos/<figura>.html` (oscuro) y `<figura>-light.html` (claro). Hablan con Aprende por `postMessage` (`concepto-height`, `concepto-part`, `concepto-select-part`). Lo que comparten las plantas con física (fichas, puntos clave, vuelo de cámara, gráficas, tablas y estilos) está en `conceptos-3d/planta-comun/`; su `style.css` empieza con la marca `/* usa planta-comun` para que el armado incluya ese estilo. Hoy lo usan ciclo combinado, fotovoltaica, eólica, hidroeléctrica, refinación y gasoductos; hidrógeno, geotérmica y nuclear llevan su propia copia.

En `scripts/`: `audit-tables.mjs` compara texto y celdas de todas las tablas antes y después del formato (`--local` usa `public/data`).
