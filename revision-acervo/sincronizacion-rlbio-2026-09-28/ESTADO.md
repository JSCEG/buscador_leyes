# Reglamento de la Ley de Biocombustibles: sincronización con PDF oficial

Cotejo realizado el 28/09/2026. 128 fragmentos mapeados al PDF oficial de 38 páginas; `missing.json` vacío. Se compara el texto completo ignorando espacios de maquetación y excluyendo encabezados y folios. Se conserva el hash del PDF y del contenido original exacto.

El preámbulo del DOF incluye encabezado/título repetido que no aparece con esa duplicación en el bloque continuo del PDF de Diputados; la localización coteja el cuerpo sin alterar la huella íntegra del contenido en Supabase.

Se revisaron visualmente páginas de muestra, incluyendo un fragmento multipágina; los resaltados coinciden con el texto. Los PDFs se consultan desde Diputados a través del proxy existente. No se modificó Supabase ni el frontend, ni se incorpora una copia del PDF a Git. La sincronización documental no certifica vigencia jurídica.

Reproducción: ejecutar `preparar.py` y después `publicar.py`. Requiere el PDF oficial en `.local/rlbio-sync/RLBIO.pdf` y PyMuPDF en `.local/lse-sync/python`.
