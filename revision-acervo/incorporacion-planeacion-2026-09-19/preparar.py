"""Perfiles de planeación: apartados, tablas y figuras completas, nunca artículos inventados."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parent
load=lambda n:json.loads((ROOT/n).read_text(encoding='utf-8-sig'))
EXPECTED={'PLADESE':('9b1f35cb8ba00589b054e067049903393ad0f8a25b6de23351bb8b1a826f7749',1231),'PROSENER-DECRETO':('4fb56629a5399d23aca0289d8c93467399a31b54de40d6480482f99222646ed5',19),'PROSENER':('745d8572cc6a8271e14da10d803364ac3e5d3d04e354deff27a0427ae130b077',496),'PLADESHI':('f823026fb4ab5ca2de75a21a001348a2c2dadc1860fbbddf75c96e6036369b49',1523)}
for s in load('fuentes.json'):
 name=s['name'];raw=load(f'fuentes/{name}.bloques.json');b=raw['bloques'];assert(raw['sha256'],len(b))==EXPECTED[name]
 chunks=[];themes=[];owned=[]
 def add(start,end,label,kind='ordinario',chapter=None):
  assert start<end and not set(owned)&set(range(start,end));owned.extend(range(start,end))
  body='\n'.join(x['html']for x in b[start:end])
  chunks.append(dict(identificador=label,contenido='<!-- Transcripción de la publicación oficial -->\n'+body,tipo_articulo=kind,titulo_nombre=s['pieza'],capitulo_nombre=chapter or label,seccion_nombre=None,bloques_origen=list(range(start,end)),texto_fuente='\n'.join(x['texto']for x in b[start:end]),tablas=body.count('<table>'),graficos=body.count('<img '),casillas=0))
  for level,value in [('titulo',s['pieza']),('capitulo',chapter or label)]:
   if not any(t['nivel']==level and t['nombre']==value for t in themes):themes.append(dict(nivel=level,nombre=value,orden=len(themes)))
 def sections(first,end,roots):
  # Two-or-more-part section numbers; root chapters are explicitly reviewed.
  positions=[x['id']for x in b[first:end]if x['tipo']=='parrafo'and re.match(r'^\d+\.\d+(?:\.\d+)*\.?\s',x['texto'])and len(x['texto'])<250]
  starts=sorted(set(positions+roots));assert starts[0]==first
  # Heading-only parent sections stay attached to their first subsection.
  groups=[];pending=first
  for n,p in enumerate(starts):
   stop=starts[n+1]if n+1<len(starts)else end
   if n+1<len(starts) and all(re.match(r'^\d+(?:\.\d+)*\.?\s',x['texto']) and len(x['texto'])<250 and '<img ' not in x['html'] for x in b[p:stop]):continue
   title=b[p]['texto'].replace('\n',' ')
   add(pending,stop,'Apartado '+title,chapter='Apartados del plan');pending=stop
  assert pending==end
 if name in ['PLADESE','PLADESHI']:
  unique=11 if name=='PLADESE'else 14;sig=14 if name=='PLADESE'else 17;first=235 if name=='PLADESE'else 249
  add(0,unique,'Preámbulo del acuerdo','preambulo','Acuerdo de expedición')
  add(unique,unique+1,'Artículo Único · Expedición del plan',chapter='Acuerdo de expedición')
  add(unique+1,sig,'Transitorio ÚNICO','transitorio','Acuerdo de expedición');add(sig,sig+1,'Firma del acuerdo','complementario','Firma')
  add(sig+1,first,'Presentación e índices del plan','anexo','Índices')
  if name=='PLADESE':
   sections(235,1024,[235,293,560,800])
   for start,end,label in [(1024,1077,'Glosario'),(1077,1146,'Siglas y acrónimos'),(1146,1169,'Unidades')]:add(start,end,label,'anexo','Referencias del plan')
   for start,end,label in [(1169,1174,'A1.1'),(1174,1177,'A1.2'),(1177,1180,'A1.3'),(1180,1183,'A1.4'),(1183,1187,'A1.5'),(1187,1190,'A1.6'),(1190,1193,'A1.7'),(1193,1195,'A1.8')]:add(start,end,'Anexo estadístico · Tabla '+label,'anexo','Anexo A1 · Estadísticas')
   for start,end,label in [(1195,1203,'A2.1'),(1203,1206,'A2.2'),(1206,1209,'A2.3')]:add(start,end,'Catálogo de generación · Tabla '+label,'anexo','Anexo A2 · Tecnologías de generación')
   add(1209,1215,'Anexo A3 · Catálogo de tecnologías de transmisión','anexo','Anexo A3 · Tecnologías de transmisión')
   add(1215,1216,'Firma del plan','complementario','Firma')
   add(1216,1231,'Notas del plan','anexo','Referencias del plan')
  else:
   sections(249,1282,[249,350,1002,1078])
   for start,end,label in [(1282,1302,'Referencias bibliográficas'),(1302,1381,'Glosario'),(1381,1440,'Siglas y acrónimos'),(1440,1481,'Unidades'),(1481,1523,'Notas del plan')]:add(start,end,label,'anexo','Referencias del plan')
 elif name=='PROSENER-DECRETO':
  add(0,11,'Preámbulo del decreto','preambulo')
  for i,label in enumerate(['PRIMERO','SEGUNDO','TERCERO','CUARTO']):add(11+i,12+i,'Artículo '+label)
  add(15,17,'Transitorio PRIMERO','transitorio');add(17,18,'Transitorio SEGUNDO','transitorio');add(18,19,'Firma del decreto','complementario','Firma')
 else:
  add(0,16,'Presentación e índice del programa','anexo','Índice')
  # Main sections and narrative subsections, reviewed against the published index.
  starts=[16,18,94,107,120,125,126,134,147,156,163,170,181,187,197,207,217,218,225,253,291,327,331,343,356,366,369,373,374,376,378,380,382,383,385,387,389,391,393,395,396,398,400,402,404,406,413,415,417,419,421,423,425,474]
  # Strategy and objective starts come from explicit labels, not table cell numerals.
  starts=[p for p in starts if p<373 or p>=406]+[x['id']for x in b[373:406]if x['tipo']=='parrafo'and re.match(r'^(Objetivo |Estrategia prioritaria )',x['texto'])]
  starts=sorted(set(starts));pending=16
  for n,p in enumerate(starts):
   stop=starts[n+1]if n+1<len(starts)else len(b)
   if stop==p+1 and p not in [17,474]:continue
   label='Notas del programa'if p==474 else b[p]['texto'].replace('\n',' ')
   # Long objective titles remain searchable in content; label retains the full heading.
   add(pending,stop,label,'anexo'if p>=425 else'ordinario','Apartados del programa');pending=stop
 assert owned==list(range(len(b))) and len({x['identificador']for x in chunks})==len(chunks)
 assert sum(x['tablas']for x in chunks)==raw['tablas'] and sum(x['graficos']for x in chunks)==raw['graficos']
 result=dict(instrumento=name,chunks=chunks,temas=themes,control=dict(sha256=raw['sha256'],bloques_fuente=len(b),cobertura_total=True,sin_solapamientos=True,tablas_preservadas=raw['tablas'],graficos_preservados=raw['graficos'],casillas_preservadas=0,texto_publicado_no_consolidado=True))
 (ROOT/(name+'-revisado.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps(dict(instrumento=name,fragmentos=len(chunks),max_caracteres=max(len(c['contenido'])for c in chunks),tablas=raw['tablas'],graficos=raw['graficos']),ensure_ascii=False))
