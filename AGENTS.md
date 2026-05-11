# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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
| `src/lib/supabase.js` | Singleton del cliente Supabase (usa `import.meta.env.VITE_*`) |

### Base de datos Supabase

Tablas principales:
- `leyes` — metadatos de cada ley (título, fecha, temas_clave)
- `articulos` — texto de cada artículo con columna `fts` (full-text search en español)
- `temas` — índice de temas por ley (nivel, nombre, orden)

La búsqueda usa `.textSearch('fts', query)` con operador `&` entre palabras.

### Vistas de la SPA

Las vistas son secciones del DOM que se muestran/ocultan con `classList.add/remove('hidden')`. No hay router. Las vistas son:
- `#hero-section` — pantalla inicial con buscador
- `#results-container` — resultados de búsqueda
- `#law-detail-container` — TOC + artículos de una ley completa
- `#analisis-container` — Temas Transversales (renderizado por `analisis.js`)
- `#admin-ingest-container` — panel de ingesta
- `#stats-minimal` — contador de leyes/artículos en el header

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

Colores institucionales SENER definidos en `tailwind.config.js`:
- `guinda` / `guinda-dk` / `guinda-lt` — rojo institucional (`#9B2247`)
- `verde` / `verde-lt` — verde energía (`#1E5B4F`)
- `dorado` — hidrocarburos (`#A57F2C`)

El modo oscuro inyecta un `<style id="global-dark-style">` en `<head>` con overrides `!important` sobre clases de Tailwind. No usa `dark:` variants de Tailwind. Se persiste en `localStorage` con key `app-dark-mode`.

### `generate-manifest.js`

Script Node.js (CommonJS) que lee `public/data/*.json` y genera `public/data/manifest.json`. Se ejecuta antes de cada `dev`/`build`. El plugin `manifestPlugin` en `vite.config.js` lo re-ejecuta cuando se añaden o eliminan JSONs en `public/data/` durante el dev, usando `ready` flag + debounce de 300ms para evitar recargas en bucle al arrancar.

### Scripts de mantenimiento de BD

En la raíz (no son parte del bundle):
- `ingestar_pdf.js` — parsea PDFs con pdf2json y sube artículos a Supabase
- `rechunk_leyes.js` / `fix_rechunk.js` — re-chunking de leyes existentes
- `backfill_temas.js` — rellena tabla `temas` desde los JSONs de `public/data/`
