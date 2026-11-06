# Rediseño del Buscador Jurídico con el sistema Búho

Fecha: 6 de noviembre de 2026. Estado: diseño y spec aprobados.

Sistema de diseño: [Búho](https://claude.ai/artifact/WQertACwbzHpoZzwiZ5Vid).
Maquetas aprobadas: `.superpowers/brainstorm/3428-1793957850/content/` (`navegacion`, `tarjetas`, `estante`, `busqueda`, `lector`, `mapa`).

## 1. Objetivo

Cambiar el aspecto y la navegación de todo el sitio aplicando Búho de forma consistente y haciéndolo más intuitivo. Las funciones, los datos y las URL se conservan, salvo los cambios listados en la sección 3.

Se cambia la cáscara de lo que ya existe. La única función nueva es leer un documento como libro.

**Se considera terminado cuando:**

1. Ninguna vista conserva el estilo anterior, en los 4 temas y en escritorio, tablet y celular.
2. El búho aparece en todas las páginas y el estilo es uno solo.
3. Toda función listada en la sección 10 sigue disponible.
4. `npm test`, `npm run lint` y `npm run build` pasan. Línea base de hoy: 623 pruebas pasan y 1 falla por tiempo (`tests/ui-acervo.test.js`, 5 s), a revisar antes de empezar.

## 2. Decisiones aprobadas

| Tema | Decisión |
|---|---|
| Navegación | Riel lateral de cristal flotante con píldoras (adapta `BarraLateral`) |
| Marca | Monograma oficial de Búho en todas las páginas; el nombre sigue siendo «Buscador Jurídico» |
| Tipografía | Fraunces para títulos y lectura; Manrope 450 para interfaz |
| Temas | Se conservan Claro, Oscuro, Sepia y Contraste |
| Fondo | Retícula de puntos y sombra neutra, sin mancha roja |
| Color | Guinda para navegación y atención; un color fijo por tipo de documento |
| Libros | Fondo neutro según el tema; el color solo como acento |
| Acervo | Estante 3D con carpetas abajo que filtran al instante |
| Tarjetas de resultados | Librito neutro más cristal |
| Búsqueda | Una sola caja; titular «Busca un término en el marco energético», sin cursiva |
| Grafo | Se queda el D3 actual con sus animaciones; solo cambian colores |
| Lector | «Por artículo» como hoy, más «Como libro» con giro de página |
| Tablas | Formato de `HojaExcel` en todas |
| Párrafos en lectura | Justificados, con guiones y última línea natural |
| Tamaños | Toda vista se diseña y revisa en escritorio, tablet y celular |
| Mapa de permisos | Mapa a pantalla completa con cristal encima; grupos en dona y gotas por tecnología |
| Líneas de transmisión | Estándar por tensión de Búho, en lugar de los colores CENACE actuales |
| CNE y SENER | Dos grupos de pestañas, etiqueta de autoridad; CNE en guinda y SENER en azul petróleo |
| Tarjetas de permisos | Mosaico con icono del tipo de permiso o de la tecnología |

## 3. Cambios de comportamiento

Son los únicos cambios funcionales permitidos:

1. **Resultados abren en Lista**, con el Mapa a un toque. Hoy abren en Mapa si no hay preferencia guardada. Se respeta la preferencia ya guardada en `buscador-vista`.
2. **El estante deja de dar la vuelta infinita.** Tiene principio y fin, para que los filtros se vean limpios.
3. **Color de los libros por tipo de documento**, en lugar del color calculado por siglas (`bookColor`).
4. **Navegación agrupada:** Estadísticas entra en Análisis. ¿Cómo funciona?, Reto y Ayuda entran en «Aprende».
5. **Filtro de documento en resultados:** nombre corto con la sigla como dato secundario.
6. **«Tus búsquedas recientes»** se muestra en las sugerencias de la caja, no en una tarjeta.
7. **Pedir cuenta** usa el diálogo de `requireAccount` para Guardar y Mi nota, en lugar de aviso más ventana de acceso. Las reglas no cambian: Guardar, notas y descargas requieren cuenta; Fijar no.
8. **Lectura como libro:** función nueva, sección 8.2.
9. **Colores de líneas de transmisión:** pasan de CENACE a Búho. Es un cambio de lectura para quien ya conocía los anteriores.
10. **Ventana del permiso en el mapa:** suma el número de resoluciones, acuerdos, oficios y anexos.
11. **Icono de tipo en las tarjetas de permisos:** función nueva de presentación, sección 9.1.

## 4. Fuera de alcance

- Cambios en Supabase, en la búsqueda o en la ingesta.
- Corregir el texto de los documentos. Las palabras pegadas de origen, como «TérmicaConvencional», se tratan aparte.
- Cargar React o el `bundle.js` de Búho. Se porta su CSS y su marcado al JS actual.
- Publicar cambios en el artifact de Búho. Ver sección 14.

## 5. Arquitectura

### 5.1 Capa de tokens

`src/styles/design/variables.css` sigue siendo la única fuente de valores, porque Tailwind y las hojas ya dependen de ella.

- Se añaden los nombres de Búho (`--papel`, `--tinta`, `--rojo`, `--cristal`…), definidos para los 4 temas.
- Los nombres actuales quedan como alias, para no reescribir todas las hojas de golpe:

| Actual | Búho |
|---|---|
| `--surface-0` | `--papel` |
| `--surface-1` | `--papel-alto` |
| `--surface-sunken` | `--ceniza` |
| `--hairline` | `--linea` |
| `--ink` | `--tinta` |
| `--ink-muted` | `--tinta-suave` |
| `--brand` | `--rojo` |
| `--primary` / `--on-primary` | `--accion` / `--on-accion` |
| `--font-display` | Fraunces |
| `--font-sans` | Manrope |

- `data-theme` conserva `light`, `dark`, `sepia` y `contraste`, y las claves `app-theme` y `app-dark-mode`.
- `tailwind.config.js` y `src/design/tailwind.preset.js` siguen apuntando a variables.

**Temas derivados.** Día y Noche son los de Búho. Sepia y Contraste no existen en Búho y se derivan así, partiendo de los valores que ya usa el sitio:

| Tema | Regla |
|---|---|
| Sepia | Papel `#f4ecd8`, tinta `#2b2116`, guinda `#8a1d3f` |
| Contraste | Papel `#fff`, tinta `#000`, guinda `#6b0d2a`; sin cristal, sin desenfoque, sin escena y con bordes sólidos |

**Superficie del libro.** `--lb-bg`, `--lb-bg2`, `--lb-ink`, `--lb-suave` y `--lb-edge`, claros en Claro, Sepia y Contraste, oscuros en Oscuro.

**Color por tipo de documento.** Cada tipo tiene un valor para fondo claro y otro para fondo oscuro, todos con contraste de al menos 3:1 sobre su superficie:

| Tipo | Claro | Oscuro |
|---|---|---|
| Leyes | `#9b2247` | `#e57a9a` |
| Reglamentos | `#2e6fb0` | `#6ea8e0` |
| Acuerdos | `#0e8a6e` | `#3ba98c` |
| Disposiciones | `#0e7f99` | `#39b5d1` |
| Convocatorias | `#a8720c` | `#e0a12e` |
| Normas | `#b84f29` | `#e0784f` |
| Otros | `#5e6671` | `#9aa3ae` |

Se exponen como `--col-*` y sustituyen los valores actuales. Se reutiliza `getAcervoGroup` para decidir el tipo. El texto nunca lleva el color del tipo. El encabezado y el total de las tablas van siempre en `--rojo`, sea cual sea el tipo.

**Limpieza.** Hoy hay 636 colores hexadecimales en `src/styles/*.css`, 316 en JS y 655 `!important`. Cada vista migrada debe quedar sin hexadecimales fuera de tokens. Excepciones: colores de mapas definidos como tokens (`kv-*`, `gcr-*`, `tec-*`) y la hoja blanca del PDF. Al final se retiran `legacy-dark.css` y `dark-balance.css`.

### 5.2 Fuentes

`Fraunces-Variable`, `Fraunces-Variable-Italic` y `Manrope-Variable` se copian de Búho a `public/fonts/` y se cargan con `@font-face` y `font-display: swap`. Se retiran Newsreader, Noto Sans e IBM Plex Mono de Google Fonts. La vista previa y los nombres de Ajustes de lectura pasan a Fraunces y Manrope; los valores guardados `serif` y `sans` siguen funcionando.

### 5.3 Marca

- `src/lib/brand-mark.js` usa los trazos de `buho-mark.svg`: cuerpo en `currentColor` y ojo en `--rojo`.
- Se regeneran `logo-mark*.svg` y `.png`, favicon, iconos de la app y la imagen para redes.
- `site-intro.js` anima `bm-bar`, `bm-page` y `bm-lens`. El trazo oficial une cuerpo y cejas en una sola ruta, así que hay que separarla en dos subrutas conservando esas clases. `tests/brand-mark.test.js` cubre esto.
- El video de la intro (`video-intro/`) lleva la marca anterior y debe renderizarse de nuevo con `node video-intro/render.mjs`, que requiere FFmpeg. Mientras no se publique, la intro usa la animación en SVG que ya existe como respaldo.

### 5.4 Componentes

Nueva carpeta `src/styles/design/buho/` con CSS portado de `bundle.css`, prefijo `bu-`, sin React: escena, cristal, botón, chip, insignia, carpeta, tabla, campo, diálogo, aviso.

Reglas de migración:

- El marcado existente cambia de clases, **no de `id` ni de `data-*`**, porque `ui.js` y las pruebas dependen de ellos.
- Las clases `bj-` se retiran a medida que cada vista migra. `chrome.css` y `components-extra.css` desaparecen al final.
- Cristal solo en dos densidades, y nunca un cristal encima de otro.

### 5.5 Movimiento

Tres velocidades de Búho (160, 320 y 800 ms) con `ease-entrada`. El movimiento continuo usa resorte críticamente amortiguado, sin rebote y con tope de aceleración y velocidad para los saltos largos. Valores probados en maqueta: ω 7.5, tope 60 libros/s² y 13 libros/s; presencia de libros ω 11. Con `prefers-reduced-motion` todo cambia sin animar.

Las pruebas midieron que el primer paso de un salto largo baja de 0.50 a 0.015 libros por cuadro. El salto más largo tarda 2.7 s; se puede acortar al afinar.

## 6. Armazón y navegación

| Ancho | Navegación |
|---|---|
| 1200 px o más | Riel completo de 220 px |
| 768–1199 px | Riel solo con iconos |
| Menos de 768 px | Cabecera con marca, selector y mesa; `MenuInferior` con 5 destinos |

**Destinos del riel (7):** Buscar, Acervo, Cronología, Permisos, Polos, Análisis (incluye Estadísticas) y Aprende (¿Cómo funciona?, Reto, Ayuda).

**Pie del riel:** Mi mesa con contador, Guardados y Cuenta. La cuenta reúne el tema, los atajos y las opciones de administración cuando corresponden.

**Celular:** Buscar, Acervo, Cronología, Permisos y Más. «Más» abre una hoja con el resto.

Se conservan los `id` actuales (`nav-leyes`, `nav-inicio`, `nav-stats`, `nav-favorites`, `darkmode-toggle`…) y el deep linking por hash.

El aviso legal del pie se conserva en todas las páginas.

## 7. Acervo y búsqueda

### 7.1 Acervo (`shelf-view.js`, `law-cover.js`, `law-sheet.js`)

- Se conserva `shelf-geometry.js` y su arco. Se añade la «presencia» de cada libro (0 a 1): la posición sale de sumar las presencias anteriores, así al filtrar los libros salen subiendo y desvaneciéndose mientras el resto se junta.
- `stepSpring` pasa a resorte críticamente amortiguado (sección 5.5).
- `rel()` circular se sustituye por posición lineal con extremos.
- Lomo y portada neutros con banda, listón, regla e icono en el color del tipo.
- Carpetas: una por tipo, con conteo real. Filtran al instante, y una segunda pulsación regresa a todo. Las hojas abren su documento.
- En pantallas de menos de 900 px las carpetas se deslizan en horizontal.
- La altura del libro baja a 250 px debajo de 768 px.
- Ficha: mismos campos que hoy, crece desde la portada en 620 ms y regresa en 480 ms. Un clic trae el libro al frente y, al llegar, abre la ficha.

### 7.2 Búsqueda (`search-landing.js`, `search-results-view.js`, autocompletado de `ui.js`)

- **Una sola caja** que viaja del centro a la parte superior al buscar, animando solo `transform`.
- **Ejemplos tocables:** una palabra, una ley, un artículo.
- **Bloques:** temas para empezar, con enlace al mapa de términos, y publicado recientemente.
- **Sugerencias:** primero «Buscar *x* en todo el acervo», después documentos y artículos. Sin texto, muestra el historial con «Borrar todo».
- **Resultados:** carpetas con coincidencias por tipo, panel de filtros desde 900 px y hoja inferior debajo, filtros activos como chips, grupos por documento con librito, «Ver todas», fragmento resaltado, fuente oficial, Fijar y Guardar.
- **Mapa:** `search-graph-view.js` no cambia su física ni sus animaciones. Solo `COLORS` pasa a los tokens de tipo y su tipografía a Manrope y Fraunces.
- Cambiar un filtro desvanece solo la lista y deja quietas las carpetas.

## 8. Lector

### 8.1 Por artículo

Se conservan las pestañas Texto, Línea del tiempo, Presentación y Estructura; índice; búsqueda dentro del documento; guías de trámite; documentos relacionados; prueba de la ley; cargar más.

**Índice con dos pestañas:**

- **Capítulos:** el árbol actual de `buildLawOutline`.
- **Artículos:** cuadrícula de números con filtro y salto directo, o lista de etiquetas cuando el documento no usa números. Abre por defecto en esta pestaña.

**Selector de artículos.** Fijo en el panel lateral desde 900 px. Debajo, botón junto a la mesa: en el riel en tablet y en la cabecera en celular, en una hoja. Con un artículo abierto, elegir otro lo abre directo. También aparece en el lector de artículo en escritorio.

**Tarjeta de artículo:** ruta, título, extracto, Fijar, Comparar, Guardar con candado si no hay cuenta, y nota si existe.

**Lector de artículo** (sustituye el aspecto de `#detail-modal` con los mismos `id`):

- Vistas: Texto, PDF original, Texto y PDF.
- Acciones: Compartir (WhatsApp texto e imagen, Telegram, X, correo, enlace), Copiar cita formal, Copiar, Fijar, Guardar, Abrir original.
- Mi nota, Ajustes de lectura, anterior y siguiente. Edición para administradores.

**Visor del original.** `reader-source-view.js` y `reader-pdf.js` no cambian su lógica: PDF por `/api/reader`, huella SHA-256, anclas y resaltado por renglón. Solo cambia su estilo.

**Comparar y mesas.** Se conservan: comparar dos artículos con «Resaltar diferencias»; mesas con crear, renombrar, duplicar, borrar, vaciar, compartir, reordenar, copiar a otra mesa y lado a lado de hasta 3. Límites actuales: 20 mesas y 24 artículos por mesa. `desk-store.js` y `desk-sync.js` no cambian.

### 8.2 Como libro (función nueva)

Selector **Por artículo / Como libro** en la cabecera del documento.

**Módulos nuevos:**

- `src/lib/book-paginate.js`: reparte bloques en páginas.
- `src/scripts/book-view.js`: pinta, gira, índice y marcadores.
- `src/styles/book.css`.

**Paginación:**

- Mide con la letra real, después de `document.fonts.ready`, sobre un contenedor oculto.
- Toma el texto de la misma fuente que el lector (`texto` de `mapRowToLocalItem`). Nunca altera el texto.
- Un párrafo largo se parte por palabras.
- Una tabla angosta (hasta 5 columnas en doble página y 3 en una) se reparte por filas y repite el encabezado.
- Una tabla ancha, con `rowspan` o con una fila que no cabe en una página va en tarjeta con «Ver tabla completa».
- Una figura ocupa un alto fijo de 38 % de la página y se amplía al tocarla.
- Reparte por tramos para no bloquear la pantalla y muestra aviso de carga. Referencia: la ley de 203 artículos tardó cerca de 1.3 s en una prueba de una sola pasada.
- Guarda el resultado en memoria por documento, ancho, alto y ajustes.

**Presentación:**

- Dos páginas desde 900 px y una debajo. En celular ocupa toda la pantalla, con botón para regresar.
- Giro 3D con frente y dorso reales, de 780 ms. En una sola página, 624 ms. Con movimiento reducido cambia sin animar.
- Se avanza con flechas, teclado, arrastre y barra de páginas. Pasar rápido termina el giro en curso sin interrumpir el siguiente.
- Página de portada con la marca y página final con el aviso legal: el texto con validez es el publicado en el DOF o la fuente oficial.

**Herramientas:**

- Índice con las mismas dos pestañas, marcar página y Ajustes de lectura. Cambiar la letra repagina y conserva el artículo.
- Tocar la etiqueta de un artículo abre un menú: Leer por artículo, Ver el original, Copiar cita formal, Copiar, Compartir, Fijar, Guardar.
- Al volver a Por artículo se sigue en el mismo artículo.
- Posición y marcadores se guardan en `localStorage` por documento, sin requerir cuenta.

**Avisos y límites de la primera versión:**

- La búsqueda dentro del documento y Comparar quedan en Por artículo.
- Las páginas cambian con el tamaño de letra, así que no sirven para citar. La cita sigue siendo por artículo.
- Documentos relacionados y guías aparecen al final, con su misma etiqueta que indica que no son texto oficial.

### 8.3 Texto y tablas

**Párrafos de lectura:** justificados, con `hyphens: auto` y última línea natural, en lector de artículo, libro y comparación. Lo mismo en Mesas al expandir texto. Tarjetas, listas e interfaz van alineadas a la izquierda. Se revisa la regla global de justificado de `src/styles/index.css`, que hoy abarca todo `#main-container`.

**Tablas.** `src/lib/article-html.js` conserva `enhanceTables`, y `article-tables.css` se reescribe con el formato de `HojaExcel`:

- Sin cuadrícula ni rellenos por fila.
- Encabezado inmovilizado en versalitas guinda con borde inferior de 2 px.
- Cifras tabulares a la derecha y «–» gris donde falta el dato, solo por CSS.
- Filas que empiezan con «Total» en negrita guinda con borde superior.
- Variación con signo y `%` en verde o guinda.
- Títulos «Tabla N» en Fraunces y «Fuente:» en gris.
- Desde 5 columnas, primera columna fija. Si no cabe, «Desliza» y «Ver en grande».

**El contenido oficial nunca cambia.** Reconocer encabezado o total solo añade presentación, y debe seguir pasando la auditoría de celdas. Cuando no haya `thead`, la primera fila se trata como encabezado solo si no contiene cifras distintas de años.

## 9. Resto de vistas

Sin maqueta propia. Se revisan ya en la app, con las mismas reglas de tokens, cristal, tablas, tarjetas y tamaños:

| Vista | Regla particular |
|---|---|
| Cronología (`timeline-view`) | `LineaTiempo` y `Hitos` de Búho |
| Permisos (`permits-*`, `resolutions`, `tramites`, `cne-*`) | Ver sección 9.1 |
| Polos (`polos-view`) | `TableroMapa`; capas y polígonos sin cambio |
| Análisis y Estadísticas (`explorer-*`, `stats-view`, `terms-view`) | `Grafica` y `KPI`; se conservan las animaciones de los grafos |
| Aprende (`como-funciona`, `reto`, `help`) | Editorial; ilustraciones recoloreadas con tokens |
| Cuenta y administración (`auth`, `account-panel`, `users`, `admin-*`) | `Campo`, `Modal`; sin cambios de seguridad |
| Presentación (`law-presentation`) | Paleta Búho en web y en PPTX por sus constantes de color |
| Diálogos, instalación, vacíos, carga | `Modal`, `Toast`, `EstadoVacio` |

### 9.1 Sección de permisos (maqueta `mapa`)

**Pestañas.** Dos grupos: `CNE` (Permisos, Resoluciones, Panorama, Trámites, Mapa) y `SENER` (Títulos y permisos). Etiqueta de autoridad arriba de cada vista. Token nuevo `--aut-sener`, con valor por tema: `#0f6e82`, `#5cc3db`, `#195b69` y `#00404d`. En SENER usan ese color pestaña activa, iconos, enlaces y selección. Las tablas mantienen el formato de la sección 8.3, en guinda.

**Mapa (`permits-map-view.js`).** Se conserva toda su lógica: datos, capas, búsqueda, CSV, ubicación, huracanes, otras actividades de la CNE y ligas oficiales.

- Mapa a sangre, debajo del riel; México se ajusta al área libre con márgenes por tamaño.
- Panel de capas de cristal; en celular, hoja inferior con botones flotantes.
- Indicadores recalculados con los filtros: permisos, MW, autorizados y aún sin operar.
- `sectorCluster` pasa a dona con la mezcla por tecnología y el total al centro.
- Marcadores en gota (`techMarkerSVG` variante `pin`), de 22, 26 o 30 px según capacidad; punteada si es aproximada o aún no opera, gris si no está vigente, anillo guinda si está seleccionada.
- `KV_CLASSES` y `--map-kv*` pasan al estándar de Búho. Afecta también a «Títulos y permisos».
- Ventana del permiso: conteos, «Ver permiso oficial», lista de resoluciones con sus enlaces, «Ficha y resoluciones», Compartir, Fijar y Street View. Los conteos se piden al registro con `fetchPermit` al abrir, con carga diferida; si no responde, la ventana sigue funcionando sin ellos.

**Permisos, Resoluciones, Panorama, Trámites.** Mismas funciones y consultas en vivo. Cambian formularios, tarjetas, fichas, línea de resoluciones, gráficas y fundamento legal, según la maqueta.

**Títulos y permisos (`cne-sener-view.js`).** Se conservan mapa, color por estado, tabla, paginación y ficha. Las tarjetas de la guía llevan su icono.

**Tipo de permiso.** Módulo nuevo `src/lib/permit-type.js`, de funciones puras, con pruebas:

| Prefijo o código | Tipo |
|---|---|
| `TRA` con `OM` | Transporte sin ducto |
| `TRA` con `TM` | Transporte |
| `TRA` solo | Transporte por ducto |
| `ALM` | Almacenamiento; con `AE`, en aeródromo |
| `DIST`, `DIS` | Distribución; con `PLA`, planta |
| `EXP` | Estación de servicio; con `AUT` o `ESA`, autoconsumo; con `AE`, aeródromo |
| `COM` | Comercialización |
| `COMP`, `DESC`, `LICUE`, `REG` | Instalación con su actividad |

En electricidad, `E`, la tecnología se toma de la capa del mapa por número de permiso, que se carga una vez y se guarda en memoria; sin coincidencia, icono según el código (`GEN`, `COG`, `AUT`, `IMP`…). Un código desconocido nunca inventa tipo: icono genérico con su actividad. El color del glifo se elige por contraste. Se agrega el icono `ducto` a `infra-icons.js`, y el registro de la tecnología de almacenamiento a `TECHNOLOGIES`.

Aprende y las demás vistas de esta sección siguen las reglas generales, sin maqueta propia.

## 10. Inventario que no se puede perder

Sirve de lista de cotejo en cada fase: búsqueda con sugerencias e historial; filtros por colección, documento y artículo; lista y mapa; acervo con búsqueda; ficha con temas; lector con sus 3 vistas, resaltado de fuente, ajustes, notas, cita, copiar, compartir, fijar y guardar; navegación entre artículos; comparar con diferencias; mesas y su sincronización; guardados; línea del tiempo, presentación, estructura y prueba de cada ley; guías de trámite; documentos relacionados; cronología; permisos, mapa y resoluciones; polos; análisis, términos y estadísticas; reto; ayuda; atajos de teclado; cuenta y recuperación; administración e ingesta; instalación como app; deep linking; impresión; aviso legal.

## 11. Accesibilidad

- Texto a 4.5:1 y controles, iconos y foco a 3:1 en los 4 temas. Contraste sin cristal.
- Foco visible en todo control. Diálogos con `aria-modal`, Esc y regreso del foco.
- Los filtros de carpeta usan `aria-pressed`. El estante y el libro responden a teclado.
- Destinos táctiles de 44 px en celular.
- El libro anuncia la página con `aria-live`.
- Figuras con su `alt` y tablas con región enfocable.

## 12. Errores y casos límite

| Caso | Comportamiento |
|---|---|
| PDF no carga o no coincide su huella | El mensaje y el enlace oficial que ya existen; el texto sigue disponible |
| Imagen del DOF no carga | Se muestra su `alt`; el texto sigue |
| Paginación falla | Aviso y regreso a Por artículo |
| Fuente tarda en cargar | Se pagina al estar lista; si llega después, se repagina conservando el artículo |
| Sin `localStorage` | El libro funciona sin recordar posición; la lectura no se rompe |
| Sin `backdrop-filter` | Superficie sólida equivalente |
| Documento sin índice | Lista simple de sus artículos, como hoy |
| Sin sigla o sin fecha | Se omite el campo; la portada usa el nombre |

## 13. Pruebas

**Automáticas:**

- `book-paginate`: el texto reconstruido es idéntico a la fuente en 13, 17 y 20 px; todas las celdas e imágenes presentes; sin páginas desbordadas; conserva el artículo al repaginar.
- Geometría: posición con presencia, extremos y topes del resorte.
- Actualizar las pruebas que afirman marcado o color: `brand-mark`, `law-cover`, `law-sheet`, `shelf-*`, `ui-home`, `ui-acervo`, `ui-reader`.
- Reconocer total y encabezado no altera el texto de la tabla.

**Manuales con Chrome real, en cada fase:**

- Cada vista en 390, 820, 1280 y 1400 px y en los 4 temas.
- Cotejo de la sección 10.
- Sin errores de consola.
- Contraste medido.

Referencias de la maqueta: 227,470 caracteres idénticos en los tres tamaños; PROSENER con 637 celdas y 13 imágenes; muestra difícil con 2,422 celdas y 2 imágenes; PDF de la Ley del Sector Eléctrico con 44 renglones resaltados en la página 12.

## 14. Orden de implementación

Cada fase deja el sitio funcionando y se revisa antes de seguir.

1. **Base:** tokens, fuentes, marca, CSS de componentes y fondo.
2. **Armazón:** riel, cabecera móvil, menú inferior y hojas.
3. **Acervo:** estante, carpetas y ficha.
4. **Búsqueda:** portada, sugerencias, resultados y colores del grafo.
5. **Lector por artículo:** índice, selector, lector, tablas, comparar y mesas.
6. **Como libro.**
7. **Sección de permisos** (9.1) **y resto de vistas** de la sección 9.
8. **Cierre:** retiro de CSS heredado, video de la intro, cotejo final y actualización de `DESIGN.md` y `CLAUDE.md`, que hoy describen el sistema anterior.

**Rama:** nueva rama desde `feat/portada-estante`, porque el estante y la intro actuales viven ahí, con 14 commits aún fuera de `main`. Los cambios sin commit ajenos a esto (`src/lib/motion.js`, `package.json`, `package-lock.json`, `docs/propuestas-spline-2026-10-24.md`, `supabase/.temp/`) no entran. `.superpowers/` se agrega a `.gitignore`.

**Actualizar Búho (opcional y por separado).** Para que siga siendo la fuente de verdad, conviene reflejar lo que se decidió aquí: `Escena` sin mancha roja, color por tipo de documento, riel de cristal, ocre `#b84f29` por contraste, temas Sepia y Contraste, y libro digital.

## 15. Riesgos

| Riesgo | Mitigación |
|---|---|
| CSS heredado con 655 `!important` pisa el nuevo | Migrar por vista y retirar lo reemplazado en la misma fase |
| `ui.js` (4,630 líneas) depende de `id` y clases | Conservar `id` y `data-*`; pruebas de UI en cada fase |
| Cristal lento en equipos modestos | Desenfoque solo en piezas fijas; medir en celular real |
| Tablas reales distintas a las probadas | Auditoría sobre las 363 con tablas antes de cerrar la fase 5 |
| Documentos muy largos en el libro | Paginación por tramos; probar el DOF completo más largo |
| Imágenes externas del DOF | Carga diferida y `alt`; revisar la política de seguridad en producción |
| Justificado con columnas angostas en celular | Guiones activados; revisar en 390 px |
