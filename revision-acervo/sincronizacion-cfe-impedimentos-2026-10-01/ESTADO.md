# Sincronización de CFE-IMPEDIMENTOS — 1 de octubre de 2026

Se cotejó el instrumento con la edición matutina oficial del DOF del 18/09/2026. El texto aparece en las páginas impresas 213–225 del ejemplar de 288 páginas. La extracción completa de cada fragmento coincide, en orden, con el texto de la publicación.

## Resultado

- 31 fragmentos oficiales vinculados a sus páginas y coordenadas del PDF.
- 711 anclas geométricas entre las páginas impresas 213 y 225.
- Una nota editorial local queda sin mapa porque no forma parte de la publicación oficial.
- Se revisó visualmente el inicio, una página de la sección 5, la sección 6 y el cierre del instrumento.
- El mapa guarda la huella SHA-256 del ejemplar oficial. El PDF de 8,230,822 bytes no se incorpora al repositorio; se sirve desde la fuente DOF por el proxy verificado.

La numeración del documento combina apartados, subapartados, numerales, fracciones romanas y transitorios. Cada límite se cotejó con el texto completo de su fragmento; no se infirió una estructura uniforme.

## Archivos

- `map.json`: fuente remota y mapa por identificador de fragmento.
- `cotejo.json`: páginas, huella, límites y total de anclas.
- `sin-mapa-editorial.json`: exclusión deliberada de la nota local.
- `preparar.py`: reconstruye mapa y cotejo desde el PDF temporal oficial.
- `publicar.mjs`: valida estructura, contenido, páginas y coordenadas antes de agregar el mapa al manifiesto.

El manifiesto local queda en revisión 33. Esta preparación no modifica la interfaz.

## Fuentes oficiales

- [Edición matutina del DOF del 18 de septiembre de 2026](https://sidof.segob.gob.mx/notas/getNewsletter/18-09-2026/Matutina/329705)
- [Texto oficial de las Políticas de la CFE](https://sidof.segob.gob.mx/notas/docFuente/5799057)
