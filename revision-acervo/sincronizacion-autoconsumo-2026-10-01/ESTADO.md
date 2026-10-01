# Sincronización de AUTOCONSUMO-0.7-20

## Cotejo de la fuente

- Registro SIDOF: https://sidof.segob.gob.mx/notas/docFuente/5764827
- PDF de la edición Matutina del DOF del 6 de agosto de 2025: https://sidof.segob.gob.mx/notas/getNewsletter/06-08-2025/Matutina/322403
- SHA-256 del PDF cotejado: `47b9e25c4def3e17c37434fb2344a76d9fc0f34cf34144b4cd4f423c492be27d`.
- El PDF completo tiene 524 páginas. El acuerdo aparece en las páginas 26–28; el texto de los ocho fragmentos oficiales se cotejó con la instantánea de carga previamente verificada.
- La nota editorial del buscador permanece sin página porque no forma parte de la publicación oficial.

| Fragmento | Páginas PDF | Estado |
| --- | --- | --- |
| Preámbulo y fundamentos | 26–27 | Mapeado |
| Resolutivo Primero: requisitos | 27–28 | Mapeado |
| Resolutivo Segundo: procedimiento | 28 | Mapeado |
| Transitorios Primero a Cuarto | 28 | Mapeados |
| Firma | 28 | Mapeado |
| Nota editorial | — | Se conserva sin sincronizar |

El lector consulta el PDF del DOF a través del proxy; no se agrega el documento a Git. `map.json` contiene las páginas, coordenadas y huellas del texto; `preparar.py` regenera el mapa desde el PDF local cotejado y los fragmentos de carga; `publicar.mjs` agrega la fuente y los mapas al manifiesto de forma idempotente.
