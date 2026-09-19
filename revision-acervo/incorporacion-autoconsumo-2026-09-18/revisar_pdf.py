"""Extrae las páginas de las publicaciones y renderiza muestras para cotejo visual."""
from pathlib import Path
import json
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'revision-visual'
OUT.mkdir(exist_ok=True)
RANGES = {
    'AUTOCONSUMO-0.7-20': (26, 28, [26, 28]),
    'FORMATO-AUTOCONSUMO': (113, 120, [115, 116, 118, 120]),
    'VENTANILLA-AUTOCONSUMO': (26, 64, [29, 35, 38, 39, 43, 52, 53, 63, 64]),
}
for name, (first, last, visual) in RANGES.items():
    pdf = pdfium.PdfDocument(ROOT / 'fuentes' / f'{name}-edicion.pdf')
    texts = []
    for number in range(first, last + 1):
        page = pdf[number - 1]
        text = page.get_textpage().get_text_range()
        texts.append(text)
        (ROOT / 'fuentes' / f'{name}-pdf-pagina-{number}.txt').write_text(text, encoding='utf-8')
        if number in visual:
            page.render(scale=1.6).to_pil().save(OUT / f'{name}-{number}.png')
    (ROOT / 'fuentes' / f'{name}-pdf-texto.txt').write_text('\n'.join(texts), encoding='utf-8')
    print(json.dumps({'instrumento': name, 'paginas': [first, last], 'paginas_visuales': visual}))
