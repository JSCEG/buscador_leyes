"""Disposiciones, bases y reformas del bloque prioritario pendiente."""
from pathlib import Path
import json,re
R=Path(__file__).resolve().parent;load=lambda n:json.loads((R/n).read_text(encoding='utf8'))
EXPECTED={'CFE-CONTRATACION':('d4bf6df33b35225c9af0290f7d387ac74e996ef94133894260ed8f71b9aad390',1279),'CONV-SISTRANGAS':('dd2732166dfbe9fcf903c399be357167456112951fa1e6eb298a20c78f676377',48),'DECRETO-REFORMA-ENERGETICA':('b6d282de677189459e923bf1a3d08a11344772ea55b93c66f1d7759d7d58d53f',4864)}
for s in load('fuentes.json'):
 name=s['name'];raw=load(f'fuentes/{name}.bloques.json');b=raw['bloques'];assert (raw['sha256'],len(b))==EXPECTED[name]
 chunks=[];themes=[];owned=[]
 def add(a,z,label,kind='ordinario',chapter='Cuerpo del instrumento'):
  assert a<z and not set(owned)&set(range(a,z));owned.extend(range(a,z));body='\n'.join(x['html']for x in b[a:z])
  chunks.append(dict(identificador=label,contenido='<!-- Transcripción de la publicación oficial -->\n'+body,tipo_articulo=kind,titulo_nombre=s['pieza'],capitulo_nombre=chapter,seccion_nombre=None,bloques_origen=list(range(a,z)),texto_fuente='\n'.join(x['texto']for x in b[a:z]),tablas=0,graficos=0,casillas=0))
  for level,value in [('titulo',s['pieza']),('capitulo',chapter)]:
   if not any(t['nivel']==level and t['nombre']==value for t in themes):themes.append(dict(nivel=level,nombre=value,orden=len(themes)))
 def trans(a,z,context):
  pp=[x['id']for x in b[a:z]if re.match(r'^(Primero|Segundo|Tercero|Cuarto|Quinto|Sexto|Séptimo|Octavo|Noveno)[.\s-]',x['texto'])]
  assert pp
  for i,p in enumerate(pp):add(a if i==0 else p,pp[i+1]if i+1<len(pp)else z,'Transitorio '+b[p]['texto'].split('.')[0]+' · '+context,'transitorio',context)
 if name=='CFE-CONTRATACION':
  add(0,8,'Preámbulo y considerandos','preambulo');add(8,132,'Índice de disposiciones','anexo','Índice')
  pp=[x['id']for x in b[132:1272]if re.match(r'^Disposición \d+\.-',x['texto'])]
  assert [int(re.match(r'^Disposición (\d+)',b[p]['texto']).group(1))for p in pp]==list(range(1,109))
  starts=[]
  for p in pp:
   q=p
   while q>132 and re.match(r'^(?:Capítulo|CAPÍTULO|TÍTULO|Título)\b',b[q-1]['texto']):q-=1
   starts.append(q)
  starts[0]=132
  for i,(a,p)in enumerate(zip(starts,pp)):add(a,starts[i+1]if i+1<len(pp)else 1272,b[p]['texto'],chapter='Disposiciones generales')
  trans(1272,1277,'Disposiciones generales');add(1277,1279,'Firma y publicación','complementario','Firma')
 elif name=='CONV-SISTRANGAS':
  add(0,7,'Preámbulo y objeto de la convocatoria','preambulo')
  for a,z in [(7,30),(30,39),(39,42),(42,46)]:add(a,z,b[a]['texto'],chapter='Bases de la convocatoria')
  add(46,48,'Firma y publicación','complementario','Firma')
 else:
  # Artículos Primero a Octavo expiden leyes que ya tienen instrumento propio.
  # El alcance de esta ficha es explícitamente Noveno, Décimo y el cierre común.
  for a,z,t,law in [(4747,4772,4775,'Ley del Fondo Mexicano del Petróleo'),(4775,4846,4859,'Ley Orgánica de la Administración Pública Federal')]:
   add(a,a+1,'Artículo '+('Noveno'if a==4747 else'Décimo')+' · Disposición reformadora',chapter=law)
   pp=[x['id']for x in b[a+1:z]if re.match(r'^Artículo \d+',x['texto'])];assert pp[0]==a+1
   for i,p in enumerate(pp):
    number=b[p]['texto'].split('.-')[0]
    add(p,pp[i+1]if i+1<len(pp)else z,'Modificación · '+number+' · '+('FMP'if a==4747 else'LOAPF'),chapter=law)
   trans(z,t,law)
  trans(4859,4862,'Decreto general');add(4862,4864,'Firma y publicación del decreto','complementario','Firma')
 target=list(range(4747,len(b)))if name=='DECRETO-REFORMA-ENERGETICA'else list(range(len(b)))
 assert owned==target and len({x['identificador']for x in chunks})==len(chunks)
 result=dict(instrumento=name,chunks=chunks,temas=themes,control=dict(sha256=raw['sha256'],bloques_fuente=len(b),bloques_del_alcance=target,cobertura_total=True,sin_solapamientos=True,tablas_preservadas=0,graficos_preservados=0,casillas_preservadas=0,texto_publicado_no_consolidado=True))
 (R/(name+'-revisado.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(name,len(chunks))
