import {Application,Texture,Sprite,Container,Mesh,MeshGeometry,Text,RenderTexture,Graphics} from 'pixi.js';
import {TEMPLATE,checkGeometry,sealRecord,admitRecord,hashBytes,createRig,sampleClip,applyPose,inspectShape,stableJSON} from '../creature-animation/quadruped-template.mjs';
import {keyAndDespill} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
import {installSpeciesCanvasFactory} from '../../packages/art/src/speciescanvas.ts';
import {resolveProceduralCanvas} from '../../packages/art/src/speciesoverrides.ts';
import {speciesVisualKey} from '../../packages/art/src/speciesidentity.ts';
import {initAudio,prepareStingAudioForGesture,playWhoosh,playSurveyPing} from '../../packages/audio/src/index.ts';
import {sfxOut} from '../../packages/audio/src/stings.verbatim.js';
const required=(v,m)=>{if(!v)throw Error(m);};
const json=p=>fetch(p).then(r=>{required(r.ok,p);return r.json();});
const bytes=p=>fetch(p).then(r=>{required(r.ok,p);return r.arrayBuffer();});
const canvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
const asPNG=c=>new Promise(resolve=>c.toBlob(async b=>resolve(await b.arrayBuffer()),'image/png'));
const b64=buffer=>{let str='';const a=new Uint8Array(buffer);for(let i=0;i<a.length;i+=8192)str+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(str);};
const imageCanvas=async b=>{const bitmap=await createImageBitmap(new Blob([b]));const c=canvas(bitmap.width,bitmap.height);c.getContext('2d').drawImage(bitmap,0,0);bitmap.close();return c;};
const app=new Application();await app.init({width:1536,height:740,resolution:1,background:'#141d22',antialias:false,preference:'webgl',autoStart:false});document.body.append(app.canvas);
initAudio({sndOn:()=>true,sfxVol:()=>.35});
const state={status:'PREPARING',template:TEMPLATE,controls:[],specimens:[],captures:[],errors:[],background:'Retained unoccupied Earth biome plate from accepted E recipe; E shown intact alongside',audio:'Existing whoosh and survey-ping cues reused for isolated choreography; not combat outcome qualification'};window.cfQuad={state};
const texture=c=>{const t=Texture.from(c);t.source.scaleMode='nearest';return t;};
const controls=async(record,b,alpha)=>{
  required(await admitRecord(record,b,alpha),'positive admission');
  const rejects=async(label,f)=>{let failed=false;try{await f();}catch{failed=true;}required(failed,label);state.controls.push(label);};
  const bad=structuredClone(record);bad.landmarks.head[0]=.02;await rejects('corrupted landmark recipe',()=>admitRecord(bad,b,alpha));
  await rejects('swapped cutout hash',()=>admitRecord(record,new Uint8Array([0]),alpha));
  const serpent=structuredClone(record);serpent.kind='serpent';await rejects('serpent refused by quadruped bounds',()=>checkGeometry(serpent,alpha));
  const hole=alpha.slice();const [hx,hy]=record.landmarks.head,{width:w,height:h}=record.geometry;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(Math.hypot(x-hx*w,y-hy*h)<w*.05)hole[y*w+x]=0;
  await rejects('correctly hashed landmarks outside actual painted alpha',()=>checkGeometry(record,hole));
};
async function bind(id,record,b,c,alpha){
  await controls(record,b,alpha);const rig=createRig(record,alpha),tx=texture(c);
  const group=new Container(),geometries=[];
  for(let layer=0;layer<2;layer++){const geometry=new MeshGeometry({positions:rig.vertices,uvs:rig.uvs,indices:rig.layerIndices[layer]});geometries.push(geometry);group.addChild(new Mesh({geometry,texture:tx}));}
  const renderTexture=RenderTexture.create({width:c.width,height:c.height,resolution:1});
  app.renderer.render({container:new Sprite(tx),target:renderTexture,clear:true});const oracle=app.renderer.extract.pixels({target:renderTexture}).pixels;
  app.renderer.render({container:group,target:renderTexture,clear:true});const actual=app.renderer.extract.pixels({target:renderTexture}).pixels;
  let different=0;for(let i=0;i<oracle.length;i++)if(oracle[i]!==actual[i])different++;
  renderTexture.destroy(true);
  const extremes=[];for(const clip of ['idle','attack','hit'])for(let i=0;i<=16;i++){applyPose(rig,sampleClip(clip,TEMPLATE.clips[clip]*i/16));extremes.push({clip,phase:i/16,...inspectShape(rig)});}
  const holdsShape=extremes.every(x=>x.holdsShape),fallback=!holdsShape||different!==0;
  const support=[];for(const clip of ['idle','hit'])for(const t of [.25,.5,.75]){applyPose(rig,sampleClip(clip,TEMPLATE.clips[clip]*t));let max=0,n=0;for(let i=0;i<rig.locks.length;i++)if(rig.locks[i]===1){n++;max=Math.max(max,Math.hypot(rig.vertices[i*2]-rig.rest[i*2],rig.vertices[i*2+1]-rig.rest[i*2+1]));}support.push({clip,t,vertices:n,maxDisplacement:max});}
  applyPose(rig,sampleClip('rest',0));for(const g of geometries)g.getBuffer('aPosition').update();
  // Fail visibly to the explicitly approved whole-portrait fallback; never label
  // a flipped triangle or changed rest as a successful deformable-mesh proof.
  const portrait=new Sprite(tx);portrait.visible=fallback;group.visible=!fallback;
  const holder=new Container();holder.addChild(group,portrait);
  const row={id,record,triangles:rig.indices.length/3,vertices:rig.rest.length/2,alphaLeaves:rig.leaves,
    restDifferentChannels:different,extremes,support,mode:fallback?'WHOLE-PORTRAIT FALLBACK':'DEFORMABLE MESH',ikRefusals:rig.ikRefusals,
    cutoutPNG:b64(await asPNG(c)),depthTriangleCounts:rig.layerIndices.map(x=>x.length/3)};
  state.specimens.push(row);return {id,record,c,rig,holder,group,portrait,geometries,row};
}
const subjects=[];
try{
  for(const id of ['civet','fox']){const record=await json(id+'.landmarks.json'),b=await bytes(id+'.png'),c=await imageCanvas(b),ctx=c.getContext('2d'),raw=ctx.getImageData(0,0,c.width,c.height),keyed=keyAndDespill(raw.data,c.width,c.height);ctx.putImageData(new ImageData(keyed.rgba,c.width,c.height),0,0);subjects.push(await bind(id,record,b,c,keyed.alpha));}
  installSpeciesCanvasFactory((w,h)=>new OffscreenCanvas(w,h));const genome=await json('procedural-genome.json');let drawn,ink;
  const observedCanvas=resolveProceduralCanvas(genome,(geometry,source)=>{drawn=geometry;ink=source;});required(drawn&&ink,'winning procedural owner emitted geometry');
  const plainCanvas=resolveProceduralCanvas(genome),observedPixels=observedCanvas.getContext('2d').getImageData(0,0,440,440).data,plainPixels=plainCanvas.getContext('2d').getImageData(0,0,440,440).data;
  required(observedPixels.every((v,i)=>v===plainPixels[i]),'observation must not change winning painter pixels');state.controls.push('draw-time emission leaves normal procedural canvas pixel-identical');
  const c=canvas(ink.width,ink.height);c.getContext('2d').drawImage(ink,0,0);const b=await asPNG(c),rgba=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  const landmarks=Object.fromEntries(Object.entries(drawn.landmarks).map(([n,p])=>[n,[(p[0]*drawn.width+drawn.width*.5)/ink.width,(p[1]*drawn.width+drawn.width*.5)/ink.height]]));
  const record=await sealRecord({kind:drawn.kind,identity:{speciesVisualKey:speciesVisualKey(genome),seed:genome.seed,ownerId:'resolveProceduralCanvas:quad/'+drawn.ownerId,earthName:null},template:{id:'quadruped',version:1},geometry:{cutoutAssetHash:await hashBytes(b),width:c.width,height:c.height,groundLineY:(drawn.groundLineY+.5)/2,depthLayers:[{id:'far',order:0},{id:'near',order:1}]},landmarks,materials:drawn.materials,clipSetId:TEMPLATE.clipSetId});
  subjects.push(await bind('procedural',record,b,c,Uint8Array.from({length:c.width*c.height},(_,i)=>rgba[i*4+3])));
  const plate=texture(await imageCanvas(await bytes('plate.png'))),accepted=texture(await imageCanvas(await bytes('E.png'))),plat=await imageCanvas(await bytes('platypus.png'));
  const pc=plat.getContext('2d'),pr=pc.getImageData(0,0,plat.width,plat.height),pk=keyAndDespill(pr.data,plat.width,plat.height);pc.putImageData(new ImageData(pk.rgba,plat.width,plat.height),0,0);
  const opponent=new Sprite(texture(plat)),scene=new Container();scene.position.set(0,64);app.stage.addChild(scene);
  const backdrop=new Sprite(plate);backdrop.width=768;backdrop.height=576;scene.addChild(backdrop);
  opponent.width=300;opponent.height=300;opponent.position.set(425,259);scene.addChild(opponent);
  for(const s of subjects){s.holder.scale.set(485/s.c.height);s.holder.position.set(12,90);s.holder.visible=false;scene.addChild(s.holder);}
  const comparison=new Sprite(accepted);comparison.position.set(780,130);comparison.width=748;comparison.height=420.75;app.stage.addChild(comparison);
  const label=(text,x,y,size=20)=>{const node=new Text({text,style:{fontFamily:'system-ui',fontSize:size,fill:'#eee2c9',wordWrap:true,wordWrapWidth:740}});node.position.set(x,y);app.stage.addChild(node);return node;};
  const title=label('',18,20,24);label('Accepted rain E — retained original',796,82,22);
  label('Battle backdrop: retained biome plate from the E recipe',16,658,17);label('Same quadruped template and curves • authored pixels retained',796,575,17);
  const caption=label('',796,618,16),banner=label('',110,92,28),number=label('',609,330,35);
  let selected=subjects[0];selected.holder.visible=true;
  function frame(ms){
    const s=selected;let clip,time;if(ms<3000){clip='idle';time=ms;}else if(ms<5200){clip='attack';time=ms-3000;}else if(ms<6500){clip='hit';time=ms-5200;}else{clip='idle';time=Math.min(3000,ms-6500);}
    const pose=sampleClip(clip,time),begin=performance.now();
    if(s.row.mode==='DEFORMABLE MESH'){applyPose(s.rig,pose);for(const g of s.geometries)g.getBuffer('aPosition').update();}
    else{s.portrait.x=s.rig.bodyLength*.36*pose.drive;s.portrait.y=-s.rig.bodyLength*.09*pose.flight;s.portrait.scale.y=1-.008*pose.compress;}
    const updateMs=performance.now()-begin,phase=ms/10000;
    const push=ms>=3000&&ms<5600?Math.sin(Math.PI*(ms-3000)/2600)**2:0;scene.scale.set(1+push*.025);scene.x=-push*10;
    const impact=ms>=4230&&ms<4390;opponent.tint=impact?0xffffff:0xffffff;opponent.alpha=impact?.60:1;
    const hit=ms>=4230&&ms<4900?(1-(ms-4230)/670):0;opponent.x=425+hit*24;opponent.y=259+(impact?Math.sin(ms*.12)*3:0);
    banner.text=ms>=3000&&ms<4450?'POUNCE':'';number.text=ms>=4230&&ms<5100?'−12':'';number.y=330-Math.max(0,ms-4230)*.045;
    title.text=s.id.toUpperCase()+' · '+s.row.mode;caption.text=clip.toUpperCase()+' • '+(ms/1000).toFixed(1)+' / 10.0 s\n'+(s.row.mode==='DEFORMABLE MESH'?'Shared bone curves; immutable authored support offsets.':'Mesh failed mechanical shape check; whole-portrait staging shown.');
    app.renderer.render(app.stage);return {updateMs,clip,phase};
  }
  const select=id=>{selected=subjects.find(x=>x.id===id);required(selected,id);for(const s of subjects)s.holder.visible=s===selected;frame(0);};
  const capture=async id=>{
    select(id);state.capturePhase='audio-resume';prepareStingAudioForGesture();const audioContext=window.ac?.();if(audioContext)await Promise.race([audioContext.resume(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Audio resume deadline')),5000))]);
    const destination=audioContext?.createMediaStreamDestination();let silentClock;
    if(destination){sfxOut(audioContext).connect(destination);silentClock=audioContext.createBufferSource();silentClock.buffer=audioContext.createBuffer(1,128,audioContext.sampleRate);silentClock.loop=true;silentClock.connect(destination);silentClock.start();}
    // Request every presentation frame explicitly, including an unchanged
    // fallback idle. A silent audio source prevents recorder track startup from
    // waiting for the first cue and discarding the leading idle interval.
    const stream=app.canvas.captureStream(0),videoTrack=stream.getVideoTracks()[0];if(destination)for(const track of destination.stream.getAudioTracks())stream.addTrack(track);
    const chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:7000000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const stopped=new Promise(resolve=>recorder.onstop=resolve),started=new Promise(resolve=>recorder.onstart=resolve);state.capturePhase='recorder-start';recorder.start();videoTrack.requestFrame();await Promise.race([started,new Promise((_,reject)=>setTimeout(()=>reject(Error('Recorder start deadline')),5000))]);state.capturePhase='recording';
    const updates=[],deltas=[],events=[];let previous,start,whoosh=false,ping=false;
    await new Promise(resolve=>{const tick=now=>{if(start===undefined)start=now;const ms=Math.min(10000,now-start);if(previous!==undefined)deltas.push(now-previous);previous=now;
      updates.push(frame(ms).updateMs);videoTrack.requestFrame();if(ms>=3000&&!whoosh){playWhoosh();whoosh=true;events.push({cue:'existing whoosh',atMs:ms});}if(ms>=4230&&!ping){playSurveyPing();ping=true;events.push({cue:'existing ping',atMs:ms});}
      if(ms>=10000)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);});
    await new Promise(resolve=>setTimeout(resolve,100));recorder.stop();await stopped;silentClock?.stop();silentClock?.disconnect();stream.getTracks().forEach(t=>t.stop());if(destination)sfxOut(audioContext).disconnect(destination);
    const blob=new Blob(chunks,{type:recorder.mimeType}),b=await blob.arrayBuffer(),sorted=updates.slice().sort((a,b)=>a-b),sortedFrames=deltas.slice().sort((a,b)=>a-b);
    const result={id,mode:selected.row.mode,durationMs:10000,frames:updates.length,fps:deltas.length/(deltas.reduce((a,b)=>a+b,0)/1000),updateMeanMs:updates.reduce((a,b)=>a+b,0)/updates.length,updateP95Ms:sorted[Math.floor(sorted.length*.95)],updateMaxMs:Math.max(...updates),frameP95Ms:sortedFrames[Math.floor(sortedFrames.length*.95)],events,mimeType:blob.type,bytes:b.byteLength,sha256:await hashBytes(b),video:b64(b)};
    state.captures.push({...result,video:undefined});return result;
  };
  Object.assign(window.cfQuad,{select,frame,capture,report:()=>state});document.querySelector('#start').onclick=()=>{window.cfQuad.capturePromise=capture(selected.id);window.cfQuad.capturePromise.catch(error=>{state.capturePhase='FAIL: '+String(error);});};
  frame(0);state.status='READY';document.querySelector('#state').textContent='Ready — Civet, fox, procedural quadruped';
}catch(error){state.status='FAIL';state.errors.push(String(error.stack??error));document.querySelector('#state').textContent=String(error);}
