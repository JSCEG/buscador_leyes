from pathlib import Path
import json, html
ROOT = Path(__file__).resolve().parent
load = lambda name: json.loads((ROOT / name).read_text(encoding='utf-8'))
esc = html.escape
loaded = (ROOT / 'VERIFICACION.json').exists()
status = 'Cargados y cotejados en Supabase' if loaded else 'Preparados y cotejados · pendientes de carga'
cards, rows = [], []
for item in load('sql-manifest.json'):
    p = load(item['name'] + '-carga.json')
    review = load(item['name'] + '-revisado.json')
    control = next(c for c in load('COTEJO-FUENTES.json') if c['instrumento'] == item['name'])
    preview = ''.join(f'<details><summary>{esc(c["identificador"])} <small>{esc(c["tipo_articulo"])}</small></summary><div class="text">{c["contenido"]}</div></details>' for c in review['chunks'])
    cards.append(f'''<article id="{esc(item['name'])}"><p class="tag">{esc(item['name'])} · DOF {p['ley']['fecha_publicacion']}</p><h2>{esc(p['ley']['titulo'])}</h2>
    <p>{item['fragmentos']} fragmentos: {len(review['chunks'])} de la fuente y una nota editorial. {control['tablas']} tablas · {control['celdas']} celdas · {control['casillas']} casillas.</p>
    <p><a href="{p['fuente']['url']}" target="_blank" rel="noopener">Fuente oficial</a> · <a href="https://buscador-leyes-jav.pages.dev/#ley-{item['ley_id']}">Abrir en el buscador</a> · <a href="{item['name']}-fuente-vista.html">Texto completo cotejado</a></p>{preview}</article>''')
    rows.append(f"| [{item['name']}](https://buscador-leyes-jav.pages.dev/#ley-{item['ley_id']}) | {item['fragmentos']} | {item['temas']} | {control['tablas']} | {control['celdas']} | {control['casillas']} |")
explanation = 'Los resolutivos y los transitorios conservan grupos separados. La Ventanilla Única conserva sus ocho capítulos y 36 numerales de segundo nivel con todos sus subnumerales e incisos. El formato y los anexos A, B y C se conservan completos. Cada documento incluye una nota editorial identificada con enlaces a los otros dos.'
md = '# Incorporación de autoconsumo\n\n'+status+' · 18 de septiembre de 2026.\n\n'+explanation+'\n\n| Instrumento | Fragmentos | Estructura | Tablas | Celdas | Casillas |\n|---|---:|---:|---:|---:|---:|\n'+'\n'.join(rows)+'\n\nControl: cobertura exacta de los 457 bloques HTML, sin solapamientos; cada celda conserva contenido, colspan y rowspan. Cotejo léxico completo con las 50 páginas oficiales (3 + 8 + 39), complementado con revisión visual. Se documentan 17 viñetas circulares como «o» en el HTML de la Ventanilla, conservadas tal como aparecen en esa fuente.\n'
if loaded:
    v = load('VERIFICACION.json')
    md += f"\nCatálogo final: {v['catalogo_despues']['leyes']} instrumentos, {v['catalogo_despues']['articulos']:,} fragmentos y {v['catalogo_despues']['temas']} entradas de estructura. Los 38 instrumentos previos se conservaron sin cambios.\n"
md += '\nEvidencia: `COTEJO-FUENTES.json`, `COTEJO-PDF.json`, `sql-manifest.json`, `TRANSACCIONES.json`, respaldos antes/después y `VERIFICACION.json`. Los SQL son registros de estas altas; no deben ejecutarse de nuevo sobre el acervo actual.\n'
(ROOT / 'INCORPORACION.md').write_text(md, encoding='utf-8')
page = f'''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Autoconsumo · revisión de incorporación</title>
<style>body{{font:16px/1.6 system-ui;background:#f8f6f3;color:#252525;margin:0}}main{{max-width:1150px;margin:auto;padding:35px 22px}}h1,h2{{color:#802342;line-height:1.2}}h1{{font-size:36px}}h2{{font-size:23px}}article{{background:white;border:1px solid #ddd;border-radius:10px;padding:24px;margin:25px 0}}a{{color:#802342}}.tag{{font-weight:700;color:#1e5b4f}}summary{{cursor:pointer;padding:12px 0;font-weight:650}}details{{border-top:1px solid #ddd}}small{{font-weight:400;color:#777}}.text{{padding:18px;overflow:auto}}table{{border-collapse:collapse;width:100%;margin:15px 0}}td,th{{border:1px solid #aaa;padding:9px;vertical-align:top;min-width:55px}}img{{max-width:100%}}.text div,.text p{{margin:5px 0}}.notice{{border-left:4px solid #a57f2c;padding:10px 20px;background:#fff}}</style>
<main><p class="tag">ACERVO ENERGÉTICO · 18 SEPTIEMBRE 2026</p><h1>Tres documentos de autoconsumo</h1><p>{status}</p><p class="notice">{explanation}</p><p><strong>63 fragmentos · 36 tablas · 1,068 celdas · 8 casillas</strong></p>{''.join(cards)}<p>La reproducción corresponde a las publicaciones identificadas. Las notas editoriales se distinguen del texto oficial y los documentos no se presentan como texto consolidado.</p></main></html>'''
(ROOT / 'INCORPORACION.html').write_text(page, encoding='utf-8')
print(status)
