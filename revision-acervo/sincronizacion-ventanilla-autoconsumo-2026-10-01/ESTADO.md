# Sincronización de VENTANILLA-AUTOCONSUMO

## Cotejo de la fuente

- Registro SIDOF del acuerdo: https://sidof.segob.gob.mx/notas/docFuente/5786923
- PDF de la edición Matutina del DOF del 8 de mayo de 2026: https://sidof.segob.gob.mx/notas/getNewsletter/08-05-2026/Matutina/327165
- SHA-256 del PDF cotejado: `92d7d0137e0aeab26cfddd931464f054d76591395dae42d994bc6d428cbe61f0`.
- El PDF completo tiene 326 páginas. Los 47 fragmentos oficiales cotejados con los registros actuales de Supabase corresponden a las páginas 26–64. Los 48 IDs y los 48 contenidos de la instantánea coinciden exactamente con Supabase.
- La extracción PDF presenta 17 viñetas redondas como letra “o”; es una diferencia tipográfica ya identificada en el cotejo. Se conserva el texto oficial HTML de SIDOF para la lectura.
- El documento incluye 24 tablas y 863 celdas, cotejadas en estructura. El Anexo A mantiene sus tablas distribuidas a través de las páginas 40–62.
- La nota editorial del buscador permanece sin página porque no forma parte del acuerdo.

| Fragmento / sección | Páginas PDF | Estado |
| --- | --- | --- |
| Preámbulo | 26–27 | Mapeado |
| Artículo único y numerales 1.1–2.3 | 28 | Mapeados |
| Numerales 2.4–3.1 | 29–30 | Mapeados |
| Numerales 3.2–7.1 | 30 | Mapeados |
| Numerales 7.2–11.3 | 30–35 | Mapeados |
| Numerales 12.1–14.10 | 35–39 | Mapeados |
| Transitorios primero a quinto y firma | 39 | Mapeados |
| Anexo A: solicitud de estudios y contratos | 40–62 | Mapeado |
| Anexo B: aceptación con obras de refuerzo | 63 | Mapeado |
| Anexo C: aceptación sin obras de refuerzo | 64 | Mapeado |
| Nota editorial | — | Se conserva sin sincronizar |

El lector consulta el PDF oficial a través del proxy; el archivo no se incorpora a Git. `map.json` contiene páginas, coordenadas y huellas de texto; `preparar.py` regenera el mapa desde la instantánea y la copia local ya cotejada; `publicar.mjs` actualiza el manifiesto de forma idempotente.
