# Procedencia del lector: LCNE

Primera cobertura de navegación sincronizada con el documento original. No se modificó Supabase ni se atribuyeron páginas por similitud de títulos.

## Cobertura comprobada

- Un instrumento: **Ley de la Comisión Nacional de Energía**, UUID `fddf3bf4-fbca-5b34-9631-e195b6e97229`.
- **48 fragmentos:** 28 artículos ordinarios, 13 transitorios de la ley, 2 transitorios del decreto, 1 preámbulo y 4 documentos complementarios. Los complementos permanecen diferenciados de los artículos de la ley.
- **20 páginas** del PDF de la Cámara de Diputados preservado en la revisión existente.
- **645 líneas con resaltado** atribuidas a esos fragmentos. Otras **26 líneas** corresponden a títulos y capítulos de la estructura; permanecen visibles en el original y no se atribuyen artificialmente a un artículo.
- Cotejo de los 48 UUID, ley, orden, identificador y huella del contenido contra un **SELECT de Supabase del 19 de septiembre de 2026, 07:41:55 UTC**. Evidencia: `LCNE-verificacion-bd.json`.
- Fuente oficial: https://www.diputados.gob.mx/LeyesBiblio/pdf/LCNE.pdf
- SHA-256 del PDF local: `7c13fd20564f1e7230268a0943cc226368b24c44886d6738c479f4c42cbe77de`.

Las coordenadas provienen de `revision-acervo/incorporacion-7-2026-09-17/fuentes/LCNE.lineas.json`, las asignaciones de `LCNE-revisado.json` y los UUID/contenidos de `LCNE-carga.json`. El generador exige igualdad exacta de texto entre los dos archivos, coteja el hash de la copia oficial y verifica los registros contra la instantánea remota.

El PDF contiene la nota sobre invalidez y documentos de la SCJN que ya se preservaron en la revisión. Esta función reproduce la fuente fijada por hash; no certifica por sí misma vigencia jurídica actual ni sustituye una revisión del documento.

## Assets publicados

`public/reader-sources/manifest.v1.json` contiene esquema/revisión, fuentes, dimensiones por página y el mapa UUID → páginas/rectángulos. Cada artículo conserva SHA-256 del texto exacto UTF-8. No duplica los textos completos del acervo.

`public/reader-sources/lcne-7c13fd20564f/` contiene el PDF original de 508.412 bytes y 20 PNG ya generados desde ese documento por la revisión previa. Total de assets: **4.069.824 bytes**; manifiesto: aproximadamente **173 KB**. No se cargan PDF ni imágenes durante la carga del manifiesto.

Los PNG son representaciones del PDF, con resaltados dibujados por separado. El enlace al PDF preservado usa `#page=N`. Cada página conserva dimensiones propias, tamaño de imagen y SHA-256. El generador verifica relación de aspecto, ausencia de rotación/recorte y límites de cada rectángulo. La revisión visual previa documentó páginas 1, 11, 13, 15, 17 y 19; no se afirma una nueva revisión visual manual de las 20 páginas.

## Contrato de consumo

```js
import { getReaderSource } from './reader-source.js';

const result = await getReaderSource(article.id, {
  articleText: article.texto,
  originalUrl: article.url_original,
  pageIndex: 0,
});
```

- `status: 'mapped'` y `contentVerified: true` permiten mostrar la página y `highlights` expresados como porcentajes `x/y/width/height`.
- `pages` contiene sólo las páginas del fragmento. `page` es la seleccionada; `pdfUrl` ya incluye `#page=N`; `source.pdfUrl` apunta al archivo preservado completo.
- `status: 'unmapped'` significa que no debe presentarse ubicación precisa. Si existe un enlace oficial seguro se devuelve `originalUrl`, sin páginas ni resaltados.
- Una edición posterior del contenido, incluso de la misma longitud, produce `content-mismatch`. La comparación es exacta, sin normalizar espacios ni puntuación. Falta de texto, de Web Crypto o fallo de red también producen un fallback explícito.
- `resolveReaderSource(manifest, id, options)` es la parte pura, sin comprobar texto; su resultado lleva `contentVerified: false`. La vista pública debe usar `getReaderSource`.
- `loadReaderSources()` guarda únicamente el manifiesto en memoria y permite reintentar después de errores. Su petición tiene límite de diez segundos.

## Reproducibilidad y límites

Con Python y `pypdf`, ejecutar `generar_lcne.py` desde cualquier directorio. Reutiliza exclusivamente archivos locales y la evidencia remota guardada. **Volver a generar no equivale a hacer un nuevo cotejo remoto**: para actualizar la fecha se requiere otro SELECT y su comparación completa.

`COBERTURA.json` preserva conteos y hashes de los insumos. `tests/reader-source.test.js` verifica los 48 textos, hashes de todos los assets, fragmentos de varias páginas, límites de coordenadas, contenido editado, manifiestos incompatibles y fallback sin trazabilidad.

Los demás instrumentos no reciben correspondencias inferidas: mantienen acceso a su fuente oficial cuando esté disponible. Ampliar cobertura requiere preparar y revisar sus mapas de procedencia como una tarea independiente.
