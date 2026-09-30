# RISENER: mapa del PDF oficial

Verificado el 30 de septiembre de 2026.

- Instrumento: Reglamento Interior de la Secretaría de Energía, publicado el 17 de abril de 2025.
- Supabase: 88 fragmentos, cotejados por SHA-256 con la instantánea articulos-verificados.json.
- Fuente original: edición matutina oficial del DOF; PDF completo de 298 páginas, disponible directamente en https://sidof.segob.gob.mx/notas/getNewsletter/17-04-2025/Matutina/320604.
- Mapa: los 88 fragmentos se encontraron exactamente en el texto extraído del PDF; cobertura en páginas PDF 4 a 99. No se modificaron palabras ni puntuación.
- Trazabilidad: cada página asignada tiene anclas dentro de sus dimensiones; no hay fragmentos sin página, anclas vacías ni hashes distintos.
- El lector usa la URL fija del PDF oficial con el proxy de sólo lectura. No se agrega una copia del PDF al repositorio.
- La fuente y los mapas se guardan en public/reader-sources/manifest.v1.json; el proxy valida el SHA-256 del PDF al servirlo.
- El cotejo comprueba correspondencia documental, no certifica vigencia jurídica.
