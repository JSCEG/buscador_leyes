"""Perfiles de las tres fuentes cotejadas. No escribe en Supabase."""
from pathlib import Path
import json, re, collections

ROOT = Path(__file__).resolve().parent
load = lambda name: json.loads((ROOT / name).read_text(encoding='utf-8'))
save = lambda name, data: (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
EXPECTED = {
    'AUTOCONSUMO-0.7-20': ('845ff24d22906d78bce35b539e63389c0a7c13b1cc3b6928952478abed2f8337', 65),
    'FORMATO-AUTOCONSUMO': ('787b0187a9e046183526e15134d8f9b57af3d46d6824b1b1633ad0d251d6c8fd', 91),
    'VENTANILLA-AUTOCONSUMO': ('d330f1d6440081bc7ae2ef8b02e0d77f38e16c1a9143748338c442a1b5bb8213', 301),
}

def prepare(source):
    name = source['name']
    raw = load(f'fuentes/{name}.bloques.json')
    blocks = raw['bloques']
    assert (raw['sha256'], len(blocks)) == EXPECTED[name]
    assert raw['cotejo_textual_sin_perdida']
    chunks, themes, owned = [], [], {}
    state = dict(titulo_nombre=source['pieza'], capitulo_nombre=None, seccion_nombre=None)
    def theme(level, text):
        if not any(t['nivel'] == level and t['nombre'] == text for t in themes):
            themes.append(dict(nivel=level, nombre=text, orden=len(themes)))
    theme('titulo', source['pieza'])
    def add(start, end, label, kind, chapter, section=None):
        assert start < end and all(i not in owned for i in range(start, end))
        for i in range(start, end): owned[i] = label
        state.update(capitulo_nombre=chapter, seccion_nombre=section)
        theme('capitulo', chapter)
        if section: theme('seccion', section)
        body = '\n'.join(b['html'] for b in blocks[start:end])
        chunks.append(dict(identificador=label, contenido='<!-- ### Transcripción de la publicación oficial -->\n\n' + body,
                           tipo_articulo=kind, **state, bloques_origen=list(range(start, end)),
                           texto_fuente='\n'.join(b['texto'] for b in blocks[start:end]),
                           tablas=body.count('<table>'), graficos=body.count('<img '), casillas=body.count('□')))
    if name == 'AUTOCONSUMO-0.7-20':
        assert blocks[15]['texto'].startswith('Primero.') and blocks[57]['texto'].startswith('Segundo.')
        add(0, 15, 'Preámbulo del acuerdo', 'preambulo', 'Preámbulo y considerandos')
        add(15, 57, 'Resolutivo Primero · Requisitos del permiso', 'ordinario', 'Resolutivos del acuerdo')
        add(57, 58, 'Resolutivo Segundo · Procedimiento de resolución', 'ordinario', 'Resolutivos del acuerdo')
        starts = [58, 60, 61, 63]
        for n, label in enumerate(['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO']):
            assert blocks[59 if n == 0 else starts[n]]['texto'].startswith(label + '.')
            add(starts[n], starts[n+1] if n < 3 else 64, 'Transitorio ' + label, 'transitorio', 'Transitorios del acuerdo')
        add(64, 65, 'Firma del acuerdo', 'complementario', 'Firma')
    elif name == 'FORMATO-AUTOCONSUMO':
        assert blocks[19]['texto'].startswith('Único.-') and blocks[88]['texto'] == 'TRANSITORIO'
        add(0, 19, 'Preámbulo del acuerdo de formato', 'preambulo', 'Preámbulo y considerandos')
        add(19, 20, 'Resolutivo Único · Publicación del formato', 'ordinario', 'Resolutivo del acuerdo')
        # Un formulario único: no separar celdas, manifestaciones ni su instructivo.
        add(20, 88, 'Formato íntegro de solicitud e instructivo de llenado', 'anexo', 'Formato de solicitud')
        for text in ['I. Datos de la persona solicitante', 'II. Datos de la central eléctrica', 'III. Pago de derechos', 'IV. Manifestaciones', 'Instructivo de llenado', 'Documentos anexos']:
            theme('seccion', text)
        add(88, 90, 'Transitorio PRIMERO', 'transitorio', 'Transitorio del acuerdo')
        add(90, 91, 'Firma del acuerdo', 'complementario', 'Firma')
    else:
        assert blocks[26]['texto'].startswith('Artículo Único.')
        add(0, 26, 'Preámbulo del acuerdo de Ventanilla Única', 'preambulo', 'Preámbulo y considerandos')
        add(26, 27, 'Artículo Único · Expedición de los lineamientos', 'ordinario', 'Artículo del acuerdo')
        chapters = [(28, 'I'), (77, 'II'), (98, 'III'), (155, 'IV'), (165, 'V'), (193, 'VI'), (207, 'VII'), (236, 'VIII')]
        for pos, roman in chapters: assert blocks[pos]['texto'] == 'CAPÍTULO ' + roman
        numbers = [(b['id'], m[1]) for b in blocks[30:251] if (m := re.match(r'^(\d+\.\d+)\.?\s', b['texto']))]
        expected = '1.1,2.1,2.2,2.3,2.4,3.1,3.2,4.1,5.1,6.1,6.2,6.3,7.1,7.2,8.1,9.1,9.2,10.1,10.2,10.3,11.1,11.2,11.3,12.1,13.1,13.2,14.1,14.2,14.3,14.4,14.5,14.6,14.7,14.8,14.9,14.10'.split(',')
        assert [n for _, n in numbers] == expected
        # Adjuntar encabezados de capítulo/apartado a su primer numeral subordinado.
        starts = []
        for pos, number in numbers:
            start = pos
            while start > 27 and (re.match(r'^\d+\.\s', blocks[start-1]['texto']) or blocks[start-1]['texto'].startswith('CAPÍTULO') or any(start-1 == c+1 for c, _ in chapters)):
                start -= 1
            if number == '1.1': start = 27
            starts.append(start)
        for n, (pos, number) in enumerate(numbers):
            chapter_pos, roman = max((c, r) for c, r in chapters if c < pos)
            chapter = f'CAPÍTULO {roman} · {blocks[chapter_pos+1]["texto"]}'
            add(starts[n], starts[n+1] if n+1 < len(starts) else 251, 'Numeral ' + number, 'ordinario', chapter, 'Numeral ' + number)
        for n, (start, end, label) in enumerate([(251,253,'PRIMERO'), (253,254,'SEGUNDO'), (254,256,'TERCERO'), (256,258,'CUARTO'), (258,259,'QUINTO')]):
            assert blocks[252 if n == 0 else start]['texto'].startswith(label + '.')
            add(start, end, 'Transitorio ' + label, 'transitorio', 'Transitorios de los lineamientos')
        add(259, 260, 'Firma del acuerdo', 'complementario', 'Firma')
        for start, end, letter, title in [(260,294,'A','Solicitud de estudios y contratos'), (294,297,'B','Carta de aceptación con Obras de Refuerzo'), (297,301,'C','Carta de aceptación sin Obras de Refuerzo')]:
            assert blocks[start]['texto'] == 'Anexo ' + letter
            add(start, end, f'Anexo {letter} · {title}', 'anexo', 'Anexos de los lineamientos', f'Anexo {letter}')
    assert sorted(owned) == list(range(len(blocks)))
    assert len({c['identificador'] for c in chunks}) == len(chunks)
    assert sum(c['tablas'] for c in chunks) == raw['tablas']
    assert sum(c['casillas'] for c in chunks) == raw['casillas']
    result = dict(instrumento=name, chunks=chunks, temas=themes, asignacion=owned,
                  control=dict(sha256=raw['sha256'], bloques_fuente=len(blocks), cobertura_total=True, sin_solapamientos=True,
                               tablas_preservadas=raw['tablas'], casillas_preservadas=raw['casillas'], graficos_preservados=0,
                               texto_publicado_no_consolidado=True))
    save(name + '-revisado.json', result)
    print(json.dumps(dict(instrumento=name, fragmentos=len(chunks), temas=len(themes), tipos=dict(collections.Counter(c['tipo_articulo'] for c in chunks))), ensure_ascii=False))

if __name__ == '__main__':
    for source in load('fuentes.json'): prepare(source)
