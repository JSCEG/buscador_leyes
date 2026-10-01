# Sincronización de FORMATO-AUTOCONSUMO

## Cotejo de la fuente

- Registro SIDOF del acuerdo: https://sidof.segob.gob.mx/notas/docFuente/5769388
- PDF de la edición Matutina del DOF del 7 de octubre de 2025: https://sidof.segob.gob.mx/notas/getNewsletter/07-10-2025/Matutina/323403
- SHA-256 del PDF cotejado: `cd93c396dc04a950ef45c1c150795b42f154892fb0b39252a72712115c043d8c`.
- El documento completo tiene 402 páginas y 10,658,722 bytes. La copia de trabajo coincide byte por byte con la edición oficial.
- Se cotejaron los cinco fragmentos oficiales con los textos cargados en Supabase. La nota editorial se mantiene sin página porque no forma parte del acuerdo publicado.

| Fragmento | Páginas PDF | Estado |
| --- | --- | --- |
| Preámbulo y considerandos | 113–114 | Mapeado |
| Resolutivo | 114 | Mapeado |
| Formato e instructivo (12 tablas y 8 casillas) | 115–120 | Mapeado |
| Transitorio | 120 | Mapeado |
| Firma | 120 | Mapeado |
| Nota editorial | — | Se conserva sin sincronizar |

El lector solicita el PDF oficial a través del proxy de lectura. El archivo no se incorpora al repositorio. `map.json` contiene páginas, coordenadas y huellas de texto; `preparar.py` lo regenera usando la instantánea de Supabase y la copia local del PDF; `publicar.mjs` añade la fuente y los fragmentos al manifiesto de forma idempotente.
