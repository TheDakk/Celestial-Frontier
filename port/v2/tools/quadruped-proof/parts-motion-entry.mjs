import {Application,Container,Texture,Sprite,Text,Graphics,Particle,ParticleContainer,RenderTexture} from 'pixi.js';
import {loadCreatureRigV1} from '../../apps/game/src/creature-rig.ts';
import {createQuadrupedContactSolver,poseMatrices} from '../../apps/game/src/creature-rig-contact.ts';
import {transformPoint} from '../creature-animation/kinematics.ts';
import {compileBodyCard,createGsapPlayer,buildTimeline} from 'cf-proof/motion/index.ts';
import {buildTurnPlan,sampleTurn} from 'cf-proof/battle2/choreography.ts';
import {parseEffectSequenceAnchors} from 'cf-proof/effects/anchors.ts';
import {EffectSequencePlayer,createPixiEffectHost} from 'cf-proof/effects/pixi-adapter.ts';
import {EMITTER_PRESETS} from 'cf-proof/effects/emitter.ts';
import {keyAndDespill} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
import {initAudio,prepareStingAudioForGesture,playWhoosh,playSurveyPing} from '../../packages/audio/src/index.ts';
import {sfxOut} from '../../packages/audio/src/stings.verbatim.js';
import {primeRecorder} from './capture-contract.mjs';
const get=n=>fetch(n).then(r=>{if(!r.ok)throw Error(n);return r;});
const json=n=>get(n).then(r=>r.json()),bytes=n=>get(n).then(r=>r.arrayBuffer());
const image=async n=>{const b=await bytes(n),bmp=await createImageBitmap(new Blob([b])),c=new OffscreenCanvas(bmp.width,bmp.height);c.getContext('2d').drawImage(bmp,0,0);return {bytes:new Uint8Array(b),canvas:c,rgba:c.getContext('2d').getImageData(0,0,c.width,c.height).data};};
const tex=c=>Texture.from(c),b64=b=>{const a=new Uint8Array(b);let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(s);};
const proofMode=new URLSearchParams(location.search).get('mode'),fallback=proofMode==='portrait-fallback',repairGatesOnly=proofMode==='repair-gates'||proofMode==='band-gates';
const W=896,H=504,G=.78*H,BASE=72,state={status:'RUNNING',specimens:[],errors:[],captures:[],scope:'C2 parts rig study; existing cue placeholders, no C3 source acceptance'};window.cfPartsMotion={state};
const app=new Application();await app.init({width:1536,height:740,resolution:1,background:'#141d22',antialias:false,preference:'webgl',autoStart:false});document.body.append(app.canvas);
const scene=new Container();scene.y=BASE;app.stage.addChild(scene);
const label=(text,x,y,size=18)=>{const t=new Text({text,style:{fontFamily:'system-ui',fontSize:size,fill:'#eee2c9',wordWrap:true,wordWrapWidth:600}});t.position.set(x,y);app.stage.addChild(t);return t;};
const title=label('',16,16,23),caption=label('',16,610),comparisonTitle=label('Accepted rain E — retained painting',920,92,20);
const poseCache=new WeakMap();
function gsapPose(clip,ms){if(clip.source!=='timeline')return {};let p=poseCache.get(clip);if(!p){const pose={};p={pose,player:createGsapPlayer(clip.timeline,{setJoint:(n,rotation,dx,dy)=>{pose[n]={rotation,dx,dy};}},{now:()=>0})};poseCache.set(clip,p);}p.player.seek(ms);return p.pose;}
function add(a,b){const out={};for(const source of[a,b])for(const[n,v]of Object.entries(source)){const old=out[n]??{rotation:0,dx:0,dy:0};out[n]={rotation:old.rotation+v.rotation,dx:old.dx+(v.dx??0),dy:old.dy+(v.dy??0)};}return out;}
function motionPose(plan,ms,target=false){const b=plan.beats,c=plan.clips,ic=ms<b.impactAt?ms:ms<b.hitstopEnd?b.impactAt:ms-(b.hitstopEnd-b.impactAt);if(target){let pose=gsapPose(c.target.idle,ic);if(c.target.reaction&&ms>=b.reactionStart)pose=add(pose,gsapPose(c.target.reaction,ms-b.reactionStart));return pose;}
 let pose=gsapPose(c.attacker.idle,ic);if(ms>=b.commandEnd&&ms<b.actionStart)pose=add(pose,gsapPose(c.attacker.approach,(ms-b.commandEnd)/(b.actionStart-b.commandEnd)*c.attacker.approach.timeline.durationMs));else if(ms>=b.actionStart&&ms<b.actionEnd)pose=add(pose,gsapPose(c.attacker.action,ic-b.actionStart));else if(ms>=b.actionEnd&&ms<b.returnEnd)pose=add(pose,gsapPose(c.attacker.approach,(ms-b.actionEnd)/(b.returnEnd-b.actionEnd)*c.attacker.approach.timeline.durationMs));return pose;}
const bounds=(rgba,w,h)=>{let x0=w,y0=h,x1=-1,y1=-1;for(let i=0;i<w*h;i++)if(rgba[i*4+3]){const x=i%w,y=Math.floor(i/w);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}return{x:x0/w,y:y0/h,width:(x1-x0+1)/w,height:(y1-y0+1)/h};};
try{
 const arena=await json('arena.json'),parsed=parseEffectSequenceAnchors(await json('anchors.json')),genome=await json('genome.json');if(!parsed.ok)throw Error('Effect anchors: '+parsed.reason);const anchors=parsed.anchors;
 const plates=[];for(const name of ['far','mid']){const s=new Sprite(tex((await image(name+'.png')).canvas));s.width=W;s.height=H;scene.addChild(s);plates.push(s);}
 const subjects=[];for(const id of ['civet','fox','procedural']){const record=await json(id+'.record.json'),binding=await json(id+'.binding.json'),master=new Uint8Array(await bytes(id+'.master.png')),paint=await image(id+'.keyed.png'),atlas=new Uint8Array(await bytes(id+'.atlas.png'));
 const alpha=Uint8Array.from({length:paint.canvas.width*paint.canvas.height},(_,i)=>paint.rgba[i*4+3]),rig=await loadCreatureRigV1(record,binding,master,alpha,atlas),card=compileBodyCard(record,id==='procedural'?genome:undefined),box=bounds(paint.rgba,paint.canvas.width,paint.canvas.height),scale=H*.42/box.height,holder=new Container();holder.addChild(rig.root);rig.root.scale.set(scale);rig.root.position.set(-record.landmarks.root[0]*scale,-record.geometry.groundLineY*scale);holder.position.set(W/3,G);scene.addChild(holder);
 const portrait=new Sprite(tex(paint.canvas));portrait.width=1;portrait.height=1;rig.root.parent.addChild(portrait);portrait.scale.set(scale/paint.canvas.width);portrait.position.copyFrom(rig.root.position);portrait.visible=fallback;rig.root.visible=!fallback;
 const row={id,parts:rig.parts.length,recordRecipeHash:record.recipeHash,card,mode:fallback?'WHOLE-PORTRAIT FALLBACK — parts shape gate failed':'PARTS RIG — motion review',maxContactErrorPx:0,maxUnconstrainedContactErrorPx:0,contactSamples:0,maxCompression:0};state.specimens.push(row);subjects.push({id,record,binding,master,alpha,paint,rig,portrait,holder,card,scale,box,solver:createQuadrupedContactSolver(record),row});}
 const pl=await image('platypus.png'),keyed=keyAndDespill(pl.rgba,pl.canvas.width,pl.canvas.height);pl.canvas.getContext('2d').putImageData(new ImageData(keyed.rgba,pl.canvas.width,pl.canvas.height),0,0);const pb=bounds(keyed.rgba,pl.canvas.width,pl.canvas.height),opponent=new Sprite(tex(pl.canvas));opponent.anchor.set(.5,pb.y+pb.height);const ps=H*.252/(pb.height*pl.canvas.height);opponent.scale.set(-ps,ps);opponent.position.set(W*2/3,G);scene.addChild(opponent);
 const fxLayer=new Container();scene.addChild(fxLayer);const near=new Sprite(tex((await image('near.png')).canvas));near.width=W;near.height=H;scene.addChild(near);
 const effectTextures=[];for(const n of ['launch','travel','impact'])effectTextures.push(tex((await image(n+'.png')).canvas));
 const particleCanvas=new OffscreenCanvas(8,8),pc=particleCanvas.getContext('2d');pc.fillStyle='#8a6a42';pc.beginPath();pc.ellipse(4,4,3,1.5,-.5,0,Math.PI*2);pc.fill();const particleTexture=tex(particleCanvas);
 const flash=new Graphics().rect(0,0,W,H).fill(0xffffff);flash.alpha=0;scene.addChild(flash);const bar=new Graphics();scene.addChild(bar);const banner=label('',210,BASE+35,25),number=label('',630,BASE+200,28);
 const comparison=new Sprite(tex((await image('E.png')).canvas));comparison.position.set(920,130);comparison.width=600;comparison.height=337.5;app.stage.addChild(comparison);label((fallback?'FALLBACK: whole painted portrait\nNo articulated ears, tail or jaw\n':'Same template and Motion Kit curves\nNo per-creature clip edits\n')+'C3 pending; existing whoosh/ping cues',920,500);
 let selected,plans,effectPlayers=[],now=0,lastTime=0;
 const makePlan=(s,reverse)=>buildTurnPlan({seed:arena.seed,attacker:{side:reverse?'right':'left',mass:reverse?1:s.card.massClass.multiplier,card:reverse?null:s.card,seed:s.record.identity.seed,label:reverse?'Platypus':s.id},target:{side:reverse?'left':'right',mass:reverse?s.card.massClass.multiplier:1,card:reverse?s.card:null,seed:s.record.identity.seed,label:reverse?s.id:'Platypus'},delivery:'melee',theme:'wild',outcome:'hit',damage:12,effect:reverse?null:anchors,arena:{groundLineY:.78,stands:{left:{x:1/3,y:.78},right:{x:2/3,y:.78}},halfWidths:{left:s.box.width*s.scale/W/2,right:pb.width*pl.canvas.width*ps/W/2}},readyMs:1200,commandMs:260,idleTailMs:800});
 function clearEffects(){for(const p of effectPlayers)p.dispose();effectPlayers=[];fxLayer.removeChildren();}
 function resetEffects(){clearEffects();const plan=plans[0];if(plan.effect){const player=new EffectSequencePlayer({host:createPixiEffectHost({Sprite,Particle,ParticleContainer}),schedule:plan.effect.schedule,phaseTextures:effectTextures,particleTexture,particleTint:0x8a6a42,emitters:EMITTER_PRESETS,seed:arena.seed,arena:{width:W,height:H},clock:()=>now,startAtMs:plan.effect.startMs});effectPlayers.push(player);fxLayer.addChild(...player.sprites,player.particles);}}
 function select(id){selected=subjects.find(s=>s.id===id);for(const s of subjects)s.holder.visible=s===selected;plans=[makePlan(selected,false),makePlan(selected,true)];now=0;lastTime=0;resetEffects();return plans;}
 function contactError(s,pose){const m=poseMatrices(s.record,pose);let error=0;for(const id of ['hindFar','foreFar','hindNear','foreNear']){const p=s.record.landmarks[id+'Paw'],q=transformPoint(m[id+'Paw'],{x:p[0],y:p[1]});error=Math.max(error,Math.hypot(q.x-p[0],q.y-p[1])*s.scale);}return error;}
 function frame(ms){const begin=performance.now(),reverse=ms>=5000,t=reverse?ms-5000:ms,plan=plans[reverse?1:0],sample=sampleTurn(plan,t),s=selected;now=ms;if(ms<lastTime)resetEffects();lastTime=ms;
 const pose=motionPose(plan,t,reverse),planted=reverse||t<plan.beats.commandEnd||t>=plan.beats.returnEnd;
 let resolved;try{resolved=fallback?{pose,compression:0}:s.solver.resolve(pose,planted);}catch(error){throw Error(s.id+' at '+ms+'ms ('+sample.phase+'): '+error.message,{cause:error});}
 if(fallback){const compression=Math.max(-.04,Math.min(.08,pose.root?.dy??0)),sy=1-compression;s.portrait.scale.set(s.scale/s.portrait.texture.width/sy,s.scale/s.portrait.texture.height*sy);s.portrait.position.set(-s.record.landmarks.root[0]*s.scale/sy,-s.record.geometry.groundLineY*s.scale*sy+(planted?0:(pose.root?.dy??0)*s.scale));}else s.rig.applyPose(resolved.pose);
 if(planted&&!fallback){const e=contactError(s,resolved.pose);s.row.maxContactErrorPx=Math.max(s.row.maxContactErrorPx,e);s.row.maxUnconstrainedContactErrorPx=Math.max(s.row.maxUnconstrainedContactErrorPx,contactError(s,pose));s.row.maxCompression=Math.max(s.row.maxCompression,resolved.compression);s.row.contactSamples++;if(e>.5)throw Error('Planted paw slipped '+e+' px');}
 const own=reverse?sample.target:sample.attacker,other=reverse?sample.attacker:sample.target;s.holder.x=W/3+own.displacementX*W;opponent.x=W*2/3+other.displacementX*W;opponent.y=G+(other.pose.root?.dy??0)*H*.15;opponent.rotation=other.pose.root?.rotation??0;
 const push=t>=plan.beats.commandEnd&&t<plan.beats.returnEnd?.025*Math.sin(Math.PI*(t-plan.beats.commandEnd)/(plan.beats.returnEnd-plan.beats.commandEnd)):0;scene.scale.set(1+push);scene.x=-W/2*push+sample.camera.shake.x;scene.y=BASE-H/2*push+sample.camera.shake.y;
 plates.forEach((p,i)=>p.x=-sample.runUpX*W*(i?.08:.025));near.x=-sample.runUpX*W*.16;
 flash.alpha=sample.camera.flash*.65;bar.clear().rect(16,12,(W-32)*sample.timingBar,6).fill(0x9fb6d6);banner.text=t>=plan.beats.commandEnd&&t<plan.beats.impactAt?'SAVAGE MAW':'';
 const n=sample.numbers[0];number.text=n?.visible?'−12':'';if(n){number.position.set(n.x*W,BASE+n.y*H);number.scale.set(n.scale);number.alpha=n.alpha;}
 for(const p of effectPlayers){p.tick();if(!reverse)sample.effect?.tracks.forEach((tr,i)=>{const sprite=p.spriteForTrack(i);if(sprite)sprite.alpha=tr.transform.alpha;});}
 title.text=s.id.toUpperCase()+(fallback?' · WHOLE-PORTRAIT FALLBACK · ':' · PARTS RIG · ')+sample.phase;caption.text='Civet/fox/procedural reuse • Ground line 0.78 • GSAP '+(ms/1000).toFixed(1)+' / 10 s\n'+(reverse?'Receiving hit: planted contacts':'Attacking Platypus: approach, strike, return');
 const updateMs=performance.now()-begin;app.renderer.render(app.stage);return {updateMs,phase:sample.phase};}
 // Exercise all three actual timelines before any capture. This is a contact
 // gate; visual joint seams/spikes are judged from the retained extremes.
 state.partsDiagnostic=[];for(const s of subjects){select(s.id);let firstFailure=null,samples=0,maxCompressionBL=0;for(let ms=0;ms<=10000;ms+=1000/120){const reverse=ms>=5000,t=reverse?ms-5000:ms,plan=plans[reverse?1:0],planted=reverse||t<plan.beats.commandEnd||t>=plan.beats.returnEnd;try{const solved=s.solver.resolve(motionPose(plan,t,reverse),planted);maxCompressionBL=Math.max(maxCompressionBL,solved.compression/s.card.bodyLength);samples++;}catch(error){firstFailure={atMs:ms,phase:sampleTurn(plan,t).phase,reason:error.message};break;}}state.partsDiagnostic.push({id:s.id,samples,firstFailure,maxCompressionBL});if(firstFailure&&!fallback&&!repairGatesOnly)throw Error('Dense contact admission '+s.id+': '+JSON.stringify(firstFailure));if(!repairGatesOnly)for(const ms of [0,400,900,1300,1600,1800,2000,2200,2600,3000,4000,5000,6200,6700,6900,7200,8000,9500])frame(ms);if(!fallback&&!repairGatesOnly&&s.row.maxUnconstrainedContactErrorPx<=.5)throw Error('Unconstrained contact negative control did not fail: '+s.id);}
 // Still-frame qualification precedes any new ten-second capture. All pixels
 // are measured at native cut-out size, on a transparent target, without arena.
 async function bandGates(){
  select('civet');const s=selected,w=s.record.geometry.width,h=s.record.geometry.height,rt=RenderTexture.create({width:w,height:h,resolution:1});
  const old=await loadCreatureRigV1(s.record,await json('civet-old.binding.json'),s.master,s.alpha,new Uint8Array(await bytes('civet-old.atlas.png'))),ref=new Sprite(tex(s.paint.canvas));
  const pixels=node=>{app.renderer.render({container:node,target:rt,clear:true});return Uint8Array.from(app.renderer.extract.pixels({target:rt}).pixels);};
  const oracle=pixels(ref),artifacts={},rest={},poses={},frames=[['rest',null],['hit-recoil',7400],['strike',plans[0].beats.impactAt],['approach-quarter',plans[0].beats.commandEnd+(plans[0].beats.actionStart-plans[0].beats.commandEnd)*.25*plans[0].clips.attacker.approach.timeline.bodyMs/plans[0].clips.attacker.approach.timeline.durationMs],['approach-three-quarter',plans[0].beats.commandEnd+(plans[0].beats.actionStart-plans[0].beats.commandEnd)*.75*plans[0].clips.attacker.approach.timeline.bodyMs/plans[0].clips.attacker.approach.timeline.durationMs]];
  for(const [name,ms]of frames){let pose={};if(ms!==null){const reverse=ms>=5000,t=reverse?ms-5000:ms,plan=plans[reverse?1:0];pose=s.solver.resolve(motionPose(plan,t,reverse),reverse||t<plan.beats.commandEnd||t>=plan.beats.returnEnd).pose;}poses[name]={atMs:ms,pose};
   for(const [variant,rig]of [['disc-only',old],['bands',s.rig]]){rig.root.position.set(0,0);rig.root.scale.set(w,h);rig.applyPose(pose);const rgba=pixels(rig.root),c=new OffscreenCanvas(w,h);c.getContext('2d').putImageData(new ImageData(Uint8ClampedArray.from(rgba),w,h),0,0);artifacts[variant+'-'+name+'.png']=b64(await(await c.convertToBlob({type:'image/png'})).arrayBuffer());if(ms===null){let n=0;for(let i=0;i<rgba.length;i++)if(rgba[i]!==oracle[i])n++;rest[variant]=n;}}
  }
  old.dispose();ref.destroy({texture:true,textureSource:true});rt.destroy(true);return {artifacts,restDifferentChannels:rest,poses,scope:'actual Civet masks, actual GSAP/contact poses, native1254 renders; external read-only seam oracle follows'};
 }
 async function repairGates(){
  const artifacts={},rows=[];
  const png=async(name,rgba,w,h)=>{const c=new OffscreenCanvas(w,h);c.getContext('2d').putImageData(new ImageData(Uint8ClampedArray.from(rgba),w,h),0,0);artifacts[name]=b64(await(await c.convertToBlob({type:'image/png'})).arrayBuffer());};
  const difference=(a,b)=>{let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;return n;};
  for(const id of ['civet','fox']){
   select(id);const s=selected,w=s.record.geometry.width,h=s.record.geometry.height,rt=RenderTexture.create({width:w,height:h,resolution:1});
   const pixels=node=>{app.renderer.render({container:node,target:rt,clear:true});return new Uint8Array(app.renderer.extract.pixels({target:rt}).pixels);};
   const ref=new Sprite(tex(s.paint.canvas)),oracle=pixels(ref);s.rig.root.position.set(0,0);s.rig.root.scale.set(w,h);s.rig.applyPose({});
   const rest=pixels(s.rig.root);const row={id,restDifferentChannels:difference(oracle,rest),card:s.card};await png(id+'-rest.png',rest,w,h);
   if(id==='civet'){
    const oldRig=await loadCreatureRigV1(s.record,await json('civet-old.binding.json'),s.master,s.alpha,new Uint8Array(await bytes('civet-old.atlas.png')));oldRig.root.scale.set(w,h);
    // The requested mask is exactly the opaque-at-rest head/neck/chest union,
    // with no erosion, cropped ROI, or removal of inconvenient boundary pixels.
    for(const part of s.rig.parts)part.display.visible=['head','neck','chest'].includes(part.id);
    const region=pixels(s.rig.root);for(const part of s.rig.parts)part.display.visible=true;
    const pose=s.solver.resolve(motionPose(plans[1],2400,true),true).pose;
    oldRig.applyPose(pose);s.rig.applyPose(pose);const old=pixels(oldRig.root),actual=pixels(s.rig.root);
    let tested=0,oldMissing=0,missing=0,opaqueTested=0,opaqueMissing=0;const marked=actual.slice();
    for(let i=0;i<w*h;i++)if(region[i*4+3]){tested++;if(old[i*4+3]===0)oldMissing++;if(actual[i*4+3]===0){missing++;marked.set([255,30,30,255],i*4);}if(region[i*4+3]===255){opaqueTested++;if(actual[i*4+3]===0)opaqueMissing++;}}
    Object.assign(row,{timeMs:7400,pose,regionPixels:tested,zeroAlphaPixelsInsideRestRegion:missing,opaqueRestRegionPixels:opaqueTested,zeroAlphaInsideOpaqueRestRegion:opaqueMissing,old025NegativeControl:oldMissing,gate:missing===0&&oldMissing>0?'PASS':'FAIL'});
    await png('civet-hit-7400-old.png',old,w,h);await png('civet-hit-7400-repaired.png',actual,w,h);await png('civet-hit-7400-missing-red.png',marked,w,h);await png('civet-rest-region.png',region,w,h);oldRig.dispose();
   }else{
    const oldRecord=await json('fox-old.record.json'),oldSubject={...s,record:oldRecord,card:compileBodyCard(oldRecord)},oldPlan=makePlan(oldSubject,false);let refusal=null;
    try{createQuadrupedContactSolver(oldRecord).resolve(motionPose(oldPlan,1375),true);}catch(error){refusal=error.message;}
    const diagnostic=state.partsDiagnostic.find(d=>d.id==='fox');Object.assign(row,{oldRecordAt1375:refusal,diagnostic,gate:refusal?.includes('compression bound')&&!diagnostic.firstFailure&&diagnostic.maxCompressionBL<.08&&Object.values(s.card.bounds.legSlack).every(v=>v>=.03)?'PASS':'FAIL'});
   }
   rows.push(row);s.rig.root.position.set(-s.record.landmarks.root[0]*s.scale,-s.record.geometry.groundLineY*s.scale);s.rig.root.scale.set(s.scale);rt.destroy(true);ref.destroy({texture:true,textureSource:true});
  }
  return {status:rows.every(r=>r.restDifferentChannels===0&&r.gate==='PASS')?'PASS':'FAIL',scope:'Pack7 still/contact gates; no new ten-second motion capture',rows,artifacts};
 }
 const capture=async id=>{select(id);frame(0);initAudio({sndOn:()=>true,sfxVol:()=>.35});prepareStingAudioForGesture();const ac=window.ac?.();if(ac)await ac.resume();const destination=ac?.createMediaStreamDestination();let silence;if(destination){sfxOut(ac).connect(destination);silence=ac.createBufferSource();silence.buffer=ac.createBuffer(1,128,ac.sampleRate);silence.loop=true;silence.connect(destination);silence.start();}
 const stream=app.canvas.captureStream(0),track=stream.getVideoTracks()[0];if(destination)for(const t of destination.stream.getAudioTracks())stream.addTrack(t);const chunks=[],recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:6500000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};let started=false;recorder.onstart=()=>{started=true;};const stopped=new Promise(r=>recorder.onstop=r);recorder.start();await primeRecorder({started:()=>started,paint:()=>frame(0),requestFrame:()=>track.requestFrame(),schedule:requestAnimationFrame,now:()=>performance.now()});
 const updates=[],deltas=[],events=[];let start,previous;const fired=new Set();await new Promise((resolve,reject)=>{const tick=at=>{try{start??=at;const ms=Math.min(10000,at-start);if(previous!==undefined)deltas.push(at-previous);previous=at;updates.push(frame(ms).updateMs);track.requestFrame();for(let i=0;i<2;i++)for(const[cue,when]of [['approach',plans[i].beats.commandEnd],['impact',plans[i].beats.impactAt]]){const key=i+cue;if(ms>=i*5000+when&&!fired.has(key)){fired.add(key);cue==='approach'?playWhoosh():playSurveyPing();events.push({cue,atMs:ms});}}if(ms>=10000)resolve();else requestAnimationFrame(tick);}catch(e){reject(e);}};requestAnimationFrame(tick);});
 await new Promise(r=>setTimeout(r,120));track.requestFrame();recorder.stop();await stopped;silence?.stop();stream.getTracks().forEach(t=>t.stop());if(destination)sfxOut(ac).disconnect(destination);const blob=new Blob(chunks,{type:recorder.mimeType}),raw=await blob.arrayBuffer(),sorted=updates.slice().sort((a,b)=>a-b);const result={id,mode:selected.row.mode,frames:updates.length,fps:deltas.length/(deltas.reduce((a,b)=>a+b,0)/1000),updateMeanMs:updates.reduce((a,b)=>a+b,0)/updates.length,updateP95Ms:sorted[Math.floor(sorted.length*.95)],updateMaxMs:Math.max(...updates),events,video:b64(raw),contact:selected.row};state.captures.push({...result,video:undefined});return result;};
 Object.assign(window.cfPartsMotion,{select,frame,capture,repairGates,bandGates,plans:()=>plans});select('civet');frame(0);state.status='READY';
}catch(e){state.status='FAIL';state.errors.push(String(e.stack??e));}
