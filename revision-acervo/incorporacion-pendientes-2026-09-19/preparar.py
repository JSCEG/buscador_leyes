"""Perfiles revisados por publicación; cobertura exacta y tablas indivisibles."""
from pathlib import Path
import json,re,collections
ROOT=Path(__file__).resolve().parent
load=lambda n:json.loads((ROOT/n).read_text(encoding='utf-8-sig'))
EXPECTED={
 'DACG-COGENERACION':('a2657a9270af5741891b4997618f294dc5fe6573de50c598252d4c3c9a3cea0e',140),
 'FORMATOS-COGENERACION':('449e3771831992d071aafb2974b8c424e59a8fe8d7ee880aa5963bb39c88f1c5',84),
 'MIGRACION-PERMISOS':('31864d63afec92bb0dbaadd62bae956e4afaf4a5e9f50b1b8a9acf971d8453d1',327),
 'MIGRACION-ACLARACION':('84bdd436d6cf6a7454748f6e7839cb28ad139657c0afac5f0bc5735ea35366ac',11),
 'MIGRACION-MODIFICACION':('80c49c8cefabdc75ac55b0e3aaaacf0ebb4ac47885bd751e6b317c95d56a4bf4',97),
}
def prepare(s):
 name=s['name'];raw=load(f'fuentes/{name}.bloques.json');b=raw['bloques']
 assert (raw['sha256'],len(b))==EXPECTED[name] and raw['cotejo_textual_sin_perdida']
 chunks=[];themes=[];owned=[]
 def theme(level,text):
  if text and not any(t['nivel']==level and t['nombre']==text for t in themes):themes.append(dict(nivel=level,nombre=text,orden=len(themes)))
 def add(start,end,label,kind='ordinario',chapter='Cuerpo del instrumento',section=None):
  assert start<end and not set(range(start,end))&set(owned)
  owned.extend(range(start,end));body='\n'.join(x['html'] for x in b[start:end])
  chunks.append(dict(identificador=label,contenido='<!-- Transcripción de la publicación oficial -->\n'+body,tipo_articulo=kind,titulo_nombre=s['pieza'],capitulo_nombre=chapter,seccion_nombre=section,bloques_origen=list(range(start,end)),texto_fuente='\n'.join(x['texto']for x in b[start:end]),tablas=body.count('<table>'),casillas=body.count('□'),graficos=0))
  theme('titulo',s['pieza']);theme('capitulo',chapter);theme('seccion',section)
 def trans(start,end,expected):
  assert b[start]['texto']=='TRANSITORIOS'
  matches=[(i,re.match(r'^([A-ZÁÉÍÓÚÜÑ ]+)\.',b[i]['texto'])[1]) for i in range(start+1,end) if re.match(r'^([A-ZÁÉÍÓÚÜÑ ]+)\.',b[i]['texto']) and not re.match(r'^[IVXLCDM]+\.',b[i]['texto'])]
  assert [x[1]for x in matches]==expected
  for n,(pos,label) in enumerate(matches):add(start if n==0 else pos,matches[n+1][0]if n+1<len(matches)else end,'Transitorio '+label,'transitorio','Transitorios del acuerdo')
 def numbered(start,end,pattern,expected,first):
  pairs=[(i,re.match(pattern,b[i]['texto'])[1])for i in range(start,end)if re.match(pattern,b[i]['texto'])]
  assert [x[1]for x in pairs]==expected
  heads={i for i in range(start,end)if re.match(r'^(?:Capítulo|CAPÍTULO|Sección)\s',b[i]['texto'])}
  headparts=heads|{i+1 for i in heads};starts=[]
  for n,(pos,_)in enumerate(pairs):
   p=pos
   while p-1 in headparts:p-=1
   starts.append(first if n==0 else p)
  for n,(pos,label)in enumerate(pairs):
   cp=max(i for i in heads if i<pos and b[i]['texto'].lower().startswith('capítulo'))
   sec=[i for i in heads if cp<i<pos and b[i]['texto'].startswith('Sección')]
   add(starts[n],starts[n+1]if n+1<len(starts)else end,('Numeral 'if name=='DACG-COGENERACION'else'Artículo ')+label,chapter=b[cp]['texto']+' · '+b[cp+1]['texto'],section=(b[max(sec)]['texto']+' · '+b[max(sec)+1]['texto'])if sec else None)
 if name=='DACG-COGENERACION':
  add(0,24,'Preámbulo del acuerdo','preambulo','Preámbulo y considerandos');add(24,25,'Artículo Único · Expedición de las DACG')
  numbered(25,119,r'^(\d+\.\d+)\.\s',[f'{a}.{n}'for a,total in [(1,4),(2,12),(3,7)]for n in range(1,total+1)],25)
  trans(119,139,['PRIMERO','SEGUNDO','TERCERO','CUARTO','QUINTO','SEXTO','SÉPTIMO','OCTAVO']);add(139,140,'Firma del acuerdo','complementario','Firma')
 elif name=='FORMATOS-COGENERACION':
  assert b[24]['texto']=='CNE_ELECTRICIDAD_07' and b[58]['texto']=='CNE_ELECTRICIDAD_08'
  add(0,15,'Preámbulo del acuerdo de formatos','preambulo','Preámbulo y considerandos');add(15,19,'Resolutivo Único · Publicación de los formatos')
  add(19,23,'Instrucciones de llenado de los formatos','anexo','Formatos e instrucciones')
  add(23,57,'Formato CNE_ELECTRICIDAD_07 · Solicitud de permiso de cogeneración','anexo','Formatos e instrucciones')
  add(57,81,'Formato CNE_ELECTRICIDAD_08 · Autoconsumo interconectado de 0.7 a 20 MW','anexo','Formatos e instrucciones')
  trans(81,83,['ÚNICO']);add(83,84,'Firma del acuerdo','complementario','Firma')
 elif name=='MIGRACION-PERMISOS':
  add(0,16,'Preámbulo del acuerdo','preambulo','Preámbulo y considerandos');add(16,17,'Artículo Único · Expedición de los lineamientos')
  numbered(17,300,r'^Artículo (\d+)\.\s',[str(n)for n in range(1,62)],17)
  trans(300,326,['PRIMERO','SEGUNDO','TERCERO','CUARTO','QUINTO','SEXTO','SÉPTIMO','OCTAVO','NOVENO','DÉCIMO','DÉCIMO PRIMERO','DÉCIMO SEGUNDO','DÉCIMO TERCERO']);add(326,327,'Firma del acuerdo','complementario','Firma')
 elif name=='MIGRACION-ACLARACION':
  add(0,5,'Presentación de la nota aclaratoria','preambulo','Nota aclaratoria')
  add(5,10,'Aclaración al artículo 18 · Dice y debe decir',chapter='Corrección del calendario')
  add(10,11,'Firma de la nota aclaratoria','complementario','Firma')
 else:
  add(0,10,'Preámbulo del acuerdo modificatorio','preambulo','Preámbulo y considerandos');add(10,11,'Artículo Único · Alcance de la modificación')
  pairs=[(i,re.match(r'^"Artículo (\d+)\.',b[i]['texto'])[1])for i in range(11,86)if re.match(r'^"Artículo (\d+)\.',b[i]['texto'])]
  assert [n for _,n in pairs]==['5','7','15','17','18','24','26','40','44','45','56']
  for n,(p,label)in enumerate(pairs):add(p,pairs[n+1][0]if n+1<len(pairs)else 86,'Modificación al artículo '+label,chapter='Texto de las modificaciones')
  add(86,91,'Modificación al transitorio DÉCIMO de los lineamientos',chapter='Texto de las modificaciones')
  trans(91,96,['PRIMERO','SEGUNDO','TERCERO']);add(96,97,'Firma del acuerdo','complementario','Firma')
 assert owned==list(range(len(b))) and len({c['identificador']for c in chunks})==len(chunks)
 assert sum(c['tablas']for c in chunks)==raw['tablas'] and sum(c['casillas']for c in chunks)==raw['casillas']
 out=dict(instrumento=name,chunks=chunks,temas=themes,control=dict(sha256=raw['sha256'],bloques_fuente=len(b),cobertura_total=True,sin_solapamientos=True,tablas_preservadas=raw['tablas'],casillas_preservadas=raw['casillas'],graficos_preservados=0,texto_publicado_no_consolidado=True))
 (ROOT/(name+'-revisado.json')).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps(dict(instrumento=name,fragmentos=len(chunks),tipos=dict(collections.Counter(c['tipo_articulo']for c in chunks))),ensure_ascii=False))
if __name__=='__main__':
 for s in load('fuentes.json'):prepare(s)
