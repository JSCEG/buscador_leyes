"""Segmentación revisada de estas ediciones: no reutilizar sin cotejar las fuentes."""
from pathlib import Path
import json,re
R=Path(__file__).resolve().parent
load=lambda n:json.loads((R/n).read_text(encoding='utf8'))
expected=load('perfiles-fuentes.json')
for source in load('fuentes.json'):
 name=source['name'];raw=load('fuentes/'+name+'.bloques.json');b=raw['bloques']
 assert [raw['sha256'],len(b)]==expected[name],name
 chunks=[];themes=[];owned=[]
 def label(p):return b[p]['texto'].replace('\n',' ')[:150].rstrip()
 def add(a,z,title,kind='ordinario',chapter='Acuerdo'):
  assert a<z and not set(range(a,z))&set(owned),(name,a,z)
  owned.extend(range(a,z));body='\n'.join(x['html']for x in b[a:z])
  chunks.append(dict(identificador=title,contenido='<!-- Transcripción de la publicación oficial -->\n'+body,tipo_articulo=kind,titulo_nombre=source['pieza'],capitulo_nombre=chapter,seccion_nombre=None,bloques_origen=list(range(a,z)),texto_fuente='\n'.join(x['texto']for x in b[a:z]),tablas=body.count('<table>'),graficos=body.count('<img '),casillas=0))
  for level,value in [('titulo',source['pieza']),('capitulo',chapter)]:
   if not any(t['nivel']==level and t['nombre']==value for t in themes):themes.append(dict(nivel=level,nombre=value,orden=len(themes)))
 def parts(a,z,positions,prefix='',chapter='Acuerdo',kind='ordinario',labels=None):
  assert positions and positions==sorted(set(positions)) and a<=positions[0]<z
  starts=[a]+positions[1:]
  for i,p in enumerate(positions):add(starts[i],starts[i+1]if i+1<len(starts)else z,prefix+(labels[i]if labels else label(p)),kind,chapter)
 def hits(a,z,pattern):return [x['id']for x in b[a:z]if x['tipo']=='parrafo' and re.match(pattern,x['texto'],re.I)]
 def pre(z):add(0,z,'Preámbulo y considerandos','preambulo','Preámbulo')
 def signature(a,z):add(a,z,'Firma y publicación','complementario','Firma')
 def index(a,z,title='Presentación e índice'):add(a,z,title,'anexo','Índice')
 def resolutions(a,z,positions):parts(a,z,positions,'Resolutivo ',labels=[b[p]['texto'].split('.')[0]for p in positions])
 def trans(a,z,positions):parts(a,z,positions,'Transitorio ',kind='transitorio',chapter='Transitorios',labels=[b[p]['texto'].split('.')[0]for p in positions])
 if name=='MANUAL-SUSPENSION-MEM':
  pre(25);add(25,26,'Artículo Único · Publicación del manual');trans(26,28,[27]);signature(28,29);index(29,58)
  chapters=[58]+hits(58,304,r'^CAPÍTULO \d+\.')
  assert len(chapters)==8
  for i,a in enumerate(chapters):
   z=chapters[i+1]if i+1<len(chapters)else 304;chapter='Manual · Capítulo '+str(i+1)
   if i<6:
    positions=hits(a,z,r'^\d+\.\d+\.\s');parts(a,z,positions,'Apartado ',chapter)
   else:add(a,z,chapter+' · '+('Medios de impugnación'if i==6 else 'Disposiciones transitorias'),'ordinario'if i==6 else 'transitorio',chapter)
 elif name=='BENEFICIO-REDES':
  pre(27);resolutions(27,30,[27,28,29]);signature(30,31);index(31,59)
  for a,z,chapter in [(59,62,'1 · Introducción'),(62,129,'2 · Aspectos generales'),(129,203,'3 · Criterios del beneficio neto'),(203,212,'4 · Análisis adicionales'),(212,215,'5 · Información complementaria')]:
   positions=hits(a,z,r'^\d+\.\d+\s')
   if positions:parts(a,z,positions,'Apartado ',chapter)
   else:add(a,z,'Apartado '+chapter,chapter=chapter)
  add(215,432,'Anexo I · Formulario de solicitud','anexo','Anexo I')
  add(432,451,'Anexo II · Costos de evaluación','anexo','Anexo II')
  add(451,456,'Notas al pie de los criterios y anexos','anexo','Notas de la publicación')
 elif name=='DACG-ACCESO-REDES':
  pre(70);resolutions(70,85,[70,71,74,75,76,77,79,80,81,82,83,84]);signature(85,86);index(86,96,'Anexo único · Presentación e índice')
  positions=hits(96,382,r'^Artículo \d+\.')
  assert len(positions)==21
  parts(96,382,positions,'Anexo único · Modificación al ',chapter='Modificación de las DACG',labels=[re.match(r'Artículo \d+',b[p]['texto']).group(0).lower()for p in positions])
  parts(382,393,hits(382,393,r'^Artículo \d+\.'),'Apéndice A · ',chapter='Apéndice A · Condiciones generales')
  add(393,398,'Apéndice A · Artículo 11 · Derogaciones publicadas',chapter='Apéndice A · Medición')
  positions=hits(398,1073,r'^11\.[123]\.\d+\s')
  assert len(positions)==24
  parts(398,1073,positions,'Apéndice A · Numeral ',chapter='Apéndice A · Medición')
  add(1073,1079,'Apéndice A · Numerales 11.4 a 11.9 · Derogaciones',chapter='Apéndice A · Medición')
  parts(1079,1118,hits(1079,1118,r'^Artículo \d+\.'),'Apéndice A · ',chapter='Apéndice A · Condiciones generales')
  add(1118,1119,'Apéndice B · Derogación',chapter='Apéndices modificados')
  index(1119,1142,'Apéndice B1 · Introducción e índice')
  positions=hits(1142,1254,r'^B1\.\d+\.?\s');assert len(positions)==13
  parts(1142,1254,positions,'Apartado ',chapter='Apéndice B1 · Solicitudes, quejas e informes')
  add(1254,1255,'Apéndice C · Derogación',chapter='Apéndices modificados');index(1255,1269,'Apéndice C1 · Índice de formatos')
  positions=hits(1269,1350,r'^\d+\.\s');assert len(positions)==12
  parts(1269,1350,positions,'Apéndice C1 · Formato ',chapter='Apéndice C1 · Indicadores',kind='anexo')
  add(1350,1352,'Apéndice D · Referencia en la modificación',chapter='Apéndices modificados')
  index(1352,1358,'Anexos de medición · Relación')
  for i,p in enumerate(range(1358,1362)):add(p,p+1,'Anexo '+str(i+1)+' · Requerimientos de medición','anexo','Anexos de medición')
  add(1362,1374,'Anexo 5 · Resultado del diagnóstico completo','anexo','Anexos de medición');add(1374,1375,'Nota al pie de los anexos','anexo','Notas de la publicación')
 elif name=='CEL-INSUBSISTENCIA':
  pre(19);resolutions(19,22,[19,20]);signature(22,23)
 elif name=='CEL-ASIGNACION-2022':
  pre(25);resolutions(25,31,[25,26,28,29,30]);signature(31,32)
  add(32,50,'Anexo A · Definiciones','anexo','Anexo A');add(50,75,'Anexo B · Fórmula y condiciones de asignación','anexo','Anexo B')
 elif name=='EXCLUSION-CARGAS-LEGADAS':
  pre(53);add(53,119,'Resolutivo PRIMERO · Texto modificatorio completo',chapter='Modificación del acuerdo A/064/2017');resolutions(119,123,[119,120,121,122]);signature(123,125)
 elif name=='UNIDADES-INSPECCION':
  pre(38);resolutions(38,46,[38,39,40,41,42,43,45]);signature(46,47);index(47,72)
  chapters=[72,116,163,271,288,360,386,410,439,579]
  pattern=r'^(?:Primera|Segunda|Tercera|Cuarta|Quinta|Sexta|Séptima|Octava|Novena|Décima|Decimo\w+|Vigésim[ao](?: \w+)?|Trigésima(?: \w+)?)\.'
  total=0
  for i,(a,z)in enumerate(zip(chapters,chapters[1:])):
   chapter='DACG · '+b[a]['texto']+' · '+b[a+1]['texto'];positions=hits(a,z,pattern)
   if not positions:add(a,z,'Capítulo II · Acrónimos y definiciones',chapter=chapter)
   else:
    total+=len(positions);parts(a,z,positions,'Disposición ',chapter,labels=[b[p]['texto'].split('.')[0]for p in positions])
  assert total==38,total
  starts=[579,584,595,599,607,614,624]
  parts(579,639,starts,'',chapter='Formatos de inspección',kind='anexo',labels=['Anexo '+x+' · Formato completo'for x in 'ABCDEFG'])
 elif name=='DACG-ELECTROMOVILIDAD':
  pre(45);resolutions(45,52,[45,46,47,48,50,51]);signature(52,53);index(53,67)
  positions=[67,85,94,170,179,189,204,207,265,270]
  parts(67,289,positions,'',chapter='Disposiciones de electromovilidad')
  trans(289,293,[290,291,292]);add(293,304,'Apéndice 1 · Formato completo','anexo','Apéndices');add(304,313,'Apéndice 2 · Modelo de escrito','anexo','Apéndices')
 elif name=='LIQUIDACION-CARGAS-SUR':
  pre(36);resolutions(36,41,[36,37,38,39,40]);signature(41,42);index(42,50)
  parts(50,72,[51,67,69],'Apartado ',chapter='Capítulo 1 · Disposiciones generales');add(72,79,'Capítulo 2 · Criterios de liquidación',chapter='Capítulo 2')
 elif name=='MODELOS-INTERCONEXION':
  pre(21);add(21,22,'Artículo Primero · Expedición del modelo');add(22,25,'Modelo de contrato · Presentación',chapter='Modelo de contrato')
  parts(25,73,[26,32,52],'Declaración ',chapter='Modelo de contrato · Declaraciones',labels=['I · Transportista o distribuidora','II · Solicitante','III · Ambas partes'])
  positions=[74,76,77,90,93,98,105,107,110,112,113,115,122,124,130,133,134,135,138,155,162,163,165,166,168,169,170,171,173,174,178,179]
  parts(73,180,positions,'Cláusula ',chapter='Modelo de contrato · Cláusulas',labels=[b[p]['texto'].split('.')[0]for p in positions])
  add(180,188,'Modelo de contrato · Campos de firmas','anexo','Modelo de contrato · Firmas')
  parts(188,200,[188,193,198,199],'',labels=[b[p]['texto'].split('.')[0]for p in [188,193,198,199]])
  trans(200,208,[201,202,207]);signature(208,209)
 elif name=='DACG-MECANISMOS-CENACE':
  pre(17);add(17,18,'Artículo Único · Expedición de las DACG');index(18,59)
  parents=[59,98,150,204,357,426,433]
  for i,(a,z)in enumerate(zip(parents,parents[1:])):parts(a,z,hits(a,z,r'^\d+\.\d+\s'),'Apartado ',chapter='DACG · '+b[a]['texto'])
  trans(433,437,[434,435,436]);signature(437,438)
 elif name=='CARGO-TRANSMISION-LEGADOS':
  pre(20);add(20,21,'Artículo Único · Expedición de metodología');parts(21,51,[22,30,42],'Apartado ',chapter='Metodología de transmisión')
  trans(51,66,[52,53,54,58,63,65]);signature(66,67)
 elif name=='AVISO-PROGRAMA-CENACE':
  pre(4);add(4,10,'Aviso · Identificación y medios de consulta');trans(10,12,[11]);signature(12,13)
 elif name=='CEL-REQUISITOS-2025-2026':
  pre(20);add(20,22,'Artículo Único · Requisitos CEL 2025–2026');trans(22,25,[23,24]);signature(25,26)
 else:raise AssertionError(name)
 assert owned==list(range(len(b))), (name,'cobertura')
 assert len({c['identificador']for c in chunks})==len(chunks),(name,'identificadores repetidos')
 assert sum(c['tablas']for c in chunks)==raw['tablas'] and sum(c['graficos']for c in chunks)==raw['graficos']
 result=dict(instrumento=name,chunks=chunks,temas=themes,control=dict(sha256=raw['sha256'],bloques_fuente=len(b),cobertura_total=True,sin_solapamientos=True,tablas_preservadas=raw['tablas'],graficos_preservados=raw['graficos'],texto_publicado_no_consolidado=True))
 (R/(name+'-revisado.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps(dict(name=name,fragmentos=len(chunks),max_caracteres=max(len(c['contenido'])for c in chunks),tablas=raw['tablas'],imagenes=raw['graficos']),ensure_ascii=False))
