# Corrección de tablas HIIP

Se sustituyen exclusivamente los artículos tercero y cuarto y los dos bloques del Anexo I. Se preservan sus identificadores. Las tablas provienen del HTML oficial SIDOF 5801172; preparar.py verifica que cada celda conserve su texto y atributos colspan/rowspan. Todos los encabezados se marcan con thead/th.

Cobertura: tabla comparativa de dos filas de datos, 53 reactivos restantes y 197 reactivos eliminados divididos en bloques 100/97. No quedan barras de separación. aplicar.sql exige los hashes previos para evitar sobrescribir cambios posteriores.

publicar.mjs modifica sólo los cuatro hashes de contenido del manifiesto; conserva sus coordenadas y páginas del PDF. No se modifica el frontend ni se altera el resto del acervo.
