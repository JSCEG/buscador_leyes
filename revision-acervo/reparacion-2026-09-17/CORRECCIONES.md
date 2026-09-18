# Corrección aplicada al acervo — 17 de septiembre de 2026

**Los 12 instrumentos existentes están corregidos en Supabase y cotejados contra la descarga posterior. No se incorporó ningún instrumento nuevo.**

El acervo pasó de 1,749 a 1,788 fragmentos. El aumento corresponde a disposiciones que estaban fusionadas y a separar las firmas; no representa nuevas leyes. Se reconstruyeron 358 entradas de índice y se conservaron 1,744 UUID. Cinco cortes falsos se reunieron con su disposición original, con correspondencia de IDs guardada.

| Instrumento | Antes | Ahora | Artículos / numerales | Transitorios | Índice |
|---|---:|---:|---:|---:|---:|
| RLSE | 323 | 335 | 306 | 27 | 65 |
| LSE | 200 | 207 | 188 | 16 | 40 |
| LPTE | 110 | 113 | 100 | 10 | 26 |
| LGTAIP | 234 | 238 | 216 | 20 | 45 |
| LGEC | 56 | 58 | 49 | 7 | 22 |
| RISENER | 87 | 88 | 78 | 7 | 12 |
| RLPTE | 151 | 152 | 136 | 13 | 36 |
| RLSH | 369 | 371 | 336 | 32 | 88 |
| DACG-PV | 10 | 11 | 8 | 1 | 0 |
| PODECOBI-LIN | 37 | 42 | 39 | 1 | 15 |
| PODECOBI-DEC | 18 | 19 | 13 | 3 | 0 |
| SAEE | 154 | 154 | 143 | 9 | 9 |

## Correcciones

- Restituidos los 33 artículos/numerales con identificación incorrecta: 29 ahora tienen fragmento propio y cuatro conservaron su UUID con numeración corregida.
- Separados tres transitorios adicionales del RLSH (Trigésimo a Trigésimo Segundo), que estaban dentro del Vigésimo Noveno. La fuente tiene **32 transitorios**; el conteo de 29 de la auditoría inicial quedó rectificado en esta comprobación.
- Reunidos los cinco cortes falsos de RLSE, LGTAIP, RLSH y SAEE. Reclasificados los preámbulos, las fórmulas de expedición y las referencias editoriales del decreto.
- Distinguidos los transitorios propios de LSE y LPTE de los del decreto de expedición; separadas las firmas en los 12 instrumentos.
- Eliminados los encabezados y pies editoriales identificados y reconstruida la jerarquía de títulos, capítulos y secciones. Los dos instrumentos sin capítulos permanecen sin índice artificial.
- Fechas corregidas: LGEC **2026-01-19**, DACG-PV **2025-10-17**, RISENER **2025-04-17**.
- En la tabla 1 del numeral 2.12 de SAEE se corrigió **IEC 62819 → IEC 62619**, cotejado con [la publicación oficial](https://sidof.segob.gob.mx/notas/docFuente/5785045). Se conservó la tabla legible.

## Comprobación y respaldo

Cada instrumento se aplicó en una transacción: bloqueo breve de escrituras, comparación de los datos con el respaldo, actualización conservando IDs, regeneración automática de FTS y comprobación posterior. Si una comprobación fallaba, la transacción completa se revertía. La primera transacción se probó con ROLLBACK antes de aplicarla. Se guardó SQL de reversión por instrumento.

Una exportación nueva, realizada después de las 12 transacciones, coincide **campo por campo** con los planes de artículos, fechas e índices. Los UUID existentes conservaron su fecha de creación. La consulta directa confirmó cero textos vacíos, cero índices FTS vacíos, cero etiquetas duplicadas y cero órdenes duplicados por instrumento.

El texto se preparó desde las fuentes oficiales descargadas en la auditoría, con perfiles y conteos por documento, y comprobación de cobertura de las líneas extraídas. No se aplicó la salida del parser genérico sin revisar. Esto no certifica la vigencia jurídica ni constituye una auditoría tipográfica exhaustiva de los PDF.

Las notas y favoritos remotos estaban vacíos; cada transacción comprobó que no hubieran aparecido referencias a los cortes retirados. El código local incluye redirecciones de los cinco IDs retirados para enlaces y favoritos locales. **Esas redirecciones requieren publicar el frontend para estar disponibles en una versión alojada; los datos de Supabase ya están actualizados.** No se realizó despliegue.

Pruebas del proyecto: **25 aprobadas**, ESLint correcto y build Vite correcto. El build mantiene avisos previos de tamaño de bundle y datos de Browserslist.

## Archivos

- `antes-verificado/`: respaldo anterior, con hashes.
- `despues-verificado/`: descarga posterior, con hashes.
- `VERIFICACION.json`: resultado de la comparación completa e IDs reunidos.
- `*-plan.json`: antes y después por fragmento.
- `*-aplicar.sql` y `*-revertir.sql`: transacciones protegidas; no ejecutarlas sin comprobar el estado esperado.
- `resultados-supabase.json`: comprobantes del conector.
- Fuentes originales: `../auditoria-cargados-2026-09-17/fuentes/`.

Las cargas nuevas siguen requiriendo revisión individual: esta reparación utiliza perfiles cotejados para estos 12 documentos y no convierte al parser genérico en una garantía de importación automática.
