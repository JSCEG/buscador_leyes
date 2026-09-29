# Ley General de Economía Circular: mapa al PDF oficial

Preparación del 29 de septiembre de 2026. Se cotejaron los **58 fragmentos existentes en Supabase** contra el PDF vigente publicado por la Cámara de Diputados. El PDF tiene 20 páginas y SHA-256 `89220c0c86445a873067e0095b4591c11847dfd11595ca3e11bbfcf09cef6754`.

El manifiesto integra **57 mapas exactos y únicos**: 49 artículos ordinarios, siete transitorios y el bloque complementario de firmas. Los textos se identifican por UUID real y SHA-256 del contenido UTF-8 vigente en Supabase. Cada ubicación usa coordenadas de las líneas del PDF. Se verificaron muestras visuales en las páginas 1, 9 y 20; el mapa recorre las 20 páginas e incluye artículos multipágina.

El **preámbulo del decreto no tiene mapa**. El PDF vigente de Diputados presenta el texto de la Ley y no reproduce íntegro el título y la fórmula de expedición que el acervo guarda en ese fragmento. No se le asignó una página aproximada. El lector conserva el enlace a la publicación oficial del DOF: https://sidof.segob.gob.mx/notas/docFuente/5778439.

La fuente del mapa es el PDF oficial vigente de Diputados: https://www.diputados.gob.mx/LeyesBiblio/pdf/LGEC.pdf. La aplicación consulta esa URL remota por el proxy ya existente; no se guarda el PDF en Git ni se modifican artículos o temas en Supabase. La sincronización verifica versión y contenido, y no determina vigencia jurídica.

## Reproducción

- `preparar.py` usa la exportación de solo lectura `.local/lgec-sync/articulos.json` y el PDF `.local/lgec-sync/LGEC.pdf`; comprueba coincidencias únicas y produce `map.json` y `missing.json`.
- `publicar.py` valida hashes, páginas, coordenadas y UUID antes de agregar los 57 mapas a `public/reader-sources/manifest.v1.json`.
- `missing.json` documenta el preámbulo excluido.
- `map.json` conserva la fuente y las coordenadas por fragmento.

La preparación no ejecutó escrituras en Supabase.
