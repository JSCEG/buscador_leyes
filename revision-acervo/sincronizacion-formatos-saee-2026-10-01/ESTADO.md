# Sincronización de FORMATOS-SAEE

## Cotejo oficial

- SIDOF: https://sidof.segob.gob.mx/notas/docFuente/5788270
- Edición Matutina del DOF del 22 de mayo de 2026: https://sidof.segob.gob.mx/notas/getNewsletter/22-05-2026/Matutina/327465
- SHA-256 del PDF oficial cotejado: `7cefb3ae9c1b29d4d0e8188a0827060111e53cf6b1564754edbc2f43ce224ff3`.
- Los ocho fragmentos de Supabase se cotejaron por contenido exacto y página con la edición oficial.

| Fragmento | Páginas PDF | Estado |
| --- | --- | --- |
| Preámbulo y acuerdo | 60–61 | Mapeado |
| Resolutivo único | 61 | Mapeado |
| Instrucciones de llenado | 61 | Mapeado |
| Formato CNE_ELECTRICIDAD_09 | 62–69 | Mapeado |
| Formato CNE_ELECTRICIDAD_10 | 70–73 | Mapeado |
| Formato CNE_ELECTRICIDAD_11 | 74–79 | Mapeado |
| Transitorio único | 79 | Mapeado |
| Firma del acuerdo | 79 | Mapeado |

El PDF completo pesa 78,692,963 bytes. El lector obtiene de SIDOF sólo las imágenes de las páginas oficiales que necesita; el PDF entero no se guarda en Git. Las 496 URL de imagen y dimensiones se comparten con el índice de edición generado en `sincronizacion-formatos-cogeneracion-2026-09-30/page-images.json`.

`map.json` contiene las huellas de texto, las páginas y las coordenadas; `preparar.py` lo regenera a partir de la instantánea de Supabase y la copia local ignorada del PDF; `publicar.mjs` agrega la fuente y sus fragmentos de forma idempotente.
