from pathlib import Path
import json,re,hashlib
ROOT=Path(__file__).resolve().parent
old=ROOT.parent/'LCNE'
assert hashlib.sha256((ROOT/'fuentes/LCNE.pdf').read_bytes()).hexdigest()==json.loads((old/'LCNE_control_calidad.json').read_text(encoding='utf8'))['pdf_sha256']
j=json.loads((old/'LCNE_chunks_revisados.json').read_text(encoding='utf8'))
p=json.loads((old/'LCNE_preparacion_supabase.json').read_text(encoding='utf8'))
chunks=[]
for a in sorted(j['articulos']+j['material_complementario'],key=lambda x:min(x['lineas_origen'])):
    label=a['articulo_label'];kind=a['tipo_articulo'];body=a['texto']
    if kind=='ordinario':body=re.sub(r'^Artículo \d+\.-\s*','',body)
    if kind=='transitorio':
        body=re.sub(r'^[^.]+\.(?:-)?\s*','',body)
        label+=' · ley'if a['grupo']=='ley'else''
    if kind not in ['ordinario','transitorio','preambulo']:kind='complementario'
    hierarchy=next((x for x in p['articulos']if x['identificador']==a['articulo_label']),{})
    title=hierarchy.get('titulo_nombre')
    if a['grupo']=='scjn':title='Documentos de la SCJN · AI 51/2025'
    elif a['grupo']=='decreto'and kind=='transitorio':title='Transitorios del decreto'
    elif kind=='complementario':title='Documentos complementarios'
    chunks.append(dict(identificador=label,contenido=body,tipo_articulo=kind,titulo_nombre=title,capitulo_nombre=hierarchy.get('capitulo_nombre'),seccion_nombre=None,lineas_origen=a['lineas_origen'],paginas=a['paginas']))
out=dict(chunks=chunks,temas=p['temas'],control=json.loads((old/'LCNE_control_calidad.json').read_text(encoding='utf8')))
(ROOT/'LCNE-revisado.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
print('LCNE: '+str(len(chunks))+' fragmentos; 28 ordinarios, 13 transitorios de ley, 2 de decreto, 5 complementos/preámbulo.')
