"""Informe público derivado de las comprobaciones posteriores a la carga."""
from pathlib import Path
import json,html,re
R=Path(__file__).resolve().parent;load=lambda p:json.loads(p.read_text(encoding='utf8'));esc=html.escape
v=load(R/'VERIFICACION.json');c=v['cotejo_fuentes'];items=[]
for m in load(R/'sql-manifest.json'):
 p=load(R/(m['name']+'-carga.json'));law=p['ley'];assert any(x['ley_id']==law['id']and x['cotejo_exacto']for x in v['instrumentos'])
 items.append(dict(siglas=law['siglas'],titulo=law['titulo'],fecha=law['fecha_publicacion'],fragmentos=len(p['articulos']),url='https://buscador-leyes-jav.pages.dev/#ley-'+law['id'],fuente=law['url_original'],sha256=p['fuente']['sha256'],radar=p['fuente']['radar'],cobertura=p['fuente'].get('cobertura','cargado')))
totals={k:sum(x[k]for x in c)for k in ['tablas','celdas','graficos']}
inventory=load(R.parent/'inventario-radar-2026-09-19/INVENTARIO.json')['resumen']
data=dict(fecha='2026-09-19',catalogo_antes=v['catalogo_antes'],catalogo_despues=v['catalogo_global'],altas=items,anteriores_sin_cambios=v['registros_anteriores_sin_cambios'],recursos=totals,referencias_radar=inventory['estados_sin_repeticiones'])
(R/'INCORPORACION.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
limits=[f"Se preservaron {totals['tablas']} tablas HTML con {totals['celdas']:,} celdas, incluidas las combinadas, y {totals['graficos']} apariciones de imágenes oficiales: fórmulas, símbolos y formularios. No son 333 documentos ni gráficos independientes. Las imágenes se consultan por liga y no tienen OCR; el texto interior sólo es buscable cuando también existe como texto en la fuente.",
 'Los apartados se separaron según cada publicación: resolutivos, artículos modificados, cláusulas, disposiciones, transitorios y anexos completos. El cotejo reconstruye todo el contenido fuente sin omisiones ni solapamientos.',
 'Acceso a redes: se incorpora el acuerdo modificatorio A/025/2023, no la versión consolidada de RES/948/2015. Se conservan los corchetes y derogaciones publicados, así como los cinco anexos.',
 'Unidades de inspección: se conservan las disposiciones y los siete anexos, incluido el código de conducta. Modelos de interconexión: se preservan las 32 cláusulas del modelo de contrato y sus campos de firma.',
 'Cargos de transmisión legados: el transitorio Primero señala el 19 de octubre de 2026 como entrada en vigor. No se presenta como vigente al corte del 19 de septiembre. Los criterios de CEL de 2022 se identifican por ese periodo de obligación.',
 'No se certifica vigencia ni se construyen textos consolidados. Las notas editoriales están identificadas y separadas del texto oficial. Los 68 instrumentos anteriores permanecen idénticos en Supabase.',
 'Sólo LCNE dispone de mapa para el PDF sincronizado. Estas cargas conservan tablas y figuras en el lector de texto, pero no crean nuevos mapas de páginas. No se incorporaron PDFs ni imágenes al repositorio Git.']
pending='CENACE: se cargó el aviso de publicación, con acceso al programa oficial de 52 páginas. El programa completo, sus tablas e indicadores todavía no están indexados; RAD-081 sigue con cobertura parcial. El inventario conserva 62 referencias pendientes de cotejo y esa referencia parcial. RAD-033 sigue pendiente de localizar las bases completas de desarrollo mixto CFE.'
md=['# Electricidad, redes y mercado · 19 septiembre 2026','','**14 publicaciones y 407 fragmentos nuevos. El acervo pasa de 68 a 82 instrumentos y de 4,121 a 4,528 fragmentos.**','','| Publicación | Fragmentos | Cobertura | Fuente |','|---|---:|---|---|']
cards=[]
for i in items:
 scope='Aviso cargado · programa pendiente' if i['cobertura']=='parcial' else 'Publicación cotejada'
 md.append(f"| [{i['siglas']}]({i['url']}) · {i['titulo']} | {i['fragmentos']} | {scope} | [Oficial]({i['fuente']}) |")
 cards.append(f'<article data-search="{esc((i["siglas"]+" "+i["titulo"]).lower())}"><p class="tag">{i["radar"]} · {scope}</p><h2>{esc(i["siglas"])}</h2><p>{esc(i["titulo"])}</p><small>{i["fecha"]} · {i["fragmentos"]} fragmentos</small><nav><a href="{i["url"]}">Abrir en el acervo →</a><a href="{i["fuente"]}" target="_blank" rel="noopener noreferrer">Fuente oficial ↗</a></nav></article>')
md+=['','## Alcance','']+['- '+s for s in limits]+['','## Pendientes','',pending,'','[Programa CENACE oficial](https://dof.gob.mx/2026/CENACE/ProgramaInstitucional.pdf) · [Inventario actualizado](../inventario-radar-2026-09-19/INVENTARIO.html)']
(R/'INCORPORACION.md').write_text('\n'.join(md)+'\n',encoding='utf8')
previous=(R.parent/'incorporacion-pendientes-2026-09-19/INCORPORACION.html').read_text(encoding='utf8')
style=re.search(r'<style>(.*?)</style>',previous,re.S).group(1)
page='<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Electricidad · 14 incorporaciones verificadas</title><style>'+style+'</style><main><header><p class="tag">Secretaría de Energía · Revisión del acervo · 19 septiembre 2026</p><h1>Electricidad, redes y mercado</h1><p><strong>14 publicaciones incorporadas · 407 fragmentos nuevos</strong></p><p>El acervo ahora contiene <strong>82 instrumentos y 4,528 fragmentos</strong>. Los 68 instrumentos anteriores permanecen sin cambios. Esta entrega cubre 13 referencias completas del radar y el aviso del programa CENACE, cuya cobertura sigue parcial.</p><a href="/#acervo">Abrir el acervo</a> · <a href="../inventario-radar-2026-09-19/INVENTARIO.html">Consultar inventario completo</a></header>'
page+='<section class="note"><h2>Qué queda pendiente</h2><p>'+esc(pending)+'</p><a href="https://dof.gob.mx/2026/CENACE/ProgramaInstitucional.pdf">Programa CENACE oficial ↗</a></section><label for="f">Filtrar las incorporaciones</label><input id="f" type="search" placeholder="Nombre, siglas o tema…"><p id="count" role="status">14 publicaciones</p><div class="grid">'+''.join(cards)+'</div><section class="note"><h2>Alcance y comprobaciones</h2><ul>'+''.join('<li>'+esc(x)+'</li>'for x in limits)+'</ul></section><p><a href="INCORPORACION.json">Evidencia en JSON</a> · <a href="INCORPORACION.md">Resumen en texto</a></p></main><script>const norm=s=>s.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLocaleLowerCase("es");document.getElementById("f").addEventListener("input",e=>{const q=norm(e.target.value);let n=0;document.querySelectorAll("article").forEach(a=>{a.hidden=!norm(a.dataset.search).includes(q);if(!a.hidden)n++});document.getElementById("count").textContent=n+" publicaciones"})</script></html>'
(R/'INCORPORACION.html').write_text(page,encoding='utf8')
public=R.parents[1]/'public/revision-acervo'/R.name;public.mkdir(parents=True,exist_ok=True)
for n in ['INCORPORACION.html','INCORPORACION.md','INCORPORACION.json']:(public/n).write_bytes((R/n).read_bytes())
print(json.dumps(dict(incorporados=len(items),fragmentos=sum(x['fragmentos']for x in items),**totals),ensure_ascii=False))
