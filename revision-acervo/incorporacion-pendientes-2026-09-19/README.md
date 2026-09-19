# Carga revisada del 19 de septiembre de 2026

Esta entrega reúne 27 instrumentos en cuatro carpetas: `incorporacion-pendientes`,
`incorporacion-planeacion`, `incorporacion-complementos` e
`incorporacion-cierre-prioridades`, todas con fecha `2026-09-19`.

Los archivos `*-carga.json` son los datos finales cotejados contra Supabase.
`VERIFICACION.json` registra el cotejo exacto de cada instrumento y la conservación
de los registros anteriores. `COTEJO-FUENTES.json` documenta la comparación del
texto y la estructura HTML; `ALCANCE-PDF.json` y `COTEJO-PDF*.json` registran el
alcance y las comprobaciones adicionales del original. El informe
`INCORPORACION.html` explica los límites y los pendientes.

Los perfiles de segmentación son específicos de estas ediciones; no son un
parser universal para documentos futuros. Sus comprobaciones deben detener la
carga si cambia la fuente. La selección REFORMAS-FMP-LOAPF comprende únicamente
los artículos Noveno y Décimo, sus transitorios y el cierre común del decreto.

PDFs, HTML originales, imágenes de revisión, instantáneas de la base y SQL de
aplicación quedan fuera de Git. Las fuentes oficiales y sus hashes están en
`fuentes.json` y `ediciones.json`. Para repetir un cotejo hay que recuperar esas
fuentes y comprobar sus hashes antes de usar los perfiles. Los scripts de
verificación de Supabase requieren una nueva instantánea local; no basta con
ejecutarlos sobre los archivos de evidencia de esta entrega.

La carga ya se aplicó: no volver a ejecutar SQL de inserción para estos IDs.
Los generadores producen sentencias con comprobaciones contra duplicados y
cotejo previo al commit. No se incluyeron credenciales en estos archivos.

Las figuras se consultan mediante ligas oficiales; no se almacenan en Git.
Los mapas de páginas para sincronizar artículos con PDF son un trabajo separado.
