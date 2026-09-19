"""Cotejo independiente del vocabulario completo HTML/PDF, además de la revisión visual."""
from pathlib import Path
from collections import Counter
import re, json, unicodedata
ROOT = Path(__file__).resolve().parent
tokens = lambda text: Counter(re.findall(r'\w+', unicodedata.normalize('NFKC', text).lower()))
results = []
for source in json.loads((ROOT / 'fuentes.json').read_text(encoding='utf-8')):
    name = source['name']
    blocks = json.loads((ROOT / f'fuentes/{name}.bloques.json').read_text(encoding='utf-8'))['bloques']
    pdf = (ROOT / f'fuentes/{name}-pdf-texto.txt').read_text(encoding='utf-8')
    pdf = '\n'.join(line for line in pdf.splitlines() if 'DIARIO OFICIAL' not in line and line.strip() != 'SECRETARIA DE ENERGIA')
    html_words, pdf_words = tokens(' '.join(b['texto'] for b in blocks)), tokens(pdf)
    missing, extra = html_words - pdf_words, pdf_words - html_words
    expected = {'o': 17} if name == 'VENTANILLA-AUTOCONSUMO' else {}
    assert dict(missing) == expected and not extra, (name, missing, extra)
    if expected:
        raw = (ROOT / f'fuentes/{name}.html').read_text(encoding='utf-8')
        assert len(re.findall(r'''<span[^>]*class=['"]listStyle_[^'"]*['"][^>]*>o</span>''', raw, re.I)) == 17
    results.append(dict(instrumento=name, palabras_html=sum(html_words.values()), palabras_pdf=sum(pdf_words.values()),
                        diferencia_controlada=expected, texto_sin_omisiones_detectadas=True,
                        observacion='17 viñetas circulares aparecen como letra o en el HTML oficial y no como palabras en el PDF; se preserva el HTML.' if expected else 'Mismo vocabulario y frecuencias tras retirar encabezados del diario.',
                        limites='El cotejo léxico no demuestra por sí solo orden ni maquetación; se complementa con cotejo exacto por bloques, celdas y revisión visual.'))
(ROOT / 'COTEJO-PDF.json').write_text(json.dumps(results, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(results, ensure_ascii=False))
