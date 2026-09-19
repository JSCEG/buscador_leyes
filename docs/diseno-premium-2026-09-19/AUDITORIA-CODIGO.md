# Auditoría de código para la mejora visual y responsiva

Fecha: 19 de septiembre de 2026. Base revisada: `79dd880`. Revisión de lectura; no se modificaron frontend, Supabase ni contenido jurídico. Se consultó graphify antes de recorrer los archivos. Esta auditoría distingue defectos demostrables en código de riesgos que requieren medir el navegador.

## Conclusión

La mejora puede hacerse sobre la SPA existente de Vite, JavaScript, Tailwind y Supabase. La consulta, las fuentes y las funciones ya proporcionan una buena base. La prioridad es convertirlas en una experiencia coherente de lectura: tipografía que responda a preferencias, controles accesibles, menor competencia entre estilos y una composición distinta según el espacio disponible.

El control de letra tiene un defecto concreto: cambia el porcentaje del contenedor, pero el texto usa tamaños propios en `rem` o píxeles y no hereda ese cambio. El artículo completo se presenta en otro contenedor que ni siquiera recibe la preferencia.

La inspección de navegador paralela confirmó el defecto a 390px: dos pulsaciones de A+ cambiaron el indicador de 100% a 120% y el contenedor de 16px a 19.2px, mientras el primer párrafo permaneció en 14px. Evidencia del trabajo principal: `medicion-letra.json` y captura 06 de esta carpeta. La misma inspección encontró “9 Artículos”, “4 Capítulos” y “Art.3/Art.4” en el acuerdo de requisitos de autoconsumo, aunque el inventario incluye resolutivos y otras unidades. Es evidencia de esos casos concretos, no una prueba exhaustiva de todas las vistas.

## Hallazgos comprobados en código

| Prioridad | Hallazgo y consecuencia | Evidencia | Resolución propuesta |
|---|---|---|---|
| P0 | El indicador de letra cambia, pero los textos mantienen su tamaño. El estado vuelve a 100% al abrir otra ley. | `src/scripts/ui.js:1165`, `1792–1796`, `2094–2100`. Los previews usan `text-sm`, etiquetas `text-xs` y `text-[10px]`, independientes del porcentaje de su ancestro. | Preferencia única de lectura, persistida y aplicada a una variable CSS en cada superficie de contenido. Retirar tamaños fijos de los descendientes de esa superficie. Probar tamaño calculado, no sólo el porcentaje mostrado. |
| P0 | El lector completo queda fuera del aumento. Incisos y tablas tienen tamaños todavía menores. | `src/scripts/ui.js:3630` fija `0.92rem`, `3637` fija `0.85rem`; `index.html:46` y `53` fijan tamaños de celdas; `sener-institutional.css:202` fija encabezados en `0.68rem !important`. | Componente visual `.legal-document` con base configurable; cuerpo, incisos y celdas heredan; títulos usan `em` relativo. Mantener UI de acciones a escala propia para no agrandar toda la aplicación. |
| P0 | El modal de artículo no declara diálogo ni gestiona entrada, contención y retorno del foco. Las tarjetas se abren sólo por click. | `index.html:727–730`; `ui.js:2092`, `2109–2113`, `3990–4028`. No hay `role="dialog"`, `aria-modal`, `tabindex` de entrada o restauración de foco en este flujo. | Usar `<dialog>` o primitiva accesible equivalente; foco inicial, Escape, fondo inerte y retorno al disparador. En las tarjetas, un enlace/botón real para el título, con acciones independientes. |
| P0 | Flechas arriba/abajo cambian de artículo, aunque una persona quiera desplazar la lectura con teclado. | `ui.js:4228–4237` captura las cuatro flechas y hace `preventDefault()`. | Conservar arriba/abajo para desplazamiento normal; navegación entre artículos con botones visibles y atajo explícito que no capture la lectura. |
| P1 | Conviven dos sistemas de tema: modo global persistido en `html.dark-mode` y lector no persistido en `body.bg-light/bg-sepia/bg-dark`. Ambos inyectan sobrescrituras. | `ui.js:47–107`, `1166`, `1732–1790`; `base-theme.css:753`; `sener-institutional.css:260`. | Una preferencia global claro/oscuro/sistema y una preferencia de superficie de lectura, si se conserva sepia. Resolverlas con tokens y atributos explícitos, sin pintar globalmente cada clase utilitaria. |
| P1 | El bloqueo de scroll de menú/índice se contradice en móvil. | `mobile-responsive.css:11–16` fuerza `overflow-y:auto !important`; `ui.js:1618` intenta `document.body.style.overflow='hidden'`. El modal de artículo tampoco activa bloqueo de fondo en `3990–4018`. | Centralizar overlays y scroll lock. Fondo inmóvil mientras se lee, con un único contenedor interno de scroll; conservar posición al cerrar. |
| P1 | Hay reglas móviles que no coinciden con el DOM actual. | `mobile-responsive.css:199` apunta a `#detail-panel`; el panel real es `#modal-panel` (`index.html:730`). La regla de ajuste del footer no puede aplicarse. | Sustituir selectores frágiles por clases de componente; retirar reglas sin destino después de comprobar todas las vistas. |
| P1 | Se usan alturas `vh` sin compensar barra del navegador, teclado o zonas seguras. Los overlays móviles se apilan con alto de cuerpo y panel independiente. | `mobile-responsive.css:235` usa `92vh`; `:244` usa `75vh`; `ui.js:1504` usa `75vh` para índice. No se encontraron `dvh`, `svh` ni `safe-area-inset` en los CSS importados. | Lector de pantalla completa móvil con `100dvh`, `min-height:0`, cabecera/pie flexibles y `env(safe-area-inset-*)`. Una sola región de scroll por panel. |
| P1 | La tabla se estiliza con letra pequeña y rellenos fijos; el scroll horizontal envuelve todo el contenido Markdown, no cada tabla. | `index.html:29–70`; `ui.js:3614–3618`. La ruta de HTML tradicional no añade ese contenedor. | Envolver cada tabla individualmente en región de desplazamiento con nombre y señal visual; mantener la semántica de filas, celdas y spans; texto previo/posterior siempre se adapta al ancho. Ofrecer expansión de tablas extensas. |
| P1 | Falta una jerarquía legible consistente para metadatos y acciones. Hay texto útil de 9–10px y controles pequeños. | `index.html:734` (origen de artículo, 9px), `ui.js:2098` (ubicación, 10px), `ui.js:1173–1185` (controles de letra/tema), `mobile-responsive.css:109` (10.4px). | Tokens de contenido, metadatos y UI, con contraste medido. Objetivo de UI secundaria de 14px en pantallas ordinarias, cuerpo de lectura de 18px por defecto y áreas táctiles de al menos 44×44px como criterio de proyecto. |
| P1 | El encabezado asegura “Marco Legal Vigente” para cualquier instrumento, sin consultar su condición. | `ui.js:1230` inserta el texto fijo. El acervo incluye documentos con vigencia no verificada y notas editoriales. | Mostrar tipo de instrumento y fecha; sólo afirmar vigencia cuando existe evidencia/estado disponible. Fuente oficial, versión y alcance deben ser fáciles de localizar. Esto refuerza confianza sin inventar certificación. |
| P1 | Se presenta cualquier fragmento como artículo, incluso resolutivos, notas editoriales y firmas; el índice puede inventar números de artículo. Las agrupaciones editoriales pueden aparecer como capítulos legales. | `ui.js:1316–1321` etiqueta el total como “Artículos” y agrupaciones como “Capítulos”; `1142–1150` usa nombres agrupados como respaldo; `1402–1411` sólo distingue preámbulo/anexo/complementario/transitorio y asigna `Art.${i+1}` al resto. | Proyectar un modelo de presentación que conserve tipo e identificador reales de cada unidad. Contar “unidades de consulta” o “fragmentos” de forma neutral cuando hay mezcla; separar contenido oficial y nota editorial; sólo mostrar capítulos si son capítulos formales. Índice por identificador real, con abreviatura accesible, nunca por posición como numeración inventada. |
| P2 | Se da por disponible el estilo `prose`, pero no se configura el plugin de tipografía. Hay estilos de tablas propios, no un sistema completo de párrafos/listas. | `tailwind.config.js:53` (`plugins: []`); `index.html:766`, `ui.js:3615`; búsqueda de `.prose` en archivos importados encuentra reglas de tabla. | Crear CSS semántico propio y acotado para documentos jurídicos. Alternativamente evaluar plugin, con prueba explícita del HTML fuente; no añadirlo a ciegas porque cambia listas y márgenes. |
| P2 | El movimiento no respeta una preferencia de reducción en los estilos que realmente se cargan. | `src/main.js:1` importa `index.css`, que sólo importa base/mobile/institutional; `base-theme.css:60` activa scroll suave; `ui.js:3993–4000` anima el modal con rebote de 800ms. Las reglas de reducción en `main.css` no se importan por esta ruta. | Desactivar rebotes y transiciones de desplazamiento con `prefers-reduced-motion`; usar respuesta discreta y consistente. |

Los nombres y números de línea corresponden a la base de esta auditoría. Las prioridades expresan impacto en uso, no una clasificación de seguridad.

## Riesgos a validar visualmente

1. **Índice estrecho:** `index.css:60–64` exige cuatro columnas de al menos `4.25rem` más tres separaciones de `0.5rem`: 296px mínimos con raíz de 16px. El panel agrega varios niveles de padding (`ui.js:1539`, `1425`, `mobile-responsive.css:186`). Esa combinación puede exceder el espacio disponible a 320–375px. Proponer columnas por espacio (`auto-fit` o dos/tres columnas), sin encoger las etiquetas hasta perder legibilidad.
2. **Tableta y orientación horizontal:** las correcciones móviles se concentran en `max-width:640px`, mientras controles de lectura cambian en `md` (768px) y navegación cambia en `lg` (1024px). Revisar 641–767px, 768–1023px y ventana de baja altura; no asumir que todos los breakpoints actuales componen una vista coherente.
3. **Lector con títulos largos:** cabecera y footer son filas flexibles sin una solución común para salto de línea. Evaluar acuerdos con títulos extensos, contador de navegación de varios dígitos, fuente al 200% y menú abierto.
4. **Texto fuente enriquecido:** probar HTML con tablas y anexos reales, Markdown y texto simple. Las tres rutas deben compartir tipografía y scroll, conservar el orden jurídico y evitar truncamientos en lectura completa.
5. **Contraste:** medir texto gris, dorado sobre claro, estados inactivos y resaltado en tres fondos. No basta usar colores institucionales para asegurar lectura cómoda.

## Implementación propuesta, sin migrar de framework

### Fase 1 — lector confiable

- Crear módulo de preferencias de lectura (`reader-preferences.js`) con un único estado y persistencia versionada; incluir tamaño, fondo y ancho de lectura si se ofrece.
- Crear superficie semántica de documento con CSS específico. Alcance: previews y artículo completo; no modificar ni resegmentar contenido en Supabase.
- Resolver accesibilidad del modal y paneles, navegación por teclado y scroll lock.
- Acotar tablas a su propio desbordamiento horizontal; herencia tipográfica en celdas e incisos.
- Eliminar mensajes de vigencia no sustentados.
- Corregir etiquetas y estadísticas según la unidad jurídica: artículos, resolutivos, numerales, anexos y transitorios; notas editoriales identificadas como tales. La corrección es de presentación y no exige renumerar documentos.

**Aceptación:** pulsar A+ produce un aumento medible de `getComputedStyle(...).fontSize` en párrafo, inciso y celda; los botones muestran el mismo estado en móvil/escritorio; persiste al cambiar documento y recargar. Abrir por deep link, avanzar y cerrar conserva navegación y foco. Arriba/abajo desplazan lectura. No cambia el texto jurídico ni sus relaciones de celdas.

### Fase 2 — sistema visual y composición adaptativa

- Tokens únicos de tipografía, espaciado, color, elevación, bordes y estados. Mantener Patria para títulos y Noto Sans para UI/cuerpo; respetar pesos disponibles de fuentes.
- Separar CSS de base, componentes, lectura y layout. Consolidar sobrescrituras gradualmente; no reemplazar todos los estilos en un solo cambio.
- Unificar cabecera, búsqueda, filtros, tarjetas, metadatos, botones y estados vacíos/carga/error.
- Componer escritorio con índice contextual y área de lectura limitada en caracteres; en móvil, contenido principal y acceso claro al índice/filtros como paneles; en tableta, elegir según espacio real.

**Aceptación:** ninguna vista obliga a desplazar toda la página horizontalmente desde 320px; sólo tablas identificadas pueden hacerlo dentro de su región. La lectura mantiene un ancho objetivo de 65–75 caracteres en pantallas amplias. No hay superposición de contenido y controles flotantes, ni acciones inaccesibles bajo la zona segura.

### Fase 3 — validación y pulido

- Matriz: 320, 360, 390, 430, 768, 1024, 1280, 1440 y 1920px; móvil horizontal; altura reducida; zoom 200% y 400%; letra del lector al mínimo, normal y máximo.
- Vistas: inicio, resultados y filtros, acervo, detalle, índice, artículo, tabla/anexo, comparación, favoritos, temas, login y administración autorizada.
- Estados: carga, sin resultados, error, fuente/relación no disponible, sesión cerrada/abierta, claro/oscuro/sepia y movimiento reducido.
- Pruebas de navegador sobre flujos reales; snapshots representativos y mediciones de overflow/foco/tamaño calculado. Vitest/jsdom actual protege render y búsqueda, pero no mide layout ni tipografía real (`tests/ui-agreements.test.js`, `tests/ui-acervo.test.js`).
- Comprobar los enlaces existentes, búsqueda, citas/copias, favoritos y 41 instrumentos sin cambios de datos; medir rendimiento antes/después en el mismo entorno.

**Aceptación:** flujo completo operable por teclado; indicadores de foco visibles; controles con nombre accesible; apertura/cierre de overlays estable; preferencia de movimiento respetada; fuentes e iconos cargan sin saltos importantes; inventario de errores de consola no crece. Cualquier informe debe separar defectos corregidos de riesgos pendientes y evidencias de navegador de inferencias estáticas.

## Límites de esta revisión

No se ejecutó navegador desde este subtrabajo para evitar interferir con la inspección visual paralela. No se ejecutaron tests porque no se cambió código. Las propuestas son un plan de implementación; no certifican conformidad ni describen cambios ya desplegados.
