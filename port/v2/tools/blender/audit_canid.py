"""Audit a saved canid in an isolated process; mutate only scratch memory, never save the master."""
import argparse, hashlib, json, math, os, stat, sys
from pathlib import Path
import bpy, bmesh
from mathutils import Vector


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def read(path, limit=4 * 1024 * 1024):
    check(path.is_file() and path.stat().st_size <= limit, "bounded regular input required")
    with path.open("rb") as handle:
        check(stat.S_ISREG(os.fstat(handle.fileno()).st_mode), "regular input required")
        data = handle.read(limit + 1)
    check(len(data) <= limit, "input exceeded bound")
    return data


sha = lambda data: hashlib.sha256(data).hexdigest()
encode = lambda value: json.dumps(value, ensure_ascii=False, separators=(",", ":"))
def stable(value):
    if value is None: return ["null"]
    if type(value) is bool: return ["boolean", value]
    if type(value) is str: return ["string", value]
    if type(value) is int and abs(value) <= 9007199254740991: return ["number", str(value)]
    if type(value) is list: return ["array", [stable(item) for item in value]]
    check(type(value) is dict, "unsupported pure-Wolf identity value")
    return ["object", [[key, stable(value[key])] for key in sorted(value, key=lambda key: key.encode("utf-16-be"))]]


def identity(rig, raw, receipt):
    embedded = bpy.data.texts["CF_CompletePhenotype.json"].as_string().encode("utf-8")
    check(embedded == raw and sha(embedded) == receipt["phenotypeSha256"] == rig["CF_phenotypeSHA256"], "phenotype hash mismatch")
    phenotype = json.loads(embedded); genome = phenotype["genome"]
    check(genome["kingdom"] == "fauna" and genome["_earthName"] == "Wolf" and genome["seed"] == 792844710, "wrong Wolf identity")
    check(encode(stable(genome)) == phenotype["speciesVisualKey"] == receipt["speciesVisualKey"] == rig["CF_speciesVisualKey"], "visual key mismatch")
    check(phenotype["sources"] == receipt["sources"] and phenotype["visualAcceptance"] == rig["CF_visualAcceptance"] == "UNREVIEWED", "phenotype claims mismatch")


def topology(skin, rig):
    bm = bmesh.new(); bm.from_mesh(skin.data); unseen = set(bm.verts); components = 0
    while unseen:
        components += 1; pending = [unseen.pop()]
        while pending:
            vertex = pending.pop()
            for edge in vertex.link_edges:
                other = edge.other_vert(vertex)
                if other in unseen: unseen.remove(other); pending.append(other)
    bad = sum(not edge.is_manifold for edge in bm.edges); bm.free()
    check(components == 1 and bad == 0, "skin must be one connected manifold component")
    check(len(skin.data.polygons) > 0 and all(group.name in rig.data.bones for group in skin.vertex_groups), "missing bone weight owner")
    error = max(abs(sum(group.weight for group in vertex.groups) - 1) for vertex in skin.data.vertices)
    check(error <= 1e-5 and all(math.isfinite(group.weight) and 0 <= group.weight <= 1 for vertex in skin.data.vertices for group in vertex.groups), "invalid skin weights")
    return {"vertices": len(skin.data.vertices), "polygons": len(skin.data.polygons), "components": components, "nonmanifoldEdges": bad, "maximumWeightSumError": error}


def animation(rig):
    owners = [bpy.context.scene, *bpy.data.objects, *bpy.data.meshes, *bpy.data.armatures, *bpy.data.shape_keys]
    for owner in owners:
        data = owner.animation_data
        check(not data or (not data.nla_tracks and not data.drivers and (not data.action or owner == rig)), "unexpected NLA, driver or animation owner")
    check(rig.animation_data and rig.animation_data.action and len(bpy.data.actions) == 1, "one actual finite action required")
    action = rig.animation_data.action; curves = {}
    for layer in getattr(action, "layers", []):
        for strip in layer.strips:
            for bag in getattr(strip, "channelbags", []):
                for curve in bag.fcurves: curves[curve.as_pointer()] = curve
    if getattr(action, "is_action_legacy", False):
        for curve in getattr(action, "fcurves", []): curves[curve.as_pointer()] = curve
    check(curves and not getattr(action, "use_cyclic", False), "finite action curves missing or cyclic")
    for curve in curves.values():
        check(not curve.modifiers and curve.extrapolation == "CONSTANT" and curve.keyframe_points, "nonfinite curve modifier or extrapolation")
        check(all(math.isfinite(n) for key in curve.keyframe_points for n in (*key.co, *key.handle_left, *key.handle_right)), "nonfinite animation key")
        check(all(1 <= key.co.x <= 97 for key in curve.keyframe_points), "key outside finite timeline")
    return {"actions": 1, "curves": len(curves), "keyframes": sum(len(curve.keyframe_points) for curve in curves.values()), "nlaTracks": 0, "drivers": 0, "curveModifiers": 0}


def motion(skin, rig):
    scene = bpy.context.scene; check((scene.frame_start, scene.frame_end) == (1, 97), "wrong finite timeline")
    groups = [group for group in skin.vertex_groups if group.name.endswith("_paw") and group.name in rig.data.bones]
    check(len(groups) == 4, "four actual paw weight groups required")
    rest = [skin.matrix_world @ vertex.co for vertex in skin.data.vertices]; contacts = {}
    for group in groups:
        indexes = [vertex.index for vertex in skin.data.vertices if rest[vertex.index].z < .024 and any(weight.group == group.index and weight.weight > .99999 for weight in vertex.groups)]
        check(indexes and abs(min(rest[index].z for index in indexes)) <= 1e-6, "paw ground contact missing")
        contacts[group.name] = indexes
    check(sum(map(len, contacts.values())) == len(set(index for indexes in contacts.values() for index in indexes)), "paw contact groups overlap")
    maximum = moving = settled = 0; first = None
    for frame in range(1, 98):
        scene.frame_set(frame); evaluated = skin.evaluated_get(bpy.context.evaluated_depsgraph_get()); mesh = evaluated.to_mesh()
        try:
            current = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
            check(len(current) == len(rest), "pose changed skin topology")
            if first is None: first = current
            moving = max(moving, max((a - b).length for a, b in zip(current, first)))
            for indexes in contacts.values():
                check(abs(min(current[index].z for index in indexes)) <= 1e-6, "paw grounding changed")
                maximum = max(maximum, max((current[index] - rest[index]).length for index in indexes))
            check(maximum <= 1e-6, "planted paw displaced")
            if frame == 97: settled = max((a - b).length for a, b in zip(current, first))
        finally: evaluated.to_mesh_clear()
    check(moving > 1e-5 and settled <= 1e-6, "motion absent or frame97 did not settle")
    return {"frames": 97, "contactVertices": {name: len(indexes) for name, indexes in contacts.items()}, "maximumPawDisplacement": maximum, "maximumSkinMotion": moving, "settledSkinDelta": settled}


def rejected(name, observer, expected, controls):
    try: observer()
    except AssertionError as error:
        check(expected in str(error), "negative control failed for an unrelated reason: " + str(error)); controls[name] = str(error)
    else: raise AssertionError("negative control was accepted: " + name)


def main():
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument("--candidate", type=Path, required=True); parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:]); root = args.candidate.resolve(); out = args.out.absolute()
    check(bpy.app.background and not bpy.data.filepath, "isolated background factory-startup required")
    check(out.parent.resolve() == out.parent and out.parent.is_dir() and not out.exists() and not out.is_symlink(), "fresh output under a real parent required")
    check(not any((parent / ".git").exists() for parent in (out.parent, *out.parent.parents)), "output must be outside Git")
    receipt = json.loads(read(root / "BUILD_RECEIPT.json")); blend = root / "wolf-canid.blend"; before = sha(read(blend, 512 * 1024 * 1024)); raw = read(root / "input/phenotype.json")
    check(receipt["blend"] == blend.name and before == receipt["blendSha256"], "saved blend hash mismatch")
    report = {"schema": "cf.canid-saved-audit/v1", "status": "FAIL", "blendSha256": before, "auditorSha256": sha(read(Path(__file__))), "visualAcceptance": "UNREVIEWED", "method": "saved mesh topology and world-space weighted contacts; all 97 evaluated frames; scratch-only mutants", "negativeControls": {}}
    with out.open("x", encoding="utf-8") as output:
        try:
            bpy.ops.wm.open_mainfile(filepath=str(blend), load_ui=False, use_scripts=False)
            rig = bpy.data.objects["CF_Wolf_Rig"]; skin = bpy.data.objects["CF_Wolf_ContinuousSkin"]
            check(rig.type == "ARMATURE" and skin.type == "MESH" and any(mod.type == "ARMATURE" and mod.object == rig for mod in skin.modifiers), "saved skin/rig binding missing")
            identity(rig, raw, receipt); report["topology"] = topology(skin, rig); report["animation"] = animation(rig); report["motion"] = motion(skin, rig)
            original = skin.data; mutant = original.copy(); skin.data = mutant; bm = bmesh.new(); bm.from_mesh(mutant)
            vertices = [bm.verts.new(Vector(point)) for point in ((8, 0, 0), (9, 0, 0), (8, 1, 0), (8, 0, 1))]
            for face in ((0, 2, 1), (0, 1, 3), (1, 2, 3), (2, 0, 3)): bm.faces.new([vertices[index] for index in face])
            bm.to_mesh(mutant); bm.free()
            try: rejected("disconnected-component", lambda: topology(skin, rig), "one connected", report["negativeControls"])
            finally: skin.data = original; bpy.data.meshes.remove(mutant)
            text = bpy.data.texts["CF_CompletePhenotype.json"]; text.clear(); text.write("{}")
            try: rejected("wrong-phenotype", lambda: identity(rig, raw, receipt), "phenotype hash", report["negativeControls"])
            finally: text.clear(); text.write(raw.decode("utf-8"))
            key = rig["CF_speciesVisualKey"]; rig["CF_speciesVisualKey"] = "wrong-key"
            try: rejected("wrong-key", lambda: identity(rig, raw, receipt), "visual key", report["negativeControls"])
            finally: rig["CF_speciesVisualKey"] = key
            paw = rig.pose.bones[next(iter(report["motion"]["contactVertices"]))]; location = paw.location.copy(); paw.location.z += .25
            try: rejected("moved-paw", lambda: motion(skin, rig), "paw", report["negativeControls"])
            finally: paw.location = location
            identity(rig, raw, receipt); topology(skin, rig); report["restoredMotion"] = motion(skin, rig); report["status"] = "PASS"
        except Exception as error: report["failure"] = str(error); raise
        finally:
            report["masterUnchanged"] = sha(read(blend, 512 * 1024 * 1024)) == before
            if not report["masterUnchanged"]: report["status"] = "FAIL"; report["failure"] = "master bytes changed"
            bpy.ops.wm.read_factory_settings(use_empty=True)
            json.dump(report, output, indent=2, allow_nan=False); output.write("\n")
            check(report["masterUnchanged"], "master bytes changed")
    print(json.dumps({"status": report["status"], "output": str(out)}))


if __name__ == "__main__": main()
