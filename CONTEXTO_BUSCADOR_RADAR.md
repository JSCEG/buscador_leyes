# Contexto del buscador y del radar regulatorio

Revisión: 17 de septiembre de 2026. Fuentes: código del repositorio, consultas de solo lectura a Supabase, Graphify, configuración y memoria de la tarea del radar, e informe Markdown canónico. No se incorporaron instrumentos ni se modificó la base de datos o la automatización. Esta revisión describe el sistema y su inventario; no revalida la vigencia jurídica de las fuentes del radar.

## 1. Aplicación que se ejecuta actualmente

La aplicación de esta carpeta es una SPA de JavaScript sin framework, con Vite y Tailwind. `package.json` no tiene React y `index.html` carga `src/main.js`. `App.jsx` contiene únicamente un comentario que indica que está fuera del bundle; la memoria de mayo que lo identifica como fuente activa quedó desactualizada.

`src/main.js` inicializa autenticación, interfaz, búsqueda, ingesta y administración. La navegación muestra y oculta secciones del DOM. Usa eventos como `search-ready` y `analisis:openArticle`, enlaces `#art:ID` y `#ley:NOMBRE`, y estado local dentro de los módulos.

| Componente | Responsabilidad actual |
|---|---|
| `src/scripts/ui.js` | Navegación, resultados, filtros, detalle e índice de instrumentos, favoritos, notas, estadísticas y modo oscuro. |
| `src/scripts/search-engine.js` | Consultas y operaciones de catálogo/artículos en Supabase; búsqueda, metadatos, temas y relaciones. |
| `src/scripts/auth.js` | Supabase Auth, sesión, criterio de administrador, favoritos y notas por usuario. |
| `src/scripts/admin-ingest.js` | Entrada por PDF o URL DOF, metadatos, detección de posibles duplicados, fragmentación, previsualización y escritura. Incluye también funciones de administración. |
| `src/scripts/admin-management.js` | Otra implementación de listado, edición y eliminación del catálogo; comparte elementos con la administración del módulo de ingesta. |
| `src/scripts/analisis.js` | Cinco temas transversales definidos editorialmente en `TEMAS`: planeación, consejos/comités, transición, soberanía y justicia energética. No se regeneran al cargar leyes. |
| `src/scripts/law-presentation.js` | Presentación web del instrumento y exportación a PowerPoint. |
| `src/lib/supabase.js` | Cliente compartido con variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. |
| `legal-ingest-pipeline.js` | Conversión y fragmentación para el flujo Node; independiente del parser del navegador. |

La búsqueda consulta Supabase por niveles: FTS en español con `phrase`, luego `websearch`, y finalmente `ilike` por palabras. Retorna el primer nivel con resultados. Tiene paginación y filtros de instrumento, tipo y número de artículo. Los valores `score` se asignan en JavaScript; no son una clasificación calculada con `ts_rank`.

`public/data/manifest.json` conserva 17 nombres históricos, pero en esta carpeta no están esos JSON junto al manifiesto. El motor actual no los carga: el acervo operativo proviene de Supabase. No se debe usar ese manifiesto como inventario real.

## 2. Supabase comprobado

Proyecto: `buscador-leyes`, ref `carmfqhcfsqbzcwptqfz`, coincidente con la configuración local. El conector reportó `ACTIVE_HEALTHY`.

Los conteos siguientes se obtuvieron con `count(*)`: **12 instrumentos, 1,749 fragmentos y 128 temas**. Las estimaciones de filas del listado de tablas devolvieron cero y no representan el conteo real.

| Instrumento / siglas | Tipo almacenado | Fragmentos | Temas |
|---|---|---:|---:|
| Ley del Sector Eléctrico — LSE | ley | 200 | 35 |
| Ley de Planeación y Transición Energética — LPTE | ley | 110 | 0 |
| Ley General de Economía Circular — LGEC | ley | 56 | 0 |
| Ley General de Transparencia y Acceso a la Información Pública — LGTAIP | ley | 234 | 0 |
| Reglamento de la LSE — RLSE | reglamento | 323 | 0 |
| Reglamento de la LPTE — RLPyTE | reglamento | 151 | 34 |
| Reglamento de la Ley del Sector de Hidrocarburos — RLSH | reglamento | 369 | 47 |
| Reglamento Interior de SENER — RISENER | reglamento | 87 | 12 |
| DACG de planeación vinculante en generación | dacg | 10 | 0 |
| Acuerdo CNE de integración de SAE al SEN | acuerdo | 154 | 0 |
| Lineamientos de Polos de Desarrollo Económico para el Bienestar | acuerdo | 37 | 0 |
| Decreto de estímulos fiscales de esos polos | decreto | 18 | 0 |

Un fragmento puede ser un artículo, transitorio, preámbulo o apartado; estos conteos no equivalen necesariamente al número jurídico de artículos.

Tablas reales: `leyes`, `articulos`, `temas`, `user_favorites` y `user_notes`.

- `leyes` ya incluye tipo, URL original, fecha de publicación, fecha de última reforma y `vigente`.
- `articulos` ya incluye `titulo_nombre`, `capitulo_nombre` y `seccion_nombre`; `fts` se genera con identificador y contenido en español.
- RLS está activo en las cinco tablas. El catálogo permite lectura pública y tiene políticas de administración para usuarios autenticados. Notas y favoritos se restringen por usuario.
- Las políticas administrativas consultadas aceptan correos específicos o `user_metadata.role = admin`; conviene revisar ese criterio al fortalecer permisos. El criterio de la interfaz también acepta `is_admin`, lo que no coincide exactamente con la política de BD.
- Existe el bucket público de Storage `documentos_legales`.
- **No existe `ley_relaciones` en el esquema consultado**, aunque el frontend y `supabase_setup.sql` contemplan modificaciones, reformas, adiciones, abrogaciones y sustituciones. El código de lectura tolera su ausencia.

`SUPABASE.md` quedó parcialmente desactualizado: describe RLS desactivado, columnas de jerarquía ausentes y un catálogo de una sola ley. El código y las consultas reales prevalecen sobre esa descripción histórica.

## 3. Cómo se incorporan instrumentos

### Gestor del navegador

1. PDF mediante pdf.js, o URL/código de nota DOF mediante el API SIDOF.
2. Extracción del texto y ayuda para completar título, tipo, fecha y URL.
3. Detección de posibles duplicados por siglas o similitud del título superior a 82%.
4. Fragmentación por artículos, ordinales, transitorios y algunos apartados numerados; extracción de temas.
5. Previsualización y ajustes antes de guardar.
6. Inserción de `leyes`, relación opcional, `temas` y lotes de 50 fragmentos.

El importador DOF toma el HTML de la nota y lo convierte a texto. Las notas sin HTML requieren otra vía. La detección actual de URL no cubre todos los formatos que aparecen en el radar, como `/notas/docFuente/ID`.

### Línea de comandos

`ingestar_pdf.js` usa `legal-ingest-pipeline.js`: por defecto intenta MarkItDown y recurre a pdf2md. Admite `--dry-run`, `--markdown-out` y `--tipo`, sube el original a Storage y escribe fragmentos en lotes de 100 con su jerarquía.

La CLI no recibe actualmente fecha de publicación ni URL oficial independiente del PDF almacenado. Tampoco incorpora la deduplicación del gestor ni sus relaciones. Las dos rutas no son equivalentes para una carga masiva.

Ambas rutas escriben por pasos sin una transacción global ni reversión completa ante error. Una falla intermedia puede dejar instrumentos parcialmente cargados. Antes de automatizar cargas repetibles hacen falta identificación estable de fuente, control de duplicados, validación de integridad y recuperación de fallos.

## 4. Cómo se usa Graphify aquí

`graphify-out/graph.json` es el grafo del repositorio. Sirve para localizar funciones, archivos y dependencias del código; no es el catálogo de relaciones jurídicas entre instrumentos.

Se consultó primero el grafo y luego se contrastaron sus resultados con las fuentes. La consulta de `handleDofUrlImport` localizó la extracción del código de nota, descarga SIDOF, conversión HTML, detección de tipo y llenado de campos.

Comandos previstos por `AGENTS.md`:

```text
graphify query "handleDofUrlImport"
graphify explain "legal-ingest-pipeline.js"
graphify path "admin-ingest.js" "search-engine.js"
graphify update .
```

`query` localiza contexto; `explain` enfoca un concepto; `path` busca relaciones. `update .` corresponde después de cambios de código. No se modificó código en esta revisión.

Hay advertencia de desfase entre skill 0.8.31 y paquete 0.8.26. Algunas consultas dentro del sandbox fallaron por el lanzador uv; la consulta repetida fuera del sandbox terminó correctamente. No se encontró `graphify-out/wiki/index.md`.

## 5. Radar regulatorio localizado

Tarea: **1.-Radar Regulatorio Energético DGMESNIE**, id `radar-regulatorio-energ-tico-dgmesnie`. Configurada activa, diariamente a las 18:30, con instrucciones de operar en America/Mexico_City.

Fuente canónica:

`C:/Users/User/Documents/Codex/Documentos latex/01_Proyecto_Actual/Informe_Instrumentos_Sector_Energetico_Mexico_2024-2026.md`

Frontmatter observado: **14 de septiembre de 2026, versión 4.17**. La memoria registra una revisión del 16 de septiembre sin novedades sustantivas. Esto distingue la última revisión del corte del contenido.

El radar consulta fuentes oficiales, compara novedades, mantiene el Markdown y, cuando corresponde, utiliza el publicador de `C:/Proyectos/79.-Informes`. La revisión de sus instrucciones no ejecuta la tarea ni autoriza por sí misma envíos en esta conversación.

En la sección 12, “Ligas de interés”, se contaron **179 filas con enlaces y 163 URLs únicas**:

| Grupo | Filas con enlaces |
|---|---:|
| Constitución, leyes, PND y reglamentos | 20 |
| SENER: planeación, transición e información | 33 |
| CNE, CRE y CENACE: electricidad, permisos, redes y mercado | 23 |
| CENACE | 6 |
| CFE | 10 |
| PEMEX e IMP | 12 |
| Hidrocarburos: CNH, CNE, CENAGAS y ASEA | 45 |
| CONUEE, eficiencia energética y transición | 18 |
| LitioMx, INEEL, IMP e ININ | 12 |

Estos números **no equivalen a leyes distintas ni a documentos listos para cargar**. Hay repeticiones, decretos que contienen varias leyes, anexos, reformas, sistemas, portales, publicaciones históricas y referencias a instrumentos no localizados. Las 33 filas de SENER incluyen tres referencias de instrumentos previstos pero no localizados.

El informe también contiene seguimiento de convocatorias, proyectos y resultados fuera de esas tablas. Por tanto, sección 12 es el punto de partida del inventario, no la totalidad de sus fuentes.

La memoria registra un bloqueo de publicación en las corridas del 11 y 14 de septiembre: límite de fuentes y dominios no permitidos en `approve-publicable`. El Markdown avanzó, pero esas corridas no produjeron un PDF nuevo. No se reparó ese publicador en esta revisión.

No se encontró un flujo en el buscador ni en la configuración del radar que sincronice automáticamente ese inventario con Supabase.

## 6. Implicaciones para ampliar el acervo

La base ya soporta más que leyes: reglamentos, acuerdos, decretos, DACG, NOM, permisos y manuales/lineamientos. Para todo el marco del radar faltan categorías explícitas y estados documentales suficientemente ricos para planes, programas, convocatorias, proyectos de NOM, antecedentes y referencias pendientes.

Ruta de trabajo propuesta, todavía sin ejecutar:

1. Convertir las referencias del radar en un inventario candidato, conservando sección, título, institución, fecha, tipo, estado y fuente.
2. Cruzarlo con los 12 instrumentos reales usando código DOF/URL normalizada y datos bibliográficos, sin depender únicamente del título.
3. Separar instrumentos, reformas y anexos de portales, noticias, datos de proyectos y referencias no publicadas. Resolver los decretos que contienen múltiples leyes.
4. Recuperar y validar el texto oficial completo; el resumen del radar sirve de índice y contexto, no sustituye el articulado.
5. Preparar fragmentos e índices, revisar numeración, transitorios, tablas/anexos y conteos, y presentar un lote verificable.
6. Incorporar los faltantes con trazabilidad y relaciones, y comprobar que búsqueda, lectura y presentaciones los consuman correctamente.

Antes de una carga amplia quedaron identificados estos puntos concretos:

- La fecha de LGEC está almacenada como `12026-02-19`: dato anómalo que requiere cotejo y corrección.
- La fecha de las DACG de planeación almacenada es `2025-10-27`, mientras su URL y el inventario del radar señalan 17 de octubre. RISENER también difiere entre catálogo y radar. No se corrigieron ni se dio por correcta una fuente sin cotejo oficial.
- Ocho instrumentos no tienen filas en `temas`; debe distinguirse estructura ausente de estructura aún no extraída.
- Crear y asegurar correctamente las relaciones pendientes; no aplicar sin revisión el SQL histórico que otorga escritura anónima.
- Dar consistencia a los dos parsers y a los dos módulos de administración antes de ampliar la automatización.
- Actualizar por separado los temas transversales editoriales cuando se amplíe su cobertura.

## 7. Validación realizada

`npx vitest run`: **2 archivos, 11 pruebas aprobadas** (8 de fragmentación y 3 de búsqueda). La ejecución inicial quedó bloqueada por permisos del sandbox; el reintento autorizado fuera del sandbox terminó con éxito.

Las pruebas de búsqueda usan mocks: no prueban por sí mismas la importación DOF en vivo, los permisos de escritura ni la interfaz completa. La base real se verificó únicamente con lecturas. No se ejecutó una ingesta, despliegue, actualización de políticas, publicación o envío de correo.

## 8. Actualización: revisión individual de LCNE y gestor regulatorio

La LCNE quedó preparada localmente en `revision-acervo/LCNE/`, con 28 artículos, 13 transitorios propios, 5 títulos y 8 capítulos. La vista `LCNE_vista_previa.html` permite cotejar cada fragmento con las páginas originales. Se conservaron aparte los transitorios del decreto y los documentos de la SCJN. No cambió el catálogo de Supabase.

Se corrigió el gestor existente: `admin-ingest.js` utiliza el nuevo módulo puro `src/lib/regulatory-parser.js`, con reconstrucción PDF.js, elección de estructura, validación y edición de todos los fragmentos antes de guardar. Se probaron PDF reales de LCNE, decreto PODECOBI y SAEE. El CLI conserva su parser anterior; aún son dos vías distintas. La suite final tiene 24 pruebas aprobadas, lint y build Vite correctos. Los detalles y límites están en `revision-acervo/LCNE/README.md`.

## 9. Auditoría del acervo ya cargado — 17 de septiembre de 2026

Se examinó una copia de lectura de los 12 instrumentos, 1,749 fragmentos y 128 temas, y se descargaron sus fuentes oficiales. El informe navegable está en `revision-acervo/auditoria-cargados-2026-09-17/AUDITORIA.html`; `hallazgos-confirmados.json` conserva evidencia por UUID, fuente y acción pendiente. No se escribió en Supabase.

Nueve instrumentos presentan errores de fragmentación confirmados: RLSE, LSE, LPTE, LGTAIP, LGEC, PODECOBI-LIN, SAEE, RLSH y PODECOBI-DEC. Hay 33 artículos o numerales sin identificación propia correcta: 29 unidos o desplazados y 4 con número truncado. El texto se localizó en otros fragmentos; este conteo no significa 33 textos perdidos. También se encontraron referencias internas convertidas en transitorios o artículos y bloques de transitorios sin distinguir su pertenencia al decreto o a la ley. Los otros tres instrumentos requieren limpieza o metadatos, sin cortes erróneos confirmados en este cotejo.

Las fechas oficiales comprobadas son LGEC 2026-01-19, DACG-PV 2025-10-17 y RISENER 2025-04-17. Ocho instrumentos carecen de filas en temas; seis tienen estructura relevante que revisar. Se propone reparar primero RLSE, que tiene 16 artículos mal identificados, y avanzar uno por uno con cotejo y conservación de UUID y enlaces. No se inició ninguna reparación ni carga nueva.

El parser nuevo ayuda a localizar candidatos, pero aún produce falsos positivos en algunas fuentes y no sirve como sustitución automática del acervo. La auditoría es estructural y focalizada; no certifica cada carácter, tabla o vigencia jurídica. Los detalles y límites están documentados en el informe completo.

## 10. Correcciones aplicadas y verificadas — 17 de septiembre de 2026

El usuario autorizó corregir los instrumentos cargados antes de añadir más. Se aplicaron 12 transacciones individuales en Supabase, con comprobaciones contra un respaldo fresco y verificación dentro de cada transacción. Después se descargó el catálogo y se comprobó campo por campo contra los planes revisados. El resultado está en `revision-acervo/reparacion-2026-09-17/CORRECCIONES.html` y `VERIFICACION.json`.

El acervo sigue teniendo 12 instrumentos y ahora tiene 1,788 fragmentos y 358 entradas de índice. Se conservaron 1,744 UUID, se crearon 44 fragmentos (29 artículos/numerales, tres transitorios y 12 cierres) y se reunieron cinco cortes falsos. Los cuatro números truncados conservaron sus UUID. Los transitorios del decreto y de la ley están distinguidos; las firmas y referencias editoriales son complementos. Se corrigieron las tres fechas bibliográficas ya cotejadas.

Hallazgos adicionales: RLSH tiene 32 transitorios, no 29; los últimos tres estaban dentro del Vigésimo Noveno. La tabla del numeral 2.12 de SAEE decía IEC 62819 y se corrigió a IEC 62619 según el DOF, conservando el formato de tabla.

Verificación final: cero textos vacíos, FTS vacíos, etiquetas duplicadas y órdenes duplicados. Las fechas de creación de los registros conservados permanecieron iguales. Hay respaldo anterior/posterior, planes completos y SQL de reversión protegido por comprobaciones de estado. No se cargó LCNE ni otro instrumento nuevo.

El código local incluye `src/lib/article-redirects.json` y resolución en `getArticleById()` para cinco enlaces a cortes retirados. Las cinco redirecciones y la búsqueda real del artículo 32 de RLSE se comprobaron en navegador. Suite de 25 pruebas, lint y build correctos. No se desplegó el frontend: las redirecciones nuevas requieren publicación para estar disponibles en una versión alojada; los datos corregidos de Supabase ya están activos.

La reparación se hizo con perfiles cotejados para los documentos actuales, no con una ejecución ciega del parser genérico. Las siguientes incorporaciones deben continuar documento por documento y con revisión de todo el lote preparado.

## 11. Siete instrumentos incorporados — 17 de septiembre de 2026

El usuario autorizó subir los siete propuestos. Se cargaron en este orden, con una transacción y comprobación exacta por instrumento: LCNE, LSH, RICNE, LEPECFE, LEPEPM, LBio y LGeo. Fuentes: PDFs actuales descargados de la Cámara de Diputados y nota oficial SIDOF 5756757 para RICNE. Se conservaron los archivos originales y sus SHA-256.

El catálogo tiene ahora **19 instrumentos, 2,527 fragmentos y 494 entradas de estructura**. Las incorporaciones suman 739 fragmentos: 601 artículos ordinarios, 116 transitorios y 22 preámbulos/documentos complementarios. Se cotejó el respaldo posterior contra cada texto y metadato preparado. Las 12 leyes, 1,788 filas de artículos y 358 temas anteriores permanecen exactamente iguales, incluidas sus fechas de creación.

Detalle (ordinarios / transitorios propios / transitorios del decreto / complementos): LCNE 28/13/2/5; LSH 166/23/2/3; RICNE 38/0/8/2; LEPECFE 131/18/2/3; LEPEPM 126/21/2/3; LBio 46/13/2/3; LGeo 66/8/2/3. RICNE contiene un bloque de transitorios del decreto que expide el reglamento.

Se usaron perfiles locales específicos, fijados a los hashes, con cobertura de todas las líneas del cuerpo y revisión visual de páginas clave. La salida automática de ley-chunker se conservó sin corregir como evidencia: añadía artículos falsos desde referencias constitucionales, omitía el Vigésimo Tercero de LSH y confundía capítulos únicos o secciones femeninas. Se conservaron sin mezclar los transitorios generales del decreto, referencias editoriales y firmas. LCNE conserva la nota de invalidez en el artículo 22 y los dos documentos de la SCJN.

Evidencia y scripts: `revision-acervo/incorporacion-7-2026-09-17/`; informe `INCORPORACION.html`, cotejo `VERIFICACION.json`, respaldos `antes/` y `despues/`. Las siete consultas de prueba devolvieron resultados desde el módulo real del buscador. No cambió el código de la aplicación ni sus parsers genéricos en esta carga: los casos de otros documentos siguen requiriendo revisión individual. Los temas transversales editoriales y las relaciones regulatorias no se amplían automáticamente al insertar instrumentos.

## 12. Servicio local y pendientes posteriores

El proceso local dejó de escuchar en 5317 y se volvió a levantar con `iniciar-local.ps1`: ejecuta Node/Vite en segundo plano, sin ventana, limitado a 127.0.0.1, con puerto estricto 5317 y registros en `.local/` (ignorados por Git). Para iniciar o comprobar que ya está activo: `./iniciar-local.ps1`. La raíz y el informe de incorporación responden HTTP 200. Se retiró el puerto HMR fijo 5173 de `vite.config.js`; el WebSocket utiliza ahora el mismo puerto 5317 del servidor.

Se corrigió además la presentación de fechas de publicación y relaciones en `ui.js` y `admin-ingest.js`: se formatean en UTC porque las fechas de calendario de Supabase llegaban como YYYY-MM-DD y el navegador en México las mostraba un día antes. No se modificaron fechas en la base ni se desplegó el frontend alojado.

La lista `revision-acervo/FALTANTES_Y_ORDEN_DE_CARGA.md` ya encabeza el estado posterior a las siete cargas. Siguiente bloque propuesto: reglamentos de Biocombustibles, Geotermia, CFE (incluida su fe de erratas) y Pemex. Fuentes oficiales confirmadas; ninguno se cargó en esta revisión de pendientes.

## 13. Inventario completo de Ligas de interés, posterior a las siete cargas

Se cruzó nuevamente la sección 12 del radar canónico v4.17, corte 14 de septiembre de 2026, con una consulta de lectura del catálogo de Supabase (19 instrumentos, 2,527 fragmentos, 494 temas). Resultado reproducible en `revision-acervo/inventario-radar-2026-09-17/`: `INVENTARIO.html`, `INVENTARIO.md`, `INVENTARIO.csv`, `INVENTARIO.json`, instantánea `catalogo-actual.json`, generador Python y plantilla HTML. El generador comprueba cada fila y enlace contra la línea del radar y conserva el SHA-256 de la fuente.

Se mantienen 179 filas bibliográficas y se separan 15 repeticiones: 164 referencias sin repeticiones, con 163 URLs distintas. Clasificación: 124 por cotejar e incorporar; nueve referencias cargadas; un decreto con cobertura parcial; 13 antecedentes o de efectos limitados; cuatro filas de proyectos/consulta (ocho proyectos NOM); diez portales/colecciones y tres publicaciones no localizadas en el radar. Estas cifras no equivalen a un número definitivo de documentos jurídicos por cargar. La ausencia se refiere al instrumento propio en catálogo.

Las nueve referencias cargadas, más las ocho leyes contenidas en el decreto de marzo de 2025, cubren 15 instrumentos distintos: CFE y Pemex aparecen tanto como leyes individuales como dentro del decreto. LGEC, LGTAIP y ambos PODECOBI son otros cuatro instrumentos cargados fuera de esa sección. El decreto conserva cobertura parcial por las reformas a LOAPF y Fondo Mexicano del Petróleo. Las ligas a LPTE y su reglamento no acreditan publicación de la Estrategia Nacional, PLATEASE o declaratoria SNIE.

Tres convocatorias de generación reúnen 13 piezas pendientes: primera con tres modificaciones, segunda con cuatro y proyectos estratégicos con tres. También faltan el aviso de desarrollo mixto y sus lineamientos, siete convocatorias de terceros ASEA y la del Comité Consultivo del SISTRANGAS. En almacenamiento, la DACG de integración SAEE está cargada; faltan DACG de permisos y formatos SAEE. A/113/2024 se mantiene separado como antecedente. Los procesos y resultados individuales de proyectos en la sección 6 no integran estos totales.

Se corrigió RAD-046, mal clasificado por la frase «deja sin efectos»: el acuerdo de formatos de Biocombustibles de 2026 deja sin efectos al de 2009, no es él mismo el antecedente. RAD-166 conserva una nota explícita: se publicó el programa de normalización, no el texto de modificación final de la NOM. Se abrieron fuentes oficiales de almacenamiento, permisos, formatos y últimas modificaciones de las tres convocatorias para verificar esas distinciones; no se revalidó jurídicamente toda la bibliografía ni se buscaron de forma exhaustiva publicaciones posteriores al corte.

El inventario incluye filtros, familias con documentos relacionados, enlaces oficiales, vínculos a los 19 instrumentos del buscador y CSV descargable. Se verificaron en navegador los conteos y filtros (164/179, 124 pendientes, cuatro referencias del expediente de almacenamiento y cinco de la segunda convocatoria), sin errores de JavaScript. No se cargaron ni modificaron registros de Supabase. Para futuras ingestas hay que preservar numerales, calendarios, formularios y anexos, preparar un documento a la vez y mantener la relación entre original y actos modificatorios; el inventario no sustituye la implementación pendiente de relaciones en la aplicación.

## 14. Seis incorporaciones de reglamentos y almacenamiento — estado vigente

Tras la autorización de continuar e integrar el bloque propuesto, se cargaron individualmente RLBio, RLGeo, RLEPECFE, RLEPEPM, DACG-PERMISOS-GA y FORMATOS-SAEE. El catálogo confirmado es **25 instrumentos, 3,044 fragmentos y 644 entradas de estructura**. Este estado sustituye los conteos históricos anteriores. Las seis cargas suman 517 fragmentos y 150 entradas de estructura; los 19 instrumentos, 2,527 fragmentos y 494 temas anteriores permanecen exactamente iguales, incluidas sus fechas de creación.

Detalle (fragmentos / estructura): RLBio 128/29, RLGeo 112/32, RLEPECFE 93/23, RLEPEPM 90/24, DACG-PERMISOS-GA 86/38 y FORMATOS-SAEE 8/4. Los cuatro reglamentos tienen 379 artículos y 35 transitorios; las DACG conservan 71 numerales, cinco transitorios y seis formularios; el acuerdo SAEE conserva el resolutivo Único, un transitorio y tres formularios. Preámbulos, índice, firmas, instrucciones y fe de erratas se conservaron como unidades de su tipo.

Fuentes SIDOF: 5769156, 5769154, 5774837, 5775017, 5770667 y 5788270; fe de erratas de CFE 5777392. Los artículos y transitorios de los cuatro reglamentos se cotejaron además contra PDFs oficiales de Diputados. La fe de erratas de 29 de diciembre de 2025 se aplicó al tercer párrafo del artículo 68 (Comisión Federal de Electricidad en lugar de Petróleos Mexicanos) y quedó como complemento dentro del mismo instrumento. No se registró como reforma ni como un séptimo instrumento.

Las dos publicaciones de almacenamiento conservaron 130 tablas, 2,073 celdas y 115 casillas. Se comparó cada carácter no blanco y la estructura de cada celda, incluidas las combinadas, contra las fuentes oficiales. Las imágenes fueron descargadas de la ruta de producción SIDOF y verificadas como casillas vacías antes de representarlas con □. Los nueve formularios completos se conservaron como nueve fragmentos; su numeración interna no produjo cortes de artículos.

Evidencia y scripts: `revision-acervo/incorporacion-reglamentos-almacenamiento-2026-09-17/`. Informe `INCORPORACION.html`/`.md`, cotejo exacto `VERIFICACION.json`, tablas `COTEJO-TABLAS.json`, navegador `VERIFICACION-NAVEGADOR.json`, respaldos `antes-verificado/` y `despues-verificado/`, fuentes con SHA-256 y payload/SQL por instrumento. `preparar_reglamentos.py` y `preparar_almacenamiento.py` son perfiles cerrados para estas fuentes; `generar_sql.py` prepara SQL pero no lo ejecuta. Las seis transacciones ya se aplicaron; no volver a ejecutarlas. El generador del informe añade resúmenes editoriales separados del texto normativo a las fichas locales revisadas.

La salida automática de ley-chunker se conserva sin corregir como evidencia: en Biocombustibles y Geotermia omitía los transitorios y añadía un artículo falso; en CFE convertía referencias de la fe de erratas en nuevos artículos. El cotejo de las cargas revisadas confirmó cobertura completa y sin solapamientos. La comprobación posterior encontró cero textos/FTS vacíos y cero etiquetas/órdenes duplicados por instrumento. Se probaron seis búsquedas reales; los nueve formularios conservaron sus tablas, celdas y casillas en el modal, sin desbordamiento horizontal al tamaño verificado. El artículo 68 de CFE muestra la denominación corregida.

Se actualizaron el catálogo instantáneo y todos los formatos del inventario. `catalogo-antes-bloque-6.json` conserva el estado de 19 instrumentos y `catalogo-actual.json` el de 25. Las 164 referencias sin repeticiones quedan en **117 pendientes, 16 cargadas, una parcial, 13 antecedentes, cuatro filas de proyectos, diez portales y tres publicaciones no localizadas**. La fe de erratas cuenta como una referencia bibliográfica cubierta dentro de RLEPECFE. Hay 21 instrumentos del acervo representados en el radar y cuatro fuera de la sección 12. El corte bibliográfico sigue siendo 14 de septiembre de 2026, v4.17.

Próximo bloque propuesto: las 13 piezas de las tres convocatorias de generación (tres originales y diez modificaciones), conservando calendarios y anexos y cotejando cada publicación. El expediente de almacenamiento tiene ahora sus tres instrumentos vigentes del inventario cargados; A/113/2024 permanece clasificado aparte como antecedente. No se modificó el parser genérico, no se desplegó el frontend ni se amplió automáticamente la tabla pendiente de relaciones o los temas transversales editoriales. Las modificaciones de este bloque son datos de Supabase, scripts y evidencia local.

## 15. Convocatorias y sus modificaciones incorporadas — cierre del 18 de septiembre de 2026

El usuario autorizó continuar con las trece piezas propuestas. Se cargaron en transacciones individuales durante la noche del 17 de septiembre las tres convocatorias y sus diez modificaciones: CONV-GEN-1 y M1/M2/M3, CONV-GEN-2 y M1/M2/M3/M4, CONV-ESTRATEGICOS y M1/M2/M3. El catálogo confirmado es **38 instrumentos, 3,237 fragmentos y 831 entradas de estructura**. Estos conteos sustituyen los anteriores. Los 25 instrumentos, 3,044 fragmentos y 644 temas previos permanecen exactamente iguales, incluidas sus fechas de creación.

Las altas suman **193 fragmentos y 187 entradas de estructura**: 180 fragmentos derivados de las publicaciones oficiales y trece notas editoriales claramente identificadas. Cada registro conserva el texto de su publicación y la fecha DOF en el título; la nota enlaza el original y todas las modificaciones de su familia. No se creó una consolidación ni se infirió que los plazos originales continúen abiertos. `fecha_ultima_reforma` y `vigente` se dejaron en null para estas versiones; los originales usan tipo `otros` (categoría compatible con el gestor) y los acuerdos modificatorios, `acuerdo`.

Fuentes SIDOF: primera 5770299/5770917/5772392/5774850; segunda 5787117/5788509/5789883/5790938/5798361; estratégicos 5787666/5788508/5793261/5797703. Se preservaron fuentes completas y SHA-256. Se descargaron también seis ediciones PDF para cotejo visual (los tres originales y la última modificación de cada familia). Las 35 tablas HTML conservan sus 1,320 celdas, con celdas combinadas; se preservaron nueve casillas y cuatro recursos gráficos oficiales (tres tablas como imagen y una gráfica técnica). Se cotejó de forma independiente todo el texto no blanco, cada celda y cada imagen contra las fuentes. Las casillas se inspeccionaron antes de representarlas como □; los gráficos usan sus URLs de producción SIDOF verificadas y tienen copia local.

Hallazgo específico: la convocatoria original de proyectos estratégicos tiene dos bloques 17.4, confirmados en las páginas 33 y 35 del PDF oficial. Ambos permanecen con etiquetas «primer bloque» y «segundo bloque», sin renumerar la fuente. En la segunda modificación, los textos citados se separan bajo el resolutivo PRIMERO, manteniendo su pertenencia al acuerdo. Los formularios incluidos conservan sus campos; las tres remisiones al formato de manifestación de interés disponible en VUPE se identifican como referencias, no como formularios descargados del portal.

Evidencia: `revision-acervo/incorporacion-convocatorias-2026-09-17/`. Informe `INCORPORACION.html`/`.md`, respaldo `antes-verificado/` y `despues-verificado/`, cotejo `VERIFICACION.json`, fuentes `COTEJO-FUENTES.json`, navegador `VERIFICACION-NAVEGADOR.json`, transacciones `TRANSACCIONES.json`, archivos fuente y perfiles de preparación. Las trece altas ya están aplicadas; no volver a ejecutar los SQL de carga. El cotejo posterior exacto encontró cero textos/FTS vacíos y cero identificadores/órdenes duplicados por instrumento.

Se probaron trece búsquedas reales, los 31 fragmentos con tablas o gráficos y un enlace que abre otra versión del expediente. Coinciden todas las tablas, celdas, imágenes y casillas; los gráficos cargan y no hubo desbordamiento horizontal al tamaño de navegador verificado. En `src/scripts/ui.js` solo se cambiaron tres textos para describir el catálogo como acervo de instrumentos y versiones, en lugar de afirmar que todo es vigente. Lint y build correctos. No se desplegó el frontend alojado ni cambió el parser genérico. La tabla `ley_relaciones` y los temas transversales editoriales siguen pendientes; los enlaces de estas familias residen en notas editoriales separadas de los textos normativos.

El inventario mantiene su corte bibliográfico 14 de septiembre de 2026, v4.17. Sus 164 referencias sin repeticiones quedan en **104 pendientes, 29 cargadas, una parcial, 13 antecedentes, cuatro filas de proyectos, diez portales y tres publicaciones no localizadas**. Hay 34 instrumentos del catálogo representados en la sección 12 y cuatro fuera de ella. El respaldo local del catálogo de 25 instrumentos se conserva como `catalogo-antes-convocatorias.json`; `catalogo-actual.json` contiene los 38. Los estados, familias y salidas HTML/Markdown/JSON/CSV se regeneraron. Siguen pendientes otras familias como autoconsumo, cogeneración, migración de permisos, desarrollo mixto, planeación e hidrocarburos/ASEA.
