# Sincronización de formatos de cogeneración

## Cotejo

- Fuente individual oficial SIDOF: https://sidof.segob.gob.mx/notas/docFuente/5788271
- Edición Matutina del DOF del 22 de mayo de 2026: https://sidof.segob.gob.mx/notas/getNewsletter/22-05-2026/Matutina/327465
- Huella SHA-256 de la edición oficial cotejada: `7cefb3ae9c1b29d4d0e8188a0827060111e53cf6b1564754edbc2f43ce224ff3`.
- Las páginas e imágenes se cotejaron contra el PDF oficial completo, no contra instrumentos parecidos que aparecen antes en la misma edición.

| Fragmento del acervo | Páginas PDF | Estado |
| --- | --- | --- |
| Acuerdo y considerandos | 80–81 | Mapeado |
| Resolutivo único | 81 | Mapeado |
| Instrucciones de llenado | 81 | Mapeado |
| Formato CNE_ELECTRICIDAD_07 | 82–88 | Mapeado |
| Formato CNE_ELECTRICIDAD_08 | 89–93 | Mapeado |
| Transitorio único | 93 | Mapeado |
| Firma del acuerdo | 93 | Mapeado |
| Nota editorial del buscador | — | Sin mapa: no forma parte de la publicación oficial |

## Carga del original

El PDF de la edición completa pesa 78,692,963 bytes. Para que el lector no tenga que descargarlo completo al abrir un fragmento, el manifiesto referencia las imágenes oficiales del SIDOF y el visor carga sólo las páginas elegidas. El enlace al PDF completo permanece disponible en el lector. No se guarda el PDF ni una copia de las imágenes en Git.

`map.json` contiene el mapa verificable; `preparar.py` lo regenera a partir de la copia de cotejo local, que está ignorada y no se publica. `publicar.mjs` agrega idempotentemente la fuente y los fragmentos al manifiesto. `missing.json` registra el único contenido editorial que se deja fuera del mapeo.
