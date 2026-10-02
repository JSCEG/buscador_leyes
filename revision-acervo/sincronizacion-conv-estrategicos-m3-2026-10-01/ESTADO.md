# Mapa de CONV-ESTRATEGICOS-M3 — 1 de octubre de 2026

Se cotejó la tercera modificación de la convocatoria estratégica con la edición matutina oficial del DOF del 2/09/2026. El acuerdo aparece en la página impresa 20 de una edición de 488 páginas.

## Resultado

- Cuatro fragmentos oficiales vinculados a página y coordenadas: preámbulo, resolutivo PRIMERO, transitorio ÚNICO y firma.
- El resolutivo incluye la tabla con los plazos modificados, anclada en el original del DOF.
- La nota editorial de versiones relacionadas queda fuera del mapa porque no forma parte del ejemplar oficial.
- La huella SHA-256 identifica el PDF cotejado. El archivo no se agrega a Git; se obtiene del DOF mediante el proxy verificado.

## Archivos

- `map.json`: fuente remota y mapa por identificador de fragmento.
- `cotejo.json`: huella, página y anclas de cada fragmento.
- `preparar.py`: reconstruye el mapa desde el PDF local cotejado.
- `publicar.mjs`: verifica fragmentos, contenido y coordenadas antes de anexar al manifiesto.
- `sin-mapa-editorial.json`: documenta la exclusión deliberada de la nota editorial.

La preparación no modifica la interfaz ni la carga de Supabase.

## Fuentes oficiales

- [Edición matutina del DOF del 2 de septiembre de 2026](https://sidof.segob.gob.mx/notas/getNewsletter/02-09-2026/Matutina/329425)
- [Acuerdo modificatorio](https://sidof.segob.gob.mx/notas/docFuente/5797703)
