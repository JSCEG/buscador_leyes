# LCNE: preparación individual y validación del gestor

Estado actualizado al 17 de septiembre de 2026: **LCNE cargada y cotejada en Supabase**, como parte de los siete instrumentos autorizados. Se incorporaron 48 filas: 28 artículos, 13 transitorios de la ley, dos del decreto y cinco filas de preámbulo/documentos complementarios, incluidos los documentos de la SCJN. El PDF recién descargado coincide por SHA-256 con el revisado aquí.

La carga aplicada, respaldo y verificación están en [incorporación de siete instrumentos](../incorporacion-7-2026-09-17/INCORPORACION.html). El resto de este documento conserva la evidencia de la etapa previa de preparación y pruebas del gestor, que no había escrito en Supabase. La carga posterior utilizó una transacción comprobada por instrumento.

## Revisar esta ley

Abrir `LCNE_vista_previa.html`: presenta cada fragmento junto a la página del PDF, con las líneas de origen resaltadas. Permite buscar, cambiar entre ley/decreto/SCJN y guardar observaciones locales. Las marcas de revisión pertenecen al navegador y pueden descargarse; no modifican el texto ni cargan datos.

La propuesta contiene **28 artículos y 13 transitorios de la ley**, con **5 títulos y 8 capítulos**. Se conservan aparte los dos transitorios generales del decreto, sus referencias y firmas, y los dos documentos de la SCJN. La nota relativa al artículo 22, fracción III, permanece en el fragmento.

Fuente: [PDF de la Cámara de Diputados](https://www.diputados.gob.mx/LeyesBiblio/pdf/LCNE.pdf). SHA-256: `7c13fd20564f1e7230268a0943cc226368b24c44886d6738c479f4c42cbe77de`.

## Archivos para la revisión

| Archivo | Contenido |
|---|---|
| `LCNE_chunks_revisados.json` | 41 fragmentos, jerarquía y documentos complementarios separados |
| `LCNE_revision_completa.md` | Texto completo de los fragmentos para revisión |
| `LCNE_trazabilidad.json` | Página y coordenadas de cada línea extraída |
| `LCNE_control_calidad.json` | Conteos, secuencias, cobertura y cotejo textual |
| `LCNE_preparacion_supabase.json` | Borrador de filas; no es un script de carga |
| `preparar_lcne.py` | Preparación reproducible con PyMuPDF y verificación del hash |
| `extraccion_automatica_sin_corregir.json` | Salida original conservada para auditar los errores |

La extracción inicial confundía una referencia constitucional con un artículo 89, mezclaba los transitorios con el artículo 28 y omitía tres capítulos únicos. La preparación revisada corrige esos límites. Se asignaron las 671 líneas del cuerpo a fragmentos, encabezados o complementos, sin huecos ni doble asignación. El cotejo ignora espacios; no equivale por sí solo a una revisión visual de todas las páginas. Se inspeccionaron visualmente las páginas 1, 11, 13, 15, 17 y 19.

## Cambios en el gestor existente

`src/scripts/admin-ingest.js` utiliza ahora `src/lib/regulatory-parser.js`. No se cambió el parser de consola de `legal-ingest-pipeline.js`.

- Reconstrucción de líneas por coordenadas PDF.js, sin insertar espacios dentro de palabras o números divididos en varios objetos.
- Selección de estructura automática o por artículos, ordinales, numerales y decimales.
- Separación de bloques de transitorios, anexos y complementos; conservación de listas internas y referencias jurídicas partidas entre líneas.
- Índice documental conservado sin crear capítulos duplicados; capítulos únicos y encabezados de varias líneas.
- Todos los fragmentos visibles, con inclusión individual, edición del identificador y tipo, división y unión.
- Bloqueo por duplicados, fragmentos vacíos y páginas sin texto; revisión explícita antes de guardar. Cualquier edición invalida esa revisión.
- Anexos y complementos incluidos en el índice del lector si se decide guardarlos.

El gestor descompone este PDF en 49 unidades porque también separa el preámbulo y el artículo de expedición. Para cargar únicamente la LCNE se seleccionan sus 28 artículos y los 13 transitorios del bloque 1. Los dos preámbulos, los transitorios del bloque 2 y los cuatro complementos quedan fuera de esa selección. Esta selección de 41 se comprobó en la interfaz, sin ejecutar el guardado.

## Evidencia de validación

- `npm test -- --run`: **24 pruebas aprobadas**, incluidas 13 del nuevo parser.
- El PDF real de LCNE pasó por PDF.js y el parser del gestor: los 41 contenidos coinciden con los fragmentos revisados al ignorar espacios y separar el encabezado de su cuerpo.
- PDF real del decreto PODECOBI: se reconocen los 13 artículos ordinales y los 3 transitorios.
- PDF real de SAEE de 16 de abril de 2026: pruebas de 9 capítulos, 9 transitorios, índice separado, referencia al numeral 3.12 dentro de 3.13 y conservación del quinto transitorio con sus listas. Esto no certifica todas sus tablas ni sustituye su revisión individual.
- Navegador: se comprobó selección, edición, división/unión, bloqueo por identificador duplicado e invalidación de la revisión tras editar. No se inició sesión como administrador ni se intentó escribir en la base.
- `npm run lint`: aprobado. `npx vite build`: aprobado. Permanecen avisos del tooling sobre CJS, Browserslist y tamaño del bundle. Se usó Vite directamente para no regenerar el catálogo JSON local.
- Graphify actualizado: 1,752 nodos, 2,279 relaciones. El CLI advierte una diferencia de versión entre el paquete y su skill, pero la actualización terminó correctamente.

## Límites que deben revisarse instrumento por instrumento

El parser no hace OCR ni garantiza reconstrucción de tablas, fórmulas, columnas paralelas o cualquier numeración no probada. Los textos ambiguos se conservan para revisión. Los decretos que reúnen varias leyes requieren delimitar cada instrumento antes de cargarlo. Los resultados de otros documentos no deben darse por aprobados solamente por sus conteos.

La escritura existente en Supabase sigue usando varios lotes, sin una transacción integral. No se verificó una carga real ni se modificaron permisos o tablas. Antes de la primera carga debe comprobarse que el guardado y cualquier eventual fallo parcial se manejen correctamente. La revisión aquí acredita extracción y preparación local.
