# Los equipos de la figura de las centrales térmicas, modelados en Blender. Lo corre scripts/build-blender.mjs, que le pasa el
# acomodo de lugar.js y deja conceptos-3d/termicas/equipos.glb. Se escribe en coordenadas de three.js (y hacia arriba).
# Los tubos con lo que corre por ellos (vapor, carbón, agua, electricidad) no van aquí: los dibuja la página, con su física.
import math
import sys

sys.path.insert(0, sys.argv[sys.argv.index('--kit') + 1])
from kit import PI, Modelo, argumentos  # noqa: E402

opciones, L = argumentos()
S = L['SITIO']
m = Modelo({'carbon': '#2b2b2e', 'llama': '#ff8a3c', 'agua': '#4fb3c9', 'ceniza': '#9a968e', 'vidrioV': '#7fa2bf'})


def barandal(parte, puntos, y, mat='grafito', **kw):
    """Pasamanos y postes a lo largo de una quebrada a la altura y."""
    for (ax, az), (bx, bz) in zip(puntos, puntos[1:]):
        m.viga(parte, mat, (ax, y + 0.12, az), (bx, y + 0.12, bz), 0.012, **kw)
        n = max(1, int(math.hypot(bx - ax, bz - az) / 0.32))
        for i in range(n + 1):
            t = i / n
            px, pz = ax + (bx - ax) * t, az + (bz - az) * t
            m.viga(parte, mat, (px, y, pz), (px, y + 0.12, pz), 0.01, **kw)


def escalera(parte, x, z, alto, ancho=0.18, giro=0.0, mat='grafito', **kw):
    """Torre de escaleras en zigzag."""
    tramos = max(2, int(alto / 0.3))
    c, s = math.cos(giro), math.sin(giro)
    rot = lambda dx, dz: (x + dx * c + dz * s, z - dx * s + dz * c)  # noqa: E731
    for esq in ((-ancho / 2, -ancho / 2), (ancho / 2, -ancho / 2), (-ancho / 2, ancho / 2), (ancho / 2, ancho / 2)):
        px, pz = rot(*esq)
        m.viga(parte, mat, (px, 0, pz), (px, alto, pz), 0.018, **kw)
    for i in range(tramos):
        y0, y1 = alto * i / tramos, alto * (i + 1) / tramos
        lado = -ancho / 4 if i % 2 == 0 else ancho / 4
        a = rot(-ancho / 2, lado)
        b = rot(ancho / 2, lado)
        m.viga(parte, mat, (a[0], y0, a[1]) if i % 2 == 0 else (b[0], y0, b[1]), (b[0], y1, b[1]) if i % 2 == 0 else (a[0], y1, a[1]), 0.06, 0.012, **kw)
        q0, q1 = rot(-ancho / 2, 0), rot(ancho / 2, 0)
        m.viga(parte, mat, (q0[0], y1, q0[1]), (q1[0], y1, q1[1]), ancho, 0.01, **kw)


def aislador(parte, x, y, z, alto, r=0.03, mat='porcelana', **kw):
    """Boquilla de porcelana con sus faldas."""
    perfil = [(0.0, 0.0), (r, 0.0)]
    n = max(2, int(alto / 0.08))
    for i in range(n):
        h = alto * (i + 0.5) / n
        perfil += [(r * 1.7, h), (r, h + alto / n * 0.45)]
    perfil += [(r * 0.8, alto), (0.0, alto + 0.01)]
    m.torno(parte, mat, perfil, x, y, z, seg=8, **kw)


# ------------------------------------------------------------------ patio de carbón y apiladora-recuperadora
def patio():
    px, pz = S['patio']
    largo, ancho, alto = 2.9, 1.25, 0.72

    def pila(x, z):
        dx = max(0.0, abs(x - px) - largo / 2 + ancho / 2)
        d = math.hypot(dx, z - pz)
        ruido = 0.025 * math.sin(x * 9.1) * math.cos(z * 7.3)
        mordida = 0.18 * max(0.0, 1 - math.hypot(x - (S['apiladora'][0] + 0.05), z - (pz - 0.35)) / 0.45)
        return max(0.0, alto * (1 - d / (ancho / 2 + 0.05)) + ruido - mordida)

    m.relieve('patio', 'carbon', px - largo / 2 - 0.15, px + largo / 2 + 0.15, pz - ancho / 2 - 0.12, pz + ancho / 2 + 0.12, 32, 13, pila, recortar=True)
    # rieles de la máquina
    ax, az = S['apiladora']
    for dz in (-0.13, 0.13):
        m.caja('patio', 'acero', px, 0, az + dz, largo + 0.7, 0.03, 0.03)
    for i in range(18):
        m.caja('patio', 'concreto', px - largo / 2 - 0.3 + i * (largo + 0.6) / 17, 0, az, 0.05, 0.015, 0.36)
    # la apiladora-recuperadora: pórtico, torre que gira, cabina, pluma con banda y rueda de cangilones
    for dx in (-0.2, 0.2):
        for dz in (-0.13, 0.13):
            m.caja('patio', 'grafito', ax + dx, 0.03, az + dz, 0.12, 0.06, 0.07, bisel=0.01)
    m.caja('patio', 'guinda', ax, 0.09, az, 0.55, 0.12, 0.36, bisel=0.015)
    m.cil('patio', 'grafito', ax, 0.21, az, 0.13, 0.22, seg=24)
    m.caja('patio', 'marfil', ax + 0.12, 0.43, az - 0.05, 0.16, 0.12, 0.12, bisel=0.01)
    m.caja('patio', 'vidrioV', ax + 0.2, 0.46, az - 0.05, 0.005, 0.06, 0.1)
    top = (ax, 0.48, az)
    punta = (ax, 0.3, pz - 0.38)
    for dx in (-0.05, 0.05):
        m.viga('patio', 'guinda', (ax + dx, 0.5, az), (ax + dx, 0.36, punta[2] - 0.05), 0.025)
        m.viga('patio', 'guinda', (ax + dx, 0.62, az + 0.05), (ax + dx, 0.42, punta[2] - 0.1), 0.018)
    n = 7
    for i in range(n):
        t0, t1 = i / n, (i + 1) / n
        z0, z1 = az + (punta[2] - 0.05 - az) * t0, az + (punta[2] - 0.05 - az) * t1
        y0, y1 = 0.5 + (0.36 - 0.5) * t0, 0.5 + (0.36 - 0.5) * t1
        m.viga('patio', 'grafito', (ax, y0, z0), (ax, y1 + 0.1, z1), 0.012)
    m.viga('patio', 'guinda', (ax, 0.66, az + 0.02), (ax, 0.5, az - 0.6), 0.03)
    m.caja('patio', 'concreto', ax, 0.36, az - 0.62, 0.2, 0.18, 0.16, bisel=0.01)
    # rueda de cangilones: gira sobre x, en la punta de la pluma
    wx, wy, wz = ax, punta[1], punta[2]
    kw = dict(gira='x', pivote=(wx, wy, wz), vel='rueda')
    m.aro('patio', 'acero', wx + 0.06, wy, wz, 0.15, 0.014, eje='x', seg=32, **kw)
    m.aro('patio', 'acero', wx - 0.06, wy, wz, 0.15, 0.014, eje='x', seg=32, **kw)
    for i in range(10):
        a = 2 * PI * i / 10
        m.caja('patio', 'grafito', wx, wy + 0.15 * math.sin(a) - 0.035, wz + 0.15 * math.cos(a), 0.14, 0.07, 0.07, giro=0.0, **kw)
    m.cil('patio', 'acero', wx, wy, wz, 0.03, 0.18, eje='x', seg=12, **kw)


# ------------------------------------------------------------------ tanques de combustóleo
def combustoleo():
    cx, cz = S['combustoleo']
    for dx in (-0.72, 0.72):
        x = cx + dx
        m.torno('combustoleo', 'tanque', [(0.0, 0.0), (0.56, 0.0), (0.56, 0.14), (0.565, 0.145), (0.565, 0.155), (0.56, 0.16), (0.56, 0.32), (0.565, 0.325), (0.565, 0.335), (0.56, 0.34), (0.56, 0.52), (0.5, 0.6), (0.06, 0.66), (0.0, 0.66)], x, 0, cz, seg=32)
        m.aro('combustoleo', 'grafito', x, 0.64, cz, 0.42, 0.006, seg=24, seg2=4)
        for i in range(8):
            a0, a1 = -0.6 + i * 0.16, -0.6 + (i + 1) * 0.16
            r = 0.6
            m.viga('combustoleo', 'grafito', (x + r * math.cos(a0), 0.52 * i / 8, cz + r * math.sin(a0)), (x + r * math.cos(a1), 0.52 * (i + 1) / 8, cz + r * math.sin(a1)), 0.05, 0.01)
    # muro de contención
    for (x0, z0, x1, z1) in ((cx - 1.4, cz - 0.72, cx + 1.4, cz - 0.72), (cx - 1.4, cz + 0.72, cx + 1.4, cz + 0.72), (cx - 1.4, cz - 0.72, cx - 1.4, cz + 0.72), (cx + 1.4, cz - 0.72, cx + 1.4, cz + 0.72)):
        m.viga('combustoleo', 'concreto', (x0, 0.06, z0), (x1, 0.06, z1), 0.04, 0.12)
    # bombas y calentadores: el combustóleo se calienta para que fluya
    for i in range(3):
        m.cil('combustoleo', 'guinda', cx + 1.2, 0.0, cz - 0.3 + i * 0.3, 0.05, 0.08, eje='y', seg=12)
        m.caja('combustoleo', 'grafito', cx + 1.2, 0.0, cz - 0.3 + i * 0.3 + 0.07, 0.07, 0.06, 0.06)


# ------------------------------------------------------------------ molinos y tolvas
def molinos():
    mx, mz = S['molinos']
    x0, x1, z0, z1 = mx - 0.42, mx + 0.42, mz - 0.75, mz + 0.75
    for x in (x0, x1):
        for z in (z0, mz, z1):
            m.caja('molinos', 'grafito', x, 0, z, 0.04, 2.55, 0.04)
    for y in (1.2, 2.5):
        barandal('molinos', [(x0, z0), (x0, z1)], y)
    m.caja('molinos', 'marfil', mx, 1.2, mz, 0.84, 1.3, 1.5, cub='molinos', abre=['molinos'])
    m.caja('molinos', 'techo', mx, 2.5, mz, 0.9, 0.05, 1.56, cub='molinos', abre=['molinos'])
    for i, dz in enumerate((-0.48, 0.0, 0.48)):
        z = mz + dz
        m.torno('molinos', 'acero', [(0.05, 1.05), (0.07, 1.05), (0.2, 1.45), (0.2, 2.35), (0.0, 2.36)], mx, 0, z, seg=16)
        m.cil('molinos', 'grafito', mx, 0.75, z, 0.04, 0.3, seg=10)
        m.caja('molinos', 'gabinete', mx, 0.6, z, 0.14, 0.15, 0.12, bisel=0.01)
        # el molino: mesa que gira, cuerpo, clasificador arriba
        m.cil('molinos', 'grafito', mx + 0.05, 0.0, z, 0.17, 0.12, seg=20)
        m.torno('molinos', 'guinda', [(0.15, 0.12), (0.17, 0.3), (0.12, 0.42), (0.05, 0.48), (0.0, 0.48)], mx + 0.05, 0, z, seg=20)
        m.caja('molinos', 'grafito', mx - 0.22, 0, z, 0.16, 0.1, 0.1, bisel=0.01)
        m.cil('molinos', 'acero', mx - 0.12, 0.05, z, 0.025, 0.12, eje='x', seg=10)


# ------------------------------------------------------------------ caldera
def caldera():
    cx, cz = S['caldera']
    W, D, H = L['CALDERA']['ancho'], L['CALDERA']['fondo'], L['CALDERA']['alto']
    x0, x1, z0, z1 = cx - W / 2, cx + W / 2, cz - D / 2, cz + D / 2
    # estructura de acero por fuera
    for x in (x0 - 0.03, cx - W / 6, cx + W / 6, x1 + 0.03):
        for z in (z0 - 0.03, z1 + 0.03):
            m.caja('caldera', 'grafito', x, 0, z, 0.035, H, 0.035)
    for z in (cz - D / 6, cz + D / 6):
        for x in (x0 - 0.03, x1 + 0.03):
            m.caja('caldera', 'grafito', x, 0, z, 0.035, H, 0.035)
    for y in (1.2, 2.4, H - 0.02):
        for (ax, az, bx, bz) in ((x0 - 0.03, z0 - 0.03, x1 + 0.03, z0 - 0.03), (x0 - 0.03, z1 + 0.03, x1 + 0.03, z1 + 0.03), (x0 - 0.03, z0 - 0.03, x0 - 0.03, z1 + 0.03), (x1 + 0.03, z0 - 0.03, x1 + 0.03, z1 + 0.03)):
            m.viga('caldera', 'grafito', (ax, y, az), (bx, y, bz), 0.025, 0.04)
        barandal('caldera', [(x1 + 0.03, z0 - 0.03), (x1 + 0.03, z1 + 0.03)], y)
    escalera('caldera', x1 + 0.2, z1 - 0.15, H - 0.2)
    # la cubierta: se vuelve vidrio para ver el hogar
    kc = dict(cub='caldera', abre=['caldera', 'molinos'])
    m.caja('caldera', 'marfil', cx, 0.0, cz, W, H, D, bisel=0.015, **kc)
    for y in (0.6, 1.8, 3.0):
        m.caja('caldera', 'marfil', cx, y, cz, W + 0.025, 0.045, D + 0.025, **kc)
    for y in (1.15, 2.35):
        m.caja('caldera', 'techo', cx, y, cz, W + 0.02, 0.14, D + 0.02, **kc)
    m.caja('caldera', 'techo', cx, H, cz, W + 0.12, 0.08, D + 0.12, bisel=0.01, **kc)
    m.caja('caldera', 'techo', cx - 0.2, H + 0.08, cz, 0.7, 0.18, 0.7, bisel=0.01, **kc)
    # adentro: el hogar con sus paredes de tubos, los quemadores, el domo, los sobrecalentadores y el economizador
    fx, fz = cx - 0.22, cz
    m.caja('caldera', 'acero', fx, 0.35, fz, 0.86, 2.55, 0.92)
    for i in range(10):
        z = fz - 0.42 + i * 0.093
        m.caja('caldera', 'grafito', fx - 0.435, 0.35, z, 0.012, 2.55, 0.02)
    for i in range(9):
        x = fx - 0.39 + i * 0.097
        m.caja('caldera', 'grafito', x, 0.35, fz + 0.465, 0.02, 2.55, 0.012)
    m.caras('caldera', 'acero', [(fx - 0.43, 0.35, fz - 0.46), (fx + 0.43, 0.35, fz - 0.46), (fx + 0.43, 0.35, fz + 0.46), (fx - 0.43, 0.35, fz + 0.46), (fx - 0.1, 0.05, fz - 0.46), (fx + 0.1, 0.05, fz - 0.46), (fx + 0.1, 0.05, fz + 0.46), (fx - 0.1, 0.05, fz + 0.46)],
            [(0, 4, 7, 3), (1, 2, 6, 5), (0, 1, 5, 4), (3, 7, 6, 2), (4, 5, 6, 7)])
    for y in (0.75, 1.05, 1.35):
        for dz in (-0.25, 0.0, 0.25):
            m.cil('caldera', 'grafito', fx - 0.5, y, fz + dz, 0.055, 0.12, eje='x', seg=16)
            m.cil('caldera', 'llama', fx - 0.43, y, fz + dz, 0.035, 0.02, eje='x', seg=12, sombra=False)
    m.cil('caldera', 'acero', cx - 0.15, 3.1, cz, 0.12, 0.95, eje='x', seg=24)
    for sx in (-1, 1):
        m.torno('caldera', 'acero', [(0.0, 0.0), (0.12, 0.0), (0.1, 0.06), (0.05, 0.1), (0.0, 0.11)], cx - 0.15 + sx * 0.475, 3.1, cz, seg=20, eje='x' if sx > 0 else 'x', giro=0.0 if sx > 0 else PI)
    for dx in (-0.45, 0.15):
        for dz in (-0.38, 0.38):
            m.cil('caldera', 'acero', cx + dx, 0.2, cz + dz, 0.025, 2.9, seg=10)
    for i in range(7):
        m.caja('caldera', 'cobre', cx + 0.3 + (i - 3) * 0.07, 2.2, cz, 0.015, 0.75, 0.7)
    m.caja('caldera', 'acero', cx + 0.5, 0.8, cz, 0.38, 2.0, 0.85)
    for y in (1.0, 1.3, 1.6, 1.9, 2.2, 2.5):
        m.caja('caldera', 'cobre', cx + 0.5, y, cz, 0.4, 0.025, 0.87)
    # precalentador de aire: gira despacio y le pasa el calor de los gases al aire que entra
    ax, az = S['precalentador']
    ay = 0.7
    for dx in (-0.2, 0.2):
        for dz in (-0.2, 0.2):
            m.caja('caldera', 'grafito', ax + dx, 0, az + dz, 0.03, ay, 0.03)
    m.cil('caldera', 'acero', ax, ay, az, 0.2, 0.32, seg=24, gira='y', pivote=(ax, ay + 0.16, az), vel='precalentador')
    for i in range(12):
        a = 2 * PI * i / 12
        m.viga('caldera', 'grafito', (ax, ay + 0.33, az), (ax + 0.2 * math.cos(a), ay + 0.33, az + 0.2 * math.sin(a)), 0.012, gira='y', pivote=(ax, ay + 0.16, az), vel='precalentador')
    m.caja('caldera', 'gabinete', ax, ay + 0.34, az, 0.46, 0.2, 0.46, bisel=0.01)
    # ventilador de tiro forzado: mete el aire que se calienta en el precalentador
    m.caja('caldera', 'gabinete', ax + 0.5, 0.0, az, 0.24, 0.32, 0.24, bisel=0.01)
    m.cil('caldera', 'acero', ax + 0.5, 0.16, az, 0.14, 0.3, eje='z', seg=24)


# ------------------------------------------------------------------ filtro de cenizas (precipitador electrostático) y ventiladores
def precipitador():
    px, pz = S['precipitador']
    w, d = 1.35, 0.95  # los gases van hacia atrás (-z): entran por el frente y salen hacia la chimenea
    for dx in (-0.6, 0.0, 0.6):
        for dz in (-0.42, 0.42):
            m.caja('precipitador', 'grafito', px + dx, 0, pz + dz, 0.05, 0.75, 0.05)
    for i in range(3):
        for j in range(2):
            hx, hz = px - 0.42 + i * 0.42, pz - 0.23 + j * 0.46
            m.torno('precipitador', 'gabinete', [(0.03, 0.35), (0.04, 0.35), (0.27, 0.75)], hx, 0, hz, seg=4, giro=PI / 4, liso=False)
            m.cil('precipitador', 'grafito', hx, 0.22, hz, 0.035, 0.14, seg=10)
    m.caja('precipitador', 'gabinete', px, 0.75, pz, w, 0.85, d, bisel=0.02, cub='precipitador', abre=['precipitador'])
    for i in range(6):
        for sx in (-1, 1):
            m.caja('precipitador', 'gabinete', px + sx * (w / 2 + 0.012), 0.75, pz - 0.4 + i * 0.16, 0.02, 0.85, 0.03, cub='precipitador', abre=['precipitador'])
    for i in range(3):
        m.caja('precipitador', 'techo', px, 1.6, pz - 0.3 + i * 0.3, w - 0.1, 0.12, 0.2, bisel=0.01)
    # adentro: placas colectoras, paralelas al paso de los gases
    for i in range(11):
        m.caja('precipitador', 'acero', px - 0.55 + i * 0.11, 0.82, pz, 0.008, 0.7, d - 0.12)
    # entrada (desde el precalentador) y salida de gases
    m.torno('precipitador', 'gabinete', [(0.2, 0.0), (0.4, 0.3)], px, 1.17, pz + d / 2 + 0.3, seg=4, eje='z', giro=PI / 4, liso=False)
    m.torno('precipitador', 'gabinete', [(0.4, 0.0), (0.2, 0.28)], px, 1.17, pz - d / 2, seg=4, eje='z', giro=PI / 4, liso=False)
    # ventiladores de tiro inducido: jalan los gases y los mandan a la chimenea
    fz = pz - d / 2 - 0.4
    m.viga('precipitador', 'gabinete', (px, 1.17, pz - d / 2 - 0.27), (px, 0.4, fz), 0.24, 0.2)
    for dx in (-0.32, 0.32):
        m.cil('precipitador', 'acero', px + dx, 0.2, fz, 0.18, 0.12, eje='x', seg=24)
        m.caja('precipitador', 'grafito', px + dx * 1.7, 0, fz, 0.14, 0.14, 0.16, bisel=0.01)
    m.caja('precipitador', 'gabinete', px, 0.12, fz, 0.42, 0.26, 0.22)


# ------------------------------------------------------------------ chimenea
def chimenea():
    x, z = S['chimenea']
    H = L['ALTO_CHIMENEA']
    m.torno('chimenea', 'concreto', [(0.48, 0.0), (0.4, 0.2), (0.3, 1.0), (0.24, H - 0.9), (0.24, H), (0.2, H), (0.2, H - 0.25), (0.0, H - 0.25)], x, 0, z, seg=32)
    for i in range(6):
        y0 = H - 0.9 + i * 0.15
        m.torno('chimenea', 'guinda' if i % 2 == 0 else 'marfil', [(0.243, y0), (0.243, y0 + 0.15)], x, 0, z, seg=32, liso=True)
    for y in (2.6, H - 0.95):
        r = 0.27 if y < 3 else 0.25
        m.cil('chimenea', 'grafito', x, y, z, r + 0.08, 0.025, seg=24)
        m.aro('chimenea', 'grafito', x, y + 0.12, z, r + 0.08, 0.008, seg=24, seg2=4)
    m.caja('chimenea', 'gabinete', x, 0.0, z + 0.45, 0.34, 0.38, 0.32, bisel=0.01)


# ------------------------------------------------------------------ sala de turbinas: turbina de vapor, generador y condensador
def sala():
    sx, sz = S['turbina']
    W, D, H = L['SALA']['ancho'], L['SALA']['fondo'], L['SALA']['alto']
    x0, x1, z0, z1 = sx - W / 2, sx + W / 2, sz - D / 2, sz + D / 2
    kc = dict(cub='sala', abre=['turbina', 'generador', 'condensador'])
    m.caja('turbina', 'marfil', sx, 0, sz, W, H, D, bisel=0.015, **kc)
    for i in range(12):
        x = x0 + 0.14 + i * (W - 0.28) / 11
        m.caja('turbina', 'grafito', x, 0, z1 + 0.012, 0.035, H, 0.02, **kc)
        m.caja('turbina', 'grafito', x, 0, z0 - 0.012, 0.035, H, 0.02, **kc)
    m.caras('turbina', 'techo', [(x0 - 0.06, H, z0 - 0.06), (x1 + 0.06, H, z0 - 0.06), (x1 + 0.06, H, z1 + 0.06), (x0 - 0.06, H, z1 + 0.06), (x0 - 0.06, H + 0.22, sz), (x1 + 0.06, H + 0.22, sz)],
            [(0, 1, 5, 4), (3, 4, 5, 2), (0, 4, 3), (1, 2, 5)], **kc)
    for i in range(5):
        m.caja('turbina', 'techo', x0 + 0.4 + i * 0.62, H + 0.1, sz, 0.26, 0.1, 0.22, bisel=0.01, **kc)
    # grúa viajera
    for z in (z0 + 0.08, z1 - 0.08):
        m.viga('turbina', 'grafito', (x0 + 0.05, 1.2, z), (x1 - 0.05, 1.2, z), 0.04, 0.06)
    m.viga('turbina', 'guinda', (sx + 0.6, 1.24, z0 + 0.08), (sx + 0.6, 1.24, z1 - 0.08), 0.07, 0.08)
    m.caja('turbina', 'grafito', sx + 0.6, 1.12, sz, 0.12, 0.1, 0.12)
    # mesa de concreto
    m.caja('turbina', 'concreto', sx - 0.05, 0, sz, W - 0.5, 0.32, 0.62)
    E = L['EJE']
    ty = E['y']
    # alta e intermedia presión
    hx = E['alta']
    m.torno('turbina', 'acero', [(0.0, 0.0), (0.16, 0.0), (0.22, 0.12), (0.26, 0.45), (0.3, 0.72), (0.22, 0.85), (0.0, 0.86)], hx, ty, sz, seg=28, eje='x')
    m.cil('turbina', 'grafito', hx + 0.43, ty + 0.27, sz, 0.03, 0.5, eje='z', seg=10)
    # dos de baja presión
    for bx in E['baja']:
        m.caja('turbina', 'acero', bx, 0.32, sz, 0.56, 0.28, 0.66, bisel=0.04)
        m.cil('turbina', 'acero', bx, ty + 0.02, sz, 0.3, 0.56, eje='x', seg=28)
        for dz in (-0.2, 0.2):
            m.cil('turbina', 'grafito', bx, ty + 0.25, sz + dz, 0.07, 0.14, seg=16)
    # generador, excitatriz y la caja de donde salen las barras
    gx = E['generador']
    m.cil('generador', 'guinda', gx, ty, sz, 0.26, 0.56, eje='x', seg=28)
    for dx in (-0.3, 0.3):
        m.cil('generador', 'grafito', gx + dx, ty, sz, 0.27, 0.04, eje='x', seg=28)
    m.caja('generador', 'grafito', gx, 0.32, sz, 0.58, 0.06, 0.6)
    m.cil('generador', 'marfil', E['excitatriz'], ty - 0.06, sz, 0.1, 0.14, eje='x', seg=24)
    m.caja('generador', 'gabinete', gx + 0.12, 0.3, sz + 0.3, 0.22, 0.26, 0.24, bisel=0.01)
    # la flecha que une todo: gira
    kg = dict(gira='x', pivote=(sx, ty, sz), vel='rotor')
    m.cil('turbina', 'acero', (hx + E['excitatriz']) / 2, ty, sz, 0.045, E['excitatriz'] - hx, eje='x', seg=14, **kg)
    for dx in (hx + 0.9, (E['baja'][0] + E['baja'][1]) / 2, (E['baja'][1] + gx) / 2):
        m.aro('turbina', 'grafito', dx, ty, sz, 0.07, 0.02, eje='x', seg=20, seg2=6, **kg)
    # condensador, bajo las turbinas de baja presión, con sus cajas de agua
    cxn = E['condensador']
    m.caja('condensador', 'tanque', cxn, 0.0, sz, 1.1, 0.3, 0.5, bisel=0.02)
    for dz in (-0.3, 0.3):
        m.cil('condensador', 'acero', cxn, 0.16, sz + dz, 0.13, 0.1, eje='z', seg=24)
    for i in range(3):
        m.cil('condensador', 'tanque', x0 + 0.35 + i * 0.32, 0.1, z1 - 0.12, 0.06, 0.28, eje='x', seg=16)


# ------------------------------------------------------------------ toma de agua de mar
def toma():
    tx, tz = S['toma']
    m.caja('condensador', 'concreto', tx, 0.0, tz - 0.1, 0.9, 0.22, 0.46, bisel=0.01)
    for i in range(6):
        m.caja('condensador', 'grafito', tx - 0.38 + i * 0.152, 0.0, tz + 0.15, 0.03, 0.24, 0.03)
    for i in range(3):
        m.cil('condensador', 'guinda', tx - 0.28 + i * 0.28, 0.22, tz - 0.15, 0.06, 0.16, seg=16)
        m.caja('condensador', 'grafito', tx - 0.28 + i * 0.28, 0.38, tz - 0.15, 0.08, 0.08, 0.08)
    barandal('condensador', [(tx - 0.45, tz + 0.12), (tx + 0.45, tz + 0.12)], 0.22)


# ------------------------------------------------------------------ transformador elevador
def transformador():
    """Transformador elevador: le llegan las barras del generador y sale la línea por un marco de remate."""
    x, z = S['trafo']
    B = L['BORNES']
    m.caja('trafo', 'concreto', x + 0.15, 0, z, 1.2, 0.04, 0.8)
    m.caja('trafo', 'trafo', x, 0.04, z, 0.44, 0.4, 0.38, bisel=0.015)
    for i in range(5):
        for sz in (-1, 1):
            m.caja('trafo', 'trafo', x - 0.16 + i * 0.08, 0.08, z + sz * 0.25, 0.012, 0.32, 0.1)
    m.cil('trafo', 'trafo', x - 0.1, 0.62, z, 0.06, 0.32, eje='z', seg=16)
    for dz in (-0.1, 0.1):
        m.viga('trafo', 'grafito', (x - 0.1, 0.44, z + dz), (x - 0.1, 0.58, z + dz), 0.02)
    # barras de fase aislada: salen de la caja del generador, cruzan la pared de la sala y entran por el lado de baja tensión
    gx, gy, gz = B['generador']
    xb = B['trafoBaja'][0]
    for dz in (-0.075, 0.0, 0.075):
        m.cil('trafo', 'acero', (gx + xb) / 2, gy, gz + dz, 0.028, xb - gx, eje='x', seg=12)
    for xs in (gx + 0.55, gx + 0.95):
        m.viga('trafo', 'grafito', (xs, 0.0, gz), (xs, gy - 0.03, gz), 0.03)
        m.viga('trafo', 'grafito', (xs, gy - 0.03, gz - 0.12), (xs, gy - 0.03, gz + 0.12), 0.02)
    m.caja('trafo', 'gabinete', xb - 0.03, gy - 0.08, z, 0.06, 0.16, 0.26)
    # boquillas de alta tensión en fila, y los tres conductores al marco de remate
    rx, ry, rz = B['remateTrafo']
    ry += 0.2  # el larguero va 0.2 arriba de donde terminan los aisladores, que es donde se amarra la línea
    for dz in (-0.12, 0.0, 0.12):
        aislador('trafo', x + 0.1, 0.44, z + dz, 0.24)
        m.viga('trafo', 'acero', (x + 0.1, 0.69, z + dz), (rx - 0.02, ry - 0.2, rz + dz * 1.4), 0.008)
        aislador('trafo', rx, ry - 0.2, rz + dz * 1.4, 0.16, r=0.012)
    for dz in (-0.28, 0.28):
        m.viga('trafo', 'grafito', (rx, 0.0, rz + dz), (rx, ry, rz + dz), 0.035)
    m.viga('trafo', 'grafito', (rx, ry - 0.02, rz - 0.32), (rx, ry - 0.02, rz + 0.32), 0.04)
    m.caja('trafo', 'concreto', x - 0.1, 0, z - 0.46, 0.7, 0.62, 0.06)


# ------------------------------------------------------------------ turbogás: dos unidades de ciclo abierto
def turbogas():
    gx, gz = S['turbogas']
    for k, dz in enumerate((-0.48, 0.48)):
        z = gz + dz
        m.caja('turbogas', 'concreto', gx, 0, z, 2.3, 0.04, 0.66)
        # generador (lado frío), caseta con la turbina adentro, difusor y chimenea corta
        m.caja('turbogas', 'trafo', gx - 0.78, 0.04, z, 0.5, 0.4, 0.46, bisel=0.02)
        for i in range(4):
            m.caja('turbogas', 'grafito', gx - 0.96 + i * 0.12, 0.44, z, 0.06, 0.03, 0.4)
        kc = dict(cub=f'turbogas{k}', abre=['turbogas'])
        m.caja('turbogas', 'marfil', gx + 0.05, 0.04, z, 1.05, 0.46, 0.5, bisel=0.025, **kc)
        m.caja('turbogas', 'guinda', gx + 0.05, 0.4, z + 0.252, 1.05, 0.03, 0.006, **kc)
        for dx in (-0.25, 0.25):
            m.cil('turbogas', 'grafito', gx + 0.05 + dx, 0.5, z, 0.07, 0.05, seg=16, **kc)
        # adentro: compresor, cámaras de combustión y turbina en un eje que gira
        kr = dict(gira='x', pivote=(gx + 0.05, 0.28, z), vel='turbogas')
        m.torno('turbogas', 'acero', [(0.0, 0.0), (0.16, 0.0), (0.1, 0.45), (0.13, 0.55), (0.12, 0.66), (0.17, 0.9), (0.0, 0.9)], gx - 0.4, 0.28, z, seg=20, eje='x', **kr)
        for i in range(5):
            m.aro('turbogas', 'grafito', gx - 0.33 + i * 0.08, 0.28, z, 0.15 - i * 0.012, 0.01, eje='x', seg=18, seg2=4, **kr)
        for i in range(6):
            a = 2 * PI * i / 6
            m.cil('turbogas', 'cobre', gx + 0.12, 0.28 + 0.15 * math.sin(a), z + 0.15 * math.cos(a), 0.03, 0.14, eje='x', seg=8)
        # casa de filtros arriba del compresor
        fx = gx - 0.35
        for dx in (-0.2, 0.2):
            for dzz in (-0.2, 0.2):
                m.caja('turbogas', 'grafito', fx + dx, 0.5, z + dzz, 0.03, 0.42, 0.03)
        m.caja('turbogas', 'gabinete', fx, 0.9, z, 0.5, 0.42, 0.56, bisel=0.015)
        for i in range(5):
            m.caja('turbogas', 'grafito', fx - 0.26, 0.94 + i * 0.07, z, 0.03, 0.025, 0.5)
        m.caja('turbogas', 'gabinete', fx, 0.5, z, 0.26, 0.4, 0.26)
        # escape
        ex = gx + 0.75
        m.caja('turbogas', 'acero', ex, 0.04, z, 0.32, 0.42, 0.42, bisel=0.02)
        m.torno('turbogas', 'acero', [(0.17, 0.0), (0.17, 0.75), (0.19, 0.78), (0.19, 0.82), (0.15, 0.82), (0.15, 0.7), (0.0, 0.7)], ex, 0.46, z, seg=24)
        m.aro('turbogas', 'grafito', ex, 0.46 + 0.5, z, 0.2, 0.008, seg=20, seg2=4)
    # trinchera de cables: de los dos generadores al transformador
    gxg = gx - 0.78
    m.caja('turbogas', 'concreto', (gxg + gx + 1.3) / 2, 0, gz, gx + 1.3 - gxg, 0.035, 0.12)
    for dz in (-0.13, 0.13):
        m.caja('turbogas', 'concreto', gxg, 0, gz + dz, 0.12, 0.035, 0.15)
        m.caja('turbogas', 'gabinete', gxg, 0.04, gz + dz * 1.75, 0.16, 0.2, 0.04)
    m.caja('turbogas', 'gabinete', gx + 1.28, 0.03, gz, 0.04, 0.2, 0.16)
    # transformador de las dos unidades
    tx, tz = gx + 1.45, gz
    m.caja('turbogas', 'concreto', tx, 0, tz, 0.5, 0.03, 0.5)
    m.caja('turbogas', 'trafo', tx, 0.03, tz, 0.3, 0.3, 0.28, bisel=0.01)
    for i in range(3):
        m.caja('turbogas', 'trafo', tx + 0.2, 0.06, tz - 0.1 + i * 0.1, 0.08, 0.22, 0.01)
    for i in range(3):
        aislador('turbogas', tx - 0.08 + i * 0.08, 0.33, tz, 0.14, r=0.018)


# ------------------------------------------------------------------ central de motores de combustión interna
def motores():
    mx, mz = S['motores']
    W, D, H = 2.5, 1.3, 0.8
    x0, x1, z0, z1 = mx - W / 2, mx + W / 2, mz - D / 2, mz + D / 2
    m.caja('motores', 'concreto', mx, 0, mz, W + 0.3, 0.04, D + 0.9)
    kc = dict(cub='motores', abre=['motores'])
    m.caja('motores', 'marfil', mx, 0.04, mz, W, H, D, bisel=0.015, **kc)
    for i in range(9):
        m.caja('motores', 'grafito', x0 + 0.15 + i * (W - 0.3) / 8, 0.04, z1 + 0.012, 0.03, H, 0.02, **kc)
    m.caja('motores', 'vidrioV', mx, 0.6, z1 + 0.014, W - 0.2, 0.12, 0.01, **kc)
    m.caras('motores', 'techo', [(x0 - 0.05, H + 0.04, z0 - 0.05), (x1 + 0.05, H + 0.04, z0 - 0.05), (x1 + 0.05, H + 0.04, z1 + 0.05), (x0 - 0.05, H + 0.04, z1 + 0.05), (x0 - 0.05, H + 0.2, mz), (x1 + 0.05, H + 0.2, mz)],
            [(0, 1, 5, 4), (3, 4, 5, 2), (0, 4, 3), (1, 2, 5)], **kc)
    # adentro: cuatro motores, cada uno con su generador
    for i in range(4):
        x = x0 + 0.38 + i * 0.58
        m.caja('motores', 'concreto', x, 0.04, mz, 0.36, 0.06, 1.0)
        m.caja('motores', 'grafito', x, 0.1, mz + 0.12, 0.3, 0.3, 0.56, bisel=0.03)
        m.caja('motores', 'acero', x, 0.4, mz + 0.1, 0.2, 0.06, 0.46)
        m.torno('motores', 'acero', [(0.0, 0.0), (0.06, 0.0), (0.08, 0.08), (0.06, 0.14), (0.0, 0.15)], x, 0.46, mz - 0.2, seg=14)
        m.cil('motores', 'guinda', x, 0.27, mz - 0.33, 0.15, 0.28, eje='z', seg=24)
        m.cil('motores', 'grafito', x, 0.27, mz - 0.48, 0.152, 0.03, eje='z', seg=24)
        # chimenea corta de cada motor
        m.torno('motores', 'acero', [(0.06, 0.0), (0.06, 1.05), (0.07, 1.08), (0.0, 1.08)], x, 0.5, mz + 0.4, seg=14)
    # radiadores afuera, con sus ventiladores
    for i in range(4):
        x = x0 + 0.38 + i * 0.58
        rz = z0 - 0.38
        for dx in (-0.22, 0.22):
            for dzz in (-0.16, 0.16):
                m.caja('motores', 'grafito', x + dx, 0.04, rz + dzz, 0.03, 0.4, 0.03)
        m.caja('motores', 'gabinete', x, 0.44, rz, 0.5, 0.1, 0.38, bisel=0.01)
        kv = dict(gira='y', pivote=(x, 0.56, rz), vel='radiador')
        m.cil('motores', 'grafito', x, 0.54, rz, 0.13, 0.02, seg=20, tapas=False)
        for a in range(3):
            ang = 2 * PI * a / 3
            m.viga('motores', 'acero', (x, 0.56, rz), (x + 0.12 * math.cos(ang), 0.56, rz + 0.12 * math.sin(ang)), 0.045, 0.008, **kv)
    # salida de los generadores: una caja en la pared, el ducto y el transformador de la central
    tmx, tmz = S['trafoMotores']
    m.caja('motores', 'gabinete', x1 + 0.03, 0.2, tmz, 0.06, 0.34, 0.3)
    m.viga('motores', 'gabinete', (x1 + 0.06, 0.32, tmz), (tmx - 0.15, 0.32, tmz), 0.1, 0.1)
    m.caja('motores', 'concreto', tmx, 0, tmz, 0.44, 0.03, 0.44)
    m.caja('motores', 'trafo', tmx, 0.03, tmz, 0.3, 0.32, 0.28, bisel=0.01)
    for i in range(3):
        m.caja('motores', 'trafo', tmx - 0.08 + i * 0.08, 0.06, tmz + 0.18, 0.01, 0.24, 0.08)
    for dz in (-0.08, 0.0, 0.08):
        aislador('motores', tmx, 0.35, tmz + dz, 0.17, r=0.018)
    # tanque de combustible del día
    m.torno('motores', 'tanque', [(0.0, 0.0), (0.26, 0.0), (0.26, 0.42), (0.0, 0.46)], x1 + 0.45, 0.04, mz - 0.45, seg=24)


# ------------------------------------------------------------------ subestación, torres de la red y CENACE
def subestacion():
    sx, sz = S['subestacion']
    m.caja('subestacion', 'concreto', sx, 0, sz, 2.0, 0.025, 1.2)
    for bx in (-0.6, 0.0, 0.6):
        x = sx + bx
        for dz in (-0.3, 0.3):
            for dx in (-0.12, 0.12):
                m.viga('subestacion', 'grafito', (x + dx, 0.0, sz + dz), (x + dx * 0.5, 1.0, sz + dz), 0.025)
        m.viga('subestacion', 'grafito', (x - 0.25, 1.0, sz - 0.3), (x + 0.25, 1.0, sz - 0.3), 0.04)
        m.viga('subestacion', 'grafito', (x - 0.25, 1.0, sz + 0.3), (x + 0.25, 1.0, sz + 0.3), 0.04)
        for i in range(3):
            fx = x - 0.15 + i * 0.15
            m.cil('subestacion', 'grafito', fx, 0.0, sz, 0.02, 0.25, seg=8)
            aislador('subestacion', fx, 0.25, sz, 0.32, r=0.022)
            m.cil('subestacion', 'acero', fx, 0.57, sz, 0.03, 0.05, seg=10)
    for i in range(3):
        m.viga('subestacion', 'acero', (sx - 0.95, 0.85 + i * 0.03, sz - 0.3 + i * 0.3), (sx + 0.95, 0.85 + i * 0.03, sz - 0.3 + i * 0.3), 0.012)
    m.caja('subestacion', 'gabinete', sx + 0.85, 0.025, sz + 0.45, 0.3, 0.22, 0.2, bisel=0.01)


def banda():
    """La banda del patio, la torre de transferencia y la galería que sube el carbón a las tolvas."""
    tx, tz = S['torreBanda']
    ax, az = S['apiladora']
    x0 = S['patio'][0] - 1.55
    # banda al pie de los rieles
    m.caja('patio', 'acero', (x0 + tx) / 2, 0.1, az - 0.24, tx - x0, 0.03, 0.1)
    n = int((tx - x0) / 0.4)
    for i in range(n + 1):
        m.caja('patio', 'grafito', x0 + i * (tx - x0) / n, 0.0, az - 0.24, 0.02, 0.1, 0.1)
    m.viga('patio', 'acero', (tx - 0.05, 0.12, az - 0.24), (tx, 0.25, tz + 0.12), 0.1, 0.03)
    # torre de transferencia
    alto = 1.6
    for dx in (-0.14, 0.14):
        for dz in (-0.14, 0.14):
            m.caja('patio', 'grafito', tx + dx, 0, tz + dz, 0.03, alto, 0.03)
    for y in (0.5, 1.0):
        m.caja('patio', 'grafito', tx, y, tz, 0.31, 0.02, 0.31)
    m.caja('patio', 'marfil', tx, alto - 0.3, tz, 0.36, 0.38, 0.36, bisel=0.01)
    m.caja('patio', 'techo', tx, alto + 0.08, tz, 0.4, 0.03, 0.4)
    # galería inclinada hasta lo alto de las tolvas
    mx, mz = S['molinos']
    a = (tx + 0.15, alto - 0.05, tz)
    b = (mx - 0.42, 2.45, mz - 0.25)
    m.viga('molinos', 'marfil', a, b, 0.2, 0.16)
    m.viga('molinos', 'techo', (a[0], a[1] + 0.09, a[2]), (b[0], b[1] + 0.09, b[2]), 0.23, 0.02)
    for t in (0.33, 0.66):
        p = [a[i] + (b[i] - a[i]) * t for i in range(3)]
        m.viga('molinos', 'grafito', (p[0] - 0.08, 0, p[2]), (p[0], p[1] - 0.08, p[2]), 0.03)
        m.viga('molinos', 'grafito', (p[0] + 0.08, 0, p[2]), (p[0], p[1] - 0.08, p[2]), 0.03)


def ductos():
    """Los ductos de gases: de la caldera al precalentador y de ahí al filtro de cenizas."""
    cx, cz = S['caldera']
    D = L['CALDERA']['fondo']
    ax, az = S['precalentador']
    px, pz = S['precipitador']
    zb = cz - D / 2
    m.viga('caldera', 'gabinete', (ax, 2.9, zb), (ax, 2.9, az), 0.26, 0.3)
    m.viga('caldera', 'gabinete', (ax, 3.04, az), (ax, 1.22, az), 0.26)
    m.viga('caldera', 'gabinete', (ax - 0.2, 0.92, az - 0.05), (px, 1.17, pz + 0.475 + 0.31), 0.24, 0.22)


def red():
    cx, cz = S['cenace']
    m.caja('cenace', 'concreto', cx, 0, cz, 1.5, 0.03, 1.0)
    m.caja('cenace', 'marfil', cx, 0.03, cz, 1.2, 0.55, 0.7, bisel=0.02)
    m.caja('cenace', 'vidrioV', cx, 0.2, cz + 0.352, 1.1, 0.25, 0.01)
    m.caja('cenace', 'techo', cx, 0.58, cz, 1.26, 0.04, 0.76, bisel=0.01)
    m.caja('cenace', 'guinda', cx - 0.45, 0.62, cz, 0.18, 0.1, 0.18)
    m.cil('cenace', 'grafito', cx + 0.45, 0.62, cz - 0.15, 0.012, 0.6, seg=8)
    m.torno('cenace', 'marfil', [(0.0, 0.0), (0.09, 0.02), (0.0, 0.05)], cx + 0.45, 1.05, cz - 0.15, seg=16)


patio()
combustoleo()
molinos()
caldera()
precipitador()
chimenea()
sala()
toma()
transformador()
turbogas()
motores()
subestacion()
red()
banda()
ductos()

m.exportar(opciones['salida'])
if 'laminas' in opciones:
    m.laminas(opciones['laminas'], {p['id']: p['vista'] for p in L.get('PARTES', [])} or {
        'general': {'az': 25, 'el': 30, 'tam': 4.5, 'mira': [-3.0, 0.8, 0.0]},
        'caldera': {'az': 35, 'el': 22, 'tam': 2.4, 'mira': [S['caldera'][0], 1.6, S['caldera'][1]]},
        'patio': {'az': 20, 'el': 30, 'tam': 2.2, 'mira': [S['patio'][0], 0.3, S['patio'][1] - 0.4]},
        'sala': {'az': 15, 'el': 30, 'tam': 2.2, 'mira': [S['turbina'][0], 0.6, S['turbina'][1]]},
        'derecha': {'az': 20, 'el': 28, 'tam': 3.6, 'mira': [4.4, 0.5, -0.4]},
    })
