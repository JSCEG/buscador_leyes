# Cuarta modificación a proyectos estratégicos — 29 de octubre de 2026

Cargada en Supabase como `CONV-ESTRATEGICOS-M4`, ID `9fcd022a-e3ba-5c86-ba92-867526353891`. Tres fragmentos oficiales: preámbulo y considerandos, Acuerdo ÚNICO y Transitorio ÚNICO con firma. Una nota editorial separada enlaza la convocatoria original y sus cuatro modificaciones.

## Alcance

Modifica la fracción II del numeral 3.1 y la etapa 2 del numeral 17.1. Extiende hasta el 1 de marzo de 2027 la presentación de manifestaciones de interés y solicitudes de estudios de conexión de SAEE; permite actuaciones en 2027 y entra en vigor el 29 de octubre de 2026. La fecha de firma, 26 de octubre, se conserva dentro del texto y no se confunde con la publicación. No crea otra convocatoria ni reabre el registro de generación. Los puntos suspensivos del cuadro oficial se conservan, sin completar información por inferencia.

## Integridad

Texto HTML oficial íntegro, excluido únicamente el aviso técnico del portal. Los 18 bloques no tabulares se localizaron completos y en orden en el PDF mediante normalización alfanumérica. Las ocho celdas de la tabla de cuatro columnas se cotejaron individualmente con el PDF; la primera fila está marcada con `thead/th`. El detector dividía «No. de Etapa» e introducía columnas vacías: se corrigió sólo ese artefacto de extracción para el cotejo. Inspección visual de la página 49 aprobada.

## Mapa remoto

PDF DOF matutino del 29 de octubre: 184 páginas, 4,386,145 bytes, SHA-256 `2f30744f130e1bf501a1ae5e5ca4b754f7e34fa2f80ccbcf5db52ac6bb9febad`. Fuente `dof-estrategicos-m4-20261029-2f30744f130e`.

Los tres fragmentos oficiales apuntan a sus propios rangos de líneas de la página 49; el título repetido del acuerdo se distingue de la presentación inicial. Se comprueba que no haya solapamientos entre fragmentos. La nota editorial no recibe un mapa de texto oficial. No se agregan PDFs ni imágenes a Git.

## Relaciones

Se agregó a las cuatro notas editoriales anteriores un enlace a M4 y una aclaración sobre SAEE. Sus contenidos anteriores están en `antes-notas.json`, con protección MD5 frente a cambios concurrentes. No se modifica texto oficial ni mapas de publicaciones previas. La nota nueva permite que la cronología existente muestre las cinco publicaciones; se añade la sigla M4 al catálogo de instrumentos de almacenamiento en `src/data/tramites.js`, sin cambios de interfaz.

## Verificación

Los cuatro fragmentos nuevos y las cuatro notas actualizadas coinciden por MD5 con sus payloads; los ocho tienen índice de búsqueda. Lint y build aprobados. 71 pruebas pertinentes aprobadas, incluidos texto/mapeo, tabla, cronología, catálogo de trámites y proxy PDF. Manifiesto de lectura: revisión 116; mapas anteriores preservados idénticos.

Reproducción: `python preparar.py <PDF-oficial> <directorio-python-con-pymupdf-y-bs4>`. Aplicar `aplicar.sql` una sola vez y ejecutar `node publicar.mjs` desde la raíz del proyecto.
