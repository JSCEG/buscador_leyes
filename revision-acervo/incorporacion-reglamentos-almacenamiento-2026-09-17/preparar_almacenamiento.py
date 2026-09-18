"""Dos perfiles documentales revisados: numerales y formularios completos, sin ingesta."""
from pathlib import Path
import json,re,html,collections
ROOT=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
NUM=re.compile(r'^(\d+(?:\.\d+)+)\s+')
TRANS=re.compile(r'^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|ÚNICO)\.\s*')
SHA={'DACG-PERMISOS-GA':'89ac92a6faf94889ca78d6417adf7dc5c6ad6849fd5c28dbd834af1dff146100','FORMATOS-SAEE':'c6e34a70cdd766a8f692130765d5fb11db1bd2441257aa395d41b33273b32d1f'}

def prepare(name):
 d=load(ROOT/'fuentes'/f'{name}.bloques.json');assert d['sha256']==SHA[name] and d['cotejo_textual_sin_perdida']
 blocks=d['bloques'];chunks=[];themes=[];owned={};state=dict(titulo_nombre=None,capitulo_nombre=None,seccion_nombre=None)
 def own(start,end,label):
  for i in range(start,end):assert i not in owned;owned[i]=label
 def add(start,end,label,kind,prefix=''):
  assert start<end;part=blocks[start:end];assert part[0]['texto'].startswith(prefix)
  rich=any(b['tipo']=='tabla'for b in part)
  texts=[b['texto']for b in part];texts[0]=texts[0][len(prefix):].strip();assert texts[0]
  if rich:
   content='### '+html.escape(texts[0]).replace('\n',' ')+'\n\n'
   content+='\n\n'.join(b['html']if b['tipo']=='tabla'else '<p>'+html.escape(b['texto']).replace('\n','<br>')+'</p>'for b in part[1:])
   assert part[0]['tipo']=='parrafo'
  else:content='\n\n'.join(texts)
  chunks.append(dict(identificador=label,contenido=content,tipo_articulo=kind,**state,prefijo_fuente=prefix,bloques_origen=list(range(start,end)),texto_fuente='\n\n'.join(b['texto']for b in part),tablas=sum(b['tipo']=='tabla'for b in part),casillas=sum(b['texto'].count('□')for b in part)))
  own(start,end,label)
 def theme(level,text):themes.append(dict(nivel=level,nombre=text.replace('\n',' '),orden=len(themes)))
 if name=='DACG-PERMISOS-GA':
  assert len(blocks)==720 and d['tablas']==90 and d['casillas']==73
  assert blocks[30]['texto']=='ÍNDICE' and blocks[64]['texto']=='Capítulo 1. Disposiciones Generales'
  add(0,30,'Preámbulo y acuerdo','preambulo')
  state['titulo_nombre']='Índice de la publicación';add(30,64,'Índice de las disposiciones','complementario')
  starts=[b['id']for b in blocks[64:527]if re.match(r'^Capítulo \d+\.',b['texto'])or NUM.match(b['texto'])]
  found=[NUM.match(blocks[i]['texto'])[1]for i in starts if NUM.match(blocks[i]['texto'])]
  expected=[]
  for chapter,count in [(1,5),(2,2),(3,14),(4,3),(5,2)]:
   for section in range(1,count+1):
    n=f'{chapter}.{section}';expected.append(n)
    for child in range(1,{'1.5':14,'2.2':6,'3.7':5,'3.8':4,'3.9':5,'3.10':3,'3.12':2,'3.13':2,'5.1':4}.get(n,0)+1):expected.append(n+'.'+str(child))
  assert found==expected and len(found)==71,(name,found)
  state.update(titulo_nombre='Disposiciones administrativas de carácter general',capitulo_nombre=None,seccion_nombre=None)
  for n,start in enumerate(starts):
   stop=starts[n+1]if n+1<len(starts)else 527;b=blocks[start];m=NUM.match(b['texto'])
   if m:
    if len(m[1].split('.'))==2:
     state['seccion_nombre']=b['texto'].replace('\n',' ');theme('seccion',state['seccion_nombre'])
    add(start,stop,'Numeral '+m[1],'ordinario',m[0])
   else:
    assert stop==start+1
    state.update(capitulo_nombre=b['texto'].replace('\n',' '),seccion_nombre=None);theme('capitulo',state['capitulo_nombre']);own(start,stop,'estructura:'+str(len(themes)-1))
  assert blocks[527]['texto']=='Transitorios';own(527,528,'encabezado:transitorios')
  state.update(titulo_nombre='Transitorios del acuerdo',capitulo_nombre=None,seccion_nombre=None)
  ts=[i for i in range(528,536)if TRANS.match(blocks[i]['texto'])];assert ts==[528,529,533,534,535]
  for n,start in enumerate(ts):
   m=TRANS.match(blocks[start]['texto']);add(start,ts[n+1]if n+1<len(ts)else 536,'Transitorio '+m[1].title()+' · acuerdo','transitorio',m[0])
  state.update(titulo_nombre='Anexo Único — Formatos autorizados',capitulo_nombre=None,seccion_nombre=None);theme('titulo',state['titulo_nombre'])
  add(536,541,'Anexo Único · Instrucciones de llenado','anexo')
  fs=[i for i in range(541,719)if re.fullmatch(r'CNE_ELECTRICIDAD_\d+',blocks[i]['texto'])];assert fs==[541,575,601,658,686,705]
  assert [blocks[i]['texto']for i in fs]==[f'CNE_ELECTRICIDAD_{n:02d}'for n in range(1,7)]
  for n,start in enumerate(fs):
   state['capitulo_nombre']=blocks[start]['texto'];theme('capitulo',state['capitulo_nombre']);add(start,fs[n+1]if n+1<len(fs)else 719,blocks[start]['texto']+' · Formato','anexo')
  state.update(titulo_nombre='Documentos complementarios',capitulo_nombre=None,seccion_nombre=None);add(719,720,'Firma del acuerdo','complementario')
 else:
  assert len(blocks)==108 and d['tablas']==40 and d['casillas']==42
  add(0,15,'Preámbulo y acuerdo','preambulo')
  state['titulo_nombre']='Acuerdo de emisión de formatos';add(15,20,'Único · Emisión de formatos','ordinario','Único. - ')
  state['titulo_nombre']='Formatos SAEE';theme('titulo','Formatos SAEE');add(20,25,'Instrucciones de llenado','anexo')
  fs=[25,57,79];assert [blocks[i]['texto']for i in fs]==[f'CNE_ELECTRICIDAD_{n:02d}'for n in [9,10,11]]
  for n,start in enumerate(fs):
   state['capitulo_nombre']=blocks[start]['texto'];theme('capitulo',state['capitulo_nombre']);add(start,fs[n+1]if n+1<len(fs)else 105,blocks[start]['texto']+' · Formato','anexo')
  own(105,106,'encabezado:transitorios');assert blocks[105]['texto']=='TRANSITORIOS'
  state.update(titulo_nombre='Transitorios del acuerdo',capitulo_nombre=None,seccion_nombre=None);add(106,107,'Transitorio Único · acuerdo','transitorio','ÚNICO. ')
  state.update(titulo_nombre='Documentos complementarios',capitulo_nombre=None,seccion_nombre=None);add(107,108,'Firma del acuerdo','complementario')
 assert set(owned)==set(range(len(blocks)))
 assert len({c['identificador']for c in chunks})==len(chunks)
 assert sum(c['tablas']for c in chunks)==d['tablas'] and sum(c['casillas']for c in chunks)==d['casillas']
 result=dict(instrumento=name,chunks=chunks,temas=themes,control=dict(sha256=d['sha256'],bloques_fuente=len(blocks),bloques_asignados=len(owned),cobertura_total=True,sin_solapamientos=True,tablas_preservadas=d['tablas'],casillas_preservadas=d['casillas'],numerales=71 if name.startswith('DACG')else 0,formatos=6 if name.startswith('DACG')else 3),asignacion=owned)
 save(ROOT/f'{name}-revisado.json',result);print(name,'fragmentos',len(chunks),'temas',len(themes),'tipos',dict(collections.Counter(c['tipo_articulo']for c in chunks)))

if __name__=='__main__':
 for name in SHA:prepare(name)
