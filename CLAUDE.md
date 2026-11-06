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

Video de la intro (requiere FFmpeg; publica en `public/video/`):
```bash
node video-intro/render.mjs
```

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
- `#home-view` — estante de documentos (`shelf-view.js`), con carpetas por tipo
- `#results-container` — resultados de búsqueda y secciones que se pintan ahí
- `#law-detail-container` — documento: por artículo o como libro (`book-view.js`)
- `#analisis-container` — Temas Transversales (renderizado por `analisis.js`)
- `#admin-ingest-container` — panel de ingesta

El armazón es `.bu-riel` (riel), `.bu-cab-m` (cabecera de celular) y `#bottom-nav` (menú inferior); la hoja «Más» conserva el `id` `mobile-menu-drawer`.

### Deep linking

Las URLs usan hash: `#art:ID` para artículo, `#ley:NOMBRE` para ley. Al cargar, `handleInitialHash()` en `ui.js` parsea el hash y navega al contenido correcto.

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

En `scripts/`: `audit-tables.mjs` compara texto y celdas de todas las tablas antes y después del formato (`--local` usa `public/data`).
