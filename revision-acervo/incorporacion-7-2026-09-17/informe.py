"""Informe de las incorporaciones ya verificadas, con enlaces al lector y fuentes."""
from pathlib import Path
import json,html
ROOT=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf8'))
v=load(ROOT/'VERIFICACION.json');e=html.escape
rows=[];sections=[];md=[]
for s in v['instrumentos']:
    name=s['siglas'];p=load(ROOT/f'{name}-carga.json');review=load(ROOT/f'{name}-revisado.json')
    url='/#ley-'+s['ley_id'];source=s['fuente']['url']
    cells=[f'<a href="{url}">{e(name)}</a>',str(s['ordinarios']),str(s['transitorios_ley']),str(s['transitorios_decreto']),str(s['complementos']),str(s['fragmentos'])]
    rows.append('<tr>'+''.join('<td>'+x+'</td>'for x in cells)+'</tr>')
    md.append(f"| {name} | {s['ordinarios']} | {s['transitorios_ley']} | {s['transitorios_decreto']} | {s['complementos']} | {s['fragmentos']} |")
    entries=[]
    for a,r in zip(p['articulos'],review['chunks']):
        pages=r.get('paginas',[]);local='fuentes/'+name+('.html'if name=='RICNE'else'.pdf')+('#page='+str(pages[0])if pages else'')
        hierarchy=' / '.join(a[k]for k in ['titulo_nombre','capitulo_nombre','seccion_nombre']if a[k])
        entries.append(f'<details class="chunk"><summary>{e(a["identificador"])} <small>{e(a["tipo_articulo"])}</small></summary><p class="muted">{e(hierarchy)}</p><p><a href="/#art-{a["id"]}">Abrir en el buscador</a> · <a href="{local}">Ver fuente'+(' · páginas '+', '.join(map(str,pages))if pages else'')+f'</a></p><div class="texto">{e(a["contenido"])}</div></details>')
    sections.append(f'<section id="{name}"><h2>{e(s["titulo"])}</h2><p><a href="{url}">Abrir instrumento</a> · <a href="{e(source)}">Fuente oficial</a> · <a href="{name}-revisado.json">Trazabilidad y revisión</a></p><p>{s["fragmentos"]} fragmentos cotejados; {s["estructura"]} entradas de estructura.</p><details><summary>Consultar todos los fragmentos</summary>'+''.join(entries)+'</details></section>')
intro='Los siete instrumentos se cargaron uno por uno en Supabase y se cotejaron campo por campo con el respaldo posterior. El catálogo tiene 19 instrumentos y 2,527 fragmentos. Los 12 instrumentos, 1,788 fragmentos y 358 temas anteriores permanecen intactos.'
notes='Se distinguieron los transitorios de cada ley de los del decreto. Se conservaron preámbulos, referencias editoriales y firmas como documentos separados. La LCNE incluye la nota de invalidez del artículo 22 y los documentos de la SCJN. Las secciones de CFE y Pemex conservan sus nombres y pertenencia en la base.'
limits='La cobertura textual coteja todas las líneas extraídas de las fuentes fijadas por SHA-256; la inspección visual se hizo sobre páginas clave, no sobre cada carácter de cada página. Las fuentes se descargaron el 17 de septiembre de 2026. Este control no sustituye la evaluación jurídica de vigencia. Los perfiles son específicos de estas versiones y no certifican el parser genérico.'
page='''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Siete instrumentos incorporados · SENER</title><style>
*{box-sizing:border-box}body{font:16px/1.6 system-ui,sans-serif;color:#222;background:#f4f5f4;margin:0}main{max-width:1120px;margin:auto;padding:36px 24px}h1{color:#71203b;font-size:2.3rem;line-height:1.15}h2{font-size:1.35rem}a{color:#176452}section,.card{background:white;border:1px solid #ddd;border-radius:12px;padding:24px;margin:20px 0}.tag{color:#176452;font-weight:700}.table{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left}td,th{padding:12px;border-bottom:1px solid #ddd}th{font-size:13px;background:#f7f3f4}summary{cursor:pointer;font-weight:650;padding:10px 0}.chunk{border-top:1px solid #ddd;padding:4px 8px}.texto{white-space:pre-wrap;font:17px/1.8 Georgia,serif;padding:18px;background:#fcfbf8}small,.muted{color:#66706a;font-size:13px}.muted{word-break:break-word}nav a{margin-right:16px}footer{font-size:13px;color:#555;margin-top:30px}
</style><main><a href="/">← Volver al buscador</a><p class="tag">CARGADOS Y COTEJADOS · 17 DE SEPTIEMBRE DE 2026</p><h1>Siete instrumentos incorporados</h1>'''
page+=f'<p>{intro}</p><div class="card"><strong>739 fragmentos nuevos</strong> · 601 artículos · 116 transitorios · 22 preámbulos y complementos<p>{notes}</p></div><div class="table"><table><thead><tr><th>Instrumento</th><th>Artículos</th><th>Transitorios de ley</th><th>Transitorios de decreto</th><th>Otros</th><th>Total</th></tr></thead><tbody>'+''.join(rows)+'</tbody></table></div><p><small>RICNE contiene los ocho transitorios del decreto que expide el reglamento. «Otros» incluye preámbulos y documentos complementarios.</small></p><nav>'+''.join(f'<a href="#{s["siglas"]}">{s["siglas"]}</a>'for s in v['instrumentos'])+'</nav>'+''.join(sections)
page+='<section><h2>Comprobaciones</h2><p>Secuencias de artículos y ordinales; cobertura sin huecos ni solapamientos; estructura de títulos, capítulos y secciones; cotejo exacto de los 739 registros nuevos y 136 temas; preservación de todos los registros anteriores. Supabase confirmó cero contenidos o índices FTS vacíos. Las siete búsquedas de prueba devolvieron resultados desde el módulo real de la aplicación.</p><p><a href="VERIFICACION.json">Resultado del cotejo</a> · <a href="fuentes.json">Fuentes y hashes</a> · <a href="antes/snapshot.json">Respaldo anterior</a> · <a href="despues/snapshot.json">Respaldo posterior</a></p></section><footer>'+limits+'</footer></main></html>'
(ROOT/'INCORPORACION.html').write_text(page,encoding='utf8')
markdown='# Siete instrumentos incorporados\n\n'+intro+'\n\n| Instrumento | Artículos | Transitorios de ley | Del decreto | Otros | Total |\n|---|---:|---:|---:|---:|---:|\n'+'\n'.join(md)+'\n\n'+notes+'\n\n'+limits+'\n\nEstado: cargas completadas y cotejadas. Ver `VERIFICACION.json`, `antes/`, `despues/` y `fuentes.json`.\n'
(ROOT/'INCORPORACION.md').write_text(markdown,encoding='utf8')
print('Informe generado')
