# Incorporación DOF — corte 30/09/2026

## Estado

Cargados y cotejados en Supabase el 1 de octubre de 2026 los dos acuerdos nuevos identificados en el corte v4.21 del Radar regulatorio. Los textos oficiales se fragmentaron desde SIDOF y se contrastaron con la edición matutina del DOF del 30 de septiembre (344 páginas; SHA-256 `598b6f92b41292cebf27dc3f0dce793b7d6a02477e56a3f0ca49866ce528334c`).

| Instrumento | Fuente oficial | Fragmentos | Temas | Observación |
|---|---|---:|---:|---|
| UPAC-SGE | https://sidof.segob.gob.mx/notas/docFuente/5799963 | 23 (22 oficiales + nota editorial) | 6 | Preámbulo, resolutivo, 14 artículos, 5 transitorios y firma. Sin tablas ni anexos. Se corrigieron los encabezados formales del acuerdo y de transitorios. |
| CNE-MOD-CARGO-TRANSMISION | https://sidof.segob.gob.mx/notas/docFuente/5799964 | 7 (6 oficiales + nota editorial) | 6 | Modificación separada del acuerdo base del 18/06/2026. Incluye íntegros las dos condiciones del transitorio Tercero y los cuatro supuestos del Cuarto; queda enlazada al original en la nota editorial. |

La carga dejó 89 instrumentos, 4,811 fragmentos y 1,383 temas en total. Los fragmentos de ambos instrumentos tienen índice FTS generado; la verificación no encontró texto vacío ni fragmentos sin índice. La modificación CNE no sobrescribe ni consolida el acuerdo base.

## Archivos

- `UPAC-SGE-carga.json`: paquete cotejado.
- `UPAC-SGE-COTEJO.json`: comprobaciones frente al HTML y PDF oficial.
- `UPAC-SGE-aplicar.sql`: script idempotente de inserción original; ya aplicado.
- `UPAC-SGE-corregir.sql`: corrección de encabezados al registro existente; ya aplicada sin cambiar IDs ni duplicar el instrumento.
- `CNE-MOD-CARGO-TRANSMISION-carga.json`: paquete cotejado.
- `CNE-MOD-CARGO-TRANSMISION-COTEJO.json`: comprobaciones de estructura y alcance.
- `CNE-MOD-CARGO-TRANSMISION-aplicar.sql`: inserción transaccional; ya aplicada.
- `preparar_upac.py` y `preparar_cne_modificacion.py`: extracción reproducible del HTML oficial y generación de paquetes/SQL.

No se generaron mapas de páginas para el lector PDF en esta incorporación. La validación cubre integridad de texto, estructura, fuente e índice de búsqueda. No se modificó la interfaz.
