# Sincronización DACG de permisos de generación y almacenamiento

Se cotejaron los fragmentos cargados del Acuerdo de la Comisión Nacional de Energía contra la edición matutina del DOF del 23 de octubre de 2025. El acuerdo establece términos y requisitos para permisos de generación y almacenamiento, sus modificaciones y vigencia.

- 86 fragmentos cargados en Supabase: 85 fragmentos del texto publicado y un índice sintético de navegación.
- Se mapearon los 85 fragmentos que aparecen como contenido en la edición oficial, páginas impresas 13–69 del PDF.
- El índice sintético permanece sin mapa: la edición no lo reproduce como bloque independiente; los encabezados reales sí quedan vinculados desde cada fragmento.
- Fuente oficial: [edición matutina del DOF](https://sidof.segob.gob.mx/notas/getNewsletter/23-10-2025/Matutina/323704), PDF de 364 páginas, SHA-256 `0314af26eb12f95ba3de3f838b7bf8821f5a1900f5ad76fd11e42d2e7bc66a7d`.
- El manifiesto guarda coordenadas para sincronizar cada fragmento con la liga oficial; el PDF sólo se conserva temporalmente para el cotejo y no se agrega al repositorio.

Validación: test del instrumento, prueba del proxy oficial, suite completa, lint y build.
