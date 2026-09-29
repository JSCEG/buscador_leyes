# PLADESHi: mapa al PDF oficial del DOF

Trabajo del 29 de septiembre de 2026 sobre el instrumento ya cargado en Supabase (`48e6158c-c1a3-5b6d-811d-16e85b05ab64`). El acervo tiene 81 fragmentos. La publicación oficial se consulta en [SIDOF, nota 5798065](https://sidof.segob.gob.mx/notas/docFuente/5798065); su edición matutina del 7 de septiembre de 2026 está en el [PDF oficial del DOF](https://www.dof.gob.mx/abrirPDF.php?anio=2026&archivo=07092026-MAT.pdf&repo=).

El PDF oficial de la edición tiene 348 páginas y mide 17,852,649 bytes. El acuerdo y el plan están en las páginas impresas 17–124. El SHA-256 cotejado es `d56aa56ec9750c758bcdc1173b3ddcc0033f6f037d9a856810805a9e51a8b84f`.

El mapa liga 80 fragmentos por su UUID a los encabezados estructurales que aparecen en la edición oficial y conserva páginas continuas hasta el siguiente encabezado. Cada página ligada tiene coordenadas resaltables tomadas de sus líneas visibles; el resaltado inicial ayuda a ubicar cada sección y no pretende transcribir las tablas o los gráficos. Así el original mantiene sus cuadros, figuras, mapas y maquetación. La verificación de contenido bloquea el salto si cambia el fragmento de Supabase.

La única entrada sin mapa es **“Nota editorial · documentos relacionados”**: es texto editorial del buscador, no una parte del acuerdo ni del plan. Su fuente oficial permanece accesible. Los otros fragmentos sí llevan a la edición del DOF: acuerdo y firmas (página 17), índice y presentación (18–23), secciones del plan (24–116), referencias/glosario (117–121), siglas (122–123), unidades (123–124) y notas (124).

La edición rebasa el límite previo de 8 MiB del visor. Se amplió a 20 MiB para esta fuente, y el proxy sólo acepta la URL completa revisada del PDF del 7 de septiembre; no se guardó el PDF en el repositorio ni se escribieron datos en Supabase.

## Reproducción

- `preparar.py` toma el respaldo de solo lectura `.local/pladeshi-sync/articulos.json` y el PDF `.local/pladeshi-sync/07092026-MAT.pdf`; genera `map.json` y `missing.json`.
- `publicar.py` valida los hashes de fragmentos, el hash del PDF, los UUID, las páginas y las coordenadas antes de integrar el mapa al manifiesto.
- `map.json` documenta la fuente, sus dimensiones, páginas y coordenadas. `missing.json` explica la entrada editorial excluida. Se revisaron visualmente muestras de las páginas 17, 18, 23, 24, 28, 101, 117 y 122–124.
