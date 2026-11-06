# Portada con estante 3D · Diseño

Fecha: 5 de noviembre de 2026. Rama: `feat/portada-estante`.

## Objetivo

Cambiar la portada (`/`) por una pantalla de alto impacto: un estante curvo en 3D con todos los documentos, una barra de búsqueda visible y una ficha que se abre desde la portada del documento.

**Criterios de éxito**

- Quien llega entiende en segundos que puede buscar o explorar.
- Cualquier documento queda a dos clics: elegirlo en el estante y abrir su ficha o su texto.
- En una pantalla de escritorio o móvil normal, todo cabe sin scroll.
- Ningún enlace existente deja de funcionar.

**Decisiones tomadas**

- Dirección: estante a pantalla completa (referencia del texto pegado).
- Ficha: estilo de la imagen de referencia (portada, título serif, datos y acciones sobre fondo crema).
- Buscador: barra siempre visible arriba del estante.

**Supuesto por confirmar:** la portada busca causar impacto de cara a la campaña de lanzamiento, sin perder claridad.

## Qué se toma de las referencias y qué no

| Se conserva | Se descarta |
|---|---|
| Arco con profundidad y lomos que se reducen hacia los bordes | Películas, kanji, estética VHS y grano fuerte |
| Documento central girado 90° con su portada al frente | Imágenes del CDN externo |
| Resorte, arrastre, rueda, flechas e inclinación de portada | Cursor personalizado |
| Cambio de texto con máscara | `user-select:none` global y `overflow:hidden` en `body` |
| Hoja que crece desde la portada | Revelado de póster con tinta (la ficha muestra la portada directamente) |
| Regla inferior con punto que se desliza | Regla por años y punto deslizante |

## Datos reales que condicionan el diseño

Consulta a `leyes` del 5 de noviembre de 2026 (124 documentos):

| Dato | Valor | Consecuencia |
|---|---|---|
| Fechas | 110 de 2024–2026, 11 sin fecha | Las pestañas van por colección, no por año |
| Colecciones | leyes 11, reglamentos 9, acuerdos 34, DACG 10, convocatorias 30, normas 3, otros 27 | Pestañas de igual ancho |
| Siglas | mediana 16 caracteres, máximo 31 (`ACUERDO-CNE-16/04/2026-DACG-SAE`) | Solo las cortas van en grande |
| Nombre corto (`shortTitle` o título) | mediana 146, p90 350, máximo 778 caracteres | Recorte por líneas; título completo en la ficha |
| Resumen | No existe esa columna | La ficha usa `temas_clave`; no se inventan resúmenes |
| `temas_clave` | 1 documento sin temas | El bloque se oculta si está vacío |
| `url_original` | Presente en los 124 | Acción "Ver fuente original", oculta si falta |
| Favoritos | `user_favorites` guarda `articulo_id` | La ficha no ofrece "guardar" (cambia lo presentado en chat) |

## Pantalla

De arriba abajo, en una sección de alto `100svh` menos encabezado (y menos barra inferior en móvil):

1. **Encabezado actual**, sin cambios. Ningún enlace aparece activo en la portada.
2. **Búsqueda:** frase breve «Leyes y reglas de energía de México, en un solo lugar» (`h1`) y campo con el componente `.bj-search`, placeholder «Busca una ley, un artículo o un tema».
3. **Estante:** ocupa el centro.
4. **Texto del documento activo:** título (2 líneas como máximo), línea «siglas · colección · año» y flechas a los lados.
5. **Pestañas por colección:** ícono y nombre, de igual ancho, con la colección activa resaltada. Clic salta al primer documento de esa colección.
6. **Línea inferior:** «Ver todos los documentos» (`#acervo`), Términos, Privacidad, Enviar comentario y el aviso de que el texto con validez jurídica es el publicado en el Diario Oficial de la Federación. Sustituye a `#institutional-footer`, oculto solo en esta vista.

El botón flotante «Mi mesa» (`.desk-toggle`) se mantiene. La línea inferior y la regla reservan su espacio para que no se encimen.

Con altura menor a 620 px, la página permite scroll en vez de recortar contenido.

## Estante

**Orden:** colecciones en el orden de `ACERVO_GROUPS` y, dentro de cada una, por título según `acervo-model.js`. Abre en el primer documento de Leyes. Es circular: después del último sigue el primero.

**Valores iniciales** (ajustables al verlo en navegador):

```text
H  = min(43svh, 33vw)     móvil: min(62vw, 36svh)
ws = H * 0.16             grosor del lomo
d  = H * 0.72             ancho de la portada
gap = H * 0.012
U  = H * 1.3              móvil: H * 1.05
P  = 1400                 perspectiva CSS
```

**Geometría** (funciones puras, por índice relativo `r` al centro):

```text
rel(v, s, N) = (v - s) mod N, llevado a [-N/2, N/2)
B(r) = (r + sin(pi r) / pi) / 2   si |r| < 1;  ±0.5 si no
F(r) = r * (ws + gap) + (d - ws + 1.4 * gap) * B(r)
scl(u) = 1 / (1 + (|u| / U)^1.6)
xsc(u) = integral numérica de scl, precalculada en pasos de 2 px
```

Por cada tomo, con `o = smoothstep(max(0, 1 - |r|))`, `u = F(r)`, `sc = scl(u)` y `k = 1 / sc`:

```text
z = P * (1 - k) + o * H * 0.1
x = xsc(u) * k
y = (H * 0.5 * (1 - sc) * 0.42 + o * H * 0.012 - lift * H * 0.05) * k
rotateY = sign(u) * min(1, |u| / U) * 14° * (1 - o) - 90° * o + tiltY * o
rotateX = tiltX * o
```

**Rendimiento:**

- Solo existen en el DOM los tomos con `|u| <= U * 1.95`, unos 25 de 124.
- Un solo `requestAnimationFrame`, que se detiene cuando el estante queda en reposo y se reactiva con cualquier interacción.
- Se apaga por completo al salir de la vista (`destroy()`).

**Movimiento:** resorte `s += (T - s) * (1 - e^(-k dt))`, con `k = 5.2` (18 al arrastrar) y `dt` limitado a 50 ms.

**Interacción:**

| Entrada | Efecto |
|---|---|
| Clic en lomo | Lleva ese documento al centro |
| Clic en portada activa, Enter | Abre la ficha |
| Flechas en pantalla; ←/→ con foco dentro del estante | Avanza o retrocede uno |
| Arrastre (más de 5 px) | Desplaza; al soltar se ajusta al más cercano. Un arrastre no cuenta como clic |
| Rueda | Desplaza solo si la página no tiene scroll; con scroll, únicamente el eje horizontal |
| Puntero sobre la portada activa | Inclinación de hasta 8° y 5° |
| Puntero sobre un lomo | Se eleva ligeramente |

Las flechas del teclado no actúan mientras el foco está en el campo de búsqueda.

**Entrada:** el estante se despliega al resolverse `window.__introDone`, en 600 ms como máximo. La intro y el recorrido de bienvenida se conservan sin añadir espera.

## Lomos y portadas

Se generan por código con datos reales. Su diseño sigue la segunda imagen de referencia entregada el 5 de noviembre de 2026.

- **Color:** propio de cada documento, estable por siglas o id, tomado de diez tonos (`BOOK_COLORS`): guinda, dorado, azul petróleo, verde, índigo, lila, turquesa, ámbar, terracota y azul pizarra. Son objetos físicos: no cambian con el tema. Todos llevan texto marfil a 4.5:1 como mínimo, por eso el dorado, ámbar, lila y turquesa son más profundos que los de la imagen.
- **Lomo:** esquinas redondeadas y luz de cilindro. Siglas verticales en negrita arriba, en una línea con puntos suspensivos, y año abajo.
- **Portada:** esquinas redondeadas, banda de luz en el pliegue, listón dorado y curva suave abajo a la derecha. Tipo de documento, siglas o nombre, filete dorado y nombre corto arriba, a la izquierda. Año o «Sin fecha» abajo, con el ícono de colección (`collectionIcon`) en dorado a la derecha.
- **Nombre en la portada:** siglas en grande si tienen hasta 14 caracteres, en tres tamaños según su largo; si no, nombre corto en serif a 7 líneas como máximo.
- **Sentencias:** usan `isJudgment` y `judgmentCase`, igual que `search-landing.js`.
- **Sin siglas:** se usa la colección como respaldo.
- **Sombreado:** lomos lejanos hasta 35 %, tapas vistas de lado hasta 30 %, sin texto. Cada tomo tiene contratapa. En el tema `contraste` no hay sombreado y sí borde visible.

## Ficha

Hoja de superficie crema que crece desde la portada con `clip-path`: 1050 ms al abrir y 850 ms al cerrar, con la curva `cubic-bezier(.76,0,.18,1)`. Las líneas de texto suben con máscara. Su diseño sigue la primera imagen de referencia en lo que tiene datos reales.

**Contenido, en dos columnas (una en móvil, con scroll):**

- Ruta «Inicio › colección › nombre» y botón «Cerrar». «Inicio» cierra la ficha.
- Portada grande, igual a la del estante.
- Nombre corto en sans negrita, siglas, filete dorado y, debajo, siempre el título oficial completo si difiere.
- Colección, publicación, última reforma y número de artículos. Cada dato se oculta si falta.
- Temas (`temas_clave`) como etiquetas de color suave, hasta 8, con «ver todos» si hay más.
- Acciones con ícono:
  - **Leer** (principal): `openLawDetail(law)`. Estante y ficha siguen visibles hasta que llegan los artículos.
  - **Compartir:** `navigator.share` o copiar enlace, con `lawShareUrl(law)`.
  - **Ver fuente original:** `url_original`.

**Cierre:** botón «Cerrar», «Inicio», Esc o Atrás. El foco entra a la hoja al abrir, queda atrapado en ella y vuelve a la portada al cerrar.

## Rutas

| URL | Antes | Ahora |
|---|---|---|
| `/` | Acervo | Estante |
| `#ficha-<id>` | No existía | Estante con la ficha abierta. Id inexistente: estante sin ficha |
| `#acervo` y demás rutas | Sin cambio | Sin cambio |
| `/ley/...`, `/aprende/...` | Sin cambio | Sin cambio |

- El logo lleva a `/`.
- El `popstate` sin hash muestra el estante o cierra la ficha.
- Abrir la ficha agrega una entrada de historial para que Atrás funcione.
- Buscar reutiliza lo mismo que `ui.js:3068`: `resetToHero()`, asignar `searchInput.value` y disparar `input`. Enter con campo vacío no hace nada.

## Estructura

| Archivo | Responsabilidad | Depende de |
|---|---|---|
| `src/lib/shelf-geometry.js` | Funciones puras de arco y resorte, sin DOM | Nada |
| `src/lib/law-cover.js` | HTML de lomo y portada a partir de un documento | `acervo-model`, `short-title`, `judgment`, `collection-icons`, `acervo-art` |
| `src/scripts/shelf-view.js` | `renderShelfView(host, opciones)`: orden del estante, pantalla, regla y entradas; devuelve `{ destroy, setCatalog, setFailed, focusLaw, openSheet, closeSheet }` | Los dos anteriores, `law-sheet`, `acervo-model` |
| `src/scripts/law-sheet.js` | `openLawSheet(law, { originRect, onRead, onShare, onClose })` | `law-cover` |
| `src/styles/shelf.css` | Estilos con los tokens de `design/variables.css` | Tokens |
| `src/scripts/ui.js` | Solo enlace: `showHomeView()`, rutas, `popstate`, logo, `hideAllViews`, inicio de carga | Vista nueva |
| `index.html` | Contenedor `#home-view` fuera de `#main-container`, que limita el ancho | |

## Logo

La B se sustituye por una S con cejas y ojo de búho (S de Sasso), dibujada desde cero con trazos afilados. La imagen de referencia tenía marcas de agua, así que se tomó el concepto y no sus trazos.

- Fuente única: `src/lib/brand-mark.js`. De ahí salen `logo-mark.svg`, `logo-mark-claro.svg` (modo oscuro), `hero-mark.svg`, `logo-mark-blanco.png`, `logo-buscador.png`, `logo-buscador-claro.png`, favicon, íconos de app e imagen para redes.
- Colores: guinda con ojo dorado; marfil con ojo dorado en fondos oscuros. Íconos de app sobre guinda.
- La imagen para redes actualiza sus cifras a 124 documentos y 5,793 artículos.

**Alas en la intro:** solo ahí, dos alas simétricas (`src/lib/brand-wings.js`) se abren pluma por pluma. Trazos propios: la referencia era una plantilla de stock.

**Video de la intro:** se genera con HyperFrames desde `video-intro/` (`node video-intro/render.mjs`) con los mismos trazos del sitio, en horizontal 1920×1080 y vertical 720×1280 (`public/video/`, 3.8 s, sin sonido). Solo se muestra si empieza a reproducirse en 900 ms; si tarda, se rechaza, falla o la persona ahorra datos, corre la intro CSS sin espera. Un video que se detiene no atrapa: límite de 6 s. El sitio se abre desde el ojo. El service worker no intercepta `/video/`, porque los videos se piden por rangos.

## Temas y textos

- Funciona en los cuatro temas (`light`, `dark`, `sepia`, `contraste`) con los tokens existentes.
- Siglas y frase principal con `--font-display` (Newsreader); títulos e interfaz con `--font-sans` (Noto Sans). No se agrega la tipografía Inter sugerida en la imagen. `DESIGN.md` aún cita Merriweather; manda el token real.
- Textos visibles en lenguaje sencillo: «documentos», no «instrumentos» ni «acervo». En la regla, «Disposiciones» en vez de «DACG». El enlace «Acervo» del menú no cambia en este trabajo.

## Accesibilidad

- El escenario 3D es `aria-hidden`. La parte accesible es: región del estante con `aria-roledescription="carrusel"`, botones anterior y siguiente, botón para abrir la ficha, texto activo con `aria-live="polite"`, un botón por colección y el enlace a la lista completa en `#acervo`.
- Esto evita 124 paradas de tabulador. Cambia lo presentado en chat («lista real de documentos»): la lista real es `#acervo`, a un clic.
- Con `prefers-reduced-motion`: resorte instantáneo, sin inclinación ni elevación, y hoja en 1 ms.
- Contraste de 4.5:1 como mínimo en lomos, portadas y regla.

## Móvil (767 px o menos)

- Arrastre con el dedo y `touch-action:pan-y` en el estante.
- Pestañas solo con ícono; la colección activa conserva su nombre. Aplica hasta 1023 px, donde aparece la barra inferior.
- Flechas junto al título, con objetivo táctil de 44 px como mínimo.
- La sección descuenta la barra inferior de 68 px y el área segura.
- La línea inferior conserva todos sus enlaces y el aviso legal, en letra pequeña y hasta tres renglones.

## Estados y errores

| Caso | Comportamiento |
|---|---|
| Datos cargando | Esqueleto del estante; la búsqueda ya funciona |
| Error o catálogo vacío | Mensaje breve y enlace a `#acervo`; la búsqueda sigue visible. Hoy `initSearch()` solo registra el fallo en consola: emitirá el evento `search-failed` |
| Un solo documento | Sin flechas ni arrastre |
| Datos faltantes | Se oculta el dato; sin fecha muestra «Sin fecha» |
| Id inexistente en `#ficha-` | Estante sin ficha |

## Pruebas

**Vitest**

- `shelf-geometry`: `rel` con envoltura y `N` pequeños, `F` continua alrededor de 0, `scl` y `xsc` monótonas, posición de regla y salto a colección.
- `law-cover`: siglas de 31 caracteres, nombre de 778, sin fecha, sin siglas, sentencia, escape de HTML, y contraste de la tabla de colores de 4.5:1 como mínimo.
- `shelf-view`: render con 0, 1 y 124 documentos, solo unos 25 tomos en el DOM, Enter busca, teclado, `destroy()` detiene el bucle.
- `law-sheet`: datos faltantes ocultos, foco y cierre.
- `tests/ui-acervo.test.js`: actualizar lo que asume que `/` abre Acervo (líneas 58–59 y 165–168). Agregar `#ficha-<id>`, `popstate` y logo.

**Navegador (desarrollo)**

- 1180×889, 1920×1080 y 375×812, en los cuatro temas.
- Sin scroll en esos tamaños y sin encimar «Mi mesa».
- Búsqueda, ficha, Atrás, enlaces `#acervo` y `#ley-<id>`, movimiento reducido, sin errores de consola.

## Fuera de alcance

- Barra lateral, resumen, «Leyes populares» y «Lecturas recientes» de las imágenes de referencia.
- Filtrar el estante al escribir.
- Resúmenes de documentos (no hay datos) y guardar documentos completos (los favoritos son por artículo).
- Ilustraciones únicas por documento.
- Dependencia `motion` y `src/lib/motion.js`: cambios previos sin commit, ajenos a este trabajo. No se usan ni se incluyen en los commits.
- Actualizar `DESIGN.md` y rediseñar `#acervo`.
