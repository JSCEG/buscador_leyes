# Cierre de las 29 tablas pendientes

De las 29 tablas señaladas, 27 tienen correspondencia exacta de texto, celdas y colspan/rowspan con una variante oficial. El primer detector tomaba sólo la primera tabla de texto idéntico; los formularios repiten plantillas con geometría distinta. Se verificó el candidato completo y no requieren cambios. Evidencia: revision-manual.json del paquete auditoria-tablas.

Las otras dos son C1 y C2 de la NOM-EM-009. La conversión previa repetía tres veces algunas listas de municipios. Se reconstruyen directamente del PDF oficial, páginas 71–72, revisadas visualmente, con cinco y seis zonas metropolitanas respectivamente. La fila Guanajuato conserva su municipio Guanajuato, visible en el PDF y ausente en la conversión HTML oficial.

C1: Guadalajara 10, Monterrey 18, Puebla-Tlaxcala 39, Toluca 16 y Valle de México 76 municipios/alcaldías. C2: Celaya 4, Cuernavaca 8, Guanajuato 1, Pachuca 7, Tula 5 y Tulancingo 3. Los nombres se extraen de cada columna física del PDF una sola vez; las dos columnas tipográficas forman una sola lista por zona. No cambia el sentido ni la pertenencia de ningún municipio.

Se conservan IDs y páginas del lector, y se actualizan sus dos hashes. Este cierre corresponde a los 29 casos pendientes de la auditoría del 14 de octubre, no a una certificación universal de todos los contenidos del acervo.
