# Mapa de MIGRACION-MODIFICACION — 1 de octubre de 2026

Se cotejó el acuerdo publicado el 8 de septiembre con la edición matutina oficial del DOF. El ejemplar tiene 314 páginas; el instrumento ocupa las páginas impresas 4–10.

## Resultado

- 18 fragmentos oficiales vinculados a sus páginas y coordenadas geométricas.
- Los cambios a los artículos 17, 18 y 56 abarcan más de una página; sus anclas incluyen el texto y los calendarios tabulares que aparecen en la edición.
- La nota editorial local de documentos relacionados queda fuera del mapa porque no forma parte del DOF.
- La huella SHA-256 identifica el ejemplar cotejado. No se agrega el PDF a Git; se sirve desde el DOF mediante el proxy verificado.

## Archivos

- `map.json`: fuente remota y mapa por identificador de fragmento.
- `cotejo.json`: huella, páginas y anclas de cada fragmento.
- `preparar.py`: reconstruye el mapa desde el PDF local cotejado.
- `publicar.mjs`: valida fragmentos, contenido y coordenadas antes de anexar al manifiesto.
- `sin-mapa-editorial.json`: documenta la exclusión deliberada de la nota editorial.

La preparación no modifica la interfaz ni la carga de Supabase.

## Fuentes oficiales

- [Edición matutina del DOF del 8 de septiembre de 2026](https://sidof.segob.gob.mx/notas/getNewsletter/08-09-2026/Matutina/329525)
- [Acuerdo de modificación](https://sidof.segob.gob.mx/notas/docFuente/5798117)
