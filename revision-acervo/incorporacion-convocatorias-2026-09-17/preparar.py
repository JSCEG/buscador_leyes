"""Perfiles cerrados de trece publicaciones; no consolida ni ejecuta ingestas."""
from pathlib import Path
import json,re,collections
ROOT=Path(__file__).resolve().parent
load=lambda n:json.loads((ROOT/n).read_text(encoding='utf-8'))
save=lambda n,v:(ROOT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
SHA=['87c25b25a5b8c1befc973344fff1cde1e5f200f3a124576fd63ff8e3590e4e50','2ba34d3dd2419d324f5d160bafa9704439c09b9488b4703743d599291cb514cc','141762fa5c921f7dd01f107cf4eabb499bf198e3389f6e3d5526c28319548193','80ee13b6af8ee224200c33f18a6cb5426fff88a23f61ddcf90b1eec9e91debfe','178274967aec871f35d62c42ccb3cb151fedc2e4f933f1a7238d315c084f1bc7','0cf5044b5ca7356b4469a7d5c596f7533b554819ee77f52a3eb60b34768b26b6','a6d76c2a17ef2860f6fc1dfd768d12a10ee36059a9c8375e9aeb0171672d436c','7d569774debc1e8531c3515e2383fa53eda266206a787855c156f817210bb5af','5004e64965f5062570d859d7bb51dd0d0db748a0d224cb5bd7606df56dccf365','e66b049a4c1687d31e1606e55db26413a01f542a06b6791b552988bd3d5036c0','1ac32a60c8f6aa1a4ccabaaf88c3c6018332d782eb7406ef80f3949681dc8b9b','98316b040369fce7f60f4071726ff4712d6a9d045acf0f8609db5d3be343f70d','0cfde031eb5619dc65a65ca97376feb1623841962fe7c4d5e4c120df1b2b6178']
COUNTS=[200,17,18,26,213,29,29,30,27,242,18,104,16]
NUM=re.compile(r'^(\d+(?:\.\d+)*)(?:\.)?\s')
EXPECTED={
'CONV-GEN-2':'1,1.1,1.2,1.2.1,1.2.2,2,3,4,4.1,4.2,5,5.1,5.2,5.3,6,6.1,6.2,7,8,8.1,8.2,8.3,9,9.1,9.2,9.3,10,10.1,10.2,11,12,12.1,12.2,13,14,14.1,14.2,14.3,14.4',
'CONV-ESTRATEGICOS':'1,1.1,1.2,1.2.1,1.2.2,2,3,3.1,4,4.1,4.2,4.3,5,5.1,5.2,5.3,5.4,6,6.1,6.2,7,7.1,7.2,7.3,7.4,7.5,7.6,7.7,8,8.1,8.2,8.3,8.4,9,9.1,10,10.1,10.2,10.3,11,11.1,12,12.1,12.2,12.3,12.4,13,13.1,13.2,14,15,15.1,15.2,16,16.1,16.2,17,17.1,17.2,17.3,17.4,17.4,17.5,18,18.1,18.2,19,19.1,19.2,19.3'}
MODS={
'CONV-GEN-1-M1':([8,13],14,[15],16),
'CONV-GEN-1-M2':([9,14],15,[16],17),
'CONV-GEN-1-M3':([10,20],23,[24],25),
'CONV-GEN-2-M1':([8,24],26,[27],28),
'CONV-GEN-2-M2':([9,25],26,[27],28),
'CONV-GEN-2-M3':([10,26],27,[28],29),
'CONV-GEN-2-M4':([8],24,[25],26),
'CONV-ESTRATEGICOS-M1':([8,14],15,[16],17),
'CONV-ESTRATEGICOS-M2':([8,98],99,[100,101],103),
'CONV-ESTRATEGICOS-M3':([8],13,[14],15)}

def prepare(source,index):
 name=source['name'];d=load('fuentes/'+name+'.bloques.json');b=d['bloques']
 assert d['sha256']==SHA[index] and d['cotejo_textual_sin_perdida'] and len(b)==COUNTS[index]
 chunks=[];themes=[];owned={}
 state={'titulo_nombre':source['familia']+' · publicación del '+source['fecha'],'capitulo_nombre':None,'seccion_nombre':None}
 def theme(level,text):
  themes.append(dict(nivel=level,nombre=text.replace('\n',' '),orden=len(themes)))
 def add(start,end,label,kind):
  assert start<end
  for i in range(start,end):assert i not in owned;owned[i]=label
  part=b[start:end];body='\n'.join(x['html'] for x in part)
  # Marcador invisible: el renderizador actual activa marked al detectar ###.
  content='<!-- ### Transcripción de la publicación oficial -->\n\n'+body
  chunks.append(dict(identificador=label,contenido=content,tipo_articulo=kind,**state,bloques_origen=list(range(start,end)),texto_fuente='\n'.join(x['texto']for x in part),tablas=body.count('<table>'),graficos=body.count('<img '),casillas=body.count('□')))
 if name=='CONV-GEN-1':
  add(0,14,'Preámbulo de la convocatoria','preambulo');add(14,31,'Índice de la publicación','complementario')
  starts=[31,52,55,67,73,108,112,131,151,154,156,179]
  assert [NUM.match(b[i]['texto'])[1]for i in starts]==[str(i)for i in range(1,13)]
  for k,start in enumerate(starts[:-1]):
   state['capitulo_nombre']=b[start]['texto'];theme('capitulo',state['capitulo_nombre']);add(start,starts[k+1],'Numeral '+str(k+1),'ordinario')
  state['capitulo_nombre']='12. Anexos';theme('capitulo',state['capitulo_nombre'])
  for start,end,label in [(179,186,'12.a · Anexo técnico'),(186,188,'12.b · Referencia al formato en VUPE'),(188,197,'12.c · Formato de trámite previo'),(197,199,'12.d · Formato de aceptación de obras')]:
   state['seccion_nombre']=label;theme('seccion',label);add(start,end,label,'anexo')
  state.update(capitulo_nombre='Documentos complementarios',seccion_nombre=None);add(199,200,'Firma de la convocatoria','complementario')
 elif not source['modificacion']:
  index_start,body_start,body_end,annex=(16,35,212,'14')if name=='CONV-GEN-2'else(20,40,241,'19')
  add(0,index_start,'Preámbulo de la convocatoria','preambulo');add(index_start,body_start,'Índice de la publicación','complementario')
  starts=[(x['id'],NUM.match(x['texto'])[1])for x in b[body_start:body_end]if x['tipo']=='parrafo'and NUM.match(x['texto'])]
  assert [n for _,n in starts]==EXPECTED[name].split(',')
  major={n:b[i]['texto']for i,n in starts if '.'not in n}
  units=[];pending=None
  for k,(i,n)in enumerate(starts):
   if '.'not in n:theme('capitulo',b[i]['texto'])
   next_i,next_n=starts[k+1]if k+1<len(starts)else(body_end,'')
   # Un encabezado sin contenido se conserva dentro del primer numeral subordinado.
   if '.'not in n and next_i==i+1 and next_n.startswith(n+'.'):
    pending=i if pending is None else pending;continue
   start=pending if pending is not None else i;pending=None
   label='Numeral '+n
   if name=='CONV-ESTRATEGICOS'and n=='17.4':label+=' · '+('primer bloque'if i==218 else 'segundo bloque')
   kind='anexo'if n.startswith(annex+'.')else'ordinario'
   state.update(capitulo_nombre=major[n.split('.')[0]],seccion_nombre=('Numeral '+n if '.'in n else None))
   if '.'in n:theme('seccion',label)
   add(start,next_i,label,kind)
  assert pending is None
  state.update(capitulo_nombre='Documentos complementarios',seccion_nombre=None);add(body_end,len(b),'Firma de la convocatoria','complementario')
 else:
  starts,trans,ts,signature=MODS[name]
  add(0,starts[0],'Preámbulo del acuerdo modificatorio','preambulo')
  for k,start in enumerate(starts):
   end=starts[k+1]if k+1<len(starts)else trans
   label=re.match(r'^(PRIMERO|SEGUNDO|ÚNICO)\.',b[start]['texto'])[1]
   state.update(capitulo_nombre='Resolutivo '+label+' del acuerdo modificatorio',seccion_nombre=None);theme('capitulo',state['capitulo_nombre'])
   if name=='CONV-ESTRATEGICOS-M2'and label=='PRIMERO':
    quotes=[9,15,42,47,48,50,52,61,66,70,71,72,74,75,78,82,83,86,89,90,94]
    nums=['1','2','3.1','5.1','6.2','8.1','8.3','9.1','10.1','10.2','10.3','11.1','12.1','14','17.1','17.2','17.3','17.4','17.4.1','18','18.2']
    assert [re.match(r'^"(\d+(?:\.\d+)*)',b[q]['texto'])[1]for q in quotes]==nums
    add(start,quotes[0],'PRIMERO · Alcance de las modificaciones','ordinario')
    for kq,q in enumerate(quotes):
     state['seccion_nombre']='Texto citado del numeral '+nums[kq];theme('seccion',state['seccion_nombre'])
     add(q,quotes[kq+1]if kq+1<len(quotes)else end,'PRIMERO · Texto citado del numeral '+nums[kq],'ordinario')
   else:add(start,end,'Resolutivo '+label,'ordinario')
  assert b[trans]['texto']in ['TRANSITORIO','TRANSITORIOS']
  state.update(capitulo_nombre='Transitorios del acuerdo modificatorio',seccion_nombre=None);theme('capitulo',state['capitulo_nombre'])
  for kt,t in enumerate(ts):
   label=re.match(r'^(PRIMERO|SEGUNDO|ÚNICO)\.',b[t]['texto'])[1]
   add(trans if kt==0 else t,ts[kt+1]if kt+1<len(ts)else signature,'Transitorio '+label+' · acuerdo','transitorio')
  state['capitulo_nombre']='Documentos complementarios';add(signature,len(b),'Firma del acuerdo','complementario')
 assert set(owned)==set(range(len(b))) and len({c['identificador']for c in chunks})==len(chunks)
 assert sum(c['tablas']for c in chunks)==d['tablas'] and sum(c['graficos']for c in chunks)==d['graficos'] and sum(c['casillas']for c in chunks)==d['casillas']
 result=dict(instrumento=name,chunks=chunks,temas=themes,control=dict(sha256=d['sha256'],bloques_fuente=len(b),bloques_asignados=len(owned),cobertura_total=True,sin_solapamientos=True,tablas_preservadas=d['tablas'],graficos_preservados=d['graficos'],casillas_preservadas=d['casillas'],texto_publicado_no_consolidado=True),asignacion=owned)
 save(name+'-revisado.json',result)
 return dict(name=name,fragmentos_fuente=len(chunks),temas=len(themes),tipos=dict(collections.Counter(c['tipo_articulo']for c in chunks)))
if __name__=='__main__':
 for i,s in enumerate(load('fuentes.json')):print(json.dumps(prepare(s,i),ensure_ascii=False))
