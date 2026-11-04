"""Offline Wolf material/appeal study. No game import or protected-master mutation.

Blender --background --factory-startup --python this.py -- --master MASTER
  --phenotype INPUT --output NEW_PRIVATE_DIRECTORY
Two treatments preserve the existing skin, dimensions and complete creature identity.
The finite strike articulates neck/head; it is not an opening bite or walking cycle.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import random
import sys
import time

import bpy
from mathutils import Vector


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def linear(value):
    values = [int(value[i:i+2], 16)/255 for i in (1, 3, 5)]
    return Vector(tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in values))


def mat(name, color, rough=.65):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    return m


def clamp(x):
    return max(0., min(1., x))


def attach(obj, rig, bone='head'):
    group = obj.vertex_groups.new(name=bone)
    group.add(list(range(len(obj.data.vertices))), 1., 'REPLACE')
    mod = obj.modifiers.new('OriginalRigAttachment', 'ARMATURE')
    mod.object = rig
    obj.parent = rig


def coat_color(v, proportions, treatment):
    # Same canonical silver-grey/cream/dark-tail family; no new elemental trait.
    x = v.co.x/4 + .5
    py = proportions['groundY'] - v.co.z/4
    side = abs(v.co.y)
    base, pale, dark = linear('#7d7f86'), linear('#cac5b8'), linear('#241f1d')
    belly = clamp((py-proportions['shoulderTop']-proportions['bodyH']*.30)/(.11))
    saddle = clamp((proportions['shoulderTop']+.040-py)/.048)
    color = base.lerp(pale, belly*(.75 if treatment == 'storybook' else .58))
    color = color.lerp(dark, saddle*.55)
    face = clamp((x-proportions['hx']+.050)/.065)
    cheek = clamp((py-proportions['hy']+.018)/.053)
    color = color.lerp(pale, face*cheek*.91)
    # Rooted cheek and brow mask, quiet enough to preserve the face at 132px.
    mask = math.exp(-((x-(proportions['hx']+.006))/.045)**2
                    -((py-(proportions['hy']-.020))/.026)**2)
    color = color.lerp(dark, mask*(.48 if treatment == 'natural' else .35)*clamp(side/.10))
    tip = clamp((proportions['tipX']+proportions['tailW']*2.1-x)/(proportions['tailW']*1.2))
    color = color.lerp(dark, tip)
    if treatment == 'natural':
        variation = .965 + .035*math.sin(v.co.x*83+v.co.z*57)*math.sin(v.co.y*113)
        color *= variation
    return color


def add_coat(skin, rig, proportions, treatment):
    attribute = skin.data.color_attributes.get('CF_Coat')
    assert attribute and attribute.domain == 'POINT'
    for v in skin.data.vertices:
        attribute.data[v.index].color = (*coat_color(v, proportions, treatment), 1)
    material = skin.data.materials[0]
    material.name = 'CF_'+treatment+'_SilverWolfCoat'
    nodes, links = material.node_tree.nodes, material.node_tree.links
    p = nodes.get('Principled BSDF')
    p.inputs['Roughness'].default_value = .73 if treatment == 'natural' else .64
    p.inputs['Sheen Weight'].default_value = .34
    tex = nodes.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 155 if treatment == 'natural' else 80
    tex.inputs['Detail'].default_value = 2
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = .25 if treatment == 'natural' else .12
    bump.inputs['Distance'].default_value = .018
    links.new(tex.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], p.inputs['Normal'])
    # Small tapered coat ribbons rooted on existing skin; inherit its actual rig weights.
    rng = random.Random(792844710)
    candidates = list(skin.data.vertices)
    rng.shuffle(candidates)
    candidates = candidates[:6500 if treatment == 'natural' else 3700]
    verts, faces, weights, colors = [], [], [], []
    for v in candidates:
        if v.co.z < .09:
            continue
        x = v.co.x/4+.5
        if x > proportions['hx']+.038:
            continue  # Keep the muzzle, eyes and nose legible.
        n = v.normal.normalized()
        flow = Vector((-1., 0., -.24))
        if v.co.z < .48:
            flow = Vector((-.12, 0., -1.))
        tangent = (flow-n*flow.dot(n)).normalized()
        if tangent.length < .01:
            tangent = n.cross(Vector((0, 1, 0))).normalized()
        width_axis = n.cross(tangent).normalized()
        length = (.033 if treatment == 'natural' else .047)*(0.65+rng.random()*.7)
        width = (.0019 if treatment == 'natural' else .0034)*(0.65+rng.random()*.65)
        root = v.co+n*.002
        mid = root+tangent*length*.42+n*length*.38
        tip = root+tangent*length+n*length*.16
        i = len(verts)
        verts.extend([root-width_axis*width, root+width_axis*width,
                      mid+width_axis*width*.48, mid-width_axis*width*.48, tip])
        faces.extend([(i, i+1, i+2, i+3), (i+3, i+2, i+4)])
        weights.extend([[(skin.vertex_groups[g.group].name, g.weight) for g in v.groups]]*5)
        color = coat_color(v, proportions, treatment)*(0.87+rng.random()*.22)
        colors.extend([(*color, 1)]*5)
    mesh = bpy.data.meshes.new('RootedCoatFibers')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new('CF_RootedCoat_'+treatment, mesh)
    bpy.context.scene.collection.objects.link(obj)
    fiber = mat('CF_Fiber_'+treatment, linear('#7d7f86'), .8)
    attr = fiber.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='FiberColor'
    fiber.node_tree.links.new(attr.outputs['Color'], fiber.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    mesh.materials.append(fiber)
    col = mesh.color_attributes.new(name='FiberColor', type='FLOAT_COLOR', domain='POINT')
    groups = {g.name:obj.vertex_groups.new(name=g.name) for g in skin.vertex_groups}
    for i, (values, rgba) in enumerate(zip(weights, colors)):
        for name, weight in values:
            groups[name].add([i], weight, 'REPLACE')
        col.data[i].color = rgba
    modifier = obj.modifiers.new('InheritedCanonicalSkinWeights', 'ARMATURE')
    modifier.object = rig;obj.parent=rig
    for poly in mesh.polygons:
        poly.use_smooth=True
    return obj


def face_details(rig):
    # Improve eye focus without enlarging the original eyes or changing head proportions.
    iris = bpy.data.materials.get('WolfAmberIris')
    shader = iris.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*linear('#d0a254'), 1)
    shader.inputs['Roughness'].default_value=.21
    shader.inputs['Coat Weight'].default_value=.4
    wet = bpy.data.materials.get('EyePupilAndWetNose')
    wet.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.22
    glint = mat('CF_EyeCatchlight', linear('#fff5dc'), .12)
    for side in (-1, 1):
        eye = bpy.data.objects['WolfAmberEye'+str(side)]
        center = sum((v.co for v in eye.data.vertices), Vector())/len(eye.data.vertices)
        center += Vector((.005, side*.023, .012))
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1, location=(0,0,0))
        obj=bpy.context.object;obj.name='CF_RootedEyeGlint'+str(side)
        for v in obj.data.vertices:
            v.co = center+Vector((v.co.x*.0055,v.co.y*.0028,v.co.z*.0055))
        obj.data.materials.append(glint)
        attach(obj,rig)


def stage(treatment):
    scene=bpy.context.scene
    scene.camera.location=(3.0,-10,3.1)
    target=Vector((-.26,0,.66))
    scene.camera.rotation_euler=(target-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    scene.camera.data.ortho_scale=3.9
    scene.render.resolution_x=scene.render.resolution_y=640
    scene.render.resolution_percentage=100
    scene.cycles.samples=32
    scene.cycles.use_denoising=True
    scene.render.film_transparent=True
    scene.render.image_settings.file_format='PNG'
    scene.render.image_settings.color_mode='RGBA'
    scene.view_settings.view_transform='AgX'
    scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.22
    lights={'SoftKey':(720,3.1,(1,.84,.67)), 'SoftFill':(290,3.,(.61,.77,1)), 'UpperRim':(820,2.4,(.69,.88,1))}
    for name,(energy,size,color) in lights.items():
        d=bpy.data.objects[name].data;d.energy=energy;d.size=size;d.color=color
    scene['CF_artDirection']='Original collectible fantasy-bestiary study; same Wolf identity and dimensions'
    scene['CF_visualAcceptance']='UNREVIEWED'


def finite_strike(rig):
    # Preserve the old action in the new private .blend; assign a separate finite study.
    if rig.animation_data and rig.animation_data.action:
        rig.animation_data.action.use_fake_user=True
    rig.animation_data_clear()
    poses={1:(0,0,0,0), 13:(1,0,0,0), 21:(0,1,0,0), 29:(0,.4,0,0),
           41:(0,0,1,0), 53:(0,0,0,1), 65:(0,0,0,0)}
    for frame,(brace,strike,recoil,curious) in poses.items():
        for p in rig.pose.bones:
            p.rotation_mode='XYZ';p.rotation_euler=(0,0,0);p.location=(0,0,0);p.scale=(1,1,1)
        rig.pose.bones['neck'].rotation_euler.x=math.radians(7*brace-15*strike+9*recoil-3*curious)
        rig.pose.bones['head'].rotation_euler.x=math.radians(-7*brace+9*strike-8*recoil)
        rig.pose.bones['head'].rotation_euler.z=math.radians(-4*brace-5*strike+10*recoil+8*curious)
        rig.pose.bones['breath'].scale=(1+.025*strike-.015*brace,1,1-.025*brace)
        rig.pose.bones['ear_near'].rotation_euler.x=math.radians(-12*brace-8*strike+6*curious)
        rig.pose.bones['ear_far'].rotation_euler.x=math.radians(-8*brace-6*strike-4*curious)
        for index in range(1,4):
            rig.pose.bones['tail'+str(index)].rotation_euler.z=math.radians(index*(2*brace-2*strike+3*curious))
        for name in ['breath','neck','head','ear_near','ear_far','tail1','tail2','tail3']:
            rig.pose.bones[name].keyframe_insert(data_path='rotation_euler',frame=frame)
            rig.pose.bones[name].keyframe_insert(data_path='scale',frame=frame)
    rig.animation_data.action.name='CF_Wolf_ArtStudy_Brace_NeckStrike_Recoil_Settle'
    scene=bpy.context.scene;scene.frame_start=1;scene.frame_end=65;scene.render.fps=24
    return list(poses)


def configure_gpu():
    pref=bpy.context.preferences.addons['cycles'].preferences
    pref.compute_device_type='METAL';pref.refresh_devices()
    for device in pref.devices:
        device.use=device.type=='METAL'
    selected=[{'name':d.name,'type':d.type,'id':d.id} for d in pref.devices if d.use]
    assert selected and not any(d.use and d.type=='CPU' for d in pref.devices)
    bpy.context.scene.cycles.device='GPU'
    return selected


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--master',type=Path,required=True)
    parser.add_argument('--phenotype',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
    assert not args.output.exists(), 'Fresh output required'
    args.output.mkdir(parents=True,mode=0o700)
    source_hash,phenotype_hash=digest(args.master),digest(args.phenotype)
    phenotype=json.loads(args.phenotype.read_text())
    assert phenotype['genome']['seed']==792844710 and phenotype['genome']['_earthName']=='Wolf'
    report={'schema':'cf-creature-charm-study/v1','status':'RUNNING','sourceMasterSha256':source_hash,
            'phenotypeSha256':phenotype_hash,'speciesVisualKey':phenotype['speciesVisualKey'],
            'recipeSha256':digest(__file__),'blenderVersion':bpy.app.version_string,
            'buildHash':bpy.app.build_hash.decode(),'treatments':[], 'runtimeIntegrated':False,'humanAcceptance':False}
    (args.output/'phenotype.json').write_bytes(args.phenotype.read_bytes())
    started=time.monotonic()
    for treatment in ['natural','storybook']:
        bpy.ops.wm.open_mainfile(filepath=str(args.master),load_ui=False)
        scene=bpy.context.scene;scene.frame_set(1)
        skin=bpy.data.objects['CF_Wolf_ConnectedSkin'] if 'CF_Wolf_ConnectedSkin' in bpy.data.objects else next(o for o in bpy.data.objects if o.type=='MESH' and len(o.data.vertices)>60000)
        rig=bpy.data.objects['CF_Wolf_Rig']
        assert rig['CF_speciesVisualKey']==phenotype['speciesVisualKey']
        base_vertices=[tuple(v.co) for v in skin.data.vertices]
        fibers=add_coat(skin,rig,phenotype['morphology']['proportions'],treatment)
        face_details(rig);stage(treatment);devices=configure_gpu();keys=finite_strike(rig)
        assert base_vertices==[tuple(v.co) for v in skin.data.vertices]
        folder=args.output/treatment;folder.mkdir();scene.frame_set(1)
        master=folder/'wolf-charm.blend'
        bpy.ops.wm.save_as_mainfile(filepath=str(master),check_existing=False)
        row={'name':treatment,'sourceSkinCoordinatesUnchanged':True,'skinVertices':len(skin.data.vertices),
             'fiberVertices':len(fibers.data.vertices),'enabledDevices':devices,'cpuEnabled':False,
             'keyframes':keys,'masterSha256':digest(master),'renders':[]}
        for frame in [1,13,21,41,53]:
            scene.frame_set(frame);scene.render.filepath=str(folder/f'pose-{frame:03d}.png')
            t=time.monotonic();bpy.ops.render.render(write_still=True)
            row['renders'].append({'frame':frame,'path':str(Path(scene.render.filepath).relative_to(args.output)),
                                   'sha256':digest(scene.render.filepath),'seconds':round(time.monotonic()-t,3)})
        report['treatments'].append(row)
        (args.output/'study.json').write_text(json.dumps(report,indent=2)+'\n')
    assert digest(args.master)==source_hash and digest(args.phenotype)==phenotype_hash
    report['status']='PASS';report['seconds']=round(time.monotonic()-started,3)
    report['originalInputsUnchanged']=True
    (args.output/'study.json').write_text(json.dumps(report,indent=2)+'\n')
    print('CF_CHARM_STUDY '+json.dumps({'status':'PASS','seconds':report['seconds'],'output':str(args.output)}),flush=True)


if __name__=='__main__':
    main()
