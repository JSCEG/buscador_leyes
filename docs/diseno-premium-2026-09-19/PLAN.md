# Evolución del buscador jurídico SENER

Propuesta del 19 de septiembre de 2026. Estado: plan y prototipo aislado para revisión; la interfaz principal y Supabase no se modificaron. Acervo de referencia: 41 instrumentos y 3,300 fragmentos, verificados en la incorporación anterior. No se amplía el acervo durante este trabajo.

## Qué debe mejorar

El buscador ya resuelve tareas complejas. Para que se sienta completo necesita coherencia entre buscar, explorar y leer: menos cambios de escala, controles previsibles y una lectura que aproveche bien cada pantalla. La dirección propuesta es una **mesa de consulta jurídica institucional**: el texto normativo es el centro, la fuente y la publicación son fáciles de reconocer y las herramientas acompañan sin competir por espacio.

Se conservan búsqueda, acervo, análisis, estadísticas, favoritos, notas, comparación, exportaciones y presentación. Se reorganiza su acceso según la tarea. No se propone migrar a React, cambiar Supabase ni modificar la fragmentación de los instrumentos.

## Diagnóstico basado en la versión actual

| Paso | Estado observado | Evidencia de esta revisión | Cambio propuesto |
|---|---|---|---|
| 1. Inicio, escritorio | Identidad reconocible; la portada funciona, pero ofrece poco contexto del acervo y mucho espacio antes del trabajo | `capturas/01-inicio-escritorio.png` | Buscador protagonista, acceso al acervo y colecciones útiles, sin añadir indicadores decorativos |
| 2. Búsqueda, escritorio | Las sugerencias siguen abiertas sobre resultados; títulos muy largos se cortan y el extracto usa texto pequeño | `capturas/02-resultados-escritorio.png` | Cerrar sugerencias al confirmar; lista legible con título, coincidencia y metadatos separados |
| 3. Resultados, móvil | Filtros, espacio y resúmenes ocupan la primera pantalla; la tabla requiere desplazamiento horizontal propio | `capturas/03-resultados-movil.png` | Resultados en una columna; filtros en panel con contador y filtros activos visibles; resúmenes desplegables |
| 4. Instrumento, móvil | Título oficial largo y su repetición consumen gran parte de la pantalla antes del texto | `capturas/04-instrumento-movil.png` | Título de consulta breve, título oficial completo desplegable y acceso inmediato al contenido |
| 5. Lector, móvil | El texto está disponible; cabecera extensa, modal encajonado y acciones con iconos pequeños reducen comodidad | `capturas/05-lector-movil.png` | Lector a pantalla completa en móvil; título contextual compacto, índice y ajustes accesibles |
| 6. Ajuste de letra | Fallo confirmado: el indicador sube de 100% a 120%, el contenedor de 16 a 19.2 px, pero el párrafo permanece en 14 px | `capturas/06-ajuste-letra-movil.png`, `medicion-letra.json` | Una preferencia de lectura compartida por vistas previas, texto completo y tablas |

En el detalle observado también aparecen «Marco Legal Vigente», «9 Artículos» y etiquetas «Art.3/Art.4» para un acuerdo con resolutivos y otros fragmentos. Debe mostrarse el tipo real de unidad y la fecha de publicación; no deducir vigencia ni contar notas editoriales como artículos. El análisis de código y las referencias precisas están en [AUDITORIA-CODIGO.md](AUDITORIA-CODIGO.md).

La revisión cubre este recorrido con datos reales y una muestra de pantallas; no es una certificación completa de accesibilidad ni una prueba de todas las funciones, navegadores o dispositivos físicos.

## Dirección visual

| Elemento | Decisión |
|---|---|
| Marca | Logos existentes sin alterar proporciones. Guinda `#9B2247`, verde institucional `#1E5B4F` y dorado `#A57F2C` del proyecto. El dorado se reserva para acentos; comprobar contraste si se usa como texto |
| Superficies | Blanco para el documento, papel `#FAF8F5` para el entorno, tinta `#1C1B1A`, divisores suaves. Radios de 8 px y sombras limitadas a elementos superpuestos |
| Títulos | Patria Bold local. Escala fluida: portada 32–56 px, encabezado de sección 24–36 px, título de lectura 24–32 px |
| Interfaz | Noto Sans Medium local; base 16 px, metadatos 14 px, sin bloques extensos en mayúsculas espaciadas |
| Lectura | Noto Sans, valor inicial 18 px, opciones 16/18/20/22/24 px; interlineado 1.6/1.8/2.0. Ancho máximo de 65–75 caracteres y alineación izquierda |
| Espaciado | Escala compartida 4/8/12/16/24/32/48 px; márgenes móviles 16–20 px, escritorio 32–48 px |
| Acciones | Una acción principal clara por contexto; etiquetas visibles para herramientas importantes. Objetivo de producto: controles táctiles de 44 × 44 px |
| Movimiento | Sólo respuesta a acciones, 120–180 ms; respetar movimiento reducido. Sin carruseles automáticos |

Las fuentes y tokens de la guía SENER se reutilizan con una adaptación explícita a web: sus medidas para diapositivas no se trasladan literalmente a la aplicación. `DESIGN.md` debe actualizarse durante la implementación para eliminar su contradicción con la tipografía institucional actual.

## Mockups navegables

Abrir [prototipo.html](prototipo.html). Se propone una dirección coherente en tres pantallas, con adaptación real a escritorio y móvil:

1. **Inicio y acervo:** consulta visible, colecciones por tema y acceso a instrumentos recientes. Contexto de cobertura con fecha, sin afirmar vigencia general.
2. **Resultados:** lista con títulos de consulta, coincidencias destacadas y fuente/fecha. Filtros laterales en escritorio y panel accesible en móvil. Mantener el estado al volver de un artículo.
3. **Lector:** índice al lado en escritorio y panel en móvil; texto como superficie principal, ajustes Aa e interlineado, copiar y guardar con confirmación clara. La fuente oficial y el título completo permanecen disponibles.

El prototipo utiliza una muestra local identificada. Sus búsquedas y guardados de demostración no consultan ni escriben en cuentas de Supabase. Es una referencia para implementar; no reemplaza todavía la app.

## PDF original sincronizado con la lectura

Preferencia confirmada por el usuario el 19 de septiembre: conservar en el buscador la experiencia de las vistas previas de incorporación, donde seleccionar una unidad lleva el documento original a su ubicación. Se incorpora a la entrega 3 como una función central de consulta y comprobación de la fuente. La sincronización todavía no está implementada en este prototipo.

- **Escritorio amplio:** opción «Texto y PDF» con dos paneles; al elegir un artículo, resolutivo, transitorio o anexo, el PDF navega a la página correspondiente. El índice puede plegarse para dar espacio al documento. Permitir ampliar cualquiera de los paneles.
- **Móvil y pantallas estrechas:** selector «Texto / PDF original»; conserva la unidad seleccionada y lleva el PDF a su ubicación al cambiar de vista. El regreso al texto mantiene la posición de lectura. No comprimir dos documentos lado a lado.
- **Ubicación verificable:** asociar cada fragmento con la versión exacta del PDF y su página física; cuando existan coordenadas fiables, desplazar hasta el inicio y resaltarlo. El número del artículo no equivale al número de página. Si sólo se conoce la página, indicar ese nivel de precisión.
- **Documentos diversos:** admitir unidades que abarcan varias páginas, numeraciones repetidas, anexos, formatos y tablas. No volver a fragmentar ni cambiar IDs únicamente para sincronizar el visor.
- **Sin ubicación disponible:** conservar acceso a la fuente oficial e informar que no hay ubicación vinculada. No simular una sincronización exacta ni sustituir silenciosamente un PDF por otra edición.
- **Rendimiento y accesibilidad:** cargar el visor al abrirlo y renderizar páginas bajo demanda; controles con teclado y etiquetas; conservar la alternativa de texto y un enlace para abrir o descargar el original.

**Cierre de esta función:** seleccionar al menos un artículo, un resolutivo, un transitorio y un anexo lleva a la página comprobada en la edición correcta; volver de PDF a texto conserva contexto en móvil; documentos sin mapeo muestran su estado. Probar también tablas, varias páginas, enlaces directos y carga fallida del PDF. La sincronización de desplazamiento en ambos sentidos queda fuera del alcance inicial: primero se garantiza selección de unidad → ubicación en el original.

La estimación base de 10–14 jornadas corresponde al plan previo a esta ampliación. Reservar provisionalmente **2–4 jornadas adicionales para el visor y su integración**; el trabajo de completar ubicaciones de todo el acervo se estima por separado tras inventariar los mapeos existentes. Revisar si el contrato actual ya conserva documento, versión y páginas antes de decidir una migración de metadatos.

**Referencia existente:** `revision-acervo/LCNE/LCNE_vista_previa.html` reproduce páginas del PDF como imágenes con resaltado de líneas y un enlace al PDF en su página. Su trazabilidad relaciona `paginas`, `lineas_origen`, `pagina` y `bbox`, además de tamaño y huella del documento. Reutilizar este vínculo documental como base; distinguir el visor de páginas de revisión del visor PDF que se integrará al buscador.

La carga de autoconsumo en `revision-acervo/incorporacion-autoconsumo-2026-09-18/generar_sql.py` no persiste página ni coordenadas en las filas actuales. Por tanto, inventariar y completar el mapeo antes de prometer sincronización para todo el acervo. Para PDFs con tamaños de página diferentes, conservar dimensiones por página en lugar de reutilizar las de la primera.

## Estadísticas explorables y fichas de planeación actualizables

Ampliación confirmada por el usuario el 19 de septiembre: aprovechar las visualizaciones y explicaciones actuales, enriquecerlas y permitir que evolucionen con el radar regulatorio diario. No se modifica la tarea programada en esta entrega de planeación.

### Lo que ya existe y conviene conservar

`showStatsView()` en `src/scripts/ui.js` usa el catálogo cargado y llama a `renderAcervoAnalytics()`. Ya hay visualizaciones D3; no hace falta cambiar de librería para diversificar gráficos. Sin embargo, la fecha «Última actualización: Mayo 2025» está fija y el resumen clasifica por el inicio del título. Hay que sustituir esos supuestos por metadatos verificables y diferenciar instrumentos, artículos y otros fragmentos.

`src/scripts/analisis.js`, arreglo `TEMAS`, contiene la explicación de Planeación Vinculante, sus relaciones, métricas y extractos directamente en JavaScript. Incluye PLADESE, PLADESHi, PLATEASE y la Estrategia Nacional. Esta base se conserva y se revisa contra fuentes, pero sus contenidos se separan del renderizado para que añadir o actualizar instrumentos no exija editar componentes.

### Visualizaciones propuestas

| Pregunta de consulta | Gráfico y acción | Condición de datos |
|---|---|---|
| ¿Qué se ha publicado y qué incorporamos recientemente? | Línea de tiempo interactiva; seleccionar un periodo abre sus instrumentos | Separar fecha de publicación, incorporación y reforma; mostrar fecha de corte real |
| ¿Cómo está compuesto el acervo? | Treemap por tipo/sector, con alternativa de lista en móvil; tocar un bloque filtra resultados | Clasificación explícita y categoría «sin clasificar»; tamaño según conteo elegido, nunca importancia jurídica |
| ¿Qué temas cubre cada instrumento? | Matriz tema × instrumento con filtros y acceso a unidades relacionadas | Distinguir relación validada de etiqueta editorial; ausencia de clasificación no significa ausencia del tema |
| ¿Cómo se relacionan los instrumentos de planeación? | Diagrama dirigido y fichas enlazadas: norma, instrumento, autoridad y documento | Cada vínculo tiene tipo, fuente y referencia; no inferir jerarquía u obligatoriedad sólo por cercanía visual |

Primera implementación: línea de tiempo y diagrama de planeación, junto con los gráficos existentes que sigan siendo útiles. Treemap y matriz se activan cuando sus metadatos estén completos. Las barras se conservan donde faciliten comparar cantidades. Las cifras del acervo no se presentan como indicadores de cumplimiento o avance de la transición energética. Si más adelante se incorporan metas sectoriales, cada serie llevará unidad, horizonte, escenario y fuente, distinguiendo metas de observaciones.

Reutilizar D3 como primera opción: su documentación incluye líneas, árboles, treemaps y redes ([documentación oficial](https://d3js.org/)). Evaluar Highcharts únicamente si resuelve una necesidad concreta mejor, comparando accesibilidad, exportación, licencia y peso antes de incorporarlo. No instalar varias librerías para variar la apariencia. Todas las vistas tendrán título que explique la pregunta, leyenda, fecha de corte, fuente y alternativa tabular; selección mediante teclado y tacto, sin depender de hover. En móvil, diagramas complejos se acompañan de una lista navegable de relaciones.

### Fichas que expliquen y documenten

Crear un registro editorial versionado para PLADESE, PLADESHi, PLATEASE, Estrategia y los demás instrumentos. Cada ficha incluye: nombre oficial y siglas, qué es y para qué sirve, autoridad responsable, fundamento con artículos enlazados, horizonte cuando esté documentado, relaciones justificadas, documento publicado disponible, fuente original, fecha de última revisión e historial de cambios. Enlaces al lector y al original sincronizado cuando exista mapeo.

Separar tres hechos: **previsto en una norma**, **publicación oficial localizada** e **incorporado al buscador**. Que la ley mencione un plan no demuestra que el documento ya esté publicado o cargado. La vigencia se muestra sólo con evidencia y fecha de verificación; una explicación editorial se identifica como tal. Los estados del inventario de septiembre son un punto de partida, no una verificación actual de publicación.

Contrato propuesto, a ajustar al esquema existente: ID estable de ficha, revisión, estado editorial, referencias a instrumentos y fragmentos reales, fuentes y versión documental, fecha de revisión, relaciones tipadas y evento del radar que originó el cambio. Guardar contenido aprobado en una capa de datos —preferentemente Supabase si encaja con permisos y versionado actuales— y mantener `analisis.js` como renderizador. No trasladar credenciales privilegiadas al navegador.

### Temas Transversales como explorador parametrizable

Aclaración del usuario: el alcance no se limita a fichas de planes. Se debe poder explorar **un concepto**, como Planeación Vinculante, **o un instrumento**, como PLADESE, con su explicación y relaciones. Nombre de trabajo: **Explorador del marco normativo**; conservar «Temas Transversales» como acceso reconocible durante la transición.

El contenido ya no será un árbol dibujado a medida dentro de `TEMAS`. Se propone un modelo común con cuatro piezas:

| Pieza | Datos configurables | Ejemplo de uso |
|---|---|---|
| Entidad | ID estable, tipo (concepto, instrumento, autoridad), nombre oficial, alias/palabras clave, descripción editorial, fuentes y revisión | Buscar «planeación vinculante» o «PLADESE» y abrir una ficha centrada en esa entidad |
| Relación | Origen, destino, tipo, explicación, evidencia vinculada a artículos/documentos, revisión y contexto temporal si corresponde | Mostrar por qué dos entidades están relacionadas y abrir el fundamento que sostiene ese vínculo |
| Colección temática | Título, introducción, entidades de entrada, categorías y orden editorial opcional | Publicar otro tema sin duplicar el componente de Planeación Vinculante |
| Configuración de vista | Entidad central, profundidad, filtros por tipo/sector, disposición y orden | Mostrar árbol cuando haya jerarquía sustentada, red cuando haya relaciones cruzadas y lista equivalente en móvil |

El diagrama será una vista de los datos: no se guardarán coordenadas rígidas que sólo funcionen para los nodos actuales. La profundidad y los filtros limitarán la cantidad de relaciones visibles; se podrá expandir un nodo, centrar la vista en otro y volver al anterior. Cada relación tendrá una explicación accesible con su fuente. Los ciclos y vínculos múltiples no se forzarán dentro de un árbol que sugiera una jerarquía inexistente.

Las palabras clave y alias ayudarán a **encontrar** entidades. Compartir palabras no bastará para afirmar una relación jurídica: las relaciones publicadas tendrán evidencia y revisión. Las propuestas automáticas del radar quedarán identificadas como propuestas hasta validarse. El grafo de Graphify describe el código del proyecto; no se usará como evidencia del grafo normativo.

La administración podrá crear o editar entidades, relaciones y colecciones mediante campos y selectores de referencias existentes, con vista previa y publicación versionada. Migrar primero la propuesta actual de `TEMAS`, conservando IDs y enlaces que sigan siendo válidos; contrastar afirmaciones y reemplazar cifras fijas por consultas o métricas con metodología. Añadir un nuevo instrumento o concepto será una operación de datos; añadir un tipo de visualización o capacidad nueva seguirá siendo trabajo de código.

**Prueba decisiva de parametrización:** crear en un entorno de prueba una segunda colección y añadir un concepto con dos instrumentos y relaciones documentadas, sin editar `analisis.js`; debe aparecer en búsqueda, ficha, diagrama y lista móvil con enlaces correctos. Editar y publicar una relación debe actualizar las vistas, dejar historial y permitir restaurar la revisión previa. Cubrir también una entidad sin relaciones, ciclos, referencias ausentes y un conjunto grande.

**Próximos mockups de este módulo:** (1) catálogo de temas y conceptos; (2) entidad central con explicación, relaciones y evidencia en escritorio; (3) recorrido móvil de las mismas relaciones; (4) editor con vista previa y diferencias antes de publicar. Se diseñan usando contenido existente verificado y una colección adicional de prueba identificada, sin presentar datos ficticios como parte del acervo.

### Del radar diario a una actualización revisable

Flujo previsto: **hallazgo del radar → cotejo con inventario → propuesta de cambio → revisión documental → publicación de la actualización → verificación en la app**.

1. Recibir la salida estructurada del radar existente con URL oficial, título, fecha, tipo y evidencia. Si sólo hay informe narrativo, preparar un adaptador sin cambiar la tarea programada por esta propuesta.
2. Comparar identificadores oficiales, URL normalizada y huella del contenido. Distinguir nuevo instrumento, nueva versión, modificación, duplicado y referencia relacionada; repetir el mismo lote no crea duplicados.
3. Preparar un paquete que indique qué documento y ficha cambian, qué enlaces o estadísticas afecta y qué revisión falta. Un hallazgo puede actualizar una ficha sin exigir cargar otro PDF.
4. Para nuevas ingestas, mantener la revisión **instrumento por instrumento**: estructura y numeración reales, texto íntegro, tablas, páginas y vista previa. El radar no publica automáticamente chunks sin verificar.
5. Publicar la revisión aprobada conservando IDs, historial y posibilidad de volver a la versión anterior. Recalcular únicamente métricas derivadas y refrescar las fichas afectadas; invalidar la caché correspondiente.
6. Verificar enlaces, cifras y documento visible; registrar el lote y la fecha de actualización. La fecha de ejecución del radar no sustituye la fecha de publicación ni la última revisión editorial.

**Criterios de cierre:** incorporar un instrumento de prueba actualiza ficha, relaciones, estadísticas y búsqueda sin editar el renderizador; repetir el lote no duplica datos; una publicación pendiente no aparece como cargada; una revisión fallida conserva la versión anterior; las métricas cuadran con el catálogo filtrado; las referencias abren el artículo correcto. Usar fixtures y una vista previa para validar el flujo antes de publicar datos reales.

**Orden y estimación:** añadir una entrega específica de contenido y radar después de los fundamentos del lector. Primero inventariar los contenidos existentes y definir sus contratos; luego elaborar mockups de estadísticas y fichas; por último implementar y probar el flujo de actualización. Esta ampliación no está incluida en las 10–14 jornadas del plan base ni en las 2–4 del visor. Estimarla tras confirmar la salida disponible del radar, los permisos editoriales y los metadatos faltantes. El prototipo actual sigue cubriendo inicio, resultados y lector; no se presenta como demostración funcional de este nuevo flujo.

## Comportamiento por pantalla

| Ancho disponible en CSS | Distribución y controles |
|---|---|
| 320–479 px | Una columna; menú compacto, filtros e índice en diálogo; lector completo; títulos que se ajustan sin truncar el acceso al nombre oficial |
| 480–767 px | Una columna más amplia; acciones en filas flexibles; sin forzar columnas de escritorio |
| 768–1023 px | Paneles plegables; resultados amplios; lector con índice opcional según espacio real |
| 1024–1439 px | Navegación completa; filtros/índice lateral y contenido principal con ancho de lectura controlado |
| 1440–2560 px y superiores | Contenido centrado con límites de ancho; el texto no se estira para ocupar toda la pantalla |
| Horizontal o poca altura | Cabecera y herramientas compactas; `100dvh`, zonas seguras, scroll del contenido; evitar que barras fijas tapen la lectura |

Los puntos de cambio responden al espacio del contenido, no al nombre de un dispositivo. Las tablas normativas mantienen filas, celdas y combinaciones dentro de una región desplazable identificada; no se comprimen hasta ser ilegibles ni se convierten automáticamente en fichas que cambien su significado.

## Implementación en entregas pequeñas

Estimación orientativa: **10–14 jornadas de implementación y revisión**, después de acordar la dirección. Depende del alcance de las funciones secundarias y de los hallazgos en dispositivos reales. Cada entrega debe poder revisarse y revertirse por separado.

| Entrega | Trabajo concreto | Superficies técnicas | Criterio de cierre | Esfuerzo |
|---|---|---|---|---|
| 0. Dirección y evidencia | Plan, capturas actuales y prototipo de las tres vistas | Este directorio | Recorrido y decisiones revisables; distinguir demo de producción | Preparado |
| 1. Lectura y fundamentos | Corregir Aa, persistir tamaño/interlineado/tema; unificar tokens; reparar foco, semántica y cierre de paneles; eliminar bloqueos de scroll contradictorios | `src/scripts/ui.js`, `src/styles/index.css`, `src/styles/base-theme.css`, `src/styles/mobile-responsive.css`, `src/styles/sener-institutional.css`, `tailwind.config.js`; extraer un módulo pequeño de preferencias | Aa modifica el tamaño calculado del texto y celdas, sobrevive a cambio de instrumento y recarga; navegación con teclado sin perder foco | 2–3 jornadas |
| 2. Inicio y resultados | Cabecera compacta, búsqueda y sugerencias consistentes, lista responsiva, filtros con estado visible; jerarquía fuente/fecha/unidad | `index.html`, renderizado de resultados en `ui.js`, estilos de componentes | Buscar → filtrar → abrir → volver conserva consulta, filtros, página y posición; el primer resultado queda cerca del resumen | 2–3 jornadas |
| 3. Instrumento y lector | Índice de unidades reales; nombre corto editorial y título oficial completo; separar lectura, resumen y presentación; mejorar tablas y herramientas | `ui.js`, `src/lib/article-preview.js`, presentación existente | Funcionan ley, acuerdo, transitorio, anexo largo y formulario; mismo texto/IDs; ningún fragmento editorial se etiqueta como artículo normativo | 3–4 jornadas |
| 4. Cierre del producto | Estados de carga/error/vacío/sin conexión; paridad modo oscuro; notas, favoritos, comparación, análisis, estadísticas, impresión y gestor móvil | Módulos existentes y estilos compartidos | Cada función conserva su acceso, estados y permisos; guardar no informa éxito si falla; exportaciones legibles | 2–3 jornadas |
| 5. Validación y publicación | Pruebas de regresión, accesibilidad y pantallas; revisión visual; despliegue de vista previa y luego producción | Tests, Vite, Cloudflare Pages, service worker | Lint/tests/build correctos; recorrido público tras deploy; versión anterior recuperable | 1 jornada |

El error de la letra no se resuelve aumentando el `font-size` del padre: las clases en `rem` y tamaños fijos de los hijos siguen ganando. La implementación propuesta aplicará variables específicas al área de lectura, con unidades relativas en párrafos, listas y celdas. No se escalan logos, botones o toda la app con una transformación visual. El control Aa complementa el zoom del navegador; no lo sustituye ni lo restringe.

Las cinco entregas de implementación suman 10–14 jornadas; una corrección que amplíe ese alcance requiere actualizar la estimación. La entrega 0 corresponde al plan y prototipo ya preparados.

El tema tendrá un único controlador de preferencias. El modo global y el fondo del lector tendrán alcance explícito, sin superponer los actuales parches `html.dark-mode` y `body.bg-dark/bg-sepia`. Elegir sepia sólo afectará a la superficie de lectura; el estado mostrado en escritorio y móvil siempre deberá coincidir y persistir.

La base seguirá siendo la SPA actual. Extraer preferencias, paneles y renderizadores puntuales reduce el riesgo de seguir acumulando condiciones en `ui.js`. Mantener eventos DOM y contratos de `search-engine.js`; no reescribir todo el módulo en una sola entrega. Los ajustes visuales no necesitan migraciones de BD; el PDF sincronizado requiere revisar por separado la persistencia de sus ubicaciones.

## Matriz de aceptación

- **Pantallas:** 320, 360, 390, 430, 768, 1024, 1280, 1440, 1920 y 2560 px; alturas de 568, 844, 900 y paisaje 844 × 390. Usar anchos CSS efectivos, no sólo dimensiones declaradas por el navegador.
- **Texto:** zoom al 200%; reflow equivalente a 320 px; tamaños Aa mínimo y máximo, título oficial muy largo, incisos anidados, enlaces largos y tablas. No hay pérdida de información por `overflow-x:hidden`.
- **Teclado:** Tab y Shift+Tab con foco visible; Enter/Espacio activan resultados; Esc cierra el panel correspondiente y devuelve foco; las flechas de lectura no sustituyen inesperadamente el scroll.
- **Lectores de pantalla:** nombres de botones, regiones, encabezados, diálogo modal y anuncios de resultados. Validación manual con NVDA/VoiceOver antes de afirmar conformidad.
- **Estados:** carga inicial/lenta, cero coincidencias, error Supabase, sesión cerrada, sin conexión, notas sin guardar, preferencias inválidas y almacenamiento local no disponible.
- **Temas:** modo global y fondo de lectura controlados por un único estado; sin colores contradictorios al combinar oscuro y sepia, cambiar de instrumento, abrir un deep link o recargar. Igual selección visible en los controles de móvil y escritorio.
- **Contenido crítico:** LSE; un acuerdo con título largo; la segunda modificación estratégica; formato autoconsumo de 12 tablas; anexo A de Ventanilla de 22 tablas. Comparar texto y enlaces antes/después, sin reingesta.
- **Funciones:** búsqueda y filtros, deep links existentes, historial Atrás/Adelante, acervo, índice, Aa/tema, copiar/citar, favoritos/notas con cuenta, comparación, CSV/PDF, presentación, análisis, estadísticas y gestor.
- **Rendimiento:** medir antes/después en móvil; no añadir frameworks ni librerías pesadas sólo para decoración, reservar espacio de logos/fuentes y evitar renderizar anexos completos dentro de previews.
- **Publicación:** prueba sobre la URL de Cloudflare con caché/service worker real. Validar acervo y una búsqueda, además del estado exitoso de build.

Se toma WCAG 2.2 AA como objetivo de implementación, sin declarar cumplimiento actual. El objetivo táctil de 44 px es una decisión del producto más amplia que el mínimo de 24 px de 2.5.8, que tiene excepciones. Referencias: [reflow 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [tamaño del texto 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [tamaño de objetivo 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## Orden recomendado

Empezar por **entrega 1: lectura, tipografía y paneles**. Es el problema confirmado más inmediato y permite que el nuevo diseño se construya sobre controles fiables. Después trasladar la dirección visual al inicio y resultados, y finalmente al lector y las funciones secundarias. La implementación productiva se revisará contra los mockups y la matriz, sin alterar los documentos jurídicos.
