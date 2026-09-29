# Plan Nacional de Desarrollo: mapa al PDF oficial del DOF

Trabajo del 29 de septiembre de 2026 sobre el plan ya cargado en Supabase (`2c8c7e74-a842-5e50-8d07-2558480ee262`). Sus 98 fragmentos se cotejaron con los 98 registros vigentes de Supabase: UUID y SHA-256 del contenido coinciden.

La fuente de texto, tablas e imágenes sigue siendo [SIDOF, nota 5755162](https://sidof.segob.gob.mx/notas/docFuente/5755162). Para el lector sincronizado se usa el PDF oficial de la edición vespertina del DOF del 15 de abril de 2025: [edición completa](https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=15042025-VES.pdf&repo=). El archivo tiene 104 páginas, pesa 1,810,191 bytes y su SHA-256 es `a1f503c4229a95e0fbe0f8d801760522017af262db0b6c4faa0296e2e2d6c764`. El plan ocupa las páginas 8–104.

Los 98 fragmentos tienen páginas y coordenadas verificadas en el PDF. El bloque “Notas y referencias del plan” se liga a sus cinco notas al pie en las páginas 75, 81, 85, 94 y 98, donde están impresas; no se le asigna una falsa sección al final. Las tablas y las imágenes permanecen en la publicación oficial y conservan sus 1,440 celdas, combinaciones y 69 imágenes ya cotejadas en la incorporación. No se guardó el PDF en Git ni se modificó Supabase.

## Reproducción

- `preparar.py` usa el PDF local temporal `.local/pnd-sync/15042025-VES.pdf` y los fragmentos cotejados de `incorporacion-pnd-2026-09-22/PND-carga.json` para construir `map.json`.
- `publicar.py` valida la huella del PDF, los 98 SHA-256 de contenido, páginas y coordenadas antes de actualizar el manifiesto del lector.
- `missing.json` queda vacío: no hay fragmentos PND pendientes de sincronización.
