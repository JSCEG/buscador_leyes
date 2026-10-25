"""GET y OPTIONS únicamente. Nunca imprime claves ni credenciales."""
import datetime
import json
import pathlib
import sys
import urllib.request
import urllib.error
import urllib.parse
import time

base = sys.argv[1].rstrip('/')
key = pathlib.Path(sys.argv[2]).read_text().strip()
reference = json.loads(pathlib.Path(sys.argv[3]).read_text())
restricted = pathlib.Path(sys.argv[4]).read_text().strip() if len(sys.argv) > 4 and sys.argv[4] != '-' else None
checks = 0
examples = {}

def request(path, params=None, expected=200, api_key=key, origin=None, method='GET'):
    global checks
    url = base + path + ('?' + urllib.parse.urlencode(params) if params else '')
    headers = {}
    if api_key is not None:
        headers['X-Api-Key'] = api_key
    if origin:
        headers['Origin'] = origin
    if method == 'OPTIONS':
        headers.update({'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'x-api-key'})
    req = urllib.request.Request(url, headers=headers, method=method)
    try:
        response = urllib.request.urlopen(req, timeout=90)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = response.read()
        assert response.status == expected, (path, params, response.status, body[:200])
        checks += 1
        payload = json.loads(body) if body else None
        if response.status == 200 and api_key == key:
            examples.setdefault(path, {'query': params, 'response': payload})
        return payload, response.headers


request('/api/v1/permisos', api_key=None, expected=401)
request('/api/v1/permisos', api_key='invalid-key-123456789012345678901234567890', expected=401)
request('/health/live', api_key=None)
request('/health/ready')
catalog, _ = request('/api/v1/catalogo')
assert len(catalog['tablas']) == 15

for table, expected_counts in reference['counts'].items():
    data, headers = request('/api/v1/permisos', {'tabla': table, 'pageSize': 2})
    assert data['total'] == expected_counts['total'], (table, data['total'], expected_counts)
    assert data['pageSize'] == 2 and len(data['data']) <= 2
    assert data['nextPage'] == (2 if data['total'] > 2 else None)
    assert headers['Cache-Control'] == 'no-store'
    for row in data['data']:
        assert row['tabla'] == table and isinstance(row['datos'], dict)
        assert row['numero'] == row['numero'].strip()
        assert row['efId'] == row['efId'].strip()
        if row['efId'] == '--':
            assert row['entidad'] == 'Sin entidad'
        if row['fechaActualizacion']:
            assert row['fechaActualizacion'].endswith('Z')
            datetime.datetime.fromisoformat(row['fechaActualizacion'].replace('Z', '+00:00'))
    if data['data']:
        row = data['data'][0]
        detail, _ = request('/api/v1/detalle', {'tabla': table, 'numero': row['numero']})
        assert detail['numero'] == row['numero'] and detail['datos'] == row['datos']
    points, _ = request('/api/v1/puntos', {'tabla': table, 'pageSize': 2})
    assert points['total'] == expected_counts['puntos'], (table, points['total'], expected_counts)
    assert all(10 <= p['latitud'] <= 36 and -121 <= p['longitud'] <= -82 for p in points['data'])
    missing, _ = request('/api/v1/sin-ubicacion', {'tabla': table, 'pageSize': 1})
    assert missing['total'] + points['total'] == data['total']
    states, _ = request('/api/v1/estados', {'tabla': table})
    if table != 'asignaciones':
        assert sum(s['permisos'] for s in states['data']) == data['total']
    print(f"OK {table}: {data['total']} filas, {points['total']} puntos", flush=True)

all_rows, _ = request('/api/v1/permisos', {'pageSize': 1})
assert all_rows['total'] == sum(c['total'] for c in reference['counts'].values())
cne, _ = request('/api/v1/permisos', {'autoridad': 'CNE', 'pageSize': 1})
sener, _ = request('/api/v1/permisos', {'autoridad': 'SENER', 'pageSize': 1})
assert cne['total'] + sener['total'] == all_rows['total']
first, _ = request('/api/v1/permisos', {'tabla': 'transporte', 'pageSize': 2})
second, _ = request('/api/v1/permisos', {'tabla': 'transporte', 'pageSize': 2, 'page': 2})
assert {r['numero'] for r in first['data']}.isdisjoint(r['numero'] for r in second['data'])
active, _ = request('/api/v1/permisos', {'tabla': 'transporte', 'estatus': 'Vigente', 'pageSize': 1})
inactive, _ = request('/api/v1/permisos', {'tabla': 'transporte', 'estatus': 'No vigente', 'pageSize': 1})
assert active['total'] + inactive['total'] == first['total']
states, _ = request('/api/v1/estados', {'tabla': 'asignaciones', 'estatus': 'Vigente'})
assert {s['efId']: s['permisos'] for s in states['data'] if s['efId'] != '--'} == {s['efId']: s['permisos'] for s in reference['asignacionesEstados']}
towns, _ = request('/api/v1/asignaciones/municipios', {'pageSize': 1})
assert towns['total'] > 0
sample = towns['data'][0]
filtered, _ = request('/api/v1/permisos', {'tabla': 'asignaciones', 'ef': sample['efId'], 'mpo': sample['mpoId']})
assert any(r['numero'] == sample['numeroAsignacion'] for r in filtered['data'])
request('/api/v1/municipios', {'tabla': 'asignaciones', 'ef': sample['efId']})
multi, _ = request('/api/v1/permisos', {'tabla': 'asignaciones', 'mercado': 'Gas natural', 'pageSize': 1})
assert multi['total'] > 0 and multi['data'][0]['mercado'] == 'Varios'
links, _ = request('/api/v1/ligas', {'pageSize': 1})
assert links['total'] > 0 and 'ligaPermiso' in links['data'][0]
updates, _ = request('/api/v1/actualizaciones')
assert {'CNE', 'SENER'} == {u['autoridad'] for u in updates['data']}
assert all(u['fechaActualizacion'].endswith('Z') for u in updates['data'])
assert all(u['clave'] for u in updates['data'])
assert any(u['tabla'] == 'Pozos_SENER' and u['clave'] == 'pozos' for u in updates['data'])
search, _ = request('/api/v1/permisos', {'tabla': 'asignaciones', 'q': 'petroleos mexicanos', 'pageSize': 1})
assert search['total'] > 0 and 'Mexicanos' in search['data'][0]['razonSocial']
partial = first['data'][0]['numero'][-8:]
search, _ = request('/api/v1/permisos', {'tabla': 'transporte', 'q': partial, 'pageSize': 5})
assert search['total'] > 0 and all(partial.lower() in row['numero'].lower() for row in search['data'])
literal, _ = request('/api/v1/permisos', {'q': '%_[', 'pageSize': 1})
assert literal['total'] == 0
for invalid in ({'q': 'x'}, {'q': 'x' * 121}, {'ligero': 'yes'}):
    request('/api/v1/puntos', invalid, expected=400)
start = time.perf_counter()
numbers = []
page = 1
while page is not None:
    light, _ = request('/api/v1/puntos', {'tabla': 'electricidad', 'pageSize': 500, 'page': page, 'ligero': 'true'})
    assert all(set(row) == {'tabla','numero','razonSocial','estatus','estatusFuente','latitud','longitud','autoridad','tipo'} for row in light['data'])
    numbers.extend(row['numero'] for row in light['data'])
    page = light['nextPage']
assert len(numbers) == len(set(numbers)) == reference['counts']['electricidad']['puntos']
elapsed = time.perf_counter()-start
assert elapsed < 90, ('Carga ligera completa demasiado lenta', elapsed)
print(f'OK {len(numbers)} puntos ligeros en {elapsed:.2f} s, sin datos ni PDF.', flush=True)
request('/api/v1/detalle', {'tabla': 'transporte', 'numero': 'INEXISTENTE'}, expected=404)
empty, _ = request('/api/v1/permisos', {'tabla': 'transporte', 'tipo': "' OR 1=1--"})
assert empty['total'] == 0

for invalid in ({'tabla': 'otra'}, {'tabla': "transporte];DROP TABLE X--"}, {'page': 0}, {'pageSize': 501},
                {'page': -1}, {'ef': '9'}, {'ef': '٠٩'}, {'mpo': '001'}, {'estatus': 'todos'}, {'autoridad': 'OTRA'},
                {'mercado': '%'}, {'sql': 'SELECT 1'}, [('ef', '09'), ('ef', '10')]):
    request('/api/v1/permisos', invalid, expected=400)

_, headers = request('/api/v1/permisos', {'tabla': 'pozos', 'pageSize': 1}, origin='https://buscador-juridico.com')
assert headers.get('Access-Control-Allow-Origin') == 'https://buscador-juridico.com'
_, headers = request('/api/v1/permisos', {'tabla': 'pozos', 'pageSize': 1}, origin='https://otro.example')
assert headers.get('Access-Control-Allow-Origin') is None
_, headers = request('/api/v1/permisos', origin='https://buscador-juridico.com', method='OPTIONS', expected=204, api_key=None)
assert headers.get('Access-Control-Allow-Origin') == 'https://buscador-juridico.com'

if restricted:
    request('/api/v1/permisos', api_key=restricted, expected=403)
    request('/api/v1/puntos', {'tabla': 'pozos'}, api_key=restricted, expected=403)
    limited, _ = request('/api/v1/puntos', {'pageSize': 5}, api_key=restricted)
    assert all(r['tabla'] == 'electricidad' for r in limited['data'])

print(f'OK {checks} comprobaciones HTTP: autorización, paginación, esquema, CORS, filtros, agregaciones y detalle.', flush=True)
if len(sys.argv) > 5:
    pathlib.Path(sys.argv[5]).write_text(json.dumps({'checks': checks, 'examples': examples}, ensure_ascii=False, indent=2), encoding='utf-8')
