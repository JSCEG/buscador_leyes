# Sincronización del PDF: FORMATOS-BIOCOMBUSTIBLES

Se cotejaron 27 fragmentos oficiales con la edición matutina del DOF del 31 de agosto de 2026. El mapa apunta a la edición remota, verificada con SHA-256 `51a89cc6ed35f31778d3d2134cbd1d1c135514a184cdb99b11eb23ae66260880` (438 páginas, 6,259,191 bytes); no se agrega el PDF al repositorio.

La correspondencia cubre el preámbulo, resolutivo, transitorios, firma y los 22 formatos distribuidos en los siete anexos. Las tablas y cuadros se cotejaron visualmente en páginas de inicio, fin y transición; el texto del PDF es seleccionable y no se detectaron páginas escaneadas en el tramo mapeado. Cada mapa conserva las coordenadas del texto original para el resaltado del lector.

La nota editorial del acervo se excluye porque no forma parte de la edición oficial; véase `sin-mapa-editorial.json`. `cotejo.json` documenta la huella y cobertura; `map.json` contiene la fuente y los mapas propuestos. `publicar.mjs` verifica IDs, texto, coordenadas y ausencia de conflictos antes de incorporar los mapas al manifiesto.
