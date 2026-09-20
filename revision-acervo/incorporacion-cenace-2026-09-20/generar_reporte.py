"""Informe reproducible de la carga cotejada; no publica archivos fuente ni copias del PDF."""
from pathlib import Path
import html
import json
import re

R = Path(__file__).resolve().parent
load = lambda p: json.loads(p.read_text(encoding='utf8'))
esc = html.escape
v = load(R / 'VERIFICACION.json')
p = load(R / 'PROGRAMA-CENACE-carga.json')
assert v['cotejo_exacto'] and v['fuente']['mapa_coincide']
base = 'https://buscador-leyes-jav.pages.dev/'
law_url = base + '#ley-' + p['ley']['id']
inventory = load(R.parent / 'inventario-radar-2026-09-20/INVENTARIO.json')
examples = [
    ('Mapas y diagnóstico', '6.1.3. Causas y efectos del problema', 'Abre PDF original y selecciona la página 18 para consultar los mapas, o la 19 para ver la gráfica.'),
    ('Gráficas y datos rotulados', '7.1. Relevancia del Objetivo', 'Consulta las gráficas de las páginas 32 y 33. El texto incluye dos tablas auxiliares, identificadas como ayudas de lectura.'),
    ('Indicadores completos', 'Indicador 1.1 y sus metas', 'La ficha y sus metas permanecen juntas. En Texto y PDF puedes recorrer sus dos páginas: 44 y 45.'),
]
items = []
for title, label, detail in examples:
    article = next(x for x in p['articulos'] if x['identificador'] == label)
    items.append(dict(titulo=title,apartado=label,detalle=detail,url=base+'#art-'+article['id']))
limits = [
    'El PDF oficial tiene 52 páginas. Se incorporaron 32 apartados y una nota editorial, con cinco estrategias y cuatro indicadores completos. La contraportada no contiene texto normativo.',
    'Se cotejaron 20 tablas y 429 celdas, conservando las celdas combinadas y el texto extraíble. Los indicadores de dos páginas no se dividieron en fichas independientes.',
    'Los mapas de la página 18 y las gráficas de las páginas 19, 32 y 33 se consultan en el PDF original. El detalle interno de los mapas y de la gráfica de la página 19 no tiene OCR. No se presenta como texto buscable todo el contenido de esas imágenes.',
    'Las dos tablas auxiliares de las páginas 32 y 33 transcriben únicamente cifras rotuladas en las gráficas y están señaladas como ayudas editoriales. No se estiman valores de la serie TOTAL.',
    'Los 32 apartados oficiales tienen páginas sincronizadas. La nota editorial no tiene página oficial. La LCNE conserva sus 48 fragmentos sincronizados: ahora hay dos fuentes y 80 correspondencias.',
    'El lector consulta el PDF mediante la liga oficial y comprueba la huella de la edición. No se añadieron PDFs ni imágenes a Git. Si cambia el archivo, la sincronización se detiene para evitar un resaltado equivocado.',
    'La fecha de la ficha corresponde al aviso de publicación del 30 de abril de 2026. Se enlazaron el aviso y el programa, y sólo se actualizó la nota editorial del aviso; el resto de los registros anteriores permanece idéntico. No se certifica vigencia ni se elabora un texto consolidado.',
]
pending = 'RAD-081 pasa de cobertura parcial a completa. El radar v4.18 conserva su corte documental del 18 de septiembre: 73 referencias cargadas y 62 pendientes de cotejo. Esas 62 referencias requieren revisar fuentes y alcance; no equivalen a 62 leyes listas para importar. Los antecedentes, portales, proyectos y publicaciones no localizadas siguen separados.'
data = dict(fecha='2026-09-20',instrumento=p['ley'],catalogo_antes=v['catalogo_antes'],catalogo_despues=v['catalogo_despues'],cotejo=v['fuente'],fuente=p['fuente'],ejemplos=items,alcance=limits,referencias_radar=inventory['resumen']['estados_sin_repeticiones'])
(R/'INCORPORACION.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
md = ['# Programa CENACE completo · 20 septiembre 2026','','**33 fragmentos nuevos · 32 apartados con PDF sincronizado.**','','El acervo queda en **83 instrumentos y 4,561 fragmentos**.','','[Abrir programa]('+law_url+') · [PDF oficial]('+p['fuente']['url']+')','','## Prueba el lector','']
md += ['- ['+x['titulo']+']('+x['url']+'): '+x['detalle'] for x in items]
md += ['','## Alcance y comprobaciones','']+['- '+x for x in limits]+['','## Pendientes','',pending,'','[Inventario al 20 de septiembre](../inventario-radar-2026-09-20/INVENTARIO.html)']
(R/'INCORPORACION.md').write_text('\n'.join(md)+'\n',encoding='utf8')
prior=(R.parent/'incorporacion-electricidad-2026-09-19/INCORPORACION.html').read_text(encoding='utf8')
style=re.search(r'<style>(.*?)</style>',prior,re.S).group(1)
cards=''.join('<article><p class="tag">PDF oficial sincronizado</p><h2>'+esc(x['titulo'])+'</h2><p>'+esc(x['detalle'])+'</p><nav><a href="'+esc(x['url'])+'">Abrir ejemplo →</a></nav></article>'for x in items)
page='<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Programa CENACE · incorporación completa</title><style>'+style+'</style><main><header><p class="tag">Secretaría de Energía · Revisión del acervo · 20 septiembre 2026</p><h1>Programa CENACE completo</h1><p><strong>33 fragmentos nuevos · 32 apartados con PDF sincronizado</strong></p><p>El acervo queda en <strong>83 instrumentos y 4,561 fragmentos</strong>. El programa, sus cinco estrategias y sus cuatro indicadores ya se pueden buscar y consultar junto al original.</p><a href="'+law_url+'">Abrir programa en el acervo</a> · <a href="'+p['fuente']['url']+'">PDF oficial ↗</a></header><div class="grid">'+cards+'</div><section class="note"><h2>Alcance y comprobaciones</h2><ul>'+''.join('<li>'+esc(x)+'</li>'for x in limits)+'</ul></section><section class="note"><h2>Qué queda pendiente</h2><p>'+esc(pending)+'</p><a href="../inventario-radar-2026-09-20/INVENTARIO.html">Consultar inventario actualizado →</a></section><p><a href="INCORPORACION.json">Evidencia en JSON</a> · <a href="INCORPORACION.md">Resumen en texto</a> · <a href="/#acervo">Volver al acervo</a></p></main></html>'
(R/'INCORPORACION.html').write_text(page,encoding='utf8')
public=R.parents[1]/'public/revision-acervo'/R.name
public.mkdir(parents=True,exist_ok=True)
for name in ['INCORPORACION.html','INCORPORACION.md','INCORPORACION.json']:
    (public/name).write_bytes((R/name).read_bytes())
print('Informe CENACE generado: 33 fragmentos, 32 apartados sincronizados.')
