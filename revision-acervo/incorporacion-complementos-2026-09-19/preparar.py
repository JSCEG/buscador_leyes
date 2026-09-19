"""Perfiles revisados por estructura documental, con propiedad exacta de cada bloque."""
from pathlib import Path
import json,re
R=Path(__file__).resolve().parent
load=lambda n:json.loads((R/n).read_text(encoding='utf8'))
EXPECTED=load('perfiles-fuentes.json')
for s in load('fuentes.json'):
 name=s['name'];raw=load(f'fuentes/{name}.bloques.json');b=raw['bloques']
 assert [raw['sha256'],len(b)]==EXPECTED[name]
 chunks=[];themes=[];owned=[]
 def add(a,z,label,kind='ordinario',chapter='Cuerpo del instrumento'):
  assert a<z and not set(range(a,z))&set(owned),(name,a,z)
  owned.extend(range(a,z));body='\n'.join(x['html']for x in b[a:z])
  chunks.append(dict(identificador=label,contenido='<!-- Transcripción de la publicación oficial -->\n'+body,tipo_articulo=kind,titulo_nombre=s['pieza'],capitulo_nombre=chapter,seccion_nombre=None,bloques_origen=list(range(a,z)),texto_fuente='\n'.join(x['texto']for x in b[a:z]),tablas=body.count('<table>'),graficos=body.count('<img '),casillas=0))
  for level,value in [('titulo',s['pieza']),('capitulo',chapter)]:
   if not any(t['nivel']==level and t['nombre']==value for t in themes):themes.append(dict(nivel=level,nombre=value,orden=len(themes)))
 def trans(a,z,gender=False):
  starts=[x['id']for x in b[a:z]if re.match(r'^(?:ÚNICO|PRIMER[OA]|SEGUND[OA]|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO(?: PRIMERO| SEGUNDO)?)[.\s-]',x['texto'],re.I)]
  assert starts
  for i,p in enumerate(starts):
   label=re.split(r'[.\-]',b[p]['texto'],maxsplit=1)[0].strip()
   add(a if i==0 else p,starts[i+1]if i+1<len(starts)else z,'Transitorio '+label,'transitorio','Transitorios')
 def firma(a,z):add(a,z,'Firma y publicación','complementario','Firma')
 if name=='FORMATOS-BIOCOMBUSTIBLES':
  add(0,11,'Preámbulo del acuerdo','preambulo','Preámbulo')
  add(11,14,'Resolutivo ÚNICO · Relación de formatos')
  trans(14,17);firma(17,18)
  starts=[18,199,340,460,608,804,1010,1157,1282,1404,1550,1682,1822,1962,2118,2276,2397,2530,2635,2680,2886,2928]
  for i,p in enumerate(starts):
   z=starts[i+1]if i+1<len(starts)else len(b)
   title=b[p+1 if b[p]['texto'].startswith('ANEXO ')else p]['texto'].replace('\n',' ')
   annex=next(x['texto']for x in reversed(b[:p+1])if re.fullmatch(r'ANEXO [1-7]',x['texto']))
   add(p,z,title,'anexo',annex)
 elif name=='CATALOGO-CONUEE':
  add(0,11,'Preámbulo del acuerdo','preambulo','Preámbulo');add(11,12,'Resolutivo ÚNICO · Expedición de disposiciones')
  ids=[15,17,28,29,46,51,59,67,80,92,104,108,110,114,116,119,128]
  starts=[12,17,26,29,44,51,59,67,80,92,104,106,110,114,116,117,128]
  for i,(a,p)in enumerate(zip(starts,ids)):
   add(a,starts[i+1]if i+1<len(starts)else 129,'Artículo '+str(i+1),chapter='Disposiciones reglamentarias')
  trans(129,134);firma(134,135)
  add(135,138,'Apéndice A · Catálogo de equipos y aparatos','anexo','Apéndice A')
  for i,(a,z,p)in enumerate([(138,142,140),(142,144,142),(144,146,144),(146,148,146),(148,151,148),(151,155,151)]):add(a,z,b[p]['texto'],'anexo','Apéndice B · Formatos oficiales')
 elif name.startswith('REFORMA-'):
  start,end,sig={'REFORMA-AREAS-ESTRATEGICAS':(6,59,63),'REFORMA-SIMPLIFICACION':(6,202,225),'REFORMA-LIH':(7,191,195),'REFORMA-RLIH':(4,51,57)}[name]
  add(0,start,'Preámbulo del decreto','preambulo','Decreto de reforma');add(start,start+1,'Artículo Único · Disposición reformadora',chapter='Decreto de reforma')
  ids=[x['id']for x in b[start+1:end]if re.match(r'^Artículo \d+',x['texto'])]
  positions=[]
  for p in ids:
   q=p
   while q>start+1 and (re.match(r'^(?:TÍTULO|CAPÍTULO)\b',b[q-1]['texto'])or(q>=2 and re.match(r'^(?:TÍTULO|CAPÍTULO)\b',b[q-2]['texto']))):q-=1
   positions.append(q)
  assert positions[0]==start+1
  for i,(a,p)in enumerate(zip(positions,ids)):
   number=re.match(r'^Artículo (\d+(?:o\.)?)',b[p]['texto']).group(1)
   add(a,positions[i+1]if i+1<len(ids)else end,'Modificación al artículo '+number,chapter='Disposiciones modificadas')
  trans(end,sig);firma(sig,len(b))
 elif name.startswith('ASEA-CONV-'):
  if name=='ASEA-CONV-BODEGAS-LP':
   add(0,9,'Preámbulo del acuerdo modificatorio','preambulo','Acuerdo modificatorio')
   add(9,55,'Resolutivo ÚNICO · Modificación de la convocatoria',chapter='Texto modificado de la convocatoria');trans(55,58);firma(58,60)
  else:
   t=next(x['id']for x in b if x['texto']=='TRANSITORIOS');sig=len(b)-2
   starts=[x['id']for x in b[:t]if re.match(r'^[1-4]\. ',x['texto'])]
   assert len(starts)==4
   add(0,starts[0],'Preámbulo y objeto de la convocatoria','preambulo','Convocatoria')
   for i,p in enumerate(starts):add(p,starts[i+1]if i+1<len(starts)else t,'Base '+b[p]['texto'],chapter='Bases de la convocatoria')
   trans(t,sig);firma(sig,len(b))
 elif name=='DESARROLLO-MIXTO-CFE':
  add(0,4,'Presentación e índice','anexo','Índice')
  headings=[x['id']for x in b[4:439]if re.match(r'^[IVX]+\.\d+ ',x['texto'])]
  assert len(headings)==26
  starts=[]
  for p in headings:
   a=p
   if p>=2 and b[p-2]['texto'].startswith('Sección '):a=p-2
   elif b[p-1]['texto'].startswith('Sección '):a=p-1
   starts.append(a)
  for i,(a,p)in enumerate(zip(starts,headings)):add(a,starts[i+1]if i+1<len(starts)else 439,'Apartado '+b[p]['texto'],chapter='Lineamientos de desarrollo mixto')
  trans(439,442);firma(442,444)
 elif name=='CFE-IMPEDIMENTOS':
  add(0,14,'Preámbulo e introducción','preambulo','Políticas de impedimentos')
  starts=[14,16,19,50,84,104,147,150,154,159,162,165,191,194,202,212,219,222,229,231,234,242,246,248,250,252]
  for i,p in enumerate(starts):add(p,starts[i+1]if i+1<len(starts)else 254,'Apartado '+b[p]['texto'],chapter='Políticas de impedimentos')
  trans(254,258);firma(258,260)
 else:raise AssertionError('Perfil no revisado '+name)
 assert owned==list(range(len(b))) and len({x['identificador']for x in chunks})==len(chunks),name
 assert sum(x['tablas']for x in chunks)==raw['tablas'] and sum(x['graficos']for x in chunks)==raw['graficos']
 result=dict(instrumento=name,chunks=chunks,temas=themes,control=dict(sha256=raw['sha256'],bloques_fuente=len(b),cobertura_total=True,sin_solapamientos=True,tablas_preservadas=raw['tablas'],graficos_preservados=raw['graficos'],casillas_preservadas=0,texto_publicado_no_consolidado=True))
 (R/(name+'-revisado.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps(dict(instrumento=name,fragmentos=len(chunks),max_caracteres=max(len(c['contenido'])for c in chunks),tablas=raw['tablas'],graficos=raw['graficos']),ensure_ascii=False))
