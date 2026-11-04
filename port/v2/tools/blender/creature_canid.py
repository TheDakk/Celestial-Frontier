"""Build one private, unreviewed, connected Wolf candidate; never render or install it.

Blender invocation (root owns the tool lock and actual Metal render):
  Blender --background --factory-startup --python creature_canid.py -- \
    --source-root /path/to/exact/source --bundle-root /private/tmp/cf-wolf-candidate \
    --phenotype wolf.json \
    --output wolf-canid-v1 --size 440

The bridge owns identity and final painter proportions. This recipe adds authored
lateral depth and anatomical joints without generating, normalizing or mutating a
genome. Only the named Wolf is implemented. A lineage/procedural record must keep
its static fallback until its own rooted traits are authored. Nothing is imported
into the game. The finite timeline is idle 1..49, inspect 65..97, settled at 97;
there are no repeating modifiers, NLA strips, simulation or runtime dependencies.
"""

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import stat
import sys

import bpy
import bmesh
from mathutils import Vector


SCHEMA = "cf.creature-blender-phenotype/v1"
SCALE = 4.0
VOXEL = 0.00275 * SCALE
PROPORTIONS = (
    "groundY bodyW bodyH legLen left right bodyBottom rumpTop shoulderTop "
    "headRx headRy hx hy muzzleLen earH legW tailLen tipX tipY tailW"
).split()


def fail(message):
    raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def private_directory(path):
    path = path.resolve()
    if any((parent / ".git").exists() for parent in (path, *path.parents)):
        fail("Editable candidate output must be outside every Git checkout")
    return path


def inside(root, relative):
    relative = Path(relative)
    if relative.is_absolute() or ".." in relative.parts or not relative.parts:
        fail("Bundle dependencies and output must be relative paths without '..'")
    result = (root / relative).resolve()
    if not result.is_relative_to(root) or result == root:
        fail("Path escapes its explicit bundle root")
    return result


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, required=True, help="Exact bridge sources or preserved authority/ directory")
    parser.add_argument("--bundle-root", type=Path, required=True)
    parser.add_argument("--phenotype", required=True)
    parser.add_argument("--output", required=True, help="Fresh relative directory, never an existing master")
    parser.add_argument("--size", type=int, choices=(132, 300, 440), default=440)
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])


def stable_genome_node(value):
    # This initial recipe accepts the canonical pure Wolf's lossless integer JSON.
    # Reject unsupported number shapes rather than invent a Python/JS float normalizer.
    if value is None:
        return ["null"]
    if type(value) is bool:
        return ["boolean", value]
    if isinstance(value, str):
        return ["string", value]
    if type(value) is int and abs(value) <= 9007199254740991:
        return ["number", str(value)]
    if isinstance(value, list):
        return ["array", [stable_genome_node(item) for item in value]]
    if isinstance(value, dict):
        return ["object", [[key, stable_genome_node(value[key])]
                           for key in sorted(value, key=lambda key: key.encode("utf-16-be"))]]
    fail("Unsupported value in this pure Wolf recipe; keep complete identity and static fallback")


def source_inventory(root, rows):
    root = root.resolve()
    if not root.is_dir():
        fail("Explicit source root must exist")
    result = {}
    for row in rows:
        name = row["path"]
        source = inside(root, name)
        if name in result or not source.is_file() or source.stat().st_size > 4 * 1024 * 1024:
            fail("Invalid/duplicate/beyond-limit source dependency: " + name)
        data = source.read_bytes()
        if sha(data) != row["sha256"]:
            fail("Bridge source hash changed: " + name)
        result[name] = data
    required = {"port/v2/packages/art/src/speciesidentity.ts",
                "port/v2/packages/art/src/quadrupedoverrides.ts",
                "port/v2/tools/creature-blender-export.mjs"}
    if not required.issubset(result):
        fail("Missing actual identity, final morphology or bridge source authority")
    return result


def read_phenotype(path):
    with path.open("rb") as handle:
        if not stat.S_ISREG(os.fstat(handle.fileno()).st_mode):
            fail("Phenotype must be a regular file")
        raw = handle.read(2 * 1024 * 1024 + 1)
    if len(raw) > 2 * 1024 * 1024:
        fail("Phenotype exceeds the bounded 2 MiB input limit")
    value = json.loads(raw, parse_constant=lambda token: fail("Non-finite JSON number: " + token))
    if not isinstance(value, dict) or value.get("schema") != SCHEMA:
        fail("Unsupported phenotype schema")
    route, morphology = value.get("route", {}), value.get("morphology", {})
    if (value.get("admission", {}).get("status") != "supported"
            or route.get("kind") != "named" or route.get("name") != "Wolf"
            or route.get("kingdom") != "fauna" or morphology.get("kind") != "canid-c1"
            or morphology.get("lineage") is not None):
        fail("Only the supported, named, non-lineage Wolf can enter this first recipe; preserve static fallback")
    if value.get("visualAcceptance") != "UNREVIEWED":
        fail("A generated candidate cannot carry an acceptance verdict")
    if not isinstance(value.get("genome"), dict) or not value["genome"]:
        fail("Complete detached genome is required")
    genome = value["genome"]
    fields = ("seed color form body loco trait size diet head limbs skin tail pattern eyes behavior habitat "
              "detail accent temper sense repro life metab gen heat").split()
    if (any(type(genome.get(name)) is not int for name in fields)
            or type(genome.get("lumin")) is not bool or genome.get("kingdom") != "fauna"
            or genome.get("_earthName") != "Wolf" or genome["seed"] != 792844710
            or genome["heat"] != 1 or genome["gen"] != 0
            or any(name in genome for name in ("_earthBlend", "_earthBlendKingdom", "_anchorVal"))):
        fail("Complete canonical pure Wolf genome required; no swapped identity or lineage admission")
    key = json.dumps(stable_genome_node(genome), ensure_ascii=False, separators=(",", ":"))
    if value.get("speciesVisualKey") != key:
        fail("Visual key does not correspond exactly to the complete detached Wolf genome")
    sources = value.get("sources")
    if not isinstance(sources, list) or not sources:
        fail("Source-bound phenotype inventory is required")
    for row in sources:
        if (not isinstance(row, dict) or not isinstance(row.get("path"), str)
                or Path(row["path"]).is_absolute() or ".." in Path(row["path"]).parts
                or not re.fullmatch(r"[0-9a-f]{64}", row.get("sha256", ""))):
            fail("Malformed relative source/hash inventory")
    coordinates = morphology.get("coordinates", {})
    if (coordinates.get("space") != "painter-normalized" or coordinates.get("canvasSize") != 440
            or coordinates.get("x") != "right" or coordinates.get("y") != "down"):
        fail("Expected the final 440px painter's normalized coordinate system")
    spec, p = morphology.get("spec", {}), morphology.get("proportions", {})
    if spec.get("family") != "canid" or spec.get("mammalCPlan") != "canid-c1":
        fail("Missing named whole-form canid owner")
    for name in PROPORTIONS:
        if type(p.get(name)) not in (int, float) or not math.isfinite(p[name]) or not 0 < p[name] < 1:
            fail("Missing or invalid normalized proportion: " + name)
    # Cross-check the named owner's actual expressions, not raw genome/body-gene routing.
    expected = {"groundY": .805, "bodyW": .368, "left": .275,
                "headRx": .103, "headRy": .075, "muzzleLen": .077,
                "earH": .058, "legW": .029, "tailLen": .205, "tailW": .036}
    if spec.get("legs") != .155 or spec.get("depth") != .1377:
        fail("Wolf's reviewed leg/depth source changed; review this recipe before authoring")
    expected.update(bodyH=spec["depth"] * 1.10, legLen=spec["legs"] * 1.05)
    expected["right"] = expected["left"] + expected["bodyW"]
    expected["bodyBottom"] = expected["groundY"] - expected["legLen"] + .018
    expected["rumpTop"] = expected["bodyBottom"] - expected["bodyH"] * .82
    expected["shoulderTop"] = expected["bodyBottom"] - expected["bodyH"] * 1.05
    expected["hx"] = min(.805, expected["right"] + .065)
    expected["hy"] = expected["shoulderTop"] + expected["headRy"] * 1.08
    expected["tipX"] = max(.022, expected["left"] - expected["tailLen"])
    expected["tipY"] = expected["rumpTop"] + expected["bodyH"] * 1.02
    if any(abs(p[name] - number) > 1e-10 for name, number in expected.items()):
        fail("Final Wolf source proportions changed; do not silently build a different organism")
    return raw, value, p


def world(p, x, y, lateral=0):
    return Vector(((x - .5) * SCALE, lateral * SCALE, (p["groundY"] - y) * SCALE))


def mesh_object(name, vertices, faces, collection):
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj


def smooth_rings(rings, steps=5):
    """Sample a monotone Hermite path through the exact authored attachment rings.

    Every original centre/radius remains present. Each coordinate and radius stays
    inside its source segment's extrema; no joint, tip or body maximum is enlarged.
    This removes coarse loft planes without changing the anatomical landmarks.
    """
    count = len(rings)
    if count < 2:
        fail("An anatomical tube needs two distinct rings")
    spans = [(rings[index + 1][0] - rings[index][0]).length for index in range(count - 1)]
    if any(span <= 1e-10 for span in spans):
        fail("Coincident anatomical rings cannot define a surface tangent")
    channels = [[*position, width, depth] for position, width, depth in rings]

    def slopes(values):
        delta = [(values[index + 1] - values[index]) / spans[index]
                 for index in range(count - 1)]
        if count == 2:
            return [delta[0], delta[0]]
        result = [0.0] * count
        for index in range(1, count - 1):
            a, b = delta[index - 1], delta[index]
            if a * b > 0:
                w1, w2 = 2 * spans[index] + spans[index - 1], spans[index] + 2 * spans[index - 1]
                result[index] = (w1 + w2) / (w1 / a + w2 / b)

        def endpoint(first, second, a, b):
            slope = ((2 * first + second) * a - first * b) / (first + second)
            if slope * a <= 0:
                return 0.0
            return math.copysign(min(abs(slope), 3 * abs(a)), a)

        result[0] = endpoint(spans[0], spans[1], delta[0], delta[1])
        result[-1] = endpoint(spans[-1], spans[-2], delta[-1], delta[-2])
        return result

    derivatives = [slopes([row[channel] for row in channels]) for channel in range(5)]
    sampled = []
    for index, span in enumerate(spans):
        sampled.append(rings[index])
        for step in range(1, steps):
            t = step / steps
            h00, h10 = 2 * t ** 3 - 3 * t ** 2 + 1, t ** 3 - 2 * t ** 2 + t
            h01, h11 = -2 * t ** 3 + 3 * t ** 2, t ** 3 - t ** 2
            row = []
            for channel in range(5):
                a, b = channels[index][channel], channels[index + 1][channel]
                value = (h00 * a + h10 * span * derivatives[channel][index]
                         + h01 * b + h11 * span * derivatives[channel][index + 1])
                row.append(max(min(a, b), min(max(a, b), value)))
            sampled.append((Vector(row[:3]), row[3], row[4]))
    sampled.append(rings[-1])
    return sampled


def tube(name, rings, collection, sides=48):
    """Closed anatomical volume; finer surface sampling preserves the authored rings."""
    rings = smooth_rings(rings)
    vertices, faces = [], []
    for index, (position, width, depth) in enumerate(rings):
        tangent = (rings[min(index + 1, len(rings) - 1)][0]
                   - rings[max(0, index - 1)][0]).normalized()
        reference = Vector((0, 1, 0)) if abs(tangent.y) < .9 else Vector((1, 0, 0))
        u = (reference - reference.dot(tangent) * tangent).normalized()
        v = tangent.cross(u).normalized()
        for side in range(sides):
            angle = side * math.tau / sides
            vertices.append(position + u * (width * math.cos(angle)) + v * (depth * math.sin(angle)))
    for ring in range(len(rings) - 1):
        for side in range(sides):
            a, b = ring * sides + side, ring * sides + (side + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    vertices.extend((rings[0][0], rings[-1][0]))
    for side in range(sides):
        faces.append((len(vertices) - 2, (side + 1) % sides, side))
        a = (len(rings) - 1) * sides
        faces.append((len(vertices) - 1, a + side, a + (side + 1) % sides))
    return mesh_object(name, vertices, faces, collection)


def ellipsoid(name, center, radii, collection):
    vertices, faces = [], []
    rings, sides = 32, 64
    vertices.append(center + Vector((0, 0, radii[2])))
    for ring in range(1, rings):
        phi = math.pi * ring / rings
        for side in range(sides):
            theta = math.tau * side / sides
            vertices.append(center + Vector((radii[0] * math.sin(phi) * math.cos(theta),
                                            radii[1] * math.sin(phi) * math.sin(theta),
                                            radii[2] * math.cos(phi))))
    vertices.append(center - Vector((0, 0, radii[2])))
    for side in range(sides):
        faces.append((0, 1 + side, 1 + (side + 1) % sides))
        last = 1 + (rings - 2) * sides
        faces.append((len(vertices) - 1, last + (side + 1) % sides, last + side))
    for ring in range(rings - 2):
        for side in range(sides):
            a = 1 + ring * sides + side
            b = 1 + ring * sides + (side + 1) % sides
            faces.append((a, a + sides, b + sides, b))
    return mesh_object(name, vertices, faces, collection)


def organism(p, collection):
    parts, bones, paws = [], {}, {}
    point = lambda x, y, side=0: world(p, x, y, side)
    left, right, bw, bh = (p[key] for key in ("left", "right", "bodyW", "bodyH"))
    bottom, rump, shoulder = (p[key] for key in ("bodyBottom", "rumpTop", "shoulderTop"))
    hx, hy, rx, ry = (p[key] for key in ("hx", "hy", "headRx", "headRy"))

    def bone(name, start, end, parent, radius):
        bones[name] = {"head": start, "tail": end, "parent": parent, "radius": radius * SCALE}

    # Low, elongated body; thorax broadens toward the shoulder, not an ungulate waist.
    profile = [
        (left - bw * .018, rump + bh * .51, .017, bh * .28),
        (left + bw * .09, rump + bh * .40, .049, bh * .51),
        (left + bw * .30, rump + bh * .40, .052, bh * .52),
        (left + bw * .52, shoulder + bh * .48, .054, bh * .52),
        (right - bw * .16, shoulder + bh * .50, .060, bh * .54),
        (right - bw * .025, shoulder + bh * .51, .046, bh * .47),
        (right + bw * .025, shoulder + bh * .55, .014, bh * .28),
    ]
    parts.append(tube("RibcagePelvisContinuous", [(point(x, y), w * SCALE, h * SCALE)
                                               for x, y, w, h in profile], collection))
    pelvis = point(left + bw * .19, rump + bh * .46)
    middle = point(left + bw * .47, shoulder + bh * .49)
    chest = point(right - bw * .13, shoulder + bh * .49)
    nape = point(hx - rx * .56, hy + ry * .02)
    head = point(hx + rx * .05, hy + ry * .05)
    bone("root", Vector((0, 0, 0)), Vector((0, 0, .16)), None, .025)
    bone("pelvis", pelvis, middle, "root", .070)
    bone("spine", middle, chest, "pelvis", .073)
    bone("breath", middle, chest, "spine", .072)
    bone("neck", chest, nape, "spine", .061)
    bone("head", nape, point(hx + p["muzzleLen"], hy + ry * .12), "neck", .070)
    bone("jaw", head, point(hx + p["muzzleLen"] * .95, hy + ry * .47), "head", .028)
    parts.append(tube("AttachedNeck", [
        (chest, .055 * SCALE, .073 * SCALE),
        (point(hx - rx * .71, hy + ry * .14), .052 * SCALE, .062 * SCALE),
        (nape, .051 * SCALE, .059 * SCALE),
        (head, .047 * SCALE, .050 * SCALE),
    ], collection))
    parts.append(tube("BroadRoundedWolfSkull", [
        (point(hx - rx * .98, hy), .018 * SCALE, ry * .31 * SCALE),
        (point(hx - rx * .65, hy - ry * .03), .047 * SCALE, ry * .78 * SCALE),
        (point(hx - rx * .12, hy - ry * .05), .059 * SCALE, ry * .88 * SCALE),
        (point(hx + rx * .45, hy + ry * .05), .046 * SCALE, ry * .72 * SCALE),
        (point(hx + rx * .75, hy + ry * .18), .018 * SCALE, ry * .38 * SCALE),
    ], collection))
    parts.append(tube("JoinedMuzzleJaw", [
        (point(hx + rx * .05, hy + ry * .24), .043 * SCALE, ry * .39 * SCALE),
        (point(hx + p["muzzleLen"] * .66, hy + ry * .27), .031 * SCALE, ry * .29 * SCALE),
        (point(hx + p["muzzleLen"], hy + ry * .20), .022 * SCALE, ry * .19 * SCALE),
    ], collection))

    # Each planted leg has a real shoulder/hip, elbow/stifle, wrist/hock and paw.
    for fore in (False, True):
        for far in (False, True):
            side = .044 if far else -.044
            label = ("fore" if fore else "hind") + ("_far" if far else "_near")
            x = right - bw * (.19 if far else .08) if fore else left + bw * (.18 if far else .29)
            hip_y = shoulder + bh * .48 if fore else rump + bh * .43
            upper = point(x, hip_y, side * .80)
            joint = point(x + (-.011 if fore else .046), bottom + p["legLen"] * .31, side)
            ankle = point(x + (.002 if fore else .020), p["groundY"] - .047, side)
            paw = point(x + (.028 if fore else .041), p["groundY"] - .016, side)
            toe = point(x + (.052 if fore else .065), p["groundY"] - .014, side)
            parent = "spine" if fore else "pelvis"
            chain = [upper, joint, ankle, paw, toe]
            names = [label + suffix for suffix in ("_upper", "_lower", "_ankle", "_paw")]
            for index, name in enumerate(names):
                bone(name, chain[index], chain[index + 1], parent if index == 0 else names[index - 1],
                     (.032, .021, .016, .023)[index])
            parts.append(tube(label + "AttachedLimb", [
                (upper, .029 * SCALE, .042 * SCALE),
                (joint, .022 * SCALE, .027 * SCALE),
                (ankle, .012 * SCALE, .015 * SCALE),
                (paw, .016 * SCALE, .014 * SCALE),
            ], collection))
            parts.append(ellipsoid(label + "GroundedPaw", paw,
                                   (.030 * SCALE, .021 * SCALE, .016 * SCALE), collection))
            # Joined toe pads retain a canine paw read without detached toe meshes.
            for digit in (-1, 0, 1):
                pad = paw + Vector((.019 * SCALE, digit * .011 * SCALE, -.003 * SCALE))
                parts.append(ellipsoid(label + "Toe" + str(digit), pad,
                                       (.016 * SCALE, .008 * SCALE, .011 * SCALE), collection))
            paws[names[-1]] = {"center": paw, "upper": upper, "chain": names}

    tail_points = [point(left + bw * .12, rump + bh * .40),
                   point(left - p["tailLen"] * .29, rump + bh * .52),
                   point(p["tipX"] + p["tailLen"] * .28, p["tipY"] - p["tailW"] * .08),
                   point(p["tipX"], p["tipY"] + p["tailW"] * .28)]
    for index in range(3):
        bone("tail" + str(index + 1), tail_points[index], tail_points[index + 1],
             "pelvis" if index == 0 else "tail" + str(index), .041)
    parts.append(tube("RootedLowBrushTail", [
        (tail_points[0], .034 * SCALE, .041 * SCALE),
        (tail_points[1], .035 * SCALE, .041 * SCALE),
        (tail_points[2], .028 * SCALE, .032 * SCALE),
        (tail_points[3], .010 * SCALE, .011 * SCALE),
    ], collection))

    # Paired skull-rooted ears: 2D ear height retained; lateral separation is authored depth.
    for side, label in ((-.043, "near"), (.043, "far")):
        base = point(hx - rx * .44, hy - ry * .66, side)
        tip = point(hx - rx * .44 + p["earH"] * .07, hy - ry * .66 - p["earH"], side * 1.08)
        bone("ear_" + label, base, tip, "head", .026)
        parts.append(tube("SkullRootedEar_" + label, [
            (base - Vector((0, 0, .018 * SCALE)), .020 * SCALE, .022 * SCALE),
            (base, .017 * SCALE, .020 * SCALE),
            (base.lerp(tip, .58), .009 * SCALE, .013 * SCALE),
            (tip, .0018 * SCALE, .0022 * SCALE),
        ], collection, sides=48))
    return parts, bones, paws


def connected_skin(parts):
    bpy.ops.object.select_all(action="DESELECT")
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    skin = parts[0]
    skin.name = "CF_Wolf_ContinuousSkin"
    remesh = skin.modifiers.new("ContinuousTissueUnion", "REMESH")
    remesh.mode = "VOXEL"
    remesh.voxel_size = VOXEL
    remesh.adaptivity = 0
    remesh.use_remove_disconnected = False
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    smooth = skin.modifiers.new("TissueRelax", "SMOOTH")
    smooth.factor = .65
    smooth.iterations = 3
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    # Remeshing must join every root; never delete disconnected islands to get a PASS.
    bm = bmesh.new()
    bm.from_mesh(skin.data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    components, unseen = [], set(bm.verts)
    while unseen:
        stack, count = [unseen.pop()], 0
        while stack:
            vertex = stack.pop()
            count += 1
            for edge in vertex.link_edges:
                other = edge.other_vert(vertex)
                if other in unseen:
                    unseen.remove(other)
                    stack.append(other)
        components.append(count)
    nonmanifold = sum(not edge.is_manifold for edge in bm.edges)
    bm.to_mesh(skin.data)
    bm.free()
    if len(components) != 1 or nonmanifold:
        fail(f"Continuous tissue failed: components={components}, nonmanifoldEdges={nonmanifold}")
    for face in skin.data.polygons:
        face.use_smooth = True
    return skin, {"connectedComponents": len(components), "componentVertices": components,
                  "nonmanifoldEdges": nonmanifold, "voxelSize": VOXEL,
                  "sourceSampling": {"tubeSides": 48, "ellipsoidLatitudes": 32,
                                     "ellipsoidLongitudes": 64, "pathSteps": 5,
                                     "path": "monotone Hermite; exact rings; bounded segment extrema"},
                  "vertices": len(skin.data.vertices), "polygons": len(skin.data.polygons)}


def segment_distance(point, a, b):
    segment = b - a
    t = max(0, min(1, (point - a).dot(segment) / segment.length_squared))
    return (point - (a + segment * t)).length


def make_rig(skin, bones, paws, collection):
    armature = bpy.data.armatures.new("CF_WolfAnatomy")
    rig = bpy.data.objects.new("CF_Wolf_Rig", armature)
    collection.objects.link(rig)
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    for name, definition in bones.items():
        bone = armature.edit_bones.new(name)
        bone.head, bone.tail = definition["head"], definition["tail"]
        if definition["parent"]:
            bone.parent = armature.edit_bones[definition["parent"]]
        bone.use_deform = name != "root"
    bpy.ops.object.mode_set(mode="OBJECT")
    rig.show_in_front = True
    rig.display_type = "WIRE"
    groups = {name: skin.vertex_groups.new(name=name) for name in bones if name != "root"}
    contacts = {}
    for name, paw in paws.items():
        center = paw["center"]
        region = [vertex for vertex in skin.data.vertices
                  if abs(vertex.co.x - center.x) < .050 * SCALE
                  and abs(vertex.co.y - center.y) < .030 * SCALE and vertex.co.z < .032 * SCALE]
        if not region:
            fail("Missing planted paw geometry: " + name)
        low = min(vertex.co.z for vertex in region)
        high = .032 * SCALE
        for vertex in region:
            vertex.co.z = max(0, (vertex.co.z - low) * high / (high - low))
        contacts[name] = [vertex.index for vertex in region if vertex.co.z < .006 * SCALE]
        if not contacts[name]:
            fail("Paw has no actual floor contact: " + name)
    for vertex in skin.data.vertices:
        fixed = next((name for name, paw in paws.items()
                      if abs(vertex.co.x - paw["center"].x) < .050 * SCALE
                      and abs(vertex.co.y - paw["center"].y) < .030 * SCALE
                      and vertex.co.z < .033 * SCALE), None)
        if fixed:
            groups[fixed].add([vertex.index], 1, "REPLACE")
            continue
        weights = []
        for name, definition in bones.items():
            if name in ("root", "jaw"):
                continue
            # Distant opposite-side limbs cannot influence a leg through the body.
            if "_far_" in name and vertex.co.y < -.010 * SCALE:
                continue
            if "_near_" in name and vertex.co.y > .010 * SCALE:
                continue
            distance = segment_distance(vertex.co, definition["head"], definition["tail"])
            strength = math.exp(-2.8 * (distance / definition["radius"]) ** 2)
            if strength > 1e-12:
                weights.append((strength, name))
        weights.sort(reverse=True)
        weights = weights[:4]
        total = sum(weight for weight, _ in weights)
        if not total:
            fail("Skin vertex has no anatomical weight owner")
        for weight, name in weights:
            groups[name].add([vertex.index], weight / total, "REPLACE")
    modifier = skin.modifiers.new("AnatomicalSkin", "ARMATURE")
    modifier.object = rig
    modifier.use_deform_preserve_volume = True
    skin.parent = rig
    error = max(abs(sum(group.weight for group in vertex.groups) - 1) for vertex in skin.data.vertices)
    if error > 1e-5:
        fail("Skin weights are not normalized")
    return rig, contacts, error


def linear_color(hex_color):
    value = hex_color.lstrip("#")
    if not re.fullmatch(r"[0-9a-fA-F]{6}", value):
        fail("Expected an authored six-digit coat color")
    rgb = [int(value[index:index + 2], 16) / 255 for index in (0, 2, 4)]
    return tuple(channel / 12.92 if channel <= .04045 else ((channel + .055) / 1.055) ** 2.4
                 for channel in rgb)


def material(name, color, roughness=.76):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def appearance(skin, rig, phenotype, p, collection):
    spec = phenotype["morphology"]["spec"]
    base = Vector(linear_color(spec["hue"]))
    pale = Vector(linear_color(spec.get("muzzleHue", "#cac5b8")))
    dark = Vector(linear_color(spec.get("tailTip", "#241f1d")))
    mat = material("WolfGreyContinuousCoat", base)
    attribute = mat.node_tree.nodes.new("ShaderNodeVertexColor")
    attribute.layer_name = "CF_Coat"
    mat.node_tree.links.new(attribute.outputs["Color"], mat.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])
    skin.data.materials.append(mat)
    color = skin.data.color_attributes.new(name="CF_Coat", type="FLOAT_COLOR", domain="POINT")
    for vertex in skin.data.vertices:
        x = vertex.co.x / SCALE + .5
        painter_y = p["groundY"] - vertex.co.z / SCALE
        belly = max(0, min(.42, (painter_y - p["shoulderTop"] - p["bodyH"] * .50) / p["bodyH"]))
        result = base.lerp(pale, belly)
        if x > p["hx"] + p["headRx"] * .10 and painter_y > p["hy"] - .004:
            result = base.lerp(pale, .83)
        if x < p["tipX"] + p["tailW"] * 2.1:
            blend = max(0, min(1, (p["tipX"] + p["tailW"] * 2.1 - x) / (p["tailW"] * 1.2)))
            result = result.lerp(dark, blend)
        color.data[vertex.index].color = (*result, 1)

    def attached_detail(name, center, radii, mat):
        obj = ellipsoid(name, center, radii, collection)
        obj.data.materials.append(mat)
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
        group = obj.vertex_groups.new(name="head")
        group.add(list(range(len(obj.data.vertices))), 1, "REPLACE")
        modifier = obj.modifiers.new("HeadAttachment", "ARMATURE")
        modifier.object = rig
        obj.parent = rig
        return obj

    socket = material("EyeSocket", linear_color("#302c27"), .7)
    iris = material("WolfAmberIris", linear_color("#b98a48"), .3)
    pupil = material("EyePupilAndWetNose", linear_color("#171b1b"), .24)
    bpy.context.view_layer.update()
    # Raycast against the actual unified skin: eyes sit in it, never on a guessed floating plane.
    for side in (-1, 1):
        origin = world(p, p["hx"] + p["headRx"] * .28, p["hy"] - p["headRy"] * .17, side)
        direction = Vector((0, -side, 0))
        hit, location, normal, _ = skin.ray_cast(origin, direction)
        if not hit:
            fail("Canonical Wolf eye landmark did not intersect connected skull skin")
        attached_detail("RootedEyeSocket" + str(side), location,
                        (.012 * SCALE, .008 * SCALE, .011 * SCALE), socket)
        eye = location + normal * (.004 * SCALE)
        attached_detail("WolfAmberEye" + str(side), eye,
                        (.008 * SCALE, .006 * SCALE, .008 * SCALE), iris)
        attached_detail("WolfRoundPupil" + str(side), eye + normal * (.004 * SCALE),
                        (.0038 * SCALE, .004 * SCALE, .005 * SCALE), pupil)
    nose = world(p, p["hx"] + p["muzzleLen"], p["hy"] + p["headRy"] * .11)
    attached_detail("AttachedWetNose", nose, (.014 * SCALE, .024 * SCALE, .009 * SCALE), pupil)


def finite_pose(rig, skin, contacts):
    # Breathing is a sibling of the static limb chains. No root/hip/paw translation or IK drift.
    samples = {1: (0, 0), 13: (.55, 0), 25: (1, 0), 37: (.5, 0), 49: (0, 0),
               65: (0, 0), 73: (.35, .6), 81: (.5, 1), 89: (.2, .4), 97: (0, 0)}
    for frame, (breath, inspect) in samples.items():
        for bone in rig.pose.bones:
            bone.rotation_mode = "XYZ"
            bone.location = (0, 0, 0)
            bone.rotation_euler = (0, 0, 0)
            bone.scale = (1, 1, 1)
        rig.pose.bones["breath"].scale = (1 + .012 * breath, 1, 1 + .008 * breath)
        rig.pose.bones["neck"].rotation_euler.x = math.radians(-2 * breath - 5 * inspect)
        rig.pose.bones["head"].rotation_euler.z = math.radians(6 * inspect)
        rig.pose.bones["head"].rotation_euler.x = math.radians(3 * inspect)
        rig.pose.bones["ear_near"].rotation_euler.x = math.radians(4 * inspect)
        rig.pose.bones["ear_far"].rotation_euler.x = math.radians(-3 * inspect)
        for index in range(1, 4):
            rig.pose.bones["tail" + str(index)].rotation_euler.z = math.radians((.5 * breath + inspect) * index)
        for name in ("breath", "neck", "head", "ear_near", "ear_far", "tail1", "tail2", "tail3"):
            bone = rig.pose.bones[name]
            bone.keyframe_insert(data_path="rotation_euler", frame=frame)
            bone.keyframe_insert(data_path="scale", frame=frame)
    rig.animation_data.action.name = "CF_Wolf_FiniteIdle_ThenInspect"
    scene = bpy.context.scene
    scene.frame_start, scene.frame_end = 1, 97
    scene.render.fps = 24
    for name, frame in (("IdleStart", 1), ("IdleSettled", 49), ("InspectStart", 65), ("InspectPeak", 81), ("SettledEnd", 97)):
        scene.timeline_markers.new(name, frame=frame)
    maximum = 0
    for frame in range(1, 98):
        scene.frame_set(frame)
        evaluated = skin.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        try:
            if len(mesh.vertices) != len(skin.data.vertices):
                fail("Unexpected topology change during pose proof")
            for indexes in contacts.values():
                for index in indexes:
                    maximum = max(maximum, (mesh.vertices[index].co - skin.data.vertices[index].co).length)
        finally:
            evaluated.to_mesh_clear()
    scene.frame_set(1)
    if maximum > 1e-6:
        fail("Finite poses moved planted paw vertices")
    return {"fps": 24, "idle": [1, 49], "interaction": [65, 97], "settledFrame": 97,
            "keyedPoses": list(samples), "groundingCheckedFrames": [1, 97], "maximumPawDisplacement": maximum,
            "cyclicModifiers": 0, "runtimeIntegration": False}


def stage(size, collection):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    scene.render.threads_mode = "FIXED"
    scene.render.threads = 4
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True
    scene.view_settings.view_transform = "AgX"
    scene.world = bpy.data.worlds.new("CF_NeutralStudio")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (.19, .22, .27, 1)
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = .32
    camera_data = bpy.data.cameras.new("CF_WolfReviewCamera")
    camera = bpy.data.objects.new("CF_WolfReviewCamera", camera_data)
    collection.objects.link(camera)
    camera.location = (3.0, -10, 3.1)
    target = Vector((-.26, 0, .66))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 3.9
    scene.camera = camera
    for name, location, energy, size, color in (
            ("SoftKey", (-2, -4, 6), 650, 4, (1, .91, .80)),
            ("SoftFill", (1, 4, 3), 420, 3, (.72, .84, 1)),
            ("UpperRim", (-3, 2, 4), 480, 3, (.82, .90, 1))):
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.shape, data.size, data.color = energy, "DISK", size, color
        obj = bpy.data.objects.new(name, data)
        collection.objects.link(obj)
        obj.location = location
        obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = "//renders/wolf-rest.png"
    scene["CF_renderQualification"] = "UNRENDERED; root must enable and record actual METAL-only device before render"


def main():
    args = arguments()
    if not bpy.app.background or bpy.data.filepath:
        fail("Run only in an isolated background factory-startup scene, never an existing master")
    bundle = private_directory(args.bundle_root)
    if not bundle.is_dir():
        fail("Explicit private bundle root must already exist")
    phenotype_path = inside(bundle, args.phenotype)
    output = private_directory(inside(bundle, args.output))
    raw, phenotype, p = read_phenotype(phenotype_path)
    authority = source_inventory(args.source_root, phenotype["sources"])
    if output.exists():
        fail("Refusing to overwrite an existing candidate directory")
    # Exclusive directory creation precedes every saved artifact, retaining failed candidates.
    output.mkdir(parents=False, exist_ok=False)
    (output / "input").mkdir()
    (output / "source").mkdir()
    (output / "renders").mkdir()
    for relative, data in authority.items():
        dependency = output / "authority" / relative
        dependency.parent.mkdir(parents=True, exist_ok=True)
        dependency.write_bytes(data)
    (output / "input" / "phenotype.json").write_bytes(raw)
    recipe = Path(__file__).resolve().read_bytes()
    (output / "source" / "creature_canid.py").write_bytes(recipe)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    creature = bpy.data.collections.new("CF_WolfCandidate")
    studio = bpy.data.collections.new("CF_ReviewStudio")
    bpy.context.scene.collection.children.link(creature)
    bpy.context.scene.collection.children.link(studio)
    parts, bones, paws = organism(p, creature)
    skin, topology = connected_skin(parts)
    rig, contacts, weight_error = make_rig(skin, bones, paws, creature)
    appearance(skin, rig, phenotype, p, creature)
    animation = finite_pose(rig, skin, contacts)
    stage(args.size, studio)
    rig["CF_speciesVisualKey"] = phenotype["speciesVisualKey"]
    rig["CF_phenotypeSHA256"] = sha(raw)
    rig["CF_visualAcceptance"] = "UNREVIEWED"
    rig["CF_schema"] = SCHEMA
    rig["CF_relativePhenotype"] = "//input/phenotype.json"
    text = bpy.data.texts.new("CF_CompletePhenotype.json")
    text.write(raw.decode("utf-8"))
    blend = output / "wolf-canid.blend"
    if blend.exists():
        fail("Refusing to overwrite a master")
    bpy.ops.wm.save_as_mainfile(filepath=str(blend), check_existing=False)
    receipt = {
        "schema": "cf.creature-canid-build/v1", "status": "BUILT_UNRENDERED_UNREVIEWED",
        "id": phenotype.get("id"), "speciesVisualKey": phenotype["speciesVisualKey"],
        "sources": phenotype["sources"], "recipeSha256": sha(recipe), "phenotypeSha256": sha(raw),
        "blend": "wolf-canid.blend", "blendSha256": sha(blend.read_bytes()),
        "blender": bpy.app.version_string, "buildHash": bpy.app.build_hash.decode("ascii"),
        "proportions": p, "coordinates": {"scale": SCALE, "originX": .5, "groundY": p["groundY"],
                                              "depth": "authored lateral anatomy; no changed genome"},
        "topology": topology, "maximumWeightSumError": weight_error,
        "pawContactVertices": {name: len(indexes) for name, indexes in contacts.items()},
        "bones": {name: {"head": list(row["head"]), "tail": list(row["tail"]), "parent": row["parent"]}
                  for name, row in bones.items()},
        "animation": animation, "render": {"size": args.size, "samples": 16, "threads": 4,
                                              "configuredDevice": "GPU", "actualBackend": None, "performed": False},
        "relativeDependencies": ["input/phenotype.json", "source/creature_canid.py"]
            + ["authority/" + name for name in authority],
        "sourceInventoryVerified": True, "completeVisualKeyVerified": True,
        "runtimeIntegrated": False, "humanAccepted": False, "anatomicalFamiliesComplete": 0,
    }
    with (output / "BUILD_RECEIPT.json").open("x", encoding="utf-8") as handle:
        json.dump(receipt, handle, indent=2, ensure_ascii=False, allow_nan=False)
        handle.write("\n")
    print("BUILT_UNRENDERED_UNREVIEWED " + str(blend))


if __name__ == "__main__":
    main()
