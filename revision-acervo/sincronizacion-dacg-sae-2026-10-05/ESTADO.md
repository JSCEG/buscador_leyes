# DACG de integración de Sistemas de Almacenamiento: mapa del PDF oficial

Cotejo del acuerdo publicado el 16 de abril de 2026 contra la [edición matutina oficial del DOF](https://sidof.segob.gob.mx/notas/getNewsletter/16-04-2026/Matutina/326685), de 304 páginas. La ficha oficial del [acuerdo](https://sidof.segob.gob.mx/notas/5785045) advierte que su HTML puede omitir elementos; por eso las páginas se cotejaron con el PDF de la edición.

- Supabase contiene 154 fragmentos del acuerdo: preámbulo, 143 numerales y artículos, nueve transitorios y firma.
- Los 154 fragmentos coinciden por texto con la edición oficial y tienen páginas y anclas geométricas dentro de las páginas PDF 35–57.
- Se reutiliza la fuente y el PDF oficial que ya están registrados para las DACG de Cogeneración, publicadas en la misma edición. La fuente se comparte entre ambos instrumentos y no se incorpora una copia del PDF al repositorio.
- El PDF cotejado mide 6,748,589 bytes y tiene SHA-256 `aa23e284c9c97542a96c8db5278f4694f38d0ad1f07b2081b6f0db268a93cba4`.
- `articulos-verificados.json` registra los textos recuperados de Supabase para reproducir la comprobación. `preparar.py` genera páginas, coordenadas y huellas; `publicar.mjs` valida integridad y publica el mapa.

Este cotejo verifica la correspondencia con la publicación oficial; no constituye una certificación de vigencia jurídica.
