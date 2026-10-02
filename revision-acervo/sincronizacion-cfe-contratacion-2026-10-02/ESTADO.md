# Sincronización del PDF: CFE-CONTRATACIÓN

Se cotejaron 115 fragmentos oficiales de las Disposiciones Generales con la edición matutina del DOF del 19 de agosto de 2026. El PDF remoto corresponde exactamente al ejemplar revisado: SHA-256 `a7c206cad00cf89d19750bca7faa09470526fff07c0874d31ff3941dca605c55`, 7,821,940 bytes y 542 páginas. El instrumento ocupa las páginas 89–149; el PDF no se copia al manifiesto ni se añade otra vez a Git.

El mapa comprende preámbulo, índice, Disposiciones 1–108, cuatro transitorios y firma/publicación. Se cotejaron sus inicios en orden con la transcripción oficial y se revisaron visualmente las páginas de apertura, índice, inicio del articulado, Disposición 15 y cierre. El índice y la Disposición 1 comparten la página 92; el ancla de la Disposición 1 se colocó en el inicio del cuerpo, debajo del índice. La edición incluye contenido ajeno al instrumento después de la página 149, que queda fuera del mapa.

La nota editorial local se excluye porque no pertenece al DOF; véase `sin-mapa-editorial.json`. `cotejo.json` registra la huella, cobertura y anclas. `map.json` contiene la edición remota y los mapas. `publicar.mjs` verifica IDs, contenido, coordenadas y ausencia de conflictos antes de actualizar el manifiesto.

## Fuentes oficiales

- [Edición matutina del DOF del 19 de agosto de 2026](https://sidof.segob.gob.mx/notas/getNewsletter/19-08-2026/Matutina/329166)
- [Texto oficial de las Disposiciones Generales](https://sidof.segob.gob.mx/notas/docFuente/5796647)
