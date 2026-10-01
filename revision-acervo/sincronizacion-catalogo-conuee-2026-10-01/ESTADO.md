# Sincronización del catálogo CONUEE — 1 de octubre de 2026

Se cotejó CATALOGO-CONUEE con la edición matutina oficial del DOF del 11/09/2026. La publicación ocupa las páginas impresas 26–38 del ejemplar de 160 páginas.

## Resultado del cotejo

- 31 fragmentos oficiales vinculados a páginas y coordenadas del ejemplar.
- 405 anclas geométricas para texto y contenido visual.
- El Apéndice A, incluida su tabla de 40 equipos y aparatos, se mapeó por su texto extraído del PDF.
- Los seis formatos del Apéndice B son formularios escaneados distribuidos en teselas de imagen. Se ancló el rectángulo de cada formulario en las páginas 33–38; no se atribuyó OCR a esas imágenes.
- La nota editorial local queda fuera del mapa porque no forma parte del DOF.
- La huella SHA-256 identifica el ejemplar usado. El PDF oficial no se guarda en Git; el lector lo solicita por el proxy verificado.

## Archivos

- `map.json`: fuente remota y mapa por identificador de fragmento.
- `cotejo.json`: páginas, huellas, formularios visuales y anclas.
- `sin-mapa-editorial.json`: exclusión deliberada de la nota editorial.
- `preparar.py`: reconstruye coordenadas y cotejo desde el PDF temporal oficial.
- `publicar.mjs`: valida el mapa antes de anexarlo al manifiesto.

La preparación no modifica la interfaz.

## Fuentes oficiales

- [Edición matutina del DOF del 11 de septiembre de 2026](https://sidof.segob.gob.mx/notas/getNewsletter/11-09-2026/Matutina/329588)
- [Texto oficial del acuerdo CONUEE](https://sidof.segob.gob.mx/notas/docFuente/5798667)
