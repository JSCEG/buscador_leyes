# Kit para modelar en Blender, sin ventana, los equipos de las figuras de Aprende. Lo usa el modelo de cada figura
# (conceptos-3d/<figura>/blender/equipos.py) y lo corre scripts/build-blender.mjs.
#
# Se escribe en las coordenadas de three.js (y hacia arriba, en las mismas unidades que lugar.js); el exportador de glTF
# las regresa a three.js tal cual. Cada pieza dice en sus propiedades (extras del glTF) a qué punto clave pertenece, qué
# material del sitio lleva y, si aplica, si es cubierta que se vuelve vidrio, cuánto se separa al desarmar y sobre qué
# eje gira. planta-comun/glb.js lee esas propiedades y las pasa al kit de la página (crearAyudante).
#
# Las piezas se juntan por (parte, material, cubierta, desarme, giro) antes de exportar: una malla por combinación.
import bmesh
import bpy
import json
import math
import os
from mathutils import Matrix, Vector

PI = math.pi


def B(x, y, z):
    """De three.js (y arriba) a Blender (z arriba)."""
    return Vector((x, -z, y))


# Colores solo para las láminas que se renderizan en Blender; en la página manda el material del sitio que nombra cada pieza.
COLORES = {
    'marfil': '#f3f1ec', 'cubierta': '#f3f1ec', 'grafito': '#303137', 'acero': '#a7abb3', 'torre': '#303137', 'cobre': '#c8743c',
    'guinda': '#9b2247', 'losa': '#dcdcda', 'concreto': '#cfccc5', 'tierra': '#e9e6df', 'suelo': '#b9a688', 'madera': '#7a6248',
    'hoja': '#3f5d44', 'vidrio': '#dff2ff', 'ventana': '#ffc77a', 'lampara': '#ffe2ad', 'muro': '#e1ddd3', 'techo': '#c3c6cb',
    'trafo': '#8b9097', 'porcelana': '#8a5a44', 'tubos': '#b5683c', 'tanque': '#dcd9d2', 'gabinete': '#e6e3dc',
}


def _rgb(h):
    h = h.lstrip('#')
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))


class Modelo:
    def __init__(self, colores=None):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.escena = bpy.context.scene
        self.colores = {**COLORES, **(colores or {})}
        self.piezas = []  # (clave, bmesh en coordenadas del mundo de Blender, pivote)
        self.mats = {}

    # ------------------------------------------------------------------ materiales
    def material(self, nombre):
        if nombre not in self.mats:
            m = bpy.data.materials.new(nombre)
            m.use_nodes = True
            b = m.node_tree.nodes['Principled BSDF']
            b.inputs['Base Color'].default_value = (*_rgb(self.colores.get(nombre, '#cccccc')), 1)
            metal = nombre in ('acero', 'grafito', 'torre', 'cobre', 'trafo', 'tubos', 'techo')
            b.inputs['Metallic'].default_value = 0.7 if metal else 0.05
            b.inputs['Roughness'].default_value = 0.4 if metal else 0.6
            self.mats[nombre] = m
        return self.mats[nombre]

    # ------------------------------------------------------------------ registrar
    def _guardar(self, bm, parte, mat, cub=None, abre=None, mueve=None, gira=None, pivote=None, vel=None, sombra=True):
        """Guarda una pieza ya hecha en coordenadas de Blender. cub: nombre de la cubierta; abre: partes que la vuelven vidrio."""
        clave = (parte, mat, cub, ','.join(abre or []), tuple(round(v, 4) for v in (mueve or ())), gira, tuple(round(v, 4) for v in (pivote or ())), vel, sombra)
        self.piezas.append((clave, bm))
        return bm

    @staticmethod
    def _suavizar(bm, eje=None, angulo=40):
        """Caras lisas en lo curvo y planas en las tapas y aristas."""
        bm.normal_update()
        lim = math.cos(math.radians(angulo))
        for f in bm.faces:
            if eje is not None:
                f.smooth = abs(f.normal.dot(eje)) < 0.5
            else:
                f.smooth = all(e.calc_face_angle(PI) < math.radians(angulo) for e in f.edges if len(e.link_faces) == 2)
        _ = lim

    # ------------------------------------------------------------------ formas (todo en coordenadas de three.js)
    def caja(self, parte, mat, x, y0, z, w, h, d, giro=0.0, bisel=0.0, **kw):
        """Caja con la base en y0, centrada en (x, z), de ancho w (x), alto h y fondo d (z). giro: radianes sobre y."""
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=Vector((w, d, h)), verts=bm.verts)
        if bisel > 0 and min(w, h, d) >= 0.12:
            bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bisel, w / 2.1, h / 2.1, d / 2.1), segments=2, profile=0.5, affect='EDGES')
        self._mover(bm, x, y0 + h / 2, z, giro)
        self._suavizar(bm)
        return self._guardar(bm, parte, mat, **kw)

    def cil(self, parte, mat, x, y0, z, r, h, eje='y', seg=32, r2=None, tapas=True, giro=0.0, **kw):
        """Cilindro (o cono si r2) de radio r y largo h. eje y: base en y0. eje x o z: centrado en (x, y0, z)."""
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=tapas, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
        if eje == 'y':
            self._mover(bm, x, y0 + h / 2, z, giro)
            self._suavizar(bm, Vector((0, 0, 1)))
        else:
            rot = Matrix.Rotation(PI / 2, 4, 'Y') if eje == 'x' else Matrix.Rotation(PI / 2, 4, 'X')
            bmesh.ops.transform(bm, matrix=rot, verts=bm.verts)
            self._mover(bm, x, y0, z, giro)
            ax = Vector((1, 0, 0)) if eje == 'x' else Vector((0, 1, 0))
            if giro:
                ax = Matrix.Rotation(giro, 3, 'Z') @ ax
            self._suavizar(bm, ax)
        return self._guardar(bm, parte, mat, **kw)

    def torno(self, parte, mat, perfil, x, y0, z, seg=40, eje='y', giro=0.0, liso=True, **kw):
        """Sólido de revolución. perfil: [(radio, altura), …] de abajo arriba. eje y: base en y0; eje x/z: altura a lo largo de ese eje."""
        bm = bmesh.new()
        vs = [bm.verts.new((r, 0, y)) for r, y in perfil]
        for a, b in zip(vs, vs[1:]):
            bm.edges.new((a, b))
        bmesh.ops.spin(bm, geom=list(bm.verts) + list(bm.edges), cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * PI, steps=seg, use_merge=True)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        if eje != 'y':
            rot = Matrix.Rotation(PI / 2, 4, 'Y') if eje == 'x' else Matrix.Rotation(-PI / 2, 4, 'X')
            bmesh.ops.transform(bm, matrix=rot, verts=bm.verts)
        self._mover(bm, x, y0, z, giro)
        for f in bm.faces:
            f.smooth = liso
        return self._guardar(bm, parte, mat, **kw)

    def tubo(self, parte, mat, puntos, r, seg=10, **kw):
        """Tubo por una línea quebrada de puntos de three.js, con codos suaves."""
        cu = bpy.data.curves.new('t', 'CURVE')
        cu.dimensions = '3D'
        cu.bevel_depth = r
        cu.bevel_resolution = max(1, seg // 4)
        cu.use_fill_caps = True
        sp = cu.splines.new('POLY')
        sp.points.add(len(puntos) - 1)
        for p, q in zip(sp.points, puntos):
            p.co = (*B(*q), 1)
        o = bpy.data.objects.new('t', cu)
        self.escena.collection.objects.link(o)
        dg = bpy.context.evaluated_depsgraph_get()
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        bm = bmesh.new()
        bm.from_mesh(me)
        bpy.data.objects.remove(o)
        bpy.data.curves.remove(cu)
        bpy.data.meshes.remove(me)
        for f in bm.faces:
            f.smooth = True
        return self._guardar(bm, parte, mat, **kw)

    def prisma(self, parte, mat, contorno, y0, h, giro=0.0, **kw):
        """Extruye hacia arriba un contorno [(x, z), …] de three.js, de y0 a y0 + h (techos a dos aguas, tolvas, muros)."""
        bm = bmesh.new()
        abajo = [bm.verts.new(B(px, y0, pz)) for px, pz in contorno]
        cara = bm.faces.new(abajo)
        r = bmesh.ops.extrude_face_region(bm, geom=[cara])
        arriba = [v for v in r['geom'] if isinstance(v, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, vec=Vector((0, 0, h)), verts=arriba)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        self._suavizar(bm)
        return self._guardar(bm, parte, mat, **kw)

    def caras(self, parte, mat, puntos, caras, **kw):
        """Malla libre: puntos de three.js y caras por índice."""
        bm = bmesh.new()
        vs = [bm.verts.new(B(*p)) for p in puntos]
        for c in caras:
            bm.faces.new([vs[i] for i in c])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        self._suavizar(bm)
        return self._guardar(bm, parte, mat, **kw)

    def viga(self, parte, mat, p0, p1, ancho, alto=None, **kw):
        """Barra de sección ancho × alto entre dos puntos de three.js (perfiles, galerías de banda, plumas, celosías)."""
        a, b = B(*p0), B(*p1)
        eje = b - a
        largo = eje.length
        if largo < 1e-6:
            return None
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=Vector((ancho, alto or ancho, largo)), verts=bm.verts)
        z = eje.normalized()
        arriba = Vector((0, 0, 1)) if abs(z.z) < 0.95 else Vector((1, 0, 0))
        x = arriba.cross(z).normalized()
        y = z.cross(x)
        rot = Matrix((x, y, z)).transposed().to_4x4()
        bmesh.ops.transform(bm, matrix=rot, verts=bm.verts)
        bmesh.ops.translate(bm, vec=(a + b) / 2, verts=bm.verts)
        self._suavizar(bm)
        return self._guardar(bm, parte, mat, **kw)

    def relieve(self, parte, mat, x0, x1, z0, z1, nx, nz, f, liso=True, recortar=False, **kw):
        """Superficie y = f(x, z) sobre una rejilla (pilas de carbón, terreno, agua). recortar: quita lo que queda en el piso."""
        bm = bmesh.new()
        filas = []
        for j in range(nz + 1):
            z = z0 + (z1 - z0) * j / nz
            filas.append([bm.verts.new(B(x0 + (x1 - x0) * i / nx, f(x0 + (x1 - x0) * i / nx, z), z)) for i in range(nx + 1)])
        for j in range(nz):
            for i in range(nx):
                q = (filas[j][i], filas[j][i + 1], filas[j + 1][i + 1], filas[j + 1][i])
                if recortar and all(v.co.z <= 1e-4 for v in q):
                    continue
                bm.faces.new(q)
        if recortar:
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
        bm.normal_update()
        abajo = [c for c in bm.faces if c.normal.z < 0]
        if abajo:
            bmesh.ops.reverse_faces(bm, faces=abajo)
        for c in bm.faces:
            c.smooth = liso
        return self._guardar(bm, parte, mat, **kw)

    def aro(self, parte, mat, x, y, z, r, grueso, eje='y', seg=40, seg2=8, **kw):
        """Anillo (toro) de radio r y sección grueso: barandales, coples, bridas."""
        bm = bmesh.new()
        anillos = []
        for i in range(seg):
            a = 2 * PI * i / seg
            c, s = math.cos(a), math.sin(a)
            anillos.append([bm.verts.new(((r + grueso * math.cos(2 * PI * k / seg2)) * c, (r + grueso * math.cos(2 * PI * k / seg2)) * s, grueso * math.sin(2 * PI * k / seg2))) for k in range(seg2)])
        for i in range(seg):
            for k in range(seg2):
                a, b = anillos[i], anillos[(i + 1) % seg]
                bm.faces.new((a[k], b[k], b[(k + 1) % seg2], a[(k + 1) % seg2]))
        if eje != 'y':
            rot = Matrix.Rotation(PI / 2, 4, 'Y') if eje == 'x' else Matrix.Rotation(PI / 2, 4, 'X')
            bmesh.ops.transform(bm, matrix=rot, verts=bm.verts)
        bmesh.ops.translate(bm, vec=B(x, y, z), verts=bm.verts)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        for c in bm.faces:
            c.smooth = True
        return self._guardar(bm, parte, mat, **kw)

    @staticmethod
    def _mover(bm, x, y, z, giro=0.0):
        if giro:
            bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(giro, 3, 'Z'), verts=bm.verts)
        bmesh.ops.translate(bm, vec=B(x, y, z), verts=bm.verts)

    # ------------------------------------------------------------------ juntar y exportar
    def juntar(self):
        """Una malla por clave. Las que giran llevan su origen en el pivote, para que three.js las gire sobre su eje."""
        grupos = {}
        for clave, bm in self.piezas:
            grupos.setdefault(clave, []).append(bm)
        objetos = []
        for i, (clave, bms) in enumerate(grupos.items()):
            parte, mat, cub, abre, mueve, gira, pivote, vel, sombra = clave
            me = bpy.data.meshes.new(f'{parte}-{mat}-{i}')
            total = bmesh.new()
            for bm in bms:
                tmp = bpy.data.meshes.new('tmp')
                bm.to_mesh(tmp)
                total.from_mesh(tmp)
                bpy.data.meshes.remove(tmp)
                bm.free()
            piv = B(*pivote) if pivote else Vector((0, 0, 0))
            if pivote:
                bmesh.ops.translate(total, vec=-piv, verts=total.verts)
            total.to_mesh(me)
            total.free()
            me.materials.append(self.material(mat))
            o = bpy.data.objects.new(me.name, me)
            o.location = piv
            self.escena.collection.objects.link(o)
            o['parte'] = parte or ''
            o['mat'] = mat
            if cub:
                o['cub'] = cub
                o['abre'] = abre
            if mueve:
                o['mueve'] = list(mueve)
            if gira:
                o['gira'] = gira
                o['vel'] = vel or ''
            if not sombra:
                o['sombra'] = 0
            objetos.append(o)
        self.piezas = []
        return objetos

    def _densificar(self, objetos, paso):
        """Parte las caras grandes (no los perfiles delgados) para que la sombra horneada tenga dónde guardarse."""
        for o in objetos:
            bm = bmesh.new()
            bm.from_mesh(o.data)
            for _ in range(4):
                grandes = [f for f in bm.faces if f.calc_area() > paso * paso * 2]
                largas = list({e for f in grandes for e in f.edges if e.calc_length() > paso})
                if not largas:
                    break
                bmesh.ops.subdivide_edges(bm, edges=largas, cuts=1, use_grid_fill=True)
            bm.to_mesh(o.data)
            bm.free()

    def hornear(self, objetos, distancia=0.6, muestras=48, paso=0.5):
        """Oclusión ambiental horneada en Cycles: cada esquina guarda cuánto la tapan las piezas vecinas (atributo de color AO)."""
        self._densificar(objetos, paso)
        sc = self.escena
        sc.render.engine = 'CYCLES'
        sc.cycles.samples = muestras
        sc.cycles.device = 'CPU'
        if sc.world is None:
            sc.world = bpy.data.worlds.new('mundo')
        sc.world.light_settings.distance = distancia
        sc.render.bake.target = 'VERTEX_COLORS'
        bpy.ops.object.select_all(action='DESELECT')
        for o in objetos:
            if 'AO' not in o.data.color_attributes:
                o.data.color_attributes.new('AO', 'BYTE_COLOR', 'CORNER')
            o.data.color_attributes.active_color = o.data.color_attributes['AO']
            o.select_set(True)
        # un piso de mentira, solo para que las piezas se oscurezcan donde tocan el suelo; no se exporta
        me = bpy.data.meshes.new('piso-horno')
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=60)
        bm.to_mesh(me)
        bm.free()
        piso = bpy.data.objects.new('piso-horno', me)
        sc.collection.objects.link(piso)
        bpy.context.view_layer.objects.active = objetos[0]
        bpy.ops.object.bake(type='AO')
        bpy.data.objects.remove(piso)
        bpy.data.meshes.remove(me)
        # un solo número por esquina, en un byte: _AO (0 a 127). La página lo vuelve color al cargar (planta-comun/glb.js)
        for o in objetos:
            col = o.data.color_attributes['AO']
            ao = o.data.attributes.new('_AO', 'INT8', 'CORNER')
            ao.data.foreach_set('value', [max(0, min(127, round(c.color[0] * 127))) for c in col.data])
            o.data.color_attributes.remove(col)

    def exportar(self, ruta, ao=True, **horno):
        objetos = self.juntar()
        if ao and objetos:
            self.hornear(objetos, **horno)
        os.makedirs(os.path.dirname(ruta), exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=ruta, export_format='GLB', export_extras=True, export_apply=True, export_yup=True,
            export_texcoords=False, export_normals=True, export_materials='EXPORT', export_attributes=ao,
            export_vertex_color='NONE', export_all_vertex_colors=False,
            export_meshopt_compression_enable=True, export_cameras=False, export_lights=False,
        )
        caras = sum(len(o.data.polygons) for o in self.escena.objects if o.type == 'MESH')
        print(f'glb: {ruta} · {os.path.getsize(ruta) // 1024} KB · {len(objetos)} mallas · {caras} caras')

    # ------------------------------------------------------------------ láminas para revisar
    def laminas(self, carpeta, vistas, ancho=720, alto=460):
        """vistas: {nombre: {az, el, tam, mira}} como en lugar.js (grados; tam ≈ cuánto se ve)."""
        os.makedirs(carpeta, exist_ok=True)
        sc = self.escena
        motores = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
        sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in motores else 'BLENDER_EEVEE_NEXT'
        sc.render.resolution_x, sc.render.resolution_y = ancho, alto
        sc.render.film_transparent = False
        mundo = bpy.data.worlds.new('mundo')
        mundo.use_nodes = True
        mundo.node_tree.nodes['Background'].inputs['Color'].default_value = (0.95, 0.95, 0.95, 1)
        mundo.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
        sc.world = mundo
        sol = bpy.data.objects.new('sol', bpy.data.lights.new('sol', 'SUN'))
        sol.data.energy = 3.2
        sol.rotation_euler = (math.radians(40), math.radians(10), math.radians(35))
        sc.collection.objects.link(sol)
        cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
        cam.data.lens = 50
        sc.collection.objects.link(cam)
        sc.camera = cam
        for nombre, v in vistas.items():
            az, el = math.radians(v['az']), math.radians(v['el'])
            mira = Vector(v['mira'])
            d = v['tam'] * 3.4
            pos = mira + Vector((math.sin(az) * math.cos(el), math.sin(el), math.cos(az) * math.cos(el))) * d
            cam.location = B(*pos)
            direc = B(*mira) - cam.location
            cam.rotation_euler = direc.to_track_quat('-Z', 'Y').to_euler()
            sc.render.filepath = os.path.join(carpeta, f'{nombre}.png')
            bpy.ops.render.render(write_still=True)


def argumentos():
    """--lugar lugar.json --salida equipos.glb [--laminas carpeta]"""
    import sys
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    o = {}
    for i in range(0, len(a) - 1, 2):
        o[a[i].lstrip('-')] = a[i + 1]
    lugar = json.load(open(o['lugar'], encoding='utf-8')) if 'lugar' in o else {}
    return o, lugar
