"""Informe local reproducible a partir del cotejo posterior; no escribe en Supabase."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parent
load = lambda name: json.loads((ROOT / name).read_text(encoding='utf-8'))
verification = load('VERIFICACION.json')
browser = load('VERIFICACION-NAVEGADOR.json')
tables = load('COTEJO-TABLAS.json')
assert browser['ok'] and all(i['cotejo_exacto'] for i in verification['instrumentos'])
assert verification['catalogo_despues'] == dict(leyes=25, articulos=3044, temas=644)
summaries = {
    'RLBio': [
        'Desarrolla la Ley de Biocombustibles mediante reglas sobre coordinación, planeación, investigación y permisos de producción, almacenamiento, transporte, distribución, comercialización, expendio, importación y exportación. Incluye procedimientos ante SENER y SADER, obligaciones de titulares y el sistema de información del sector.',
        'También contiene disposiciones de protección ambiental, verificación, supervisión, medidas de seguridad, sanciones y participación social. Se incorporaron sus 116 artículos y diez transitorios, con títulos, capítulos y secciones; el preámbulo y las firmas quedaron separados.'
    ],
    'RLGeo': [
        'Desarrolla las modalidades de aprovechamiento de los recursos geotérmicos: exploración, concesiones de explotación, concesiones de agua, permisos para usos diversos y aprovechamientos exentos. Incluye planeación, innovación y los trámites relacionados con permisos y concesiones.',
        'Su estructura también comprende información del subsuelo, revocación, terminación, rescate, reasignación, inspección, verificación y sanciones. Se conservaron los 100 artículos, diez transitorios y 32 encabezados de estructura, sin confundir referencias internas con nuevos artículos.'
    ],
    'RLEPECFE': [
        'Regula aspectos de la Comisión Federal de Electricidad como empresa pública del Estado: integración del Consejo de Administración, conflictos de interés, comités, remuneraciones, vigilancia y auditoría. Desarrolla además su régimen especial y los mecanismos de evaluación.',
        'La incorporación comprende 82 artículos, ocho transitorios del decreto y la fe de erratas publicada el 29 de diciembre de 2025. El tercer párrafo del artículo 68 usa la denominación corregida Comisión Federal de Electricidad; la publicación de la fe de erratas se conserva como complemento trazable.'
    ],
    'RLEPEPM': [
        'Regula aspectos de Petróleos Mexicanos como empresa pública del Estado, la organización de su Consejo de Administración, comités, vigilancia y auditoría. Desarrolla su régimen especial en materias como filiales, adquisiciones, responsabilidades, presupuesto, deuda y sostenibilidad.',
        'Incluye evaluación, alianzas estratégicas, esquemas para desarrollo mixto, asociaciones y contratos mixtos. Se incorporaron sus 81 artículos y siete transitorios del decreto, manteniendo los encabezados de capítulos y secciones y separando las firmas del articulado.'
    ],
    'DACG-PERMISOS-GA': [
        'Establece términos legales, técnicos y financieros para solicitar el otorgamiento y modificación de permisos de generación y almacenamiento de energía eléctrica, así como su vigencia. Se respetaron los 71 numerales y subnumerales de su estructura original.',
        'La carga conserva cinco transitorios, instrucciones de llenado y seis formatos completos, CNE_ELECTRICIDAD_01 a CNE_ELECTRICIDAD_06. Las tablas, celdas combinadas y casillas se cotejaron contra la fuente oficial; los números de campos de los formularios no se trataron como artículos.'
    ],
    'FORMATOS-SAEE': [
        'El acuerdo de 22 de mayo de 2026 emite los formatos referidos en las DACG para la integración de Sistemas de Almacenamiento de Energía Eléctrica al Sistema Eléctrico Nacional. Complementa el instrumento de integración SAEE que ya estaba en el catálogo.',
        'Se conservaron el resolutivo Único, el transitorio, las instrucciones y los tres formatos completos CNE_ELECTRICIDAD_09, CNE_ELECTRICIDAD_10 y CNE_ELECTRICIDAD_11. Cada formato ocupa un fragmento con todas sus tablas y campos, sin cortes falsos provocados por su numeración interna.'
    ]
}
cards, rows, md = [], [], []
for instrument in verification['instrumentos']:
    name = instrument['siglas']
    payload = load(f'{name}-carga.json')
    prepared = load(f'{name}-revisado.json')
    prepared['metadatos_editoriales'] = {'resumen': '\n\n'.join(summaries[name]), 'naturaleza': 'Resumen de orientación; separado del texto normativo.'}
    (ROOT / f'{name}-revisado.json').write_text(json.dumps(prepared, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    source = instrument['fuente']
    date = '/'.join(reversed(instrument['fecha_publicacion'].split('-')))
    if name.startswith('R'):
        pdf = f'fuentes/{name}.pdf'
    else:
        pdf = f'fuentes/{name}-edicion.pdf#page={13 if name == "DACG-PERMISOS-GA" else 60}'
    paragraphs = ''.join(f'<p>{escape(p)}</p>' for p in summaries[name])
    link = f'/#ley-{instrument["ley_id"]}'
    forms = [a for a in payload['articulos'] if a['identificador'].startswith('CNE_ELECTRICIDAD_')]
    form_links = ''.join(f'<li><a href="/#art-{a["id"]}">{escape(a["identificador"])}</a></li>' for a in forms)
    extra = f'<details><summary>Consultar {len(forms)} formatos completos</summary><ul>{form_links}</ul></details>' if forms else ''
    cards.append(f'''<article><div class="eyebrow">{escape(name)} · {date}</div><h3>{escape(instrument['titulo'])}</h3>
      <div class="metrics">{instrument['fragmentos']} fragmentos · {instrument['estructura']} entradas de estructura</div>{paragraphs}
      <nav><a class="button" href="{link}">Abrir en el buscador ↗</a><a href="{escape(source['url'])}">Publicación oficial</a><a href="{pdf}">PDF de cotejo</a></nav>{extra}</article>''')
    types = instrument['tipos']
    rows.append(f'<tr><th scope="row">{name}</th><td>{types.get("ordinario",0)}</td><td>{types.get("transitorio",0)}</td><td>{types.get("anexo",0)}</td><td>{instrument["fragmentos"]}</td></tr>')
    md.append(f'| {name} | {instrument["fragmentos"]} | {instrument["estructura"]} | [{date}]({source["url"]}) |')

html = '''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Seis incorporaciones verificadas · Acervo energético</title><style>
:root{--wine:#9b2247;--green:#1e5b4f;--ink:#25342f;--muted:#56685f;--line:#d9e0d8;--paper:#f5f4ee}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 system-ui,sans-serif;border-top:6px solid var(--wine)}main{max-width:1180px;margin:auto;padding:40px 28px 70px}a{color:var(--wine);text-underline-offset:4px}h1,h2,h3{line-height:1.18}h1{font:clamp(34px,5vw,58px)/1.07 Georgia,serif;max-width:900px;margin:16px 0 22px}h2{font:32px/1.2 Georgia,serif;margin:42px 0 20px}h3{font-size:21px;margin:12px 0}.eyebrow{font-size:12px;font-weight:750;letter-spacing:.12em;text-transform:uppercase;color:var(--green)}.intro{font-size:19px;max-width:850px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:30px 0}.stat,article,.note{background:white;border:1px solid var(--line);border-radius:12px;padding:24px}.stat strong{display:block;color:var(--green);font:42px Georgia,serif}.stat span{color:var(--muted);font-size:14px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}article p{font-size:14px}.metrics{color:var(--green);font-weight:650;font-size:14px}nav{display:flex;flex-wrap:wrap;align-items:center;gap:14px;font-size:14px;margin:20px 0 0}.button{background:var(--wine);color:white;padding:10px 15px;text-decoration:none;border-radius:7px}.note{border-left:5px solid var(--green)}.note p:first-child{margin-top:0}.note p:last-child{margin-bottom:0}.tablewrap{overflow:auto;background:white;border-radius:12px;border:1px solid var(--line)}table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:13px 18px;text-align:left;border-bottom:1px solid var(--line)}thead{background:#eaf0ea}details{margin-top:20px}summary{cursor:pointer;color:var(--green);font-weight:650}footer{border-top:1px solid var(--line);margin-top:40px;padding-top:20px;color:var(--muted);font-size:13px}@media(max-width:760px){main{padding:24px 18px}.grid{grid-template-columns:1fr}.stats{grid-template-columns:1fr 1fr}.stat{padding:18px}.stat strong{font-size:34px}}@media print{.grid{display:block}article{break-inside:avoid;margin-bottom:15px}.button{background:white;color:var(--wine)}}
</style></head><body><main>
<div class="eyebrow">Buscador de Leyes · Incorporación del 17 de septiembre de 2026</div>
<h1>Reglamentos y almacenamiento,<br>ya integrados al acervo.</h1>
<p class="intro">Se incorporaron los seis instrumentos del siguiente bloque, uno por uno, con cotejo de texto, estructura y datos guardados. Los 19 instrumentos anteriores conservaron íntegros sus registros.</p>
<nav><a class="button" href="/">Abrir buscador ↗</a><a href="../inventario-radar-2026-09-17/INVENTARIO.html">Ver inventario completo</a><a href="INCORPORACION.md">Descargar informe en Markdown</a></nav>
<section class="stats" aria-label="Resultado de la incorporación"><div class="stat"><strong>25</strong><span>instrumentos en el acervo · antes 19</span></div><div class="stat"><strong>3,044</strong><span>fragmentos consultables · +517</span></div><div class="stat"><strong>644</strong><span>entradas de estructura · +150</span></div><div class="stat"><strong>9</strong><span>formularios completos incorporados</span></div></section>
<section class="note"><p><strong>La numeración se conservó según cada documento.</strong> Los cuatro reglamentos suman 379 artículos y 35 transitorios. Las DACG tienen 71 numerales y subnumerales, cinco transitorios y seis formatos. El acuerdo SAEE incluye un resolutivo Único, un transitorio y tres formatos.</p><p>Las 130 tablas, 2,073 celdas y 115 casillas de las dos publicaciones de almacenamiento se cotejaron completas. Cada formulario se conserva como una unidad; sus campos numerados no se convirtieron en artículos.</p></section>
<h2>Los seis instrumentos</h2><section class="grid">__CARDS__</section>
<h2>Fe de erratas de CFE</h2><section class="note"><p>Se aplicó al tercer párrafo del artículo 68 la corrección publicada el 29 de diciembre de 2025: «Comisión Federal de Electricidad». Se conservó además la fe de erratas como documento complementario dentro del mismo reglamento.</p><nav><a href="/#art-44c39145-e179-54b9-ae57-976584132b5a">Leer artículo 68</a><a href="/#art-a0f7383d-eecf-54c0-b95b-171e439f2dfe">Leer fe de erratas</a><a href="https://sidof.segob.gob.mx/notas/docFuente/5777392">Fuente oficial</a></nav></section>
<h2>Comprobaciones realizadas</h2><div class="tablewrap"><table><thead><tr><th>Instrumento</th><th>Artículos / numerales</th><th>Transitorios</th><th>Anexos</th><th>Total de fragmentos</th></tr></thead><tbody>__ROWS__</tbody></table></div><p>El total incluye preámbulos, índice, firmas y fe de erratas, según el documento. Los anexos incluyen nueve formularios y dos bloques de instrucciones.</p>
<ul><li>Cotejo exacto de los seis instrumentos y todos sus fragmentos contra el respaldo descargado después de la carga.</li><li>Los 19 instrumentos, 2,527 fragmentos y 494 entradas de estructura previos permanecen iguales, incluidas sus fechas de creación.</li><li>Cero textos vacíos, índices de búsqueda vacíos, identificadores duplicados por instrumento u órdenes duplicados.</li><li>Seis búsquedas reales con resultados; nueve formularios abiertos en el buscador, con coincidencia de tablas, celdas y casillas y sin desbordamiento horizontal en el tamaño comprobado.</li></ul>
<nav><a href="VERIFICACION.json">Cotejo posterior de Supabase</a><a href="COTEJO-TABLAS.json">Cotejo de tablas</a><a href="VERIFICACION-NAVEGADOR.json">Comprobación en navegador</a><a href="fuentes.json">Fuentes y huellas SHA-256</a><a href="revision-visual/formato09-buscador.png">Captura del formato 09</a></nav>
<h2>Cómo queda el inventario</h2><section class="note"><p><strong>117 referencias por cotejar e incorporar.</strong> El inventario conserva las 179 filas de «Ligas de interés» del radar v4.17, con corte al 14 de septiembre de 2026; al separar 15 repeticiones quedan 164 referencias. Estos conteos son bibliográficos y no equivalen a 117 leyes.</p><p>Hay 16 referencias cubiertas directamente, un decreto con cobertura parcial, 13 antecedentes o de efectos limitados, cuatro filas de proyectos, diez portales y tres publicaciones no localizadas en el radar. La fe de erratas explica que seis instrumentos nuevos cubran siete referencias adicionales.</p><p><strong>Siguiente bloque propuesto:</strong> las 13 piezas de las tres convocatorias de generación: tres originales y diez modificaciones, preservando sus calendarios y anexos.</p><a href="../inventario-radar-2026-09-17/INVENTARIO.html">Consultar familias, estados y fuentes del inventario →</a></section>
<footer>Las cargas usan perfiles específicos cotejados para estas fuentes; no sustituyen la revisión del parser genérico ante estructuras nuevas. Los temas transversales editoriales y las relaciones entre instrumentos siguen siendo trabajo separado. Los datos ya están en Supabase; no se desplegó una nueva versión del frontend. Los originales, cargas preparadas y respaldos se conservan en esta carpeta.</footer>
</main></body></html>'''.replace('__CARDS__', ''.join(cards)).replace('__ROWS__', ''.join(rows))
(ROOT/'INCORPORACION.html').write_text(html, encoding='utf-8')
report = '''# Seis incorporaciones verificadas — 17 de septiembre de 2026

El acervo pasó de **19 a 25 instrumentos**, de **2,527 a 3,044 fragmentos** y de **494 a 644 entradas de estructura**. Los registros anteriores permanecen exactamente iguales, incluidas sus fechas de creación.

| Instrumento | Fragmentos | Estructura | Publicación oficial |
|---|---:|---:|---|
'''+'\n'.join(md)+'''

Los cuatro reglamentos suman 379 artículos y 35 transitorios. Las DACG de permisos conservan 71 numerales, cinco transitorios y seis formularios; el acuerdo SAEE conserva el resolutivo Único, un transitorio y tres formularios. Los 517 fragmentos añadidos incluyen preámbulos, índice, anexos, firmas y fe de erratas.

Se aplicó la fe de erratas de CFE de 29 de diciembre de 2025 al tercer párrafo del artículo 68. La fe de erratas permanece como documento complementario del reglamento, no como un séptimo instrumento.

Las dos publicaciones de almacenamiento conservan **130 tablas, 2,073 celdas y 115 casillas**. Se cotejó el texto completo y la estructura de cada celda, incluidas las combinadas. Las 115 imágenes de casillas vacías fueron descargadas, cotejadas por huella y representadas como □; no se eliminaron campos de los formularios.

El cotejo posterior es exacto contra los seis payloads. Se verificaron cero textos vacíos, índices FTS vacíos, identificadores duplicados por instrumento y órdenes duplicados. Seis búsquedas reales devolvieron resultados y los nueve formularios se abrieron en el buscador: tablas, celdas y casillas coinciden, sin desbordamiento horizontal en el tamaño comprobado. No se ejecutó de nuevo la suite de aplicación porque esta incorporación no modifica su código.

## Evidencia

- [Informe navegable](INCORPORACION.html).
- [Cotejo posterior y conservación del acervo anterior](VERIFICACION.json).
- [Cotejo completo de tablas](COTEJO-TABLAS.json).
- [Comprobación en navegador](VERIFICACION-NAVEGADOR.json).
- [Fuentes oficiales y huellas](fuentes.json).
- Respaldos completos: `antes-verificado/` y `despues-verificado/`.
- Por instrumento: `*-revisado.json`, `*-carga.json`, `*-aplicar.sql` y fuentes originales en `fuentes/`.

## Pendientes y alcance

El [inventario actualizado](../inventario-radar-2026-09-17/INVENTARIO.html) cruza los 25 instrumentos con las 179 filas del radar v4.17 (corte 14 de septiembre). Se conservan 164 referencias sin repeticiones: 117 por cotejar e incorporar, 16 cubiertas directamente, un decreto con cobertura parcial, 13 antecedentes o de efectos limitados, cuatro filas de proyectos, diez portales y tres publicaciones no localizadas. No son 117 leyes por subir.

Siguiente bloque propuesto: 13 piezas de las tres convocatorias de generación (tres originales y diez modificaciones), con calendarios y anexos. Los perfiles usados están cerrados a estas fuentes; el parser genérico, las relaciones y los temas transversales no se amplían automáticamente. Los datos ya están en Supabase y no se desplegó un nuevo frontend.

## Resúmenes de orientación

'''
for instrument in verification['instrumentos']:
    report += f'### {instrument["titulo"]}\n\n'+'\n\n'.join(summaries[instrument['siglas']])+'\n\n'
(ROOT/'INCORPORACION.md').write_text(report, encoding='utf-8')
print(json.dumps({'informe': str(ROOT/'INCORPORACION.html'), 'instrumentos': 6, 'fragmentos_nuevos': 517, 'formularios': 9}, ensure_ascii=False))
