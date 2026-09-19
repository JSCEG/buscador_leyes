# Lector y cotejo con el documento original

Entrega del 19 de septiembre de 2026. El lector comparte preferencias entre el listado de fragmentos de un instrumento y el diálogo de artículo. La sincronización con la fuente comienza con la LCNE; los demás instrumentos conservan el acceso a su documento oficial cuando está registrado.

## Funcionamiento

Al abrir un artículo están disponibles **Texto**, **PDF original** y, desde 1000 píxeles CSS de ancho, **Texto y PDF**. En móvil se alternan texto y original; hasta 640 píxeles el diálogo ocupa la altura disponible de la pantalla. Al estrechar una vista dividida, el lector vuelve a Texto.

**Ajustes de lectura** permite cambiar el tamaño real entre **14 y 28 px**, en pasos de 2; elegir interlineado **1,6 / 1,8 / 2**; y usar fondo **Automático, Blanco, Sepia u Oscuro**. El valor inicial es **18 px, interlineado 1,8 y fondo Automático**. El texto de párrafos y tablas hereda la escala. Las tablas amplias pueden desplazarse dentro del área de lectura.

Las preferencias se guardan en `localStorage` bajo `sener-reader-preferences-v1`. Son propias del navegador y no se suben a Supabase ni sustituyen el tema global de la aplicación. En navegación privada, almacenamiento bloqueado o cuota agotada, los controles siguen funcionando durante la sesión; no se garantiza su conservación después de cerrar o recargar el navegador.

El diálogo identifica su título, mantiene el recorrido de teclado dentro de sus controles y devuelve el foco al cerrar. `Escape` cierra primero los ajustes abiertos y después el lector. Los accesos desde el explorador conservan la ruta y selección para regresar a la misma ficha. No se altera el contrato de enlaces compartidos `#art-UUID`.

## PDF sincronizado: cobertura inicial real

La **Ley de la Comisión Nacional de Energía (LCNE)** tiene **48 fragmentos vinculados a 20 páginas** de la copia oficial preservada:

| Unidad | Cantidad |
|---|---:|
| Artículos ordinarios | 28 |
| Transitorios de la ley | 13 |
| Transitorios del decreto | 2 |
| Preámbulo | 1 |
| Documentos complementarios | 4 |

Son **645 líneas con coordenadas** atribuibles a los fragmentos. Otras **26 líneas de títulos y capítulos** permanecen visibles en la página, sin atribuirlas a un artículo. La nota sobre invalidez del artículo 22 y los documentos de la SCJN conservados en la revisión no se eliminan ni se presentan como artículos ordinarios.

El panel muestra una **imagen de la página del PDF**, con los resaltados como una capa separada. Se posiciona cerca de las líneas vinculadas al fragmento. Si éste continúa en varias páginas, las flechas y el selector recorren únicamente sus páginas. El zoom va de **75% a 250%**; el botón de porcentaje ajusta al ancho. Alternar Texto y PDF conserva el panel mientras se consulta el mismo fragmento. Abrir otro fragmento resuelve su propia correspondencia.

**Abrir PDF completo** abre la copia preservada con `#page=N`. El comportamiento del visor externo respecto a ese fragmento URL depende del navegador. El texto accesible permanece en la pestaña Texto; la imagen no lo sustituye.

Ejemplos para comprobar el recorrido:

- Artículo 2, páginas 1 y 2: `#art-104581e9-3698-5eb4-b585-89ffe7589535`.
- Artículo 22 y su nota preservada: `#art-665cde60-c9ab-57f2-9637-d0f51a2ab02d`.

## Integridad y edición posterior

Cada asociación usa el **UUID real del fragmento** y un **SHA-256 del contenido exacto UTF-8**. Antes de mostrar ubicación y resaltados, `getReaderSource()` compara el texto actual recibido del acervo con la versión cotejada. No se busca por nombre, número de artículo ni similitud de texto.

Si un administrador edita un artículo —incluso cambiando un solo carácter o un espacio—, su contenido deja de coincidir y el panel informa que necesita un nuevo cotejo. La edición no actualiza automáticamente las páginas ni las coordenadas. Para restablecer precisión debe revisarse el texto contra la fuente correspondiente y regenerarse su manifiesto con evidencia.

La copia PDF se identifica por SHA-256 y los assets se publican en una ruta que incorpora su huella. Las dimensiones se guardan **por página**, con validación de los límites de todos los rectángulos. El documento preservado es una edición concreta: la función no acredita por sí sola vigencia jurídica ni que el enlace oficial siga ofreciendo idénticos bytes.

## Comportamiento cuando falta la fuente sincronizada

- Sin correspondencia revisada: indica que el fragmento aún no tiene páginas sincronizadas y ofrece el enlace oficial seguro, si existe.
- Texto distinto: desactiva páginas y resaltados y explica que cambió desde el cotejo.
- Imposibilidad de comprobar la huella: conserva el acceso a la fuente, sin afirmar ubicación precisa.
- Fallo al cargar el manifiesto: ofrece reintento y fuente oficial. La petición tiene un límite de diez segundos.
- Fallo de imagen: mantiene el enlace al PDF completo y permite reintentar la imagen.
- Sin URL oficial disponible: lo informa, sin fabricar una liga.

El manifiesto se carga al solicitar el original. El PDF y las imágenes no se descargan para abrir solamente Texto. La primera cobertura agrega aproximadamente **173 KB de metadatos** y **4,07 MB de assets**, de los cuales el PDF ocupa 508.412 bytes.

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

**Los otros 40 instrumentos del acervo aún no tienen un mapa sincronizado publicado en esta entrega.** Incorporarlos requiere fijar la versión de fuente, conservar su hash, revisar asignaciones a páginas/líneas, cotejar UUID y contenido actuales y comprobar casos especiales: numerales repetidos, transitorios, acuerdos modificatorios, tablas y anexos.

No debe trasladarse una numeración o geometría de LCNE a otro documento. PDF rotados, páginas con recortes o dimensiones distintas, documentos escaneados y publicaciones sólo HTML necesitan preparación específica. El radar puede detectar una publicación, pero el hallazgo no habilita por sí mismo una correspondencia revisada.
