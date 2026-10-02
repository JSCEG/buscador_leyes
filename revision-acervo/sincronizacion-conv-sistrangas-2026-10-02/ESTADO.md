# Sincronización del PDF: CONV-SISTRANGAS

Se cotejaron los seis fragmentos oficiales de la convocatoria con la edición matutina del DOF del 14 de agosto de 2026. La edición remota coincide con el ejemplar revisado: SHA-256 `5ec39d45cbcdef191fbeae7caf31049fcf7d72fe37999f3f33dfa10ae73317d8`, 8,455,984 bytes y 440 páginas. La convocatoria aparece en las páginas 406–407; las páginas siguientes ya pertenecen a otros documentos. El PDF se consulta desde la fuente oficial y no se duplica en Git.

El mapa abarca el preámbulo, requisitos, criterios de selección, difusión de resultados, disposiciones finales y firma/publicación. Se cotejaron en orden los inicios de los seis fragmentos con el texto PDF y se inspeccionaron visualmente ambas páginas. La nota editorial local queda fuera porque no forma parte de la publicación oficial.

`cotejo.json` conserva huella, cobertura y anclas; `map.json` guarda la fuente remota y sus mapas; `publicar.mjs` valida los IDs, texto, coordenadas y conflictos antes de actualizar el manifiesto. `sin-mapa-editorial.json` documenta la exclusión editorial.

## Fuentes oficiales

- [Edición matutina del DOF del 14 de agosto de 2026](https://sidof.segob.gob.mx/notas/getNewsletter/14-08-2026/Matutina/329086)
- [Texto oficial de la convocatoria](https://sidof.segob.gob.mx/notas/docFuente/5796317)
