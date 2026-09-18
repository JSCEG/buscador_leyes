"""Verifica la descarga posterior completa y genera el comprobante de corrección."""
from pathlib import Path
import json,collections,html,datetime
R=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf8'))
before=load(R/'antes-verificado/articulos.json');after=load(R/'despues-verificado/articulos.json')
laws0=load(R/'antes-verificado/leyes.json');laws1=load(R/'despues-verificado/leyes.json');themes=load(R/'despues-verificado/temas.json')
summary=load(R/'resumen-plan.json');plans=[load(R/f"{s['name']}-plan.json")for s in summary]
byid={a['id']:a for a in after};original={a['id']:a for a in before}
assert len(laws1)==12 and len(after)==1788 and len(themes)==358
assert {x['id']for x in laws1}=={x['id']for x in laws0}
checks=[]
for p in plans:
    actual=[a for a in after if a['ley_id']==p['ley_id']]
    assert len(actual)==len(p['after'])
    for expected in p['after']:
        row=byid[expected['id']]
        assert {k:v for k,v in row.items()if k!='created_at'}==expected,(p['name'],expected['identificador'])
        if row['id']in original:assert row['created_at']==original[row['id']]['created_at']
    actual_themes=sorted([{k:t[k]for k in ['nivel','nombre','orden']}for t in themes if t['ley_id']==p['ley_id']],key=lambda x:x['orden'])
    assert actual_themes==p['themes_after'],p['name']
    l0=next(l for l in laws0 if l['id']==p['ley_id']);l1=next(l for l in laws1 if l['id']==p['ley_id'])
    assert l1['fecha_publicacion']==p['date_after']
    assert {k:v for k,v in l0.items()if k!='fecha_publicacion'}=={k:v for k,v in l1.items()if k!='fecha_publicacion'}
    types=collections.Counter(a['tipo_articulo']for a in actual)
    checks.append({'instrumento':p['name'],'ley_id':p['ley_id'],'titulo':l1['titulo'],'antes':len(p['before']),'despues':len(actual),'tipos':dict(types),'temas':len(actual_themes),'fecha_publicacion':l1['fecha_publicacion'],'estado':'VERIFICADO'})
removed=set(original)-set(byid);new=set(byid)-set(original)
redirects={k:v for p in plans for k,v in p['redirects'].items()}
assert removed==set(redirects) and len(new)==44 and len(removed)==5
assert all(target in byid for target in redirects.values())
assert len(set(original)&set(byid))==1744
result={'fecha_verificacion':datetime.datetime.now(datetime.timezone.utc).isoformat(),'project':'carmfqhcfsqbzcwptqfz','instrumentos':12,'fragmentos':1788,'temas':358,'uuid_conservados':1744,'fragmentos_creados':44,'cortes_falsos_reunidos':5,'cobertura_fuente_pendiente':load(R/'cobertura-pendiente.json'),'verificaciones':checks,'redirecciones':redirects}
(R/'VERIFICACION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
rows=['| Instrumento | Antes | Ahora | Artículos / numerales | Transitorios | Índice |','|---|---:|---:|---:|---:|---:|']
for c in checks:rows.append(f"| {c['instrumento']} | {c['antes']} | {c['despues']} | {c['tipos'].get('ordinario',0)} | {c['tipos'].get('transitorio',0)} | {c['temas']} |")
md='''# Corrección aplicada al acervo — 17 de septiembre de 2026

**Los 12 instrumentos existentes están corregidos en Supabase y cotejados contra la descarga posterior. No se incorporó ningún instrumento nuevo.**

El acervo pasó de 1,749 a 1,788 fragmentos. El aumento corresponde a disposiciones que estaban fusionadas y a separar las firmas; no representa nuevas leyes. Se reconstruyeron 358 entradas de índice y se conservaron 1,744 UUID. Cinco cortes falsos se reunieron con su disposición original, con correspondencia de IDs guardada.

'''+ '\n'.join(rows)+'''

## Correcciones

- Restituidos los 33 artículos/numerales con identificación incorrecta: 29 ahora tienen fragmento propio y cuatro conservaron su UUID con numeración corregida.
- Separados tres transitorios adicionales del RLSH (Trigésimo a Trigésimo Segundo), que estaban dentro del Vigésimo Noveno. La fuente tiene **32 transitorios**; el conteo de 29 de la auditoría inicial quedó rectificado en esta comprobación.
- Reunidos los cinco cortes falsos de RLSE, LGTAIP, RLSH y SAEE. Reclasificados los preámbulos, las fórmulas de expedición y las referencias editoriales del decreto.
- Distinguidos los transitorios propios de LSE y LPTE de los del decreto de expedición; separadas las firmas en los 12 instrumentos.
- Eliminados los encabezados y pies editoriales identificados y reconstruida la jerarquía de títulos, capítulos y secciones. Los dos instrumentos sin capítulos permanecen sin índice artificial.
- Fechas corregidas: LGEC **2026-01-19**, DACG-PV **2025-10-17**, RISENER **2025-04-17**.
- En la tabla 1 del numeral 2.12 de SAEE se corrigió **IEC 62819 → IEC 62619**, cotejado con [la publicación oficial](https://sidof.segob.gob.mx/notas/docFuente/5785045). Se conservó la tabla legible.

## Comprobación y respaldo

Cada instrumento se aplicó en una transacción: bloqueo breve de escrituras, comparación de los datos con el respaldo, actualización conservando IDs, regeneración automática de FTS y comprobación posterior. Si una comprobación fallaba, la transacción completa se revertía. La primera transacción se probó con ROLLBACK antes de aplicarla. Se guardó SQL de reversión por instrumento.

Una exportación nueva, realizada después de las 12 transacciones, coincide **campo por campo** con los planes de artículos, fechas e índices. Los UUID existentes conservaron su fecha de creación. La consulta directa confirmó cero textos vacíos, cero índices FTS vacíos, cero etiquetas duplicadas y cero órdenes duplicados por instrumento.

El texto se preparó desde las fuentes oficiales descargadas en la auditoría, con perfiles y conteos por documento, y comprobación de cobertura de las líneas extraídas. No se aplicó la salida del parser genérico sin revisar. Esto no certifica la vigencia jurídica ni constituye una auditoría tipográfica exhaustiva de los PDF.

Las notas y favoritos remotos estaban vacíos; cada transacción comprobó que no hubieran aparecido referencias a los cortes retirados. El código local incluye redirecciones de los cinco IDs retirados para enlaces y favoritos locales. **Esas redirecciones requieren publicar el frontend para estar disponibles en una versión alojada; los datos de Supabase ya están actualizados.** No se realizó despliegue.

Pruebas del proyecto: **25 aprobadas**, ESLint correcto y build Vite correcto. El build mantiene avisos previos de tamaño de bundle y datos de Browserslist.

## Archivos

- `antes-verificado/`: respaldo anterior, con hashes.
- `despues-verificado/`: descarga posterior, con hashes.
- `VERIFICACION.json`: resultado de la comparación completa e IDs reunidos.
- `*-plan.json`: antes y después por fragmento.
- `*-aplicar.sql` y `*-revertir.sql`: transacciones protegidas; no ejecutarlas sin comprobar el estado esperado.
- `resultados-supabase.json`: comprobantes del conector.
- Fuentes originales: `../auditoria-cargados-2026-09-17/fuentes/`.

Las cargas nuevas siguen requiriendo revisión individual: esta reparación utiliza perfiles cotejados para estos 12 documentos y no convierte al parser genérico en una garantía de importación automática.
'''
(R/'CORRECCIONES.md').write_text(md,encoding='utf8')
cards=[]
for c,p in zip(checks,plans):
    links=[]
    oldids={a['id']for a in p['before']}
    sample=[a for a in p['after']if a['id']not in oldids and a['tipo_articulo']in ['ordinario','transitorio']][:6]
    if not sample:sample=[a for a in p['after']if a['tipo_articulo']=='ordinario'][:1]
    for a in sample:links.append(f'<a href="../../#art-{a["id"]}" target="_blank">{html.escape(a["identificador"])}</a>')
    cards.append(f'<tr><td><b>{c["instrumento"]}</b><small>{html.escape(c["titulo"])}</small></td><td>{c["antes"]} → <b>{c["despues"]}</b></td><td>{c["tipos"].get("ordinario",0)}</td><td>{c["tipos"].get("transitorio",0)}</td><td>{c["temas"]}</td><td><span>Verificado</span><small>{" · ".join(links)}</small></td></tr>')
page='''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acervo corregido y verificado</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f5ef;color:#24352f;font:15px/1.6 system-ui}main{max-width:1240px;margin:auto;padding:35px 24px}h1{font:600 38px/1.2 Georgia;max-width:850px}a{color:#832044}small{display:block;color:#69766e;font-size:12px}.eyebrow{color:#832044;letter-spacing:.1em;font-size:12px;font-weight:bold}.stats{display:flex;gap:18px;flex-wrap:wrap;margin:26px 0}.stats div{background:white;border:1px solid #dce3d9;border-radius:10px;padding:16px 25px}.stats b{display:block;font-size:28px}.notice{padding:16px 20px;background:#e7eee7;border-left:4px solid #1e5b4f}.scroll{overflow:auto}table{border-collapse:collapse;background:white;width:100%;margin:25px 0}th,td{text-align:left;padding:15px;border-bottom:1px solid #dfe4db;vertical-align:top}th{font-size:12px;text-transform:uppercase;background:#e9ece4}td:first-child{min-width:230px;max-width:380px}td span{color:#1e5b4f;font-weight:600;font-size:12px}footer{color:#6b756c;font-size:13px}@media(max-width:600px){main{padding:22px 14px}h1{font-size:30px}}</style><main><div class="eyebrow">SENER · 17 DE SEPTIEMBRE DE 2026</div><h1>Los 12 instrumentos ya están corregidos en Supabase.</h1><p>Verificación completa contra la descarga posterior. Las nuevas incorporaciones siguen pendientes.</p><div class="stats"><div><b>12</b>instrumentos corregidos</div><div><b>1,788</b>fragmentos verificados</div><div><b>358</b>entradas de índice</div><div><b>1,744</b>UUID conservados</div></div><div class="notice">Se restituyó la separación de artículos y transitorios, se corrigieron numeraciones y tres fechas, y se apartaron firmas y material editorial. <b>Cero textos vacíos, identificadores duplicados u órdenes repetidos.</b></div><p><a href="CORRECCIONES.md">Informe completo y límites</a> · <a href="VERIFICACION.json">Comprobante de verificación</a> · <a href="../../">Abrir buscador</a></p><div class="scroll"><table><thead><tr><th>Instrumento</th><th>Fragmentos</th><th>Artículos / numerales</th><th>Transitorios</th><th>Índice</th><th>Comprobación</th></tr></thead><tbody>'''+''.join(cards)+'''</tbody></table></div><p><b>Hallazgos adicionales resueltos:</b> RLSH tiene 32 transitorios; tres estaban dentro del Vigésimo Noveno. La tabla de SAEE ahora cita IEC 62619, conforme al DOF.</p><footer>Respaldo anterior y posterior, planes por UUID y transacciones de reversión conservados. Los datos ya están en Supabase. Las redirecciones de cinco enlaces antiguos están en el código local y requieren publicar el frontend para llegar a una versión alojada. No se cargó LCNE ni otro instrumento nuevo.</footer></main></html>'''
(R/'CORRECCIONES.html').write_text(page,encoding='utf8')
print(json.dumps({k:v for k,v in result.items()if k not in ['verificaciones','redirecciones']},ensure_ascii=False))
