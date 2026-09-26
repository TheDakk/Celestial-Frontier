"""Read-only saved-model check and finite frame export; no model is saved."""
import bpy,bmesh,json,hashlib,math,time
from pathlib import Path
from mathutils import Vector

root=Path('/private/tmp/cf-creature-charm-20260908/first')
out=root.parent/'motion-check';assert not out.exists();out.mkdir()
report={'schema':'cf-charm-saved-motion/v1','status':'RUNNING','candidates':[],'humanAcceptance':False}
source=Path('/Users/nick/Projects/Celestial-Frontier-asset-sources/creature-canid-20260908/canid/wolf-canid-v2/wolf-canid.blend')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False,use_scripts=False)
source_skin=bpy.data.objects['CF_Wolf_ContinuousSkin']
source_coordinates=[tuple(v.co) for v in source_skin.data.vertices]
source_topology=[tuple(p.vertices) for p in source_skin.data.polygons]
phenotype=(root/'phenotype.json').read_bytes();key=json.loads(phenotype)['speciesVisualKey']
try:
 for treatment in ['natural','storybook']:
  master=root/treatment/'wolf-charm.blend';before=sha(master)
  bpy.ops.wm.open_mainfile(filepath=str(master),load_ui=False,use_scripts=False)
  scene=bpy.context.scene;skin=bpy.data.objects['CF_Wolf_ContinuousSkin'];rig=bpy.data.objects['CF_Wolf_Rig']
  assert rig['CF_speciesVisualKey']==key and bpy.data.texts['CF_CompletePhenotype.json'].as_string().encode()==phenotype
  assert source_coordinates==[tuple(v.co) for v in skin.data.vertices]
  assert source_topology==[tuple(p.vertices) for p in skin.data.polygons]
  contact=[v.index for v in skin.data.vertices if v.co.z<.024 and any(skin.vertex_groups[g.group].name.endswith('_paw') and g.weight>.99999 for g in v.groups)]
  assert len(contact)>100 and (scene.frame_start,scene.frame_end)==(1,65)
  first=None;maximum=drift=settled=0
  for frame in range(1,66):
   scene.frame_set(frame);ev=skin.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
   try:
    cur=[ev.matrix_world@v.co for v in mesh.vertices]
    assert len(cur)==len(source_coordinates) and all(math.isfinite(n) for v in cur for n in v)
    if first is None:first=cur
    maximum=max(maximum,max((a-b).length for a,b in zip(first,cur)))
    drift=max(drift,max((first[i]-cur[i]).length for i in contact))
    if frame==65:settled=max((a-b).length for a,b in zip(first,cur))
   finally:ev.to_mesh_clear()
  assert maximum>.03 and drift<1e-6 and settled<1e-6
  fiber=bpy.data.objects['CF_RootedCoat_'+treatment]
  assert any(m.type=='ARMATURE' and m.object==rig for m in fiber.modifiers)
  error=max(abs(sum(g.weight for g in v.groups)-1) for v in fiber.data.vertices)
  assert error<1e-5
  # Frozen anatomy is visibly different from a zero-motion negative control.
  scene.frame_set(21);ev=skin.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
  try: strike=[ev.matrix_world@v.co for v in mesh.vertices]
  finally:ev.to_mesh_clear()
  action=rig.animation_data.action;rig.animation_data.action=None
  for bone in rig.pose.bones:bone.location=(0,0,0);bone.rotation_euler=(0,0,0);bone.scale=(1,1,1)
  bpy.context.view_layer.update();ev=skin.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
  try: static=[ev.matrix_world@v.co for v in mesh.vertices]
  finally:ev.to_mesh_clear()
  negative_delta=max((a-b).length for a,b in zip(first,static));assert negative_delta<1e-6
  assert max((a-b).length for a,b in zip(strike,static))>.03
  rig.animation_data.action=action
  for owner in [scene,*bpy.data.objects]:
   data=owner.animation_data;assert not data or (not data.drivers and not data.nla_tracks)
  row={'treatment':treatment,'originalSkinCoordinatesAndTopologyUnchanged':True,'completeIdentityUnchanged':True,
       'evaluatedFrames':65,'maximumSkinDisplacement':maximum,'maximumPawDisplacement':drift,'settledDelta':settled,
       'contacts':len(contact),'fiberWeightSumMaxError':error,'zeroMotionControlDelta':negative_delta,'masterSha256':before}
  if treatment=='storybook':
   pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type='METAL';pref.refresh_devices()
   for d in pref.devices:d.use=d.type=='METAL'
   assert any(d.use for d in pref.devices) and not any(d.use and d.type=='CPU' for d in pref.devices)
   row['devices']=[{'name':d.name,'type':d.type} for d in pref.devices if d.use]
   scene.cycles.device='GPU';scene.cycles.samples=16;scene.render.resolution_x=scene.render.resolution_y=512
   frames=out/'frames';frames.mkdir();row['renders']=[]
   for i,frame in enumerate(range(1,66,2)):
    scene.frame_set(frame);scene.render.filepath=str(frames/f'{i:03d}.png');bpy.ops.render.render(write_still=True)
    row['renders'].append({'frame':frame,'file':Path(scene.render.filepath).name,'sha256':sha(Path(scene.render.filepath))})
  assert sha(master)==before;row['masterUnchanged']=True;report['candidates'].append(row)
 report['status']='PASS'
finally:
 (out/'motion.json').write_text(json.dumps(report,indent=2)+'\n')
 print('CF_SAVED_CHARM_MOTION '+report['status'],flush=True)
