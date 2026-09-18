"""Genera el informe de las trece publicaciones desde la verificación posterior."""
from pathlib import Path
import json,re,html
ROOT=Path(__file__).resolve().parent
load=lambda n:json.loads((ROOT/n).read_text(encoding='utf-8'))
v=load('VERIFICACION.json');browser=load('VERIFICACION-NAVEGADOR.json');assert browser['ok']
items=v['instrumentos'];families=list(dict.fromkeys(i['familia']for i in items))
assert len(items)==13 and sum(i['fragmentos']for i in items)==193
cards=[];mdrows=[]
for family in families:
 members=[i for i in items if i['familia']==family];rows=[]
 for i in members:
  label='Texto original'if not i['modificacion']else'Modificación '+str(i['modificacion'])
  date='/'.join(reversed(i['fecha_publicacion'].split('-')))
  rows.append(f'<tr><th scope="row">{label}<small>{date}</small></th><td>{i["fragmentos"]}</td><td><a href="/#ley-{i["ley_id"]}">Leer en buscador ↗</a><br><a href="{i["fuente"]["url"]}">DOF / SIDOF</a></td></tr>')
  mdrows.append(f'| {i["siglas"]} | {date} | {i["fragmentos"]} | {i["estructura"]} | [Fuente oficial]({i["fuente"]["url"]}) |')
 cards.append(f'<article><div class="eyebrow">{len(members)} publicaciones cargadas</div><h2>{html.escape(family)}</h2><div class="table-wrap"><table><thead><tr><th>Publicación</th><th>Fragmentos</th><th>Consulta</th></tr></thead><tbody>{"".join(rows)}</tbody></table></div></article>')
strategic=load('CONV-ESTRATEGICOS-carga.json')
double=[a for a in strategic['articulos']if a['identificador'].startswith('Numeral 17.4 ·')]
assert len(double)==2
doublelinks=' · '.join(f'<a href="/#art-{a["id"]}">{html.escape(a["identificador"])}</a>'for a in double)
style='''*{box-sizing:border-box}body{margin:0;border-top:6px solid #9b2247;background:#f5f4ee;color:#25342f;font:16px/1.6 system-ui,sans-serif}main{max-width:1240px;margin:auto;padding:40px 28px 65px}a{color:#9b2247;text-underline-offset:4px}h1{font:clamp(34px,5vw,57px)/1.12 Georgia,serif;max-width:1000px;margin:14px 0 22px}h2{font:26px/1.2 Georgia,serif;margin:12px 0 22px}h3{font-size:20px}.eyebrow{text-transform:uppercase;letter-spacing:.1em;font-size:12px;font-weight:750;color:#1e5b4f}.intro{font-size:19px;max-width:960px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:30px 0}.stat,article,.panel{background:white;border:1px solid #d9e0d8;border-radius:12px;padding:23px}.stat strong{display:block;font:43px Georgia,serif;color:#1e5b4f}.stat span,small{display:block;font-size:13px;color:#56685f}.families{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin:32px 0}.families article{padding:20px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:12px 7px;vertical-align:top;border-bottom:1px solid #d9e0d8}thead{background:#edf2ee;font-size:12px}tbody th{font-weight:600}tbody a{white-space:nowrap}.panel{margin:23px 0;border-left:5px solid #1e5b4f}.panel p:first-child{margin-top:0}.panel p:last-child{margin-bottom:0}nav{display:flex;flex-wrap:wrap;align-items:center;gap:18px;font-size:14px;margin:22px 0}.button{background:#9b2247;color:white;border-radius:7px;padding:10px 15px;text-decoration:none}.evidence{display:grid;grid-template-columns:1fr 1fr;gap:20px}details{margin:16px 0}summary{cursor:pointer;color:#1e5b4f;font-weight:650}footer{margin-top:40px;border-top:1px solid #d9e0d8;padding-top:22px;color:#56685f;font-size:13px}@media(max-width:1050px){.families{grid-template-columns:1fr}.families h2{font-size:27px}table{font-size:15px}}@media(max-width:650px){main{padding:25px 16px}.stats{grid-template-columns:1fr 1fr}.stat{padding:17px}.stat strong{font-size:35px}.evidence{grid-template-columns:1fr}.table-wrap{overflow:auto}th,td{padding:10px 5px}}@media print{.families,.evidence{display:block}article,.panel{break-inside:avoid;margin-bottom:15px}.button{color:#9b2247;background:white}}'''
page=f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Convocatorias y modificaciones incorporadas · Acervo energético</title><style>{style}</style></head><body><main>
<div class="eyebrow">Acervo energético · Carga del 17 de septiembre · Informe cerrado el 18 de septiembre de 2026</div>
<h1>Tres convocatorias.<br>Sus diez modificaciones.</h1>
<p class="intro">Las 13 publicaciones del radar ya están incorporadas al buscador. Cada una conserva su fecha, texto, calendarios y anexos, con enlaces a los demás documentos de la misma convocatoria.</p>
<nav><a class="button" href="/">Abrir buscador ↗</a><a href="../inventario-radar-2026-09-17/INVENTARIO.html">Inventario actualizado</a><a href="INCORPORACION.md">Informe en Markdown</a></nav>
<section class="stats" aria-label="Resultado"><div class="stat"><strong>38</strong><span>instrumentos en el acervo · antes 25</span></div><div class="stat"><strong>3,237</strong><span>fragmentos consultables · +193</span></div><div class="stat"><strong>831</strong><span>entradas de estructura · +187</span></div><div class="stat"><strong>104</strong><span>referencias pendientes en el radar</span></div></section>
<section class="panel"><p><strong>Versiones publicadas con fecha y procedencia.</strong> El original y cada acuerdo modificatorio se consultan por separado. Se agregó a cada registro una nota editorial que enlaza su familia completa y aclara que el texto no está consolidado ni indica que todos sus plazos permanezcan abiertos.</p><p>Las altas suman <strong>180 fragmentos de las fuentes oficiales y 13 notas editoriales</strong>. Los 25 instrumentos anteriores, sus 3,044 fragmentos y sus 644 entradas de estructura permanecen exactamente iguales.</p></section>
<section class="families">{''.join(cards)}</section>
<h2>La estructura que se conservó</h2><div class="evidence"><section class="panel"><h3>Calendarios, formularios y gráficos</h3><p>Se cotejaron completas <strong>35 tablas HTML, 1,320 celdas y nueve casillas</strong>, incluidas las celdas combinadas. También se conservaron <strong>tres tablas publicadas como imagen y una gráfica técnica</strong> con sus archivos oficiales.</p><p>Los formularios incluidos en las publicaciones conservan todos sus campos. En los tres casos donde el DOF solo remite al formulario de manifestación de interés en la VUPE, se conserva esa referencia; no se presenta como un formulario descargado.</p><nav><a href="CONV-GEN-2-fuente-vista.html">Ver fuente con tablas y gráficos</a><a href="COTEJO-FUENTES.json">Ver cotejo completo</a></nav></section>
<section class="panel"><h3>El numeral 17.4 aparece dos veces</h3><p>La convocatoria original de proyectos estratégicos contiene dos bloques numerados 17.4, también comprobados en las páginas 33 y 35 del PDF oficial. Ambos se conservaron con etiquetas que los distinguen, sin renumerar la fuente.</p><p>{doublelinks}</p><p>En los acuerdos modificatorios se conservaron las citas del texto que cambia dentro de su resolutivo. La segunda modificación de proyectos estratégicos permite consultar por separado esos textos citados, con su contexto de modificación.</p><a href="fuentes/CONV-ESTRATEGICOS-edicion.pdf#page=33">Consultar PDF oficial preservado</a></section></div>
<h2>Validación posterior a las cargas</h2><section class="panel"><ul><li>Trece transacciones individuales con cotejo de los registros insertados y respaldo completo antes y después.</li><li>Comparación exacta de los 13 instrumentos, 193 fragmentos y 187 entradas de estructura nuevos; los registros anteriores permanecen intactos.</li><li>Cero textos vacíos, índices FTS vacíos, identificadores duplicados por instrumento u órdenes duplicados.</li><li>Trece búsquedas reales con resultados. Se abrieron los 31 fragmentos con tablas o gráficos: coinciden las 35 tablas y 1,320 celdas, cargan las cuatro imágenes y se conservan las nueve casillas.</li><li>Enlaces entre versiones comprobados. Sin desbordamiento horizontal de los modales al tamaño de navegador verificado.</li><li>Lint y build de Vite correctos. La interfaz local describe el catálogo como acervo de instrumentos y versiones; no se publicó un nuevo frontend alojado.</li></ul><nav><a href="VERIFICACION.json">Cotejo de Supabase</a><a href="VERIFICACION-NAVEGADOR.json">Comprobación del buscador</a><a href="fuentes.json">Publicaciones y huellas</a><a href="imagenes.json">Imágenes oficiales preservadas</a></nav></section>
<h2>Cómo queda el inventario</h2><section class="panel"><p>Las 179 filas bibliográficas del radar v4.17 contienen 164 referencias sin repeticiones. Ahora hay <strong>104 por cotejar e incorporar</strong>, 29 cubiertas directamente, un decreto con cobertura parcial, 13 antecedentes o de efectos limitados, cuatro filas de proyectos, diez portales y tres publicaciones no localizadas.</p><p>Estos números son referencias bibliográficas, no un conteo de leyes. El corte del radar se mantiene al 14 de septiembre de 2026. Siguen pendientes otras familias como autoconsumo, cogeneración, migración de permisos, desarrollo mixto, planeación e hidrocarburos/ASEA.</p><a href="../inventario-radar-2026-09-17/INVENTARIO.html">Explorar todas las referencias y sus fuentes →</a></section>
<footer>Las fuentes originales, sus huellas SHA-256, los perfiles de extracción, cargas preparadas, transacciones y respaldos se conservan en esta carpeta. Las notas editoriales se distinguen del texto oficial. Las imágenes del buscador usan las URLs oficiales SIDOF verificadas y también tienen copia local de respaldo. La tabla general de relaciones regulatorias sigue pendiente; los enlaces entre estas versiones están incorporados en sus notas editoriales. La revisión cubre las 13 publicaciones identificadas en el radar, sin una búsqueda exhaustiva de actos posteriores a su corte.</footer>
</main></body></html>'''
(ROOT/'INCORPORACION.html').write_text(page,encoding='utf-8')
md='''# Tres convocatorias y diez modificaciones incorporadas

Cargas del 17 de septiembre de 2026; informe cerrado el 18. Radar v4.17, corte 14 de septiembre.

El acervo pasó de **25 a 38 instrumentos**, de **3,044 a 3,237 fragmentos** y de **644 a 831 entradas de estructura**. Los 25 instrumentos anteriores y todos sus registros permanecen exactamente iguales, incluidas sus fechas de creación.

| Publicación | Fecha DOF | Fragmentos | Estructura | Fuente |
|---|---|---:|---:|---|
'''+ '\n'.join(mdrows)+'''

Las altas suman 180 fragmentos procedentes de las fuentes oficiales y 13 notas editoriales. Cada nota enlaza el original y sus modificaciones e identifica la versión publicada. Los títulos incluyen la fecha DOF. No se sustituyó el original por una consolidación; el indicador booleano de vigencia se dejó sin determinación para no confundir vigencia con apertura de plazos.

## Conservación y cotejo

Se preservaron 35 tablas HTML, 1,320 celdas y nueve casillas. Los cuatro recursos gráficos oficiales incluyen tres tablas de costos/tiempos publicadas como imagen y una gráfica técnica. Se verificó el texto completo y cada celda, incluyendo rowspan y colspan, contra la fuente. Las casillas originales se inspeccionaron y sus huellas se comprobaron antes de representarlas como □.

Se preservaron los formularios efectivamente publicados. Los tres originales remiten al formato de manifestación de interés disponible en VUPE; esa remisión se conserva como referencia, no como formulario incorporado desde el portal.

La convocatoria original de proyectos estratégicos repite 17.4 en dos bloques (PDF oficial, páginas 33 y 35). Ambos permanecen con etiquetas que los distinguen; no se renumeró el texto. En la segunda modificación, los numerales citados se separan dentro del resolutivo PRIMERO y mantienen el contexto del acto modificatorio.

## Verificación

Trece transacciones individuales; cotejo exacto de cada fila contra el respaldo posterior. Cero textos vacíos, FTS vacíos, identificadores duplicados por instrumento u órdenes duplicados. Trece búsquedas reales con resultados; 31 fragmentos con tablas o gráficos abiertos en navegador y cotejados, con los cuatro gráficos cargados. Se comprobó la navegación entre versiones y la ausencia de desbordamiento horizontal al tamaño verificado. Lint y build correctos.

- [Informe navegable](INCORPORACION.html).
- [Cotejo posterior](VERIFICACION.json).
- [Cotejo independiente de fuentes completas y celdas](COTEJO-FUENTES.json).
- [Comprobación en navegador](VERIFICACION-NAVEGADOR.json).
- [Fuentes oficiales y SHA-256](fuentes.json); [imágenes preservadas](imagenes.json).
- Respaldos inmutables: `antes-verificado/` y `despues-verificado/`.
- Por publicación: `*-revisado.json`, `*-carga.json` y `*-aplicar.sql`. Las trece altas ya se ejecutaron; no volver a aplicar el SQL.

La aplicación local cambia tres textos para describir el catálogo como acervo de instrumentos y versiones. No se desplegó el frontend alojado. Los datos ya están en Supabase. La tabla general de relaciones sigue pendiente; las notas editoriales permiten navegar estas versiones sin alterar las fuentes.

## Inventario posterior

El [inventario actualizado](../inventario-radar-2026-09-17/INVENTARIO.html) conserva 179 filas y 164 referencias sin repeticiones: **104 pendientes**, 29 cubiertas directamente, una parcial, 13 antecedentes o de efectos limitados, cuatro filas de proyectos, diez portales y tres publicaciones no localizadas. Son referencias bibliográficas, no 104 leyes. Hay 34 instrumentos del catálogo representados en la sección 12 del radar y cuatro fuera de ella.

El corte bibliográfico sigue siendo 14 de septiembre de 2026. La revisión cubre las trece publicaciones identificadas en el radar, sin búsqueda exhaustiva de actos posteriores al corte. Los perfiles son específicos para estas fuentes y no sustituyen la revisión de estructuras nuevas por el parser genérico.
'''
(ROOT/'INCORPORACION.md').write_text(md,encoding='utf-8')
print(json.dumps({'informe':str(ROOT/'INCORPORACION.html'),'altas':13,'fragmentos_nuevos':193,'pendientes':104},ensure_ascii=False))
