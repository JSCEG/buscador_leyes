# Lector y cotejo con el documento original

Entrega del 19 de septiembre de 2026. El lector comparte preferencias entre el listado de fragmentos de un instrumento y el diálogo de artículo. La sincronización con la fuente comienza con la LCNE; los demás instrumentos conservan el acceso a su documento oficial cuando está registrado.

## Funcionamiento

Al abrir un artículo están disponibles **Texto**, **PDF original** y, desde 1000 píxeles CSS de ancho, **Texto y PDF**. En móvil se alternan texto y original; hasta 640 píxeles el diálogo ocupa la altura disponible de la pantalla. Al estrechar una vista dividida, el lector vuelve a Texto.

**Ajustes de lectura** permite cambiar el tamaño real entre **14 y 28 px**, en pasos de 2; elegir interlineado **1,6 / 1,8 / 2**; y usar fondo **Automático, Blanco, Sepia u Oscuro**. El valor inicial es **18 px, interlineado 1,8 y fondo Automático**. El texto de párrafos y tablas hereda la escala. Las tablas amplias pueden desplazarse dentro del área de lectura.

Las preferencias se guardan en `localStorage` bajo `sener-reader-preferences-v1`. Son propias del navegador y no se suben a Supabase ni sustituyen el tema global de la aplicación. En navegación privada, almacenamiento bloqueado o cuota agotada, los controles siguen funcionando durante la sesión; no se garantiza su conservación después de cerrar o recargar el navegador.

El texto de lectura, las vistas previas y las explicaciones usan justificación en todos los anchos. La última línea conserva su longitud natural y la separación silábica usa el idioma español del documento. El PDF conserva la composición tipográfica de su fuente.

El diálogo identifica su título, mantiene el recorrido de teclado dentro de sus controles y devuelve el foco al cerrar. `Escape` cierra primero los ajustes abiertos y después el lector. Los accesos desde el explorador conservan la ruta y selección para regresar a la misma ficha. No se altera el contrato de enlaces compartidos `#art-UUID`.

## PDF sincronizado: cobertura inicial real

La **Ley de la Comisión Nacional de Energía (LCNE)** tiene **48 fragmentos vinculados a 20 páginas** de una edición oficial cotejada. El lector consulta ahora el PDF de Diputados por internet y lo verifica contra esa edición:

| Unidad | Cantidad |
|---|---:|
| Artículos ordinarios | 28 |
| Transitorios de la ley | 13 |
| Transitorios del decreto | 2 |
| Preámbulo | 1 |
| Documentos complementarios | 4 |

Son **645 líneas con coordenadas** atribuibles a los fragmentos. Otras **26 líneas de títulos y capítulos** permanecen visibles en la página, sin atribuirlas a un artículo. La nota sobre invalidez del artículo 22 y los documentos de la SCJN conservados en la revisión no se eliminan ni se presentan como artículos ordinarios.

El panel renderiza el **PDF remoto en un canvas**, con los resaltados como una capa separada. Se posiciona cerca de las líneas vinculadas al fragmento. Si éste continúa en varias páginas, las flechas y el selector recorren únicamente sus páginas. El zoom va de **75% a 250%**; el botón de porcentaje ajusta al ancho. Alternar Texto y PDF conserva el panel mientras se consulta el mismo fragmento. Abrir otro fragmento resuelve su propia correspondencia.

**Abrir PDF completo** abre la liga oficial de Diputados con `#page=N`. El comportamiento del visor externo respecto a ese fragmento URL depende del navegador. El texto accesible permanece en la pestaña Texto; el canvas no lo sustituye.

Ejemplos para comprobar el recorrido:

- Artículo 2, páginas 1 y 2: `#art-104581e9-3698-5eb4-b585-89ffe7589535`.
- Artículo 22 y su nota preservada: `#art-665cde60-c9ab-57f2-9637-d0f51a2ab02d`.

## Integridad y edición posterior

Cada asociación usa el **UUID real del fragmento** y un **SHA-256 del contenido exacto UTF-8**. Antes de mostrar ubicación y resaltados, `getReaderSource()` compara el texto actual recibido del acervo con la versión cotejada. No se busca por nombre, número de artículo ni similitud de texto.

Si un administrador edita un artículo —incluso cambiando un solo carácter o un espacio—, su contenido deja de coincidir y el panel informa que necesita un nuevo cotejo. La edición no actualiza automáticamente las páginas ni las coordenadas. Para restablecer precisión debe revisarse el texto contra la fuente correspondiente y regenerarse su manifiesto con evidencia.

La edición se identifica por SHA-256. Una Pages Function obtiene únicamente la fuente permitida en el manifiesto, con límite de 8 MiB y 20 segundos, rechaza redirecciones y comprueba tipo MIME y hash antes de responder. No admite URLs proporcionadas por el visitante. El cliente vuelve a verificar la huella, el total de páginas y sus dimensiones. Si cambian los bytes oficiales, no muestra resaltados y ofrece la fuente actual para consulta. La función no acredita por sí sola vigencia jurídica.

El PDF y las 20 imágenes se retiraron del directorio público actual; no se reescribió el historial de Git. La evidencia local de cotejo sigue fuera del build. El manifiesto conserva sólo hash, dimensiones y mapa de artículos. No se usa R2, KV ni caché persistente: respuesta `no-store`, exclusión del Service Worker y una sola copia temporal en memoria del navegador, reutilizable por dos minutos. Al cerrar el lector se destruye su documento PDF.js. Esta modalidad necesita conexión y disponibilidad de Diputados.

La ruta `/api/reader/:sourceId` usa el mismo handler en Vite y Cloudflare. `public/_routes.json` limita las invocaciones de Functions a esa ruta. El despliegue está pensado para Cloudflare Pages; un hosting puramente estático no ejecuta este endpoint. Referencia: [rutas de Pages Functions](https://developers.cloudflare.com/pages/functions/routing/).

Workers requiere `redirect: 'manual'`; las respuestas 3xx se rechazan explícitamente mediante `!response.ok`, sin seguir destinos nuevos. La opción estándar `redirect: 'error'` falló sólo en ese entorno y se corrigió tras revisar sus registros. La vista previa de Cloudflare confirmó HTTP 200, 508.412 bytes y el SHA-256 cotejado. Los errores del origen registran fuente, estado/tipo o excepción para permitir diagnóstico; no se registran cabeceras de visitantes ni contenido del PDF desde el handler.

Comprobación de la modalidad remota: suite completa de 161 pruebas, más la nueva regresión de reintento (16 pruebas del módulo pasan tras ese ajuste), lint, build y compilación de Pages Functions correctos. En la aplicación local se comprobó el artículo 7 en sus páginas 2, 3 y 4, el cambio al artículo 8 y su original en móvil a 390 px sin desbordamiento. Esta evidencia sustituye la prueba aislada del puerto 5318 como demostración de integración; no amplía cobertura a otros instrumentos.

## Comportamiento cuando falta la fuente sincronizada

- Sin correspondencia revisada: indica que el fragmento aún no tiene páginas sincronizadas y ofrece el enlace oficial seguro, si existe.
- Texto distinto: desactiva páginas y resaltados y explica que cambió desde el cotejo.
- Imposibilidad de comprobar la huella: conserva el acceso a la fuente, sin afirmar ubicación precisa.
- Fallo al cargar el manifiesto: ofrece reintento y fuente oficial. La petición tiene un límite de diez segundos.
- Fallo del PDF remoto: mantiene la fuente oficial y permite volver a descargarlo. Una edición distinta exige revisar el mapa antes de recuperar el resaltado.
- Sin URL oficial disponible: lo informa, sin fabricar una liga.

El manifiesto se carga al solicitar el original. El PDF no se descarga para abrir solamente Texto. La cobertura remota agrega aproximadamente **168 KB de metadatos** al build y consulta un PDF oficial de 508.412 bytes sólo al abrir el original. No añade PDF ni imágenes al build.

## Archivos y reproducción

- [Preferencias](../../src/lib/reader-preferences.js) y [controles](../../src/scripts/reader-controls.js).
- [Resolución y comprobación de fuente](../../src/lib/reader-source.js).
- [Panel de documento original](../../src/scripts/reader-source-view.js).
- [Manifiesto publicado](../../public/reader-sources/manifest.v1.json).
- [Procedencia, cobertura y generador de LCNE](../../revision-acervo/lector-fuentes-2026-09-19/README.md).

La preparación LCNE cotejó por SELECT los **48 UUID, ley, orden, identificador y huella de contenido** el **19 de septiembre de 2026, 07:41:55 UTC**. Se conserva la respuesta en `LCNE-verificacion-bd.json`; no hubo escrituras de esta preparación en Supabase.

`generar_lcne.py` necesita Python con `pypdf` y reutiliza la copia PDF, las imágenes y la asignación revisada ya existentes. Verifica hashes e identidades antes de producir los assets. Reejecutarlo utiliza la evidencia remota guardada; **no realiza un nuevo cotejo contra la base**. La revisión visual previa documenta páginas 1, 11, 13, 15, 17 y 19, sin afirmar una nueva inspección manual de cada página.

Las pruebas del lector están en `reader-preferences.test.js`, `reader-controls.test.js`, `reader-source.test.js`, `reader-source-view.test.js` y `ui-reader.test.js`. Cubren persistencia, almacenamiento bloqueado, correspondencias, integridad de assets, texto modificado, errores de carga, montaje diferido y navegación del diálogo. La integración completa se comprueba además con `npm test -- --run`, `npm run lint` y `npm run build`.

## Ampliación pendiente

### Distinción visual de documentos relacionados

Los documentos complementarios se agrupan bajo **Documentos relacionados** en la lista y en ambas vistas del índice. El lector muestra una franja persistente al alternar Texto y PDF, con etiquetas para sentencias, resolutivos de la SCJN y fe de erratas. La clasificación utiliza el tipo existente y el identificador; nunca una mención de sentencia dentro del texto de un artículo. Firmas, promulgación, índices, referencias internas del decreto y notas editoriales conservan su lugar en el registro principal: compartir el tipo de ingesta `complementario` no los convierte en documentos independientes. Los anexos también conservan su lugar en el instrumento.

La LCNE conserva sus 48 fragmentos: 46 en la lista principal y dos en el bloque de documentos de la SCJN. No hay cambios en contenido, identificadores, mapas PDF ni escrituras en Supabase. `ui-related-documents.test.js` comprueba conservación de los 48 registros, filtrado, índice, exclusión de firmas/notas y retirada del aviso al volver a un artículo ordinario.

La prueba local de PDF remoto también reutiliza las etiquetas. Sigue siendo un prototipo independiente; esta entrega visual no cambia el origen de los PDFs del lector publicado.

### Navegación, portada y tema

La navegación entre artículos y fragmentos está sobre los controles Texto/PDF, con los nombres completos de los destinos en etiquetas accesibles y botones que permanecen visibles al desplazar el contenido. El contador representa fragmentos, incluyendo preámbulo y transitorios. Los enlaces compartidos cargan los vecinos del instrumento; la paginación de tarjetas no limita la navegación del lector. El modo de lectura se conserva al avanzar.

El visor distingue las páginas del fragmento actual. Si sólo ocupa una, muestra **Página única**, sin selector ni flechas inutilizables. Para varias páginas indica la posición dentro del fragmento y la página real del PDF.

La ruta raíz abre el acervo; **Buscar** lleva a `#buscar` y explica que consulta el texto de todos los instrumentos. El footer institucional usa fondo claro y logotipos a color de día; fondo oscuro y logotipos blancos de noche. Validación: 138 pruebas, lint y build; revisión local del cambio de tema y de la navegación móvil.

### Cronología para todos los instrumentos

La ficha de cualquier ley, reglamento, acuerdo, DACG, convocatoria u otro instrumento incluye una **Línea del tiempo**. Presenta el documento abierto y sus vínculos por fecha, con nombre completo, tipo, fuente y acceso al registro o fragmento correspondiente. En escritorio se recorre horizontalmente; en móvil se apila sobre un eje vertical. El documento abierto se identifica con **En consulta**.

El modelo reutilizable está en `src/lib/instrument-timeline.js`; la vista y sus estilos son independientes de `ui.js`. Se alimenta de metadatos y enlaces explícitos de las notas editoriales del instrumento, además de sus complementos clasificados. No deduce relaciones de menciones en artículos ordinarios. También acepta las relaciones estructuradas que el arranque ya intenta consultar. El SELECT de comprobación del 19/09/2026 confirmó que `ley_relaciones` no existe todavía en este proyecto Supabase; esta entrega no crea tablas ni modifica datos.

Los enlaces editoriales sólo se resuelven si el registro está cargado en el catálogo. Las fechas de instrumentos vienen de `fecha_publicacion`, no del texto de los enlaces. Los complementos usan únicamente encabezados explícitos de publicación/notificación o un identificador de fe de erratas con fecha DOF. Las fechas ambiguas permanecen como **Fecha no identificada** y se ordenan después de las fechas disponibles. Las fuentes de complementos se etiquetan **Fuente del instrumento**, pues pueden llevar a una edición compilada, no a su publicación individual. Firmas, índices y notas editoriales no son hitos separados.

El acervo revisado de 41 instrumentos ofrece cronologías con varios documentos en 18 fichas: 13 registros de tres convocatorias, tres acuerdos de autoconsumo, la LCNE y el reglamento de la empresa pública CFE. Por ejemplo, proyectos estratégicos muestra el original del 15/05/2026 y sus modificaciones del 26/05/2026, 10/07/2026 y 02/09/2026. Autoconsumo muestra documentos relacionados sin llamarlos modificaciones. En la LCNE se distingue la notificación de resolutivos del 04/11/2025 de la publicación de la sentencia del 26/12/2025. La fe de erratas del reglamento se fecha por su identificador DOF 29/12/2025, no por el decreto del 02/12/2025 citado en su texto.

Los demás instrumentos muestran su publicación y aclaran que aún no hay otros documentos vinculados en el acervo; eso no equivale a afirmar que no existen modificaciones. La cronología no produce un texto consolidado ni determina vigencia. Las pruebas cubren resolución desde distintas modificaciones, tipos de instrumentos, ciclos y duplicados, vínculos ausentes, fechas inválidas, contenido no confiable y apertura de complementos desde la ficha.

Validación de esta entrega: 152 pruebas, lint y build correctos; revisión en navegador de la cronología de proyectos estratégicos, navegación desde una modificación al original, ancho móvil de 390 px sin desbordamiento, modo oscuro de LCNE y apertura de su sentencia desde la cronología. El grafo de código se actualizó con `graphify update .`.

**Los otros 40 instrumentos del acervo aún no tienen un mapa sincronizado publicado en esta entrega.** Incorporarlos requiere fijar la versión de fuente, conservar su hash, revisar asignaciones a páginas/líneas, cotejar UUID y contenido actuales y comprobar casos especiales: numerales repetidos, transitorios, acuerdos modificatorios, tablas y anexos.

No debe trasladarse una numeración o geometría de LCNE a otro documento. PDF rotados, páginas con recortes o dimensiones distintas, documentos escaneados y publicaciones sólo HTML necesitan preparación específica. El radar puede detectar una publicación, pero el hallazgo no habilita por sí mismo una correspondencia revisada.
