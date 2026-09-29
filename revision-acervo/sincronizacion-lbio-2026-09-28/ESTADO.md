# Ley de Biocombustibles: sincronización con PDF oficial

Cotejo realizado el 28/09/2026. 64 fragmentos mapeados al PDF oficial de 23 páginas; `missing.json` vacío. Se compara el texto completo ignorando espacios de maquetación y excluyendo encabezados y folios. Se conserva el hash del PDF y del contenido original exacto.

Los 64 fragmentos coinciden contra el texto vigente de Diputados.

Se revisaron visualmente páginas de muestra, incluyendo un fragmento multipágina; los resaltados coinciden con el texto. Los PDFs se consultan desde Diputados a través del proxy existente. No se modificó Supabase ni el frontend, ni se incorpora una copia del PDF a Git. La sincronización documental no certifica vigencia jurídica.

Reproducción: ejecutar `preparar.py` y después `publicar.py`. Requiere el PDF oficial en `.local/lbio-sync/LBIO.pdf` y PyMuPDF en `.local/lse-sync/python`.
