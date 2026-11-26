# NOM-023-ASEA-2026 — incorporación y cotejo

Corte: 26 de noviembre de 2026.

- Instrumento: `4f4a3c42-938e-5998-b192-4f17eac5e285`.
- Publicación: 25 de noviembre de 2026, DOF matutino, [nota 5805253](https://sidof.segob.gob.mx/notas/5805253).
- Fuente remota: [PDF oficial](https://sidof.segob.gob.mx/notas/getNewsletter/25-11-2026/Matutina/331125), 8,419,036 bytes, 552 páginas. La NOM ocupa las páginas 35–252.
- SHA-256: `7a9687317718bf15311a476c77e8522016e30b1778bfa6499f1172823a818186`.
- Fuente del lector: `dof-nom023-asea-20261125-7a9687317718`.
- 887 fragmentos: 870 numerales, ocho transitorios, cuatro apéndices, portada/fundamentos, considerandos, prefacio, índice y bibliografía. Todos vinculados al PDF remoto y a la huella exacta de su contenido.
- 28 tablas: encabezados explícitos en 27; la relación de abreviaturas no tiene encabezado en el original. `rowspan` y `colspan` conservados y rejilla comprobada sin filas incompletas ni solapamientos.
- 26 figuras con sus URL oficiales, verificadas como imágenes PNG. Once ilustran las trece fichas del apéndice B; las otras dos fichas son letreros textuales. No se generaron sustitutos de las figuras.
- Los cuadros extensos de evaluación permanecen íntegros en 9.2, 9.3 y 9.4; sus selectores recorren las 39, 31 y 29 páginas correspondientes.

## Cotejo

`preparar.py` verifica el SHA de ambos insumos, conserva la estructura HTML y localiza los 4,596 párrafos completos dentro del tramo del PDF correspondiente a cada fragmento. La comparación ignora espacios, puntuación y diacríticos exclusivamente para localizar el texto; el contenido publicado conserva la redacción y símbolos de la fuente.

Tres párrafos defectuosos del HTML de SIDOF se repararon con el PDF:

1. Criterio 8.2.3: la palabra «diésel» llegó con caracteres dañados.
2. Criterio 8.6.5: caracteres dañados en la lista de actuación ante fugas; cotejo visual y textual de las páginas 217–218.
3. Criterio 8.8.1.2.5: frase duplicada y cinco incisos a–e desplazados fuera de la tabla. Se reintegraron en la columna de aceptación conforme a la página 221, sin duplicarlos al final de 9.4.

El detalle está en `cotejo.json`. No se reinterpretan obligaciones ni se corrigen erratas que también están en el PDF.

## Base de datos

`aplicar.sql` aplicado en una sola transacción al proyecto `carmfqhcfsqbzcwptqfz`. Verificación posterior: 887 fragmentos, ocho transitorios, cuatro apéndices, cero vectores FTS nulos. La huella conjunta ordenada de ID y SHA-256 de contenido coincide con el paquete local: `812a3dffc1214055232de1538db4613e`.

La norma tiene entrada en vigor diferida: 180 días naturales posteriores a su publicación. La cancelación de NOM-005-ASEA-2016 opera a partir de esa entrada en vigor. `vigente` queda sin afirmación anticipada; no se registra una cancelación inmediata ni se crea un antecedente ficticio.

## Reproducción y publicación

1. Descargar temporalmente el PDF oficial y ejecutar `python preparar.py RUTA_PDF` desde esta carpeta.
2. Revisar `cotejo.json`, `carga.json` y `map.json`. El SQL rechaza instrumentos duplicados.
3. Aplicar `aplicar.sql` únicamente para la incorporación inicial.
4. Ejecutar `node publicar.mjs` una vez. Rechaza duplicados, verifica las huellas, valida los rectángulos y garantiza que no cambien los mapas anteriores.
5. `node scripts/generate-reader-pdf-sources.mjs` desde la raíz; la URL revisada figura en `server/reader-pdf.js`.

Pruebas focalizadas del mapa, sanitizador y transporte: 84 satisfactorias. Lint y build satisfactorios. El PDF permanece en su fuente oficial: no se incorpora al repositorio ni a Supabase.

## Accesos para revisión

- [Instrumento](https://buscador-juridico.com/#ley-4f4a3c42-938e-5998-b192-4f17eac5e285)
- [Tablas con encabezados combinados — 6.3.19.4.3](https://buscador-juridico.com/#art-15551dc6-f074-5a53-9417-713394756b2c)
- [Cuadro 9.4](https://buscador-juridico.com/#art-b21da901-0b10-5342-9ac1-21fa18488a57)
- [Apéndice B — señales](https://buscador-juridico.com/#art-32032670-125b-5aed-9a27-cacc53f4bb5b)
- [Apéndice D — esquemas](https://buscador-juridico.com/#art-518c6790-9b1a-5617-829b-2d79afb420bc)
