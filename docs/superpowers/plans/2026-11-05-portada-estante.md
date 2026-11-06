# Portada con estante 3D · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir la portada `/` por un estante curvo 3D con búsqueda visible, regla por colección y una ficha que crece desde la portada del documento.

**Architecture:** Cuatro módulos nuevos con límites claros: geometría pura, generador de lomos y portadas, hoja de ficha y vista del estante. `ui.js` solo aporta rutas y callbacks. Lo 3D es CSS más un bucle `requestAnimationFrame` que se detiene en reposo.

**Tech Stack:** JavaScript sin framework, Vite, Vitest con jsdom, CSS con los tokens de `src/styles/design/variables.css`.

**Spec:** `docs/superpowers/specs/2026-11-05-portada-estante-design.md`. Valores, tablas y textos salen de ahí; este plan no los repite salvo cuando una prueba los fija.

## Global Constraints

- Rama: `feat/portada-estante`.
- Sin dependencias nuevas. No importar `motion` ni `src/lib/motion.js`.
- En cada commit, `git add` solo con los archivos de la tarea. Nunca incluir `package.json`, `package-lock.json`, `public/data/manifest.json`, `.claude/settings.local.json`, `src/lib/motion.js`, `docs/propuestas-spline-2026-10-24.md` ni `supabase/.temp/`.
- Cada commit termina con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Textos visibles en español sencillo: «documentos», no «instrumentos» ni «acervo». «Disposiciones», no «DACG».
- No usar `overflow:hidden` ni `user-select:none` en `body`. No ocultar el cursor.
- Todo texto de datos pasa por escape de HTML.
- `el.animate`, `matchMedia`, `setPointerCapture` y `ResizeObserver` pueden faltar en jsdom: usar encadenamiento opcional, con el estado final aplicado aunque falten.
- `getBoundingClientRect` da 0 en jsdom: si la medida de `H` es 0, usar `H = 400`.
- Colores de lomos y portadas son fijos por colección; el resto usa tokens de tema.

## Review Focus

1. Enlace directo a `#ficha-<id>` antes de cargar el catálogo: la ficha se abre al llegar los datos (prueba en Task 6).
2. El catálogo termina de cargar cuando la persona ya se fue a otra sección: no la regresa al estante (prueba en Task 6).
3. Flechas, rueda o arrastre con la ficha abierta: el estante no se mueve debajo (prueba en Task 5).
4. Cambio de tamaño o giro de pantalla: se recalculan medidas y el documento activo no cambia (prueba en Task 5).
5. Datos anómalos: `temas_clave` nulo o con valores no texto, `url_original` no `http(s)`, HTML en títulos: sin fallo y sin inyección (pruebas en Tasks 2 y 3).

---

### Task 1: Geometría del estante

**Files:**
- Create: `src/lib/shelf-geometry.js`
- Test: `tests/shelf-geometry.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `shelfMetrics(H: number, { mobile?: boolean }) -> { H, ws, d, gap, U, P, xs: Float64Array }`
  - `rel(v: number, s: number, n: number) -> number`, en `[-n/2, n/2)`
  - `arcLength(r, m) -> number` (`F` del spec)
  - `screenScale(u, m) -> number` (`scl`)
  - `screenX(u, m) -> number` (`xsc`)
  - `tomeTransform(r, m, { lift = 0, tiltX = 0, tiltY = 0 } = {}) -> { visible, x, y, z, rotateX, rotateY, o, sc, zIndex, spineShade, coverShade }`
  - `stepSpring(s, T, dt, k) -> number`, con `dt` limitado a `0.05`
  - `rulerSegments(counts: number[], minFraction = 0.06) -> [{ index, start, end, firstIndex, count }]`
  - `rulerPosition(docIndex, segments) -> number`, de 0 a 1

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
import { describe, expect, it } from 'vitest';
import { arcLength, rel, rulerPosition, rulerSegments, screenScale, screenX, shelfMetrics, stepSpring, tomeTransform } from '../src/lib/shelf-geometry.js';

const m = shelfMetrics(400, { mobile: false });

describe('shelf geometry', () => {
  it('derives measures from H', () => {
    expect(m.ws).toBeCloseTo(52); expect(m.d).toBeCloseTo(272); expect(m.gap).toBeCloseTo(14);
    expect(m.U).toBeCloseTo(520); expect(shelfMetrics(400, { mobile: true }).U).toBeCloseTo(420);
    expect(m.P).toBe(1400);
  });
  it('wraps relative index', () => {
    expect(rel(1, 0, 124)).toBe(1); expect(rel(123, 0, 124)).toBe(-1);
    expect(rel(62, 0, 124)).toBe(-62); expect(rel(0, 0, 1)).toBe(0); expect(rel(1, 0, 2)).toBe(-1);
  });
  it('pushes neighbours apart around the open cover', () => {
    expect(arcLength(0, m)).toBe(0);
    expect(arcLength(1, m)).toBeCloseTo(m.ws + m.gap + (m.d - m.ws + 1.4 * m.gap) * 0.5);
    expect(arcLength(-1, m)).toBeCloseTo(-arcLength(1, m));
    expect(arcLength(0.001, m)).toBeLessThan(2);
  });
  it('scale and screen x fall off monotonically', () => {
    expect(screenScale(0, m)).toBe(1); expect(screenScale(m.U, m)).toBeCloseTo(0.5);
    expect(screenX(100, m)).toBeGreaterThan(screenX(50, m));
    expect(screenX(-100, m)).toBeCloseTo(-screenX(100, m));
    expect(screenX(200, m) - screenX(150, m)).toBeLessThan(screenX(50, m) - screenX(0, m));
  });
  it('turns only the centred tome and hides far ones', () => {
    const c = tomeTransform(0, m);
    expect(c.o).toBe(1); expect(c.rotateY).toBeCloseTo(-90); expect(c.z).toBeCloseTo(40); expect(c.visible).toBe(true);
    expect(tomeTransform(3, m).o).toBe(0);
    expect(tomeTransform(3, m).rotateY).toBeGreaterThan(0); expect(tomeTransform(-3, m).rotateY).toBeLessThan(0);
    expect(tomeTransform(60, m).visible).toBe(false);
    expect(tomeTransform(5, m).spineShade).toBeLessThanOrEqual(0.6);
  });
  it('spring approaches the target and caps dt', () => {
    expect(stepSpring(0, 10, 0.05, 5.2)).toBeCloseTo(10 * (1 - Math.exp(-0.26)));
    expect(stepSpring(0, 10, 5, 5.2)).toBeCloseTo(stepSpring(0, 10, 0.05, 5.2));
  });
  it('ruler gives proportional segments with a minimum width', () => {
    const segments = rulerSegments([11, 9, 34, 10, 30, 3, 27]);
    expect(segments[0].start).toBe(0); expect(segments.at(-1).end).toBeCloseTo(1);
    expect(segments[5].end - segments[5].start).toBeGreaterThanOrEqual(0.06);
    expect(segments[2].firstIndex).toBe(20);
    expect(rulerPosition(0, segments)).toBeGreaterThan(0);
    expect(rulerPosition(123, segments)).toBeLessThan(1);
    expect(rulerPosition(20, segments)).toBeGreaterThanOrEqual(segments[2].start);
    expect(rulerSegments([5])).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Comprobar que fallan**

Run: `npx vitest run tests/shelf-geometry.test.js`
Expected: FAIL, no se resuelve `shelf-geometry.js`.

- [ ] **Step 3: Implementar `src/lib/shelf-geometry.js`**

Fórmulas y constantes de «Estante · Valores iniciales» y «Geometría» del spec. `tomeTransform` usa `smoothstep(max(0, 1 - |r|))`, `visible = |u| <= U * 1.95`, `zIndex = round(3000 + z)`, `spineShade = min(.6, o * .55 + (1 - sc) * .32)` y `coverShade = (1 - o) * .82`. `xs` se precalcula de 0 a `3U` en pasos de 2 px, acumulando `2 / (1 + (u / U)^1.6)`. `rulerSegments` reparte el ancho restante en proporción una vez aplicado el mínimo.

- [ ] **Step 4: Comprobar que pasan**

Run: `npx vitest run tests/shelf-geometry.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shelf-geometry.js tests/shelf-geometry.test.js docs/superpowers/specs/2026-11-05-portada-estante-design.md docs/superpowers/plans/2026-11-05-portada-estante.md
git commit -m "feat: add shelf geometry and portada estante design docs"
```

### Task 2: Lomos y portadas

**Files:**
- Create: `src/lib/law-cover.js`
- Test: `tests/law-cover.test.js`

**Interfaces:**
- Consumes: `getAcervoGroup` (`acervo-model.js`), `shortTitle` (`short-title.js`), `isJudgment`, `judgmentCase`, `instrumentTypeLabel` (`judgment.js`), `collectionIcon` (`collection-icons.js`), `collectionSpot` (`acervo-art.js`).
- Produces:
  - `COVER_COLORS: Record<groupId, { bg, ink }>`, con la tabla del spec; marfil `#FFFAF1`, tinta `#1C1915`
  - `GROUP_LABELS: Record<groupId, string>`: Leyes, Reglamentos, Acuerdos, Disposiciones, Convocatorias, Normas, Otros
  - `coverData(law) -> { group, groupLabel, typeLabel, name, title, siglas, year, display: 'siglas' | 'name' }`
  - `spineHTML(law) -> string`, raíz `.sh-spine[data-category]`
  - `coverHTML(law) -> string`, raíz `.sh-cover[data-category]`

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
import { describe, expect, it } from 'vitest';
import { COVER_COLORS, GROUP_LABELS, coverData, coverHTML, spineHTML } from '../src/lib/law-cover.js';

const ley = { id: 'a', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'ley', fecha_publicacion: '2025-03-18' };
const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

describe('law covers', () => {
  it('meets 4.5:1 in every collection', () => {
    expect(Object.keys(COVER_COLORS)).toHaveLength(7);
    for (const { bg, ink } of Object.values(COVER_COLORS)) expect(ratio(bg, ink)).toBeGreaterThanOrEqual(4.5);
  });
  it('uses plain collection labels', () => { expect(GROUP_LABELS.dacg).toBe('Disposiciones'); });
  it('big acronym only up to 14 characters', () => {
    expect(coverData(ley).display).toBe('siglas');
    expect(coverData({ ...ley, siglas: 'ABCDEFGHIJKLMN' }).display).toBe('siglas');
    expect(coverData({ ...ley, siglas: 'ACUERDO-CNE-16/04/2026-DACG-SAE' }).display).toBe('name');
  });
  it('falls back when data is missing', () => {
    expect(coverData({ ...ley, fecha_publicacion: null }).year).toBe('Sin fecha');
    const noAcronym = coverData({ ...ley, siglas: '' });
    expect(noAcronym.display).toBe('name'); expect(noAcronym.name).toBeTruthy();
    expect(coverHTML({ id: 'x' })).toContain('Sin fecha');
    expect(spineHTML({ id: 'x' })).toContain('data-category="otros"');
  });
  it('keeps the official title and shortens the name', () => {
    const titulo = `Acuerdo de la Comisión Nacional de Energía por el que se emite la metodología para ${'x'.repeat(700)}`;
    const data = coverData({ ...ley, titulo, siglas: 'ACUERDO-LARGO-DE-PRUEBA', tipo: 'acuerdo' });
    expect(data.title).toBe(titulo); expect(data.name.startsWith('Metodología')).toBe(true);
  });
  it('labels rulings with their case', () => {
    const data = coverData({ id: 's', titulo: 'Sentencia de la Suprema Corte. Controversia constitucional 1/2025', siglas: 'SCJN-CC-1-2025', tipo: 'sentencia', fecha_publicacion: '2025-01-01' });
    expect(data.typeLabel.startsWith('Sentencia')).toBe(true);
  });
  it('escapes HTML from data', () => {
    const evil = { ...ley, titulo: '<img src=x onerror=alert(1)>', siglas: '"><script>' };
    for (const html of [coverHTML(evil), spineHTML(evil)]) {
      expect(html).not.toContain('<img src=x'); expect(html).not.toContain('<script>');
    }
  });
});
```

- [ ] **Step 2: Comprobar que fallan**

Run: `npx vitest run tests/law-cover.test.js`
Expected: FAIL, no se resuelve `law-cover.js`.

- [ ] **Step 3: Implementar `src/lib/law-cover.js`**

Contenido de lomo y portada según «Lomos y portadas» del spec. Colores por `data-category` y variables `--sh-bg`, `--sh-ink` en línea. Nombre: `judgmentCase(law)?.label` si es sentencia, si no `shortTitle(titulo) || titulo || siglas || groupLabel`.

- [ ] **Step 4: Comprobar que pasan**

Run: `npx vitest run tests/law-cover.test.js`
Expected: PASS. Si la prueba de sentencia no coincide con el formato de `judgmentCase`, ajustar su fixture, no el código.

- [ ] **Step 5: Commit**

```bash
git add src/lib/law-cover.js tests/law-cover.test.js
git commit -m "feat: generate law spines and covers from metadata"
```

### Task 3: Ficha

**Files:**
- Create: `src/scripts/law-sheet.js`, `src/styles/shelf.css` (solo la sección `.sh-sheet`)
- Test: `tests/law-sheet.test.js`

**Interfaces:**
- Consumes: `coverData`, `coverHTML` (Task 2); `countFragments` (`judgment.js`).
- Produces: `openLawSheet(law, { host, getOriginRect, reducedMotion, onRead, onShare, onRequestClose }) -> { element, close(): Promise<void> }`. `onRequestClose()` se llama con Esc o el botón Cerrar. `close()` anima de vuelta, elimina el elemento y devuelve el foco al elemento activo previo. Es idempotente.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openLawSheet } from '../src/scripts/law-sheet.js';

const law = { id: 'a', titulo: 'Ley del Sector Eléctrico', siglas: 'LSE', tipo: 'ley', fecha_publicacion: '2025-03-18', fecha_ultima_reforma: null, temas_clave: ['Tema 1', 'Tema 2'], url_original: 'https://dof.gob.mx/x', articulos: 120 };
const open = (data = law, extra = {}) => {
  document.body.innerHTML = '<button id="o">o</button><div id="h"></div>';
  document.getElementById('o').focus();
  return openLawSheet(data, { host: document.getElementById('h'), getOriginRect: () => ({ top: 0, left: 0, right: 10, bottom: 10, width: 10, height: 10 }), reducedMotion: true, onRead: vi.fn(), onShare: vi.fn(), onRequestClose: vi.fn(), ...extra });
};
afterEach(() => { document.body.innerHTML = ''; });

describe('law sheet', () => {
  it('shows name, official title, data and actions', () => {
    const { element } = open();
    expect(element.getAttribute('role')).toBe('dialog');
    expect(element.querySelector('h2').textContent).toContain('Ley del Sector Eléctrico');
    expect(element.textContent).toContain('120');
    expect(element.textContent).toContain('Tema 2');
    expect(element.querySelector('[data-sheet-source]').href).toBe('https://dof.gob.mx/x');
    expect(element.querySelector('[data-sheet-source]').rel).toContain('noopener');
  });
  it('hides missing data', () => {
    const { element } = open({ id: 'b', titulo: 'Acuerdo X', temas_clave: null, url_original: 'javascript:alert(1)', articulos: 0 });
    expect(element.querySelector('[data-sheet-source]')).toBeNull();
    expect(element.querySelector('[data-sheet-topics]')).toBeNull();
    expect(element.querySelector('[data-sheet-reform]')).toBeNull();
    expect(element.querySelector('[data-sheet-count]')).toBeNull();
  });
  it('ignores non-text topics and caps at 8', () => {
    const { element } = open({ ...law, temas_clave: [1, null, ...Array.from({ length: 10 }, (_, i) => `T${i}`)] });
    expect(element.querySelectorAll('[data-sheet-topics] li')).toHaveLength(8);
    element.querySelector('[data-sheet-more]').click();
    expect(element.querySelectorAll('[data-sheet-topics] li')).toHaveLength(10);
  });
  it('wires actions and closing', () => {
    const onRead = vi.fn(), onShare = vi.fn(), onRequestClose = vi.fn();
    const { element } = open(law, { onRead, onShare, onRequestClose });
    element.querySelector('[data-sheet-read]').click(); expect(onRead).toHaveBeenCalledWith(law);
    element.querySelector('[data-sheet-share]').click(); expect(onShare).toHaveBeenCalledWith(law);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    element.querySelector('[data-sheet-close]').click();
    expect(onRequestClose).toHaveBeenCalledTimes(2);
  });
  it('moves focus in, traps it, and returns it on close', async () => {
    const sheet = open();
    expect(sheet.element.contains(document.activeElement)).toBe(true);
    await sheet.close(); await sheet.close();
    expect(document.querySelector('.sh-sheet')).toBeNull();
    expect(document.activeElement.id).toBe('o');
  });
});
```

- [ ] **Step 2: Comprobar que fallan**

Run: `npx vitest run tests/law-sheet.test.js`
Expected: FAIL, no se resuelve `law-sheet.js`.

- [ ] **Step 3: Implementar `src/scripts/law-sheet.js` y estilos `.sh-sheet`**

Contenido y tiempos de «Ficha» del spec. Fuente solo si `url_original` empieza con `http://` o `https://`. Número de artículos con `countFragments(law.articulos, law)`: el catálogo expone `articulos`, no `total_articulos`. No usar `law.resumen`: `initSearch()` lo llena con el título. Fechas con `toLocaleDateString('es-MX')` a las 12:00 para evitar corrimiento de día. Atrapar Tab dentro de la hoja. Dos columnas sobre `--surface-1`, una en 767 px o menos con scroll interno. `reducedMotion` lleva las animaciones a 1 ms.

- [ ] **Step 4: Comprobar que pasan**

Run: `npx vitest run tests/law-sheet.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/law-sheet.js src/styles/shelf.css tests/law-sheet.test.js
git commit -m "feat: add law sheet that grows from its cover"
```

### Task 4: Pantalla y estante

**Files:**
- Create: `src/scripts/shelf-view.js`
- Modify: `src/styles/shelf.css`
- Test: `tests/shelf-view.test.js`

**Interfaces:**
- Consumes: Tasks 1–3; `selectAcervo`, `groupAcervo`, `ACERVO_GROUPS` (`acervo-model.js`).
- Produces:
  - `buildShelf(summaries) -> { items: law[], segments }`: orden del spec, colecciones vacías omitidas
  - `renderShelfView(host, { summaries = [], status = 'loading', onSearch, onOpenLaw, onShare, onSheetChange, onBrowse, onLegal, onFeedback }) -> { destroy, setCatalog(summaries), setFailed(), focusLaw(id), openSheet(id, { silent }), closeSheet({ silent }) }`
  - `status`: `'loading' | 'ready'`. `setFailed()` y catálogo vacío muestran mensaje.
  - Selectores: `.sh-view`, `.sh-search input`, `.sh-stage`, `.sh-tome[data-law-id]`, `.sh-caption-title`, `.sh-caption-meta`, `[data-sh-prev]`, `[data-sh-next]`, `[data-sh-open]`, `[data-sh-segment]`, `[data-sh-browse]`, `[data-legal]`, `[data-feedback]`, `.sh-status`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildShelf, renderShelfView } from '../src/scripts/shelf-view.js';

const docs = n => Array.from({ length: n }, (_, i) => ({ id: `d${i}`, titulo: `Acuerdo ${String(i).padStart(3, '0')}`, siglas: `A${i}`, tipo: 'acuerdo', fecha_publicacion: '2026-01-01' }));
const mixed = [
  { id: 'r', titulo: 'Reglamento B', siglas: 'RB', tipo: 'reglamento' },
  { id: 'l2', titulo: 'Ley Z', siglas: 'LZ', tipo: 'ley' },
  { id: 'l1', titulo: 'Ley A', siglas: 'LA', tipo: 'ley' },
];
const frame = () => new Promise(resolve => setTimeout(resolve, 5));

describe('shelf view', () => {
  let host, view;
  beforeEach(() => {
    document.body.innerHTML = '<div id="h"></div>';
    host = document.getElementById('h');
    vi.stubGlobal('requestAnimationFrame', cb => setTimeout(() => cb(performance.now()), 0));
    vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    vi.stubGlobal('matchMedia', q => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
  });
  afterEach(() => { view?.destroy(); view = null; vi.unstubAllGlobals(); delete window.__introDone; });

  it('orders by collection, then title', () => {
    expect(buildShelf(mixed).items.map(l => l.id)).toEqual(['l1', 'l2', 'r']);
    expect(buildShelf(mixed).segments).toHaveLength(2);
  });
  it('states what the site is and offers search', () => {
    view = renderShelfView(host, { summaries: mixed, status: 'ready' });
    expect(host.querySelector('h1').textContent).toBe('Leyes y reglas de energía de México, en un solo lugar');
    expect(host.querySelector('.sh-search input').placeholder).toBe('Busca una ley, un artículo o un tema');
  });
  it('opens on the first law, with accessible structure', async () => {
    view = renderShelfView(host, { summaries: mixed, status: 'ready' }); await frame();
    expect(host.querySelector('.sh-caption-title').textContent).toContain('Ley A');
    expect(host.querySelector('.sh-stage').getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('[aria-roledescription="carrusel"]')).not.toBeNull();
    expect(host.querySelector('[aria-live="polite"]')).not.toBeNull();
  });
  it('renders only the visible tomes', async () => {
    view = renderShelfView(host, { summaries: docs(124), status: 'ready' }); await frame();
    const count = host.querySelectorAll('.sh-tome').length;
    expect(count).toBeGreaterThan(5); expect(count).toBeLessThanOrEqual(30);
  });
  it('searches on Enter and ignores blanks', () => {
    const onSearch = vi.fn();
    view = renderShelfView(host, { summaries: mixed, status: 'ready', onSearch });
    const field = host.querySelector('.sh-search input');
    field.value = '   '; field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onSearch).not.toHaveBeenCalled();
    field.value = 'interconexión'; field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onSearch).toHaveBeenCalledWith('interconexión');
  });
  it('shows loading, then the catalog, with search available', async () => {
    view = renderShelfView(host, { status: 'loading' });
    expect(host.querySelector('.sh-status[data-state="loading"]')).not.toBeNull();
    expect(host.querySelector('.sh-search input').disabled).toBe(false);
    view.setCatalog(mixed); await frame();
    expect(host.querySelector('.sh-status')).toBeNull();
    expect(host.querySelector('.sh-caption-title').textContent).toContain('Ley A');
  });
  it('offers the full list on failure or empty catalog', () => {
    const onBrowse = vi.fn();
    view = renderShelfView(host, { status: 'loading', onBrowse });
    view.setFailed();
    expect(host.querySelector('.sh-status[data-state="error"]')).not.toBeNull();
    host.querySelector('.sh-status [data-sh-browse]').click();
    expect(onBrowse).toHaveBeenCalled();
    view.destroy();
    view = renderShelfView(host, { summaries: [], status: 'ready', onBrowse });
    expect(host.querySelector('.sh-status[data-state="error"]')).not.toBeNull();
  });
  it('wires the bottom line', () => {
    const onLegal = vi.fn(), onFeedback = vi.fn(), onBrowse = vi.fn();
    view = renderShelfView(host, { summaries: mixed, status: 'ready', onLegal, onFeedback, onBrowse });
    host.querySelector('[data-legal="privacidad"]').click(); expect(onLegal).toHaveBeenCalledWith('privacidad');
    host.querySelector('[data-feedback]').click(); expect(onFeedback).toHaveBeenCalled();
    host.querySelector('[data-sh-browse]').click(); expect(onBrowse).toHaveBeenCalled();
    expect(host.textContent).toContain('Diario Oficial de la Federación');
  });
  it('does not fail if destroyed while the intro is pending', async () => {
    let release; window.__introDone = new Promise(r => { release = r; });
    view = renderShelfView(host, { summaries: mixed, status: 'ready' });
    view.destroy(); view = null; release(); await frame();
    expect(host.querySelector('.sh-tome')).toBeNull();
  });
  it('stops its loop on destroy', async () => {
    const raf = vi.fn(cb => setTimeout(() => cb(performance.now()), 0));
    vi.stubGlobal('requestAnimationFrame', raf);
    view = renderShelfView(host, { summaries: mixed, status: 'ready' }); await frame();
    view.destroy(); view = null; await frame();
    const calls = raf.mock.calls.length; await frame();
    expect(raf.mock.calls.length).toBe(calls);
  });
});
```

- [ ] **Step 2: Comprobar que fallan**

Run: `npx vitest run tests/shelf-view.test.js`
Expected: FAIL, no se resuelve `shelf-view.js`.

- [ ] **Step 3: Implementar pantalla, tomos virtuales, bucle y estilos**

Pantalla, texto y línea inferior según las secciones «Pantalla», «Lomos y portadas», «Temas y textos», «Accesibilidad», «Móvil» y «Estados y errores» del spec. `H` se mide con una sonda de `height: var(--sh-h)`. Crear y retirar nodos `.sh-tome` según `tomeTransform(...).visible`. Bucle detenido en reposo (`|T - s| < 0.001`, sin puntero activo) y reactivado por cualquier entrada. Cambio de texto con máscara de 650 ms. Entrada ligada a `Promise.resolve(window.__introDone)`, con guardia por `destroyed`. La hoja de estilos se importa en este módulo.

CSS que fija lo que el spec pide:

```css
body.home-active #main-container, body.home-active #institutional-footer { display: none; }
.sh-view { --sh-h: min(46svh, 33vw); display: grid; grid-template-rows: auto minmax(0, 1fr) auto auto auto;
  height: calc(100svh - var(--sh-header, 64px)); overflow: hidden; }
@media (max-height: 619px) { .sh-view { height: auto; min-height: 620px; overflow: visible; } }
@media (max-width: 767px) { .sh-view { --sh-h: min(62vw, 36svh);
  height: calc(100svh - var(--sh-header, 64px) - 68px - env(safe-area-inset-bottom)); } }
@media (prefers-reduced-motion: reduce) { .sh-view * { transition-duration: 1ms !important; animation-duration: 1ms !important; } }
```

`--sh-header` se fija en JavaScript desde `.site-header`. Regla y línea inferior dejan `padding-right` suficiente para `.desk-toggle` (`right: 22px; bottom: 22px`). Sin sombreado y con borde en `html[data-theme="contraste"]`.

- [ ] **Step 4: Comprobar que pasan**

Run: `npx vitest run tests/shelf-view.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/shelf-view.js src/styles/shelf.css tests/shelf-view.test.js
git commit -m "feat: render home screen with virtualized 3D shelf"
```

### Task 5: Interacción del estante

**Files:**
- Modify: `src/scripts/shelf-view.js`, `src/styles/shelf.css`
- Test: `tests/shelf-view-input.test.js`

**Interfaces:**
- Consumes: `openLawSheet` (Task 3); vista de Task 4.
- Produces: el comportamiento real de `focusLaw`, `openSheet`, `closeSheet` y `onSheetChange(law | null)`. `onSheetChange` se llama solo en cambios iniciados por la persona, nunca con `{ silent: true }`. `openSheet` devuelve `true` si encontró el documento.

- [ ] **Step 1: Escribir las pruebas que fallan**

Mismo arranque que `tests/shelf-view.test.js`, con movimiento reducido para que el resorte sea instantáneo. `title()` lee `.sh-caption-title`.

```js
it('steps and wraps with the arrows', async () => {
  next.click(); await frame(); expect(title()).toContain('Ley Z');
  prev.click(); await frame(); prev.click(); await frame();
  expect(title()).toContain('Reglamento B');
});
it('uses arrow keys inside the carousel, not in the search field', async () => {
  region.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await frame();
  expect(title()).toContain('Ley Z');
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await frame();
  expect(title()).toContain('Ley Z');
});
it('brings a clicked spine to the centre without opening it', async () => {
  tome('l2').dispatchEvent(new MouseEvent('click', { bubbles: true })); await frame();
  expect(title()).toContain('Ley Z'); expect(document.querySelector('.sh-sheet')).toBeNull();
});
it('opens the sheet from the active cover and reports it', async () => {
  tome('l1').dispatchEvent(new MouseEvent('click', { bubbles: true })); await frame();
  expect(document.querySelector('.sh-sheet')).not.toBeNull();
  expect(onSheetChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'l1' }));
});
it('a drag is not a click', async () => {
  pointer('pointerdown', 300); pointer('pointermove', 200); pointer('pointerup', 200);
  tome('l1').dispatchEvent(new MouseEvent('click', { bubbles: true })); await frame();
  expect(document.querySelector('.sh-sheet')).toBeNull();
});
it('jumps to a collection from the ruler', async () => {
  host.querySelector('[data-sh-segment="reglamentos"]').click(); await frame();
  expect(title()).toContain('Reglamento B');
});
it('wheel moves the shelf only when the page does not scroll', async () => {
  setScrollable(true);
  stageWheel({ deltaY: 200 }); await frame(); expect(title()).toContain('Ley A');
  setScrollable(false);
  stageWheel({ deltaY: 200 }); await frame(); expect(title()).not.toContain('Ley A');
});
it('ignores shelf input while the sheet is open', async () => {
  view.openSheet('l1', { silent: true }); await frame();
  next.click(); region.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  stageWheel({ deltaY: 200 }); await frame();
  expect(title()).toContain('Ley A');
});
it('silent changes do not report; unknown ids are refused', async () => {
  expect(view.openSheet('nope', { silent: true })).toBe(false);
  expect(view.openSheet('l2', { silent: true })).toBe(true); await frame();
  expect(title()).toContain('Ley Z');
  await view.closeSheet({ silent: true });
  expect(onSheetChange).not.toHaveBeenCalled();
});
it('keeps the active document across a resize', async () => {
  next.click(); await frame();
  window.dispatchEvent(new Event('resize')); await frame();
  expect(title()).toContain('Ley Z');
  expect(host.querySelectorAll('.sh-tome').length).toBeGreaterThan(0);
});
it('hides arrows with a single document', async () => {
  view.destroy(); view = renderShelfView(host, { summaries: [mixed[0]], status: 'ready' }); await frame();
  expect(host.querySelector('[data-sh-next]').hidden).toBe(true);
});
```

Con `setScrollable` se redefine `document.documentElement.scrollHeight`. `pointer` despacha `PointerEvent` (o `MouseEvent` con el tipo indicado) con `clientX` sobre `.sh-stage`.

- [ ] **Step 2: Comprobar que fallan**

Run: `npx vitest run tests/shelf-view-input.test.js`
Expected: FAIL en todas salvo la de un solo documento si Task 4 ya oculta flechas.

- [ ] **Step 3: Implementar entradas**

Tabla «Interacción» del spec. Clic en un tomo no activo fija `T` al entero más cercano a `s + rel`. Arrastre: `T = T0 - dx / (ws + gap)` tras 5 px; al soltar se redondea; `k = 18` mientras dura. Rueda: suma `delta / (ws + gap) * 0.5` usando el eje mayor y se ajusta tras 160 ms sin actividad. Con scroll de página solo cuenta `deltaX`. Inclinación y elevación según spec, omitidas con movimiento reducido. Medidas recalculadas en `resize`, con `ResizeObserver` si existe. Con ficha abierta, todas las entradas salen de inmediato.

- [ ] **Step 4: Comprobar que pasan**

Run: `npx vitest run tests/shelf-view.test.js tests/shelf-view-input.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/shelf-view.js src/styles/shelf.css tests/shelf-view-input.test.js
git commit -m "feat: add shelf drag, wheel, keyboard and sheet opening"
```

### Task 6: Portada, rutas y catálogo

**Files:**
- Modify: `index.html:112` (logo a `/`), `index.html` (`<section id="home-view" class="hidden">` entre `#main-container` y `#institutional-footer`)
- Modify: `src/scripts/ui.js:265`, `:350`, `:490`, `:662-672`, `:676`, `:820-823`, `:967`, `:4543`
- Modify: `src/scripts/search-engine.js:86-88`
- Modify: `tests/ui-acervo.test.js:58-59`, `:165-168`
- Test: `tests/ui-home.test.js`

**Interfaces:**
- Consumes: `renderShelfView` y su objeto de retorno (Tasks 4–5).
- Produces: `showHomeView({ updateHistory = true } = {})` y `releaseHome()`, internos de `ui.js`. Evento `search-failed` en `window`.

Comportamiento exacto:

| Punto | Cambio |
|---|---|
| Estado (`:265`) | Agregar `let homeView = null` y `let sheetPushed = false` |
| `showHomeView` | `destroyTOC()`, `hideAllViews()`, `setActiveNav('')`, `setHash('')` si `updateHistory`, `body.home-active`, mostrar `#home-view`, `scrollTo` arriba, montar la vista. Si `homeView` ya existe, no remontar |
| `hideAllViews` | Llama a `releaseHome()`: `homeView.destroy()`, ocultar host, quitar `home-active` |
| `search-ready` (`:350`) | `homeView?.setCatalog(summaries)`. No llama a `showHomeView` |
| Rama `#ficha-` en `handleInitialHash` | Monta portada sin historial. Con catálogo: `homeView.openSheet(id, { silent: true })`. Sin catálogo: espera; el `handleInitialHash` de `:360` la reabre |
| `:676` | Incluir `#ficha-` para mostrar el esqueleto antes de los datos |
| `popstate` sin hash (`:662`) | Tras la limpieza actual: `homeView ? homeView.closeSheet({ silent: true }) : showHomeView({ updateHistory: false })` |
| Logo (`:820`) | `showHomeView()` |
| `:4543` | `showHomeView({ updateHistory: false })` |
| `onSearch` | Igual que `:3068` |
| `onOpenLaw` | `openLawDetail(law)` |
| `onShare` | `navigator.share` si existe; si no, portapapeles con `showToast('¡Enlace copiado!', '🔗', 'bg-blue-600')`, siempre con `lawShareUrl(law)` |
| `onBrowse` | `showLawsView()` |
| `onLegal`, `onFeedback` | `openLegalPage(kind)`, `openFeedback({ context: 'inicio' })` |
| `onSheetChange(law)` | Con documento: `sheetPushed = true`, `setHash('#ficha-' + encodeURIComponent(law.id))`. Con `null`: `sheetPushed ? history.back() : history.replaceState(null, '', location.pathname)` |
| `search-engine.js` catch | Agregar `window.dispatchEvent(new CustomEvent('search-failed'))`; `ui.js` escucha y llama a `homeView?.setFailed()` |

No cambian: `#acervo`, `analisis:goHome`, las migas de pan, `#buscar` y las rutas de SEO.

- [ ] **Step 1: Escribir la prueba que falla**

`tests/ui-home.test.js`, con el arnés de `tests/ui-acervo.test.js` (mismos `vi.mock`, `index.html` real, una sola `initUI()`, `settle()` con temporizadores). `summaries` incluye un documento con `id: 'ley-a'`, y `searchArticles` resuelve `{ data: [], total: 0 }`. Un solo `it`, en secuencia:

```js
// 1. Enlace directo antes de los datos
history.replaceState(null, '', '/#ficha-ley-a');
initUI(); await settle();
expect(document.body.classList.contains('home-active')).toBe(true);
expect(document.querySelector('#home-view .sh-status[data-state="loading"]')).not.toBeNull();
expect(document.querySelector('.sh-sheet')).toBeNull();
window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries, relaciones: [] } })); await settle();
expect(document.querySelector('.sh-sheet')).not.toBeNull();

// 2. Atrás cierra la ficha; el estante sigue
history.replaceState(null, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); await settle();
expect(document.querySelector('.sh-sheet')).toBeNull();
expect(document.querySelector('#home-view .sh-tome')).not.toBeNull();
expect(location.hash).toBe('');

// 3. Sale a Acervo: la portada se libera y el pie vuelve
document.getElementById('nav-leyes').click(); await settle();
expect(document.body.classList.contains('home-active')).toBe(false);
expect(document.getElementById('home-view').classList.contains('hidden')).toBe(true);
expect(document.querySelector('#home-view .sh-tome')).toBeNull();
expect(location.hash.startsWith('#acervo')).toBe(true);

// 4. Datos que llegan tarde no regresan al estante
window.dispatchEvent(new CustomEvent('search-ready', { detail: { summaries, relaciones: [] } })); await settle();
expect(document.body.classList.contains('home-active')).toBe(false);
expect(location.hash.startsWith('#acervo')).toBe(true);

// 5. El logo vuelve al estante
document.getElementById('brand-home').click(); await settle();
expect(document.body.classList.contains('home-active')).toBe(true);
expect(location.hash).toBe('');

// 6. Buscar desde el estante
const field = document.querySelector('#home-view .sh-search input');
field.value = 'interconexión';
field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await settle();
expect(document.body.classList.contains('home-active')).toBe(false);
expect(document.getElementById('search-input').value).toBe('interconexión');

// 7. Fallo de catálogo
document.getElementById('brand-home').click(); await settle();
window.dispatchEvent(new CustomEvent('search-failed')); await settle();
expect(document.querySelector('#home-view .sh-status[data-state="error"]')).not.toBeNull();
```

Agregar un `it` aparte para Atrás desde el lector: abrir ficha con clic en la portada activa, `[data-sheet-read]`, verificar `#ley-<id>`, luego `history.replaceState` a `#ficha-<id>` más `popstate`: ficha abierta otra vez.

- [ ] **Step 2: Comprobar que falla**

Run: `npx vitest run tests/ui-home.test.js`
Expected: FAIL en `home-active`.

- [ ] **Step 3: Implementar la tabla anterior en `ui.js`, `index.html` y `search-engine.js`**

- [ ] **Step 4: Comprobar que pasa**

Run: `npx vitest run tests/ui-home.test.js`
Expected: PASS.

- [ ] **Step 5: Actualizar `tests/ui-acervo.test.js`**

En `:58-59`, la URL pelada espera el estante en carga (`#home-view .sh-status[data-state="loading"]`) y hash vacío. Antes de lo que usa `cards()`, entrar con clic en `#nav-leyes`. En `:165-168`, el `popstate` a `/` espera `body.home-active` y hash vacío, sin `.ac-library`. Conservar el resto de aserciones de `#acervo`, porque prueban que esa ruta no cambió.

- [ ] **Step 6: Correr las pruebas de la app**

Run: `npx vitest run tests/ui-acervo.test.js tests/ui-agreements.test.js tests/ui-explorer.test.js tests/ui-reader.test.js tests/ui-related-documents.test.js`
Expected: PASS. Si otra prueba asume que `/` abre Acervo, entrar por `#nav-leyes` en esa prueba; no alterar `showHomeView`.

- [ ] **Step 7: Commit**

```bash
git add index.html src/scripts/ui.js src/scripts/search-engine.js tests/ui-home.test.js tests/ui-acervo.test.js
git commit -m "feat: make the 3D shelf the home screen"
```

Agregar además cualquier otra prueba `tests/ui-*.test.js` ajustada en el paso 6.

### Task 7: Verificación en navegador y ajuste visual

**Files:**
- Modify (solo si hace falta): `src/styles/shelf.css`, `src/scripts/shelf-view.js`, `src/lib/shelf-geometry.js`

**Interfaces:**
- Consumes: la portada completa.
- Produces: portada verificada. Si cambian constantes de geometría, actualizar en el mismo commit las pruebas de Task 1 y la sección «Valores iniciales» del spec.

- [ ] **Step 1: Abrir con `preview_start` `{name: "dev"}` y recargar**

Expected: sin errores en `read_console_messages` ni en `preview_logs`.

- [ ] **Step 2: Comprobar tamaños con `resize_window`**

En 1180×889, 1920×1080 y 375×812: `document.documentElement.scrollHeight <= innerHeight` (móvil: el contenido queda sobre la barra inferior). «Mi mesa» no se encima con regla ni línea inferior. Con 1280×560 hay scroll y nada se recorta.

- [ ] **Step 3: Comprobar los cuatro temas**

`light`, `dark`, `sepia` y `contraste` con la vista en 1180×889. Texto legible, portadas iguales y borde visible en `contraste`.

- [ ] **Step 4: Comprobar flujos reales**

Arrastre, rueda, flechas y teclado. Clic en regla. Abrir ficha y cerrar con botón, Esc y Atrás. Leer, y Atrás desde el lector. Buscar con Enter. Enlaces `#acervo`, `#ley-<id>` y `#ficha-<id>` recién cargados. Primera visita con intro y recorrido de bienvenida. Movimiento reducido con emulación por `javascript_tool` o preferencia del sistema; si no se puede emular, indicarlo en el informe.

- [ ] **Step 5: Comprobar el costo en reposo**

Con la portada quieta, verificar que no se solicitan más cuadros: envolver `requestAnimationFrame` con un contador en `javascript_tool`, antes de cargar la vista por el logo, y comparar dos lecturas separadas por 2 s.

- [ ] **Step 6: Ajustar y tomar capturas de prueba**

Corregir lo encontrado. Capturas de escritorio, móvil y ficha para el informe final.

- [ ] **Step 7: Correr lint, pruebas y build**

Run: `npm run lint`
Expected: sin errores nuevos en los archivos de este trabajo.

Run: `npm test`
Expected: PASS. `ui-acervo`, `reader-formatos-saee`, `cogeneracion` y `related-documents` han sido inestables en la suite completa y pasan solas: si solo ellas fallan, volver a correrlas solas e informar.

Run: `npm run build`
Expected: build sin errores. Revisar `git status` por si cambió `public/data/manifest.json`; no incluirlo.

- [ ] **Step 8: Commit, si hubo ajustes**

```bash
git add src/styles/shelf.css src/scripts/shelf-view.js src/lib/shelf-geometry.js tests/shelf-geometry.test.js docs/superpowers/specs/2026-11-05-portada-estante-design.md
git commit -m "style: tune shelf after browser review"
```
