"""Bounded Civet master/clip proof. Shared tissue/weight primitives, exact Civet phenotype.
Editable output stays outside Git; never substitutes Wolf anatomy or installs runtime art.
"""
import sys, json, math, hashlib, argparse
from pathlib import Path
import bpy
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
import creature_canid as tissue

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--phenotype', required=True);parser.add_argument('--out',required=True)
    parser.add_argument('--texture',required=True);parser.add_argument('--render',action='store_true')
    a=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
    out=Path(a.out).resolve()
    if any((x/'.git').exists() for x in (out,*out.parents)):raise ValueError('Private master outside Git required')
    out.mkdir(exist_ok=False)
    phen=json.loads(Path(a.phenotype).read_text());g=phen['genome'];p=dict(phen['morphology']['proportions'])
    if phen['route']['name']!='Civet' or phen['morphology']['kind']!='viverrid-d' or g['_earthName']!='Civet':raise ValueError('Exact Civet owner required')
    root=Path(__file__).resolve().parents[4]
    for row in phen['sources']:
        if hashlib.sha256((root/row['path']).read_bytes()).hexdigest()!=row['sha256']:raise ValueError('Phenotype source changed: '+row['path'])
    # The current named owner supplies fixed canonical proportions. Gene variation is
    # intentionally not invented for this pure named animal; family bounds remain future work.
    p.update(bodyW=p['right']-p['left'],bodyH=p['bodyBottom']-p['rumpTop'],legLen=p['groundY']-p['bodyBottom'],earH=p['headRy']*.68,tailLen=.257,tailW=.060,tipX=.055,tipY=p['groundY']-.080)
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    coll=bpy.data.collections.new('CF_CivetProof');bpy.context.scene.collection.children.link(coll)
    parts,bones,paws=tissue.organism(p,coll)
    # Replace pointed generic ears with rounded viverrid ears rooted into the skull.
    for obj in list(parts):
        if obj.name.startswith('SkullRootedEar_'):parts.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)
    for side,label in ((-.043,'near'),(.043,'far')):
        centre=tissue.world(p,p['hx']-p['headRx']*.44,p['hy']-p['headRy']*.66-p['earH']*.36,side)
        parts.append(tissue.ellipsoid('CivetRoundedEar_'+label,centre,(.026*4,.016*4,.036*4),coll))
    skin,topology=tissue.connected_skin(parts);rig,contacts,weight_error=tissue.make_rig(skin,bones,paws,coll)
    skin.name='CF_Civet_ContinuousSkin';rig.name='CF_Civet_Rig';rig.data.name='CF_CivetAnatomy'
    skin['speciesVisualKey']=phen['speciesVisualKey'];rig['speciesVisualKey']=phen['speciesVisualKey']
    # Three-view projection UVs use the finisher-painted turnaround as one texture atlas.
    # Same scale/front-left-side-back layout, no isolated image parts used as a fake rig.
    uv=skin.data.uv_layers.new(name='CivetTurnaroundProjection')
    for poly in skin.data.polygons:
        front=poly.normal.x>.65 and poly.center.x>.75
        back=poly.normal.x<-.65 and poly.center.x<-.45
        for index in poly.loop_indices:
            v=skin.data.vertices[skin.data.loops[index].vertex_index].co
            xn=v.x/4+.5;yn=p['groundY']-v.z/4
            y=750-(p['groundY']-yn)/(.795-.365)*550
            if front:u=190-v.y/4/.075*120
            elif back:u=1588+v.y/4/.075*118
            else:u=1435-(xn-.055)/(.88-.055)*1060
            uv.data[index].uv=(max(0,min(1773,u))/1774,1-max(0,min(886,y))/887)
    mat=bpy.data.materials.new('CivetPaintedAtlas');mat.use_nodes=True
    nodes=mat.node_tree.nodes;shader=nodes.get('Principled BSDF');tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(Path(a.texture).resolve()));tex.interpolation='Linear';tex.extension='EXTEND'
    separate=nodes.new('ShaderNodeSeparateColor');mat.node_tree.links.new(tex.outputs['Color'],separate.inputs['Color'])
    red=nodes.new('ShaderNodeMath');red.operation='GREATER_THAN';red.inputs[1].default_value=.7;mat.node_tree.links.new(separate.outputs['Red'],red.inputs[0])
    blue=nodes.new('ShaderNodeMath');blue.operation='GREATER_THAN';blue.inputs[1].default_value=.7;mat.node_tree.links.new(separate.outputs['Blue'],blue.inputs[0])
    both=nodes.new('ShaderNodeMath');both.operation='MULTIPLY';mat.node_tree.links.new(red.outputs[0],both.inputs[0]);mat.node_tree.links.new(blue.outputs[0],both.inputs[1])
    mix=nodes.new('ShaderNodeMixRGB');mat.node_tree.links.new(both.outputs[0],mix.inputs[0]);mat.node_tree.links.new(tex.outputs['Color'],mix.inputs[1]);mix.inputs[2].default_value=(.38,.29,.16,1)
    mat.node_tree.links.new(mix.outputs[0],shader.inputs['Base Color']);shader.inputs['Roughness'].default_value=.86
    skin.data.materials.clear();skin.data.materials.append(mat)
    # Stable paint is UV-bound to the skin; all poses reuse this one atlas.
    frames={'idle':[1,24],'attack':[25,48],'hit':[49,64]}
    scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=64
    for f in range(1,65):
        for bone in rig.pose.bones:bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0);bone.location=(0,0,0);bone.scale=(1,1,1)
        if f<=24:
            wave=math.sin((f-1)/23*math.tau);rig.pose.bones['breath'].scale=(1+.012*wave,1,1+.008*wave);rig.pose.bones['neck'].rotation_euler.y=.025*wave
        elif f<=48:
            t=(f-25)/23;strike=math.sin(math.pi*t)**2
            rig.pose.bones['root'].location.x=.20*strike
            rig.pose.bones['neck'].rotation_euler.y=.12*strike
            rig.pose.bones['fore_near_upper'].rotation_euler.y=-.65*strike
            rig.pose.bones['fore_near_lower'].rotation_euler.y=.45*strike
            rig.pose.bones['jaw'].rotation_euler.y=.10*strike
        else:
            t=(f-49)/15;recoil=math.sin(math.pi*t)**2
            rig.pose.bones['root'].location.x=-.12*recoil
            rig.pose.bones['head'].rotation_euler.y=-.18*recoil
            rig.pose.bones['neck'].rotation_euler.z=.10*recoil
        for i in range(1,4):rig.pose.bones['tail'+str(i)].rotation_euler.z=.025*math.sin((f-1)/63*math.tau)*i
        for bone in rig.pose.bones:
            for channel in ['location','rotation_euler','scale']:bone.keyframe_insert(data_path=channel,frame=f)
    scene.frame_set(1);tissue.stage(440,coll);scene.camera.name='CF_CivetReviewCamera'
    scene.view_settings.view_transform='Standard';scene.render.filepath=str(out/'token.png')
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
    devices=[]
    for d in prefs.devices:d.use=d.type=='METAL';devices.append({'name':d.name,'type':d.type,'use':d.use})
    if not any(d['use'] for d in devices):raise ValueError('Qualified Metal device unavailable')
    rig['phenotype']=json.dumps(phen);rig['clipRanges']=json.dumps(frames)
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'civet-master.blend'))
    receipt={'status':'MASTER_BUILT','qualityAccepted':False,'topology':topology,'weightError':weight_error,'clips':frames,'devices':devices,'genome':g,'speciesVisualKey':phen['speciesVisualKey'],'textureSha256':hashlib.sha256(Path(a.texture).read_bytes()).hexdigest(),'limitation':'Named Civet only; gene-driven family bounds and local-finisher texture completion not yet proved.'}
    if a.render:
        bpy.ops.render.render(write_still=True);receipt['tokenRendered']=True
    (out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')

if __name__=='__main__':main()
