# Mapa de CONV-GEN-2-M4 — 1 de octubre de 2026

Se cotejó la cuarta modificación de la Segunda Convocatoria con el ejemplar matutino oficial del DOF del 10/09/2026. El instrumento ocupa las páginas impresas 13 y 14 de una edición de 274 páginas.

## Resultado

- Cuatro fragmentos oficiales vinculados a páginas y coordenadas: preámbulo, resolutivo, transitorio y firma.
- El resolutivo abarca las dos páginas y conserva el calendario tabular en el PDF original.
- La nota editorial local queda fuera del mapa porque no forma parte del DOF.
- La huella SHA-256 identifica el ejemplar cotejado. El PDF no se agrega a Git; se obtiene desde el DOF mediante el proxy verificado.

## Archivos

- `map.json`: fuente remota y mapa por identificador de fragmento.
- `cotejo.json`: páginas, huella y anclas cotejadas.
- `preparar.py`: reconstruye el mapa a partir del PDF temporal oficial.
- `publicar.mjs`: verifica huellas, fragmentos y coordenadas antes de anexar al manifiesto.

La preparación no modifica la interfaz ni la carga de Supabase.

## Fuentes oficiales

- [Edición matutina del DOF del 10 de septiembre de 2026](https://sidof.segob.gob.mx/notas/getNewsletter/10-09-2026/Matutina/329565)
- [Acuerdo modificatorio](https://sidof.segob.gob.mx/notas/docFuente/5798361)
