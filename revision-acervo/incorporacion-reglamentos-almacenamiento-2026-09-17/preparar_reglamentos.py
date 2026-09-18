"""Perfiles cerrados: cuatro reglamentos. No ejecuta escrituras en Supabase."""
from pathlib import Path
import json, re, hashlib, unicodedata, collections, difflib
import pymupdf
ROOT=Path(__file__).resolve().parent
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
save=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
PROFILES={
 'RLBio':(116,10,'2ab9efe7aaa1c04934edd557e4fc60a668e1c9a89828276f5898015b1c09a69b'),
 'RLGeo':(100,10,'698ad6fee8acd3350518247080f355778b3e3e314ee5dc50ddc59401728ac1a9'),
 'RLEPECFE':(82,8,'2803f60e4ae5620f3e697cf94ac06de92f79ed03c2a8505bdd4531ddd9db9e7c'),
 'RLEPEPM':(81,7,'01791609388ca55de84ed6ac9ae853dcfb3201ece277010a8dceab9a29ea7565'),
}
ORD=['Primero','Segundo','Tercero','Cuarto','Quinto','Sexto','Séptimo','Octavo','Noveno','Décimo']
ARTICLE=re.compile(r'^Artículo\s+(\d+)\.\s*',re.I)
HEAD=re.compile(r'^(TÍTULO|CAPÍTULO|SECCIÓN)\s+(?:[IVXLCDM]+|ÚNIC[OA]|PRIMER[OA]|SEGUND[OA]|TERCER[OA]|CUART[OA]|QUINT[OA]|SEXT[OA]|SÉPTIM[OA]|OCTAV[OA]|NOVEN[OA]|DÉCIM[OA])$',re.I)
TRANS=re.compile(r'^('+'|'.join(ORD)+r')\.\s*',re.I)
compact=lambda s:re.sub(r'\s+','',s).replace('\u00ad','')
normal=lambda s:''.join(c for c in unicodedata.normalize('NFD',s.lower()) if not unicodedata.combining(c))

def pdf_lines(name):
 doc=pymupdf.open(ROOT/'fuentes'/f'{name}.pdf');out=[];excluded=[]
 for pn,page in enumerate(doc,1):
  physical=[]
  for b in page.get_text('dict')['blocks']:
   for line in b.get('lines',[]):
    value=''.join(s['text']for s in sorted(line['spans'],key=lambda x:x['bbox'][0])).strip()
    if not value:continue
    box=list(line['bbox']);entry=dict(pagina=pn,texto=value,bbox=box)
    if box[1]<90 or box[1]>=735:excluded.append(entry)
    else:physical.append(entry)
  physical.sort(key=lambda x:(round(x['bbox'][1],1),x['bbox'][0]));groups=[]
  for line in physical:
   if groups and abs(line['bbox'][1]-groups[-1][0]['bbox'][1])<2:groups[-1].append(line)
   else:groups.append([line])
  for group in groups:
   group.sort(key=lambda x:x['bbox'][0]);out.append(dict(pagina=pn,texto=re.sub(r'\s+',' ',' '.join(x['texto']for x in group)).strip()))
 assert all(re.match(r'^\d+ de \d+$|^REGLAMENTO |^CÁMARA|^Secretaría |^Nuevo Reglamento',x['texto'])for x in excluded)
 save(ROOT/'fuentes'/f'{name}.lineas-pdf.json',dict(lineas=out,margenes=excluded,paginas=len(doc)))
 return out

def parse(name):
 total,nt,sha=PROFILES[name];assert hashlib.sha256((ROOT/'fuentes'/f'{name}.html').read_bytes()).hexdigest()==sha
 lines=(ROOT/'fuentes'/f'{name}.txt').read_text(encoding='utf-8').splitlines()
 markers=[i for i,t in enumerate(lines)if t.upper()=='TRANSITORIOS'];assert len(markers)==1
 at=markers[0];articles=[(i,ARTICLE.match(t))for i,t in enumerate(lines[:at])if ARTICLE.match(t)]
 assert [int(m[1])for i,m in articles]==list(range(1,total+1))
 chunks=[];themes=[];owned={};state=dict(titulo_nombre=None,capitulo_nombre=None,seccion_nombre=None)
 def own(start,end,owner):
  for i in range(start,end):assert i not in owned;owned[i]=owner
 def add(start,end,label,kind,prefix=''):
  if end<=start:return
  text='\n\n'.join(lines[start:end]);assert text.startswith(prefix)
  content=text[len(prefix):].strip();assert content
  row=dict(identificador=label,tipo_articulo=kind,contenido=content,**state,prefijo_fuente=prefix,lineas_origen=list(range(start,end)))
  assert compact(prefix+content)==compact(''.join(lines[start:end]));chunks.append(row);own(start,end,label)
 def split(start,end):
  positions=[i for i in range(start,end)if HEAD.fullmatch(lines[i])];return positions[0]if positions else end
 def headings(start,end):
  groups=[]
  for i in range(start,end):
   if HEAD.fullmatch(lines[i]):groups.append([i])
   else:assert groups;groups[-1].append(i)
  for group in groups:
   assert all(len(lines[i])<250 and not re.search(r'[.;!?]$',lines[i])for i in group)
   level=normal(lines[group[0]].split()[0]);label=' — '.join([lines[group[0]],' '.join(lines[i]for i in group[1:])]).rstrip(' —')
   if level=='titulo':state.update(titulo_nombre=label,capitulo_nombre=None,seccion_nombre=None)
   elif level=='capitulo':state.update(capitulo_nombre=label,seccion_nombre=None)
   else:state['seccion_nombre']=label
   themes.append(dict(nivel=level,nombre=label,orden=len(themes)));own(group[0],group[-1]+1,'estructura:'+str(len(themes)-1))
 start=articles[0][0];cut=split(0,start);add(0,cut,'Preámbulo y expedición','preambulo');headings(cut,start)
 for n,(start,m)in enumerate(articles):
  end=articles[n+1][0]if n+1<len(articles)else at;cut=split(start,end)
  add(start,cut,'Artículo '+m[1],'ordinario',m[0]);headings(cut,end)
 own(at,at+1,'encabezado:transitorios')
 end=next(i for i in range(at+1,len(lines))if lines[i].startswith('Dado en la residencia'))
 ts=[(i,TRANS.match(lines[i]))for i in range(at+1,end)if TRANS.match(lines[i])]
 assert ts[0][0]==at+1 and [normal(m[1])for i,m in ts]==[normal(x)for x in ORD[:nt]]
 block='decreto'if name in ['RLEPECFE','RLEPEPM']else'reglamento'
 state.update(titulo_nombre='Transitorios del '+block,capitulo_nombre=None,seccion_nombre=None)
 for n,(start,m)in enumerate(ts):add(start,ts[n+1][0]if n+1<len(ts)else end,'Transitorio '+ORD[n]+' · '+block,'transitorio',m[0])
 state.update(titulo_nombre='Documentos complementarios',capitulo_nombre=None,seccion_nombre=None)
 add(end,len(lines),'Firmas y expedición','complementario')
 assert set(owned)==set(range(len(lines)))
 edits=[]
 if name=='RLEPECFE':
  raw=(ROOT/'fuentes/RLEPECFE-erratas.txt').read_text(encoding='utf-8');assert hashlib.sha256((ROOT/'fuentes/RLEPECFE-erratas.html').read_bytes()).hexdigest()=='19f4cd118f8d2205eb353800cd37b473aa16aad984e3387d444572843a2cda94'
  old,new=re.findall(r'^La información y documentación.*$',raw,re.M);assert old.replace('Petróleos Mexicanos','Comisión Federal de Electricidad')==new
  article=next(c for c in chunks if c['identificador']=='Artículo 68');assert article['contenido'].count(old)==1
  article['contenido']=article['contenido'].replace(old,new)
  edits.append(dict(identificador='Artículo 68',tipo='fe de erratas',fecha='2025-12-29',antes=old,despues=new,url='https://sidof.segob.gob.mx/notas/docFuente/5777392'))
  chunks.append(dict(identificador='Fe de erratas DOF 29-12-2025 · Artículo 68',tipo_articulo='complementario',contenido='### Fe de erratas\n\n'+raw.strip()+'\n\n[Fuente oficial de la fe de erratas](https://sidof.segob.gob.mx/notas/docFuente/5777392).',**state,lineas_origen=[],fuente_adicional='RLEPECFE-erratas'))
 # Cotejo independiente contra el PDF de Diputados, artículo por artículo.
 pl=pdf_lines(name);pt=next(i for i,x in enumerate(pl)if x['texto'].upper()=='TRANSITORIOS')
 pm=[(i,ARTICLE.match(x['texto']))for i,x in enumerate(pl[:pt])if ARTICLE.match(x['texto'])]
 assert [int(m[1])for i,m in pm]==list(range(1,total+1))
 differences=[];matched=0
 for n,(start,m)in enumerate(pm):
  end=pm[n+1][0]if n+1<len(pm)else pt
  cut=next((i for i in range(start,end)if HEAD.fullmatch(pl[i]['texto'])),end)
  text=' '.join(x['texto']for x in pl[start:cut])[len(m[0]):].strip()
  text=re.sub(r'Fe de erratas al párrafo DOF 29-12-2025','',text)
  row=next(c for c in chunks if c['identificador']=='Artículo '+m[1]);row['paginas_pdf']=sorted({x['pagina']for x in pl[start:cut]})
  # Diferencia tipográfica cotejada: guion corto HTML / raya PDF en megawatts-hora.
  a,b=compact(row['contenido']).replace('–','-'),compact(text).replace('–','-')
  if a==b:matched+=1
  else:
   op=difflib.SequenceMatcher(None,a,b,autojunk=False)
   differences.append(dict(articulo=m[1],cambios=[dict(html=a[max(0,i-35):j+35],pdf=b[max(0,k-35):l+35])for tag,i,j,k,l in op.get_opcodes()if tag!='equal']))
 pend=next(i for i in range(pt+1,len(pl))if pl[i]['texto'].startswith('Dado en la residencia'))
 ptrans=[(i,TRANS.match(pl[i]['texto']))for i in range(pt+1,pend)if TRANS.match(pl[i]['texto'])]
 assert [normal(m[1])for i,m in ptrans]==[normal(x)for x in ORD[:nt]]
 for n,(start,m)in enumerate(ptrans):
  stop=ptrans[n+1][0]if n+1<len(ptrans)else pend
  text=' '.join(x['texto']for x in pl[start:stop])[len(m[0]):].strip()
  row=next(c for c in chunks if c['identificador']=='Transitorio '+ORD[n]+' · '+block)
  assert compact(row['contenido'])==compact(text),(name,'Transitorio '+ORD[n])
  row['paginas_pdf']=sorted({x['pagina']for x in pl[start:stop]})
 assert not differences,(name,'diferencias sustantivas PDF pendientes')
 result=dict(instrumento=name,chunks=chunks,temas=themes,cambios_cotejados=edits,control=dict(sha256=sha,ordinarios=total,transitorios=nt,bloque_transitorios=block,lineas_cuerpo=len(lines),lineas_asignadas=len(owned),cobertura_total=True,sin_solapamientos=True,articulos_cotejados_pdf=matched,transitorios_cotejados_pdf=nt,diferencias_pdf=differences,normalizacion_cotejo='Se ignoran espacios, guion blando, diferencia de raya/guion y la nota editorial de fe de erratas del PDF; el texto de origen se conserva.'),asignacion=owned)
 assert len({x['identificador']for x in chunks})==len(chunks)
 save(ROOT/f'{name}-revisado.json',result)
 print(name,'artículos',total,'transitorios',nt,'fragmentos',len(chunks),'temas',len(themes),'diferenciasPDF',json.dumps(differences,ensure_ascii=False))

if __name__=='__main__':
 for name in PROFILES:parse(name)
