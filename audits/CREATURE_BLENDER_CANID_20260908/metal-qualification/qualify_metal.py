import bpy, json, time, math, hashlib
from pathlib import Path
from mathutils import Vector
out=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=16
prefs=bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type='METAL'; prefs.refresh_devices()
selected=[]
for d in prefs.devices:
    d.use=d.type=='METAL'
    if d.use: selected.append({'name':d.name,'type':d.type,'id':d.id})
assert selected and all(d.type!='CPU' or not d.use for d in prefs.devices)
scene.cycles.device='GPU'; scene.cycles.use_denoising=False
scene.render.resolution_x=192; scene.render.resolution_y=192; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=True; scene.render.threads_mode='FIXED'; scene.render.threads=4
scene.world.color=(.16,.16,.16)
def material(name,color):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*color,1)
    m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.58
    return m
bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=(0,0,.65)); ob=bpy.context.object; ob.scale=(.8,.42,.65); ob.data.materials.append(material('synthetic-gray',(.24,.32,.38)))
for f in ob.data.polygons:f.use_smooth=True
bpy.ops.mesh.primitive_plane_add(size=3); bpy.context.object.data.materials.append(material('synthetic-ground',(.055,.07,.08)))
bpy.ops.object.light_add(type='AREA',location=(-2,-3,4)); bpy.context.object.data.energy=350; bpy.context.object.data.shape='DISK'; bpy.context.object.data.size=3
bpy.ops.object.camera_add(location=(2.6,-4.0,2.2)); camera=bpy.context.object; camera.rotation_euler=(Vector((0,0,.5))-camera.location).to_track_quat('-Z','Y').to_euler(); camera.data.type='ORTHO'; camera.data.ortho_scale=2.7;scene.camera=camera
scene.render.filepath=str(out/'metal-qualification.png')
start=time.monotonic(); bpy.ops.render.render(write_still=True); elapsed=time.monotonic()-start
png=Path(scene.render.filepath); assert png.stat().st_size>1000
record={'schema':'cf-metal-render-qualification/v1','blenderVersion':bpy.app.version_string,'buildHash':bpy.app.build_hash.decode(),'backend':prefs.compute_device_type,'sceneDevice':scene.cycles.device,'enabledDevices':selected,'cpuEnabled':any(d.use and d.type=='CPU' for d in prefs.devices),'samples':scene.cycles.samples,'resolution':[192,192],'renderSeconds':round(elapsed,3),'output':{'path':png.name,'bytes':png.stat().st_size,'sha256':hashlib.sha256(png.read_bytes()).hexdigest()},'scope':'Bounded actual synthetic material/lighting render; not candidate anatomy or performance comparison.'}
(out/'metal-qualification.json').write_text(json.dumps(record,indent=2)+'\n'); print(json.dumps(record),flush=True)
