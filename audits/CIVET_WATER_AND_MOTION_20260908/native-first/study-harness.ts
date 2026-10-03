/* Isolated authoring bench. Actual native-frame readback never calls render or pose. */
import {Application,Container,ImageSource,MeshSimple,Rectangle,Sprite,Texture,type Buffer as PixiBuffer} from 'pixi.js';
import {applyCivetPose,createCivetMesh,sampleCivetPose,CIVET_CLIP_MS,CIVET_RIG_VERSION,CIVET_SOURCE_GENOME_JSON,
 type CivetClip,type CivetMeshData,type CivetPose} from '../../port/v2/tools/painted-creature/civet-articulated-rig.js';
import {EARTH_RESIDENT_LAYER_PLAN_V1} from '../../port/v2/packages/art/src/earth-resident-plan.js';
import {attachCivetWaterScene} from './water-owner.js';
type Bounds={x0:number;y0:number;x1:number;y1:number};
interface AssetManifest{path:string;sha256:string;width:number;height:number;alphaBounds:Bounds;contactY:number;civetPaws:Bounds[]}
interface SceneAsset{path:string;sha256:string;width:number;height:number}
declare const __CF_CIVET_ASSET__:AssetManifest;declare const __CF_CIVET_SCENE__:{background:SceneAsset};
const manifest=Object.freeze(__CF_CIVET_ASSET__),sceneManifest=Object.freeze(__CF_CIVET_SCENE__);
const genome=JSON.parse(CIVET_SOURCE_GENOME_JSON),identityBefore=JSON.stringify(genome),recipeBefore=JSON.stringify(manifest);
const assert=(ok:unknown,why:string):void=>{if(!ok)throw Error(why);};
const digest=async(bytes:BufferSource)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
const view=document.getElementById('study-view')!,status=document.getElementById('status')!;
const effects=document.getElementById('effects') as HTMLInputElement,reduced=document.getElementById('reduced') as HTMLInputElement,grounding=document.getElementById('cohesion') as HTMLInputElement;
const ids=['breathe','strike','recoil','rest','portrait','environment','hide','dispose'] as const;
const buttons=new Map(ids.map(id=>[id,document.getElementById(id) as HTMLButtonElement]));
const resources:Array<{name:string;bitmap:ImageBitmap;texture:Texture;source:ImageSource;disposed:boolean}>=[];
const failures:string[]=[],listeners:Array<()=>void>=[],journal:Record<string,unknown>[]=[];
const log=(v:Record<string,unknown>)=>{journal.push(v);if(journal.length>256)journal.shift();};
const counters={decodedCreature:0,creatureTextures:0,creatureSources:0,started:0,completed:0,cancelled:0,frames:0,renders:0,meshesDestroyed:0,geometriesDestroyed:0,texturesDestroyed:0,sourcesDestroyed:0,bitmapsClosed:0};
const app=new Application();let initialized=false,disposed=false,raf=0,clip:CivetClip='rest',startMs:number|null=null,elapsed=0,sequence=0;
let currentPose:CivetPose={breath:0,drive:0,tail:0},mode:'portrait'|'environment'='portrait',lastWidth=0,lastCancellation='',creatureBytes:ArrayBuffer;
let water:ReturnType<typeof attachCivetWaterScene>,waterRetirement:ReturnType<ReturnType<typeof attachCivetWaterScene>['snapshot']>|null=null;
let earth:Container,background:Sprite,hero:Actor,earthActor:Actor;
const actors:Actor[]=[];
type Actor={root:Container;mesh:MeshSimple;geometry:MeshSimple['geometry'];buffers:PixiBuffer[];data:CivetMeshData;k:number;sourceX:number;sourceY:number};
type Mutation='none'|'constant-rest'|'rigid-block'|'frozen-tail'|'subpixel'|'held-breath';let motionMutation:Mutation='none';
let nativeBaseline:Uint8ClampedArray|null=null;
let recordArmed=false,recorder:MediaRecorder|null=null,recordStream:MediaStream|null=null,recordingResult:{done:boolean;frames:number;mime:string;dataURL?:string}|null=null;
function beginRecording(){if(!recordArmed)return;recordArmed=false;const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8'].find(x=>MediaRecorder.isTypeSupported(x));assert(mime,'Native WebM recording unavailable');recordStream=app.canvas.captureStream(0);const chunks:BlobPart[]=[];recordingResult={done:false,frames:0,mime:mime!};const result=recordingResult,stream=recordStream;recorder=new MediaRecorder(stream,{mimeType:mime!,videoBitsPerSecond:1800000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{for(const track of stream.getTracks())track.stop();const reader=new FileReader();reader.onload=()=>{result.dataURL=String(reader.result);result.done=true;};reader.readAsDataURL(new Blob(chunks,{type:mime!}));};recorder.start();}
function stopRecording(){if(recorder?.state==='recording')recorder.stop();recorder=null;recordStream=null;}
const visible=()=>{if(disposed||document.hidden||!view.isConnected)return false;for(let n:HTMLElement|null=view;n;n=n.parentElement){const s=getComputedStyle(n);if(n.hidden||n.hasAttribute('inert')||s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}return true;};
const policy=()=>({effectsOn:effects.checked,fullMotion:!reduced.checked,visible:visible()});
function listen(target:EventTarget,event:string,fn:EventListener){target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));}
function inspectAlpha(bitmap: ImageBitmap, expected: AssetManifest) {
  assert(bitmap.width === expected.width && bitmap.height === expected.height, 'Decoded creature dimensions differ from immutable manifest');
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height), context = canvas.getContext('2d')!;
  try {
    context.drawImage(bitmap, 0, 0); const rgba = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    let x0 = bitmap.width, y0 = bitmap.height, x1 = -1, y1 = -1, contactY = -1, zero = 0, solid = 0, partial = 0, border = 0;
    for (let y = 0; y < bitmap.height; y++) for (let x = 0; x < bitmap.width; x++) {
      const a = rgba[(y * bitmap.width + x) * 4 + 3]!;
      if (a === 0) zero++; else if (a < 255) partial++;
      if (a >= 230) { solid++; contactY = y; }
      if (a > 12) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      if (a > 0 && (x === 0 || y === 0 || x === bitmap.width - 1 || y === bitmap.height - 1)) border++;
    }
    assert(zero > bitmap.width * bitmap.height * .1 && solid > 100 && partial > 0 && border === 0, 'Creature must have real transparent margins and antialiased visible ink; opaque/matte/edge-clipped asset refused');
    assert(JSON.stringify({ x0, y0, x1, y1 }) === JSON.stringify(expected.alphaBounds), 'Native alpha>12 bounds changed');
    assert(contactY === expected.contactY, 'Native alpha>=230 contact row changed');
    return { x0, y0, x1, y1, contactY, zero, solid, partial, border };
  } finally { canvas.width = canvas.height = 1; }
}
async function validateHash(bytes: ArrayBuffer, expected: string) { assert(await digest(bytes) === expected, 'Immutable texture SHA-256 mismatch'); }
async function loadTexture(name: string, input: SceneAsset | AssetManifest, creature = false) {
  assert(input.path.startsWith('./study-assets/') && !input.path.includes('..'), 'Only fixed local study assets are admitted');
  const response = await fetch(input.path, { cache: 'no-store' }); assert(response.ok, 'Required local texture unavailable: ' + name);
  const bytes = await response.arrayBuffer(); await validateHash(bytes, input.sha256);
  let bitmap: ImageBitmap | null = await createImageBitmap(new Blob([bytes]));
  try {
    assert(bitmap.width === input.width && bitmap.height === input.height, 'Texture dimensions changed: ' + name);
    if (creature) { inspectAlpha(bitmap, input as AssetManifest); creatureBytes = bytes; counters.decodedCreature++; }
    const source = new ImageSource({ resource: bitmap, scaleMode: 'linear', autoGenerateMipmaps: false, alphaMode: 'premultiply-alpha-on-upload' });
    const texture = new Texture({ source });
    resources.push({ name, bitmap, source, texture, disposed: false }); bitmap = null;
    if (creature) { counters.creatureTextures++; counters.creatureSources++; }
    return texture;
  } finally { bitmap?.close(); }
}
function addActor(texture:Texture,parent:Container):Actor{
 const data=createCivetMesh(genome),mesh=new MeshSimple({texture,vertices:data.vertices,uvs:data.uvs,indices:data.indices});mesh.autoUpdate=true;mesh.eventMode='none';
 const root=new Container();root.eventMode='none';root.addChild(mesh);parent.addChild(root);const b=manifest.alphaBounds,w=b.x1-b.x0+1,h=b.y1-b.y0+1,k=Math.min(396/w,396/h),sourceX=220-(b.x0+w/2)*k,sourceY=220-(b.y0+h/2)*k;
 mesh.scale.set(manifest.width*k,manifest.height*k);mesh.position.set(sourceX,sourceY);const buffers=[...new Set([...mesh.geometry.buffers,mesh.geometry.indexBuffer].filter((v):v is PixiBuffer=>!!v))];const actor={root,mesh,geometry:mesh.geometry,buffers,data,k,sourceX,sourceY};actors.push(actor);return actor;
}
function render(){if(initialized&&!disposed){app.render();counters.renders++;const track=recordStream?.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack|undefined;if(track&&recordingResult){track.requestFrame();recordingResult.frames++;}}}
function pose(value:CivetPose){
 currentPose=value;
 for(const a of actors){applyCivetPose(a.data,motionMutation==='constant-rest'?{breath:0,drive:0,tail:0}:motionMutation==='held-breath'&&clip==='breathe'?{...value,breath:1}:value);
  for(let i=0;i<a.data.vertices.length;i+=2){const x=a.data.rest[i]!,y=a.data.rest[i+1]!;
   if(motionMutation==='rigid-block'){a.data.vertices[i]=x+.018*value.drive;a.data.vertices[i+1]=y-.020*value.breath;}
   if(motionMutation==='frozen-tail'&&x<1/3){a.data.vertices[i]=x;a.data.vertices[i+1]=y;}
   if(motionMutation==='subpixel'){a.data.vertices[i]=x+(a.data.vertices[i]!-x)*.01;a.data.vertices[i+1]=y+(a.data.vertices[i+1]!-y)*.01;}}
  a.mesh.vertices=a.data.vertices;
 }render();
}
function rest(reason:string,completed=false){if(raf)cancelAnimationFrame(raf);raf=0;if(clip!=='rest'){if(completed)counters.completed++;else counters.cancelled++;}clip='rest';startMs=null;elapsed=0;lastCancellation=reason;
 if(!disposed)pose({breath:0,drive:0,tail:0});stopRecording();buttons.get('rest')!.disabled=true;log({event:completed?'settled':'rest',reason,sequence});status.textContent=disposed?'Study disposed.':'Ready · choose a movement';}
function animate(now:number){raf=0;if(!visible()||!effects.checked||reduced.checked){rest('motion policy or visibility changed');return;}if(clip==='rest'||disposed)return;
 startMs??=now;elapsed=now-startMs;counters.frames++;
 if(elapsed>=CIVET_CLIP_MS[clip]){rest('finite movement completed',true);return;}
 pose(sampleCivetPose(clip,elapsed,policy()));raf=requestAnimationFrame(animate);
}
function start(next:Exclude<CivetClip,'rest'>,trusted:boolean){if(!initialized||disposed)return;rest('new movement');log({event:'request',clip:next,trusted,policy:policy()});
 if(!visible()||!effects.checked||reduced.checked){status.textContent='Motion is paused by your preference.';return;}
 nativeBaseline=readPainted().pixels;beginRecording();clip=next;sequence++;counters.started++;buttons.get('rest')!.disabled=false;
 status.textContent=next==='breathe'?'Breathing · two slow breaths':next==='strike'?'Brace → push forward → settle':'React → recover';raf=requestAnimationFrame(animate);
}
function layout(){if(!initialized||disposed)return;const width=Math.max(260,Math.min(1000,view.clientWidth));lastWidth=width;hero.root.visible=mode==='portrait';earth.visible=mode==='environment';
 if(mode==='portrait'){const scale=Math.min(1.25,(width-20)/440);hero.root.scale.set(scale);hero.root.position.set((width-440*scale)/2,8);app.renderer.resize(width,Math.ceil(440*scale+16));}
 else{const scale=(width-2)/960;earth.position.set(1,1);earth.scale.set(scale);app.renderer.resize(width,Math.ceil(430*scale+2));}
 // Layout preserves the active clock/pose; size changes only invalidate its pixel baseline.
 nativeBaseline=null;render();log({event:'layout',width,mode,sequence,clip});
}
function snapshot(){return{ready:initialized&&!disposed,disposed,mode,clip,elapsed,sequence,currentPose,pendingRaf:raf!==0,policy:policy(),durations:CIVET_CLIP_MS,counters:{...counters},lastCancellation,
 sourceIdentityUnchanged:JSON.stringify(genome)===identityBefore&&JSON.stringify(manifest)===recipeBefore,failures:[...failures],journal:[...journal],water:water?.snapshot()??null,waterRetirement,
 actors:actors.map(a=>({restExact:a.data.vertices.every((v,i)=>v===a.data.rest[i]),meshDestroyed:a.mesh.destroyed,geometryDestroyed:a.geometry.buffers===null,buffers:a.buffers.map(b=>({destroyed:b.destroyed})),rootDestroyed:a.root.destroyed})),
 resources:resources.map(r=>({name:r.name,textureDestroyed:r.texture.destroyed,sourceDestroyed:r.source.destroyed,bitmapWidth:r.bitmap.width,bitmapHeight:r.bitmap.height})),earthDestroyed:earth?.destroyed??false,
 canvas:initialized&&!disposed?{width:app.canvas.width,height:app.canvas.height,rect:app.canvas.getBoundingClientRect().toJSON()}:null};}
function encode(pixels:Uint8Array|Uint8ClampedArray,width:number,height:number){const c=document.createElement('canvas');c.width=width;c.height=height;try{c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(pixels),width,height),0,0);return c.toDataURL('image/png');}finally{c.width=c.height=1;}}
function readPainted(){const c=new OffscreenCanvas(app.canvas.width,app.canvas.height);try{const ctx=c.getContext('2d')!;ctx.drawImage(app.canvas,0,0);return{pixels:ctx.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height};}finally{c.width=c.height=1;}}
function pixelStats(pixels:Uint8ClampedArray,width:number,height:number,baseline:Uint8ClampedArray){
 const a=mode==='portrait'?hero:earthActor,parent=mode==='portrait'?a.root:earth,scale=parent.scale.x,dpr=app.renderer.resolution;
 const sourceToScreen=(x:number,y:number)=>({x:(parent.x+(a.sourceX+x*manifest.width*a.k)*scale)*dpr,y:(parent.y+(a.sourceY+y*manifest.height*a.k)*scale)*dpr});
 const regions=[['chest',.43,.17,.64,.60],['head',.76,.19,.97,.46],['tail',.018,.46,.30,.81],['hindLeg',.35,.59,.49,.75],['foreLeg',.55,.57,.72,.75],...manifest.civetPaws.map((p,i)=>['paw'+i,p.x0,p.y0,p.x1,p.y1])] as Array<[string,number,number,number,number]>;
 const rows=regions.map(([name,x0,y0,x1,y1])=>{const p0=sourceToScreen(x0,y0),p1=sourceToScreen(x1,y1);let ink=0,changed=0,exactChanged=0,max=0,alphaChanged=0,weighted=0;
  for(let y=Math.max(0,Math.floor(p0.y));y<Math.min(height,Math.ceil(p1.y));y++)for(let x=Math.max(0,Math.floor(p0.x));x<Math.min(width,Math.ceil(p1.x));x++){const i=(y*width+x)*4;if(baseline[i+3]!>=230)ink++;let delta=0;for(let c=0;c<4;c++)delta=Math.max(delta,Math.abs(pixels[i+c]!-baseline[i+c]!));if(delta>0)exactChanged++;if(delta>8){changed++;weighted+=delta;}if(Math.abs(pixels[i+3]!-baseline[i+3]!)>8)alphaChanged++;max=Math.max(max,delta);}
  const shape=(data:Uint8ClampedArray)=>{let solid=0,sx=0,sy=0,right=-1,topSum=0,columns=0;
   for(let x=Math.max(0,Math.floor(p0.x));x<Math.min(width,Math.ceil(p1.x));x++){let top=-1;for(let y=Math.max(0,Math.floor(p0.y));y<Math.min(height,Math.ceil(p1.y));y++)if(data[(y*width+x)*4+3]!>=230){solid++;sx+=x;sy+=y;right=Math.max(right,x);if(top<0)top=y;}if(top>=0){topSum+=top;columns++;}}
   return{solid,centroid:solid?{x:sx/solid/dpr,y:sy/solid/dpr}:null,right:right/dpr,top:columns?topSum/columns/dpr:null,columns};};
  return{name,ink,changed,exactChanged,max,alphaChanged,weighted,beforeShape:shape(baseline),afterShape:shape(pixels),screenCSS:{x:p0.x/dpr,y:p0.y/dpr,width:(p1.x-p0.x)/dpr,height:(p1.y-p0.y)/dpr}};});
 return{regions:rows,dpr};
}
function nativeFrame(){assert(initialized&&!disposed,'Inactive study');const capture=readPainted();const nonempty=capture.pixels.some((v,i)=>i%4===3&&v>230);assert(nonempty,'Actual painted canvas is empty');
 const metrics=nativeBaseline&&nativeBaseline.length===capture.pixels.length?pixelStats(capture.pixels,capture.width,capture.height,nativeBaseline):null;
 return{state:snapshot(),captureMethod:'drawImage current preserved native canvas; no render/extract/pose',metrics,png:encode(capture.pixels,capture.width,capture.height),width:capture.width,height:capture.height};}
function captureEarth(){const prior={visible:earth.visible,x:earth.x,y:earth.y,sx:earth.scale.x,sy:earth.scale.y};earth.visible=true;earth.position.set(0,0);earth.scale.set(1);try{return app.renderer.extract.pixels({target:earth,frame:new Rectangle(0,0,960,430),resolution:1,antialias:true});}finally{earth.visible=prior.visible;earth.position.set(prior.x,prior.y);earth.scale.set(prior.sx,prior.sy);}}
function sceneProbe(testMode='none'){assert(initialized&&!disposed,'Inactive study');rest('scene comparison');const prior=grounding.checked;
 try{water.setTestMode('none');water.setEnabled(false);const before=captureEarth();earthActor.root.visible=false;const backgroundOnly=captureEarth();earthActor.root.visible=true;background.visible=false;const ink=captureEarth();background.visible=true;
 water.setEnabled(true);water.setTestMode('noShadows');const noShadows=captureEarth();water.setTestMode('noOcclusion');const noOcclusion=captureEarth();water.setTestMode('noRipples');const noRipples=captureEarth();water.setTestMode(testMode as Parameters<typeof water.setTestMode>[0]);const after=captureEarth();return{testMode,owner:water.snapshot(),beforePng:encode(before.pixels,960,430),afterPng:encode(after.pixels,960,430),backgroundPng:encode(backgroundOnly.pixels,960,430),inkPng:encode(ink.pixels,960,430),noOcclusionPng:encode(noOcclusion.pixels,960,430),noRipplesPng:encode(noRipples.pixels,960,430),noShadowsPng:encode(noShadows.pixels,960,430)};}
 finally{earthActor.root.visible=true;background.visible=true;water.setTestMode('none');water.setEnabled(prior);render();}}
function retireWater(){rest('retire water');water.setEnabled(false);const before=captureEarth();waterRetirement=water.dispose();const after=captureEarth();let changed=0;for(let i=0;i<before.pixels.length;i++)if(before.pixels[i]!==after.pixels[i])changed++;const priorMode=mode;mode='portrait';layout();const sibling=readPainted();mode=priorMode;layout();let siblingInk=0;for(let i=3;i<sibling.pixels.length;i+=4)if(sibling.pixels[i]!>=230)siblingInk++;return{state:waterRetirement,restoredSceneChannelChanges:changed,siblingTextureAlive:!hero.mesh.texture.destroyed,siblingInk,siblingPng:encode(sibling.pixels,sibling.width,sibling.height),scenePng:encode(after.pixels,960,430)};}
function dispose(){if(disposed)return snapshot();rest('dispose');waterRetirement??=water?.dispose();disposed=true;observer.disconnect();resizeObserver.disconnect();for(const off of listeners.splice(0))off();
 for(const a of actors){a.mesh.destroy({texture:false,textureSource:false});counters.meshesDestroyed++;a.geometry.destroy(true);counters.geometriesDestroyed++;a.root.destroy({children:false});}earth?.destroy({children:true,texture:false,textureSource:false});
 for(const r of resources){r.texture.destroy(false);counters.texturesDestroyed++;r.source.destroy();counters.sourcesDestroyed++;r.bitmap.close();counters.bitmapsClosed++;r.disposed=true;}
 if(initialized)app.destroy({removeView:true},{children:false,texture:false,textureSource:false});for(const button of buttons.values())button.disabled=true;effects.disabled=reduced.disabled=grounding.disabled=true;return snapshot();}
const observer=new MutationObserver(()=>{if(initialized&&!disposed&&!visible())rest('hidden ancestor');});
const resizeObserver=new ResizeObserver(()=>{if(initialized&&!disposed&&visible()&&Math.abs(view.clientWidth-lastWidth)>.5)layout();});
const ready=(async()=>{await app.init({width:600,height:480,backgroundAlpha:0,antialias:true,preference:'webgl',preserveDrawingBuffer:true,resolution:Math.min(devicePixelRatio,2),autoDensity:true,autoStart:false,sharedTicker:false});app.stop();initialized=true;view.append(app.canvas);
 const texture=await loadTexture('creature',manifest,true),bg=await loadTexture('background',sceneManifest.background);hero=addActor(texture,app.stage);earth=new Container();earth.eventMode='none';app.stage.addChild(earth);background=new Sprite(bg);background.eventMode='none';earth.addChild(background);earthActor=addActor(texture,earth);
 const bounds=manifest.alphaBounds,w=bounds.x1-bounds.x0+1,k=.15*960/w;earthActor.k=k;earthActor.sourceX=.72*960-(bounds.x0+w/2)*k;earthActor.sourceY=.77*430-(manifest.contactY+1)*k;earthActor.mesh.scale.set(manifest.width*k,manifest.height*k);earthActor.mesh.position.set(earthActor.sourceX,earthActor.sourceY);
 water=attachCivetWaterScene({earth,background,civetActor:earthActor.root,recipe:{schema:'cf-civet-water-scene/v1',worldKey:EARTH_RESIDENT_LAYER_PLAN_V1.worldKey,plan:EARTH_RESIDENT_LAYER_PLAN_V1,civetAsset:{width:manifest.width,height:manifest.height,alphaBounds:manifest.alphaBounds,contactY:manifest.contactY,sha256:manifest.sha256},civetPaws:manifest.civetPaws},enabled:true,allowTestControls:true});
 for(const next of ['breathe','strike','recoil'] as const)listen(buttons.get(next)!,'click',event=>start(next,event.isTrusted));
 listen(buttons.get('rest')!,'click',event=>{log({event:'native-stop',trusted:event.isTrusted});rest('Stop/reset selected');});
 for(const next of ['portrait','environment'] as const)listen(buttons.get(next)!,'click',event=>{mode=next;buttons.get('portrait')!.setAttribute('aria-pressed',String(next==='portrait'));buttons.get('environment')!.setAttribute('aria-pressed',String(next==='environment'));layout();log({event:'view-control',mode,trusted:event.isTrusted});});
 listen(grounding,'change',event=>{water.setEnabled(grounding.checked);render();log({event:'water-control',trusted:event.isTrusted,enabled:grounding.checked});});
 for(const input of [effects,reduced])listen(input,'change',event=>{log({event:'policy-control',id:input.id,trusted:event.isTrusted});rest('motion preference changed');});
 listen(buttons.get('hide')!,'click',event=>{view.hidden=!view.hidden;buttons.get('hide')!.textContent=view.hidden?'Show study':'Hide study';if(view.hidden)rest('study hidden');else layout();log({event:'hide-control',hidden:view.hidden,trusted:event.isTrusted});});
 listen(buttons.get('dispose')!,'click',()=>dispose());listen(document,'visibilitychange',()=>{if(document.hidden)rest('document hidden');});listen(window,'pagehide',()=>dispose());
 for(let n:HTMLElement|null=view;n;n=n.parentElement)observer.observe(n,{attributes:true,attributeFilter:['hidden','inert','style','class']});resizeObserver.observe(view);for(const [id,button]of buttons)button.disabled=id==='rest';
 document.getElementById('identity')!.textContent=JSON.stringify({rig:CIVET_RIG_VERSION,genome,texture:manifest.sha256,scene:{x:.72,groundY:.77,width:.15},reviewResidents:['Civet'],gameRosterUnchanged:true},null,2);layout();return snapshot();
})().catch(error=>{failures.push(String(error?.stack||error));status.textContent='Study refused: '+String(error);try{dispose();}catch(e){failures.push(String(e));}throw error;});
(window as unknown as Record<string,unknown>).__CF_WATER_STUDY__=Object.freeze({ready,snapshot,nativeFrame,sceneProbe,retireWater,dispose,armRecording(){assert(clip==='rest'&&!recorder,'Recorder must start from rest');recordArmed=true;},recording(){return recordingResult;},setMotionMutation(value:Mutation){assert(['none','constant-rest','rigid-block','frozen-tail','subpixel','held-breath'].includes(value),'Unknown motion control');assert(clip==='rest','Change control only at rest');motionMutation=value;nativeBaseline=null;return snapshot();}});
