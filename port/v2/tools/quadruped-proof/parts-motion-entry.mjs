import {Application,Container,Texture,Sprite,Text,Graphics,Particle,ParticleContainer,RenderTexture,Matrix,ColorMatrixFilter} from 'pixi.js';
import {loadCreatureRigV1,readCreatureRigRuntimeDiagnostics} from '../../apps/game/src/creature-rig.ts';
import {createCreatureRigPerformance} from '../../apps/game/src/creature-rig-performance.ts';
import {createCreatureRigFrameTarget} from '../../apps/game/src/creature-rig-frame.ts';
import {createTurnPoseSampler} from './turn-performance.mjs';
import {inspectFramePacing,createMotionObservation,percentile} from './motion-proof-contract.mjs';
import {createQuadrupedContactSolver,poseMatrices} from '../../apps/game/src/creature-rig-contact.ts';
import {transformPoint} from '../creature-animation/kinematics.ts';
import {compileBodyCard,createGsapPlayer,buildTimeline} from 'cf-proof/motion/index.ts';
import {buildTurnPlan,sampleTurn} from 'cf-proof/battle2/choreography.ts';
import {parseEffectSequenceAnchors} from 'cf-proof/effects/anchors.ts';
import {EffectSequencePlayer,createPixiEffectHost} from 'cf-proof/effects/pixi-adapter.ts';
import {EMITTER_PRESETS} from 'cf-proof/effects/emitter.ts';
import {keyAndDespill} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
import {buildTurnCuePlan,TurnCuePlayer} from 'cf-proof/battle2/cue-plan.ts';
import {createTurnCueSink} from 'cf-proof/soundkit/turn-audio.ts';
import {synthesizeBattleCue} from 'cf-proof/soundkit/battle-synth.ts';
import {createTameGreetingAudioOwner} from 'cf-proof/tame-greeting-audio.ts';
import {createProofTurnAudio} from './proof-audio.mjs';
import {primeRecorder} from './capture-contract.mjs';
import {runSkinGates} from './skin-gates.mjs';
import {createAuthoredHeadView} from '../battle-facing/head-view.mjs';
import {resolveImpactFocus} from './impact-focus.mjs';
import {compileAttachmentCoverage,resolveAttachmentCoverage,measureAttachmentCoverage} from '../creature-animation/attachment-coverage.mjs';
import {measureCreatureUpdate} from './creature-update-timing.mjs';
import {createTurnContactSampler} from './turn-contact-transition.mjs';
import {runSeamGates} from './seam-gates.mjs';
import {createSourceJoinProbe,assessSourceJoinContinuity} from './source-join-continuity.mjs';
const get=n=>fetch(n).then(r=>{if(!r.ok)throw Error(n);return r;});
const json=n=>get(n).then(r=>r.json()),bytes=n=>get(n).then(r=>r.arrayBuffer());
const image=async n=>{const b=await bytes(n),bmp=await createImageBitmap(new Blob([b])),c=new OffscreenCanvas(bmp.width,bmp.height);c.getContext('2d').drawImage(bmp,0,0);return {bytes:new Uint8Array(b),canvas:c,rgba:c.getContext('2d').getImageData(0,0,c.width,c.height).data};};
const tex=c=>Texture.from(c),b64=b=>{const a=new Uint8Array(b);let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(s);};
const proofMode=new URLSearchParams(location.search).get('mode'),fallback=proofMode==='portrait-fallback',facingReview=proofMode==='facing-review',repairGatesOnly=['repair-gates','band-gates','pair-gates','seam-gates','skin-gates'].includes(proofMode);
const W=896,H=504,G=.78*H,BASE=72,state={status:'RUNNING',specimens:[],errors:[],captures:[],scope:'C2 parts rig study; existing labelled battle/ability synth, creature cues skipped without sources; no C3 acceptance'};window.cfPartsMotion={state};
const app=new Application();await app.init({width:1536,height:740,resolution:1,background:'#141d22',antialias:false,preference:'webgl',autoStart:false});document.body.append(app.canvas);
const scene=new Container();scene.y=BASE;app.stage.addChild(scene);
const label=(text,x,y,size=18)=>{const t=new Text({text,style:{fontFamily:'system-ui',fontSize:size,fill:'#eee2c9',wordWrap:true,wordWrapWidth:600}});t.position.set(x,y);app.stage.addChild(t);return t;};
const title=label('',16,16,23),caption=label('',16,610),comparisonTitle=label('Accepted rain E — retained painting',920,92,20);
let turnSampler=createTurnPoseSampler(createGsapPlayer);
const motionPose=(plan,ms,target=false)=>turnSampler.sample(plan,ms,target);
const bounds=(rgba,w,h)=>{let x0=w,y0=h,x1=-1,y1=-1;for(let i=0;i<w*h;i++)if(rgba[i*4+3]){const x=i%w,y=Math.floor(i/w);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}return{x:x0/w,y:y0/h,width:(x1-x0+1)/w,height:(y1-y0+1)/h};};
try{
 const arena=await json('arena.json'),parsed=parseEffectSequenceAnchors(await json('anchors.json')),genome=await json('genome.json');if(!parsed.ok)throw Error('Effect anchors: '+parsed.reason);const anchors=parsed.anchors;
 const plates=[];for(const name of ['far','mid']){const s=new Sprite(tex((await image(name+'.png')).canvas));s.width=W;s.height=H;scene.addChild(s);plates.push(s);}
 const shadowCanvas=new OffscreenCanvas(128,128),shadowContext=shadowCanvas.getContext('2d'),shadowGradient=shadowContext.createRadialGradient(64,64,0,64,64,64);
 shadowGradient.addColorStop(0,'rgba(12,22,19,0.38)');shadowGradient.addColorStop(.5,'rgba(12,22,19,0.20)');shadowGradient.addColorStop(1,'rgba(12,22,19,0)');shadowContext.fillStyle=shadowGradient;shadowContext.fillRect(0,0,128,128);
 const shadowTexture=tex(shadowCanvas),shadows=new Container();scene.addChild(shadows);
 const groundShadow=()=>{const sprite=new Sprite(shadowTexture);sprite.anchor.set(.5);shadows.addChild(sprite);return sprite;};
 const subjects=[];for(const id of ['civet','fox','procedural']){const record=await json(id+'.record.json'),binding=await json(id+'.binding.json'),master=new Uint8Array(await bytes(id+'.master.png')),paint=await image(id+'.keyed.png'),atlas=new Uint8Array(await bytes(id+'.atlas.png'));
 const alpha=Uint8Array.from({length:paint.canvas.width*paint.canvas.height},(_,i)=>paint.rgba[i*4+3]),rig=await loadCreatureRigV1(record,binding,master,alpha,atlas),card=compileBodyCard(record,id==='procedural'?genome:undefined),box=bounds(paint.rgba,paint.canvas.width,paint.canvas.height),scale=H*.42/box.height,holder=new Container();holder.addChild(rig.root);rig.root.scale.set(scale);rig.root.position.set(-record.landmarks.root[0]*scale,-record.geometry.groundLineY*scale);holder.position.set(W/3,G);scene.addChild(holder);
 const portrait=new Sprite(tex(paint.canvas));portrait.width=1;portrait.height=1;rig.root.parent.addChild(portrait);portrait.scale.set(scale/paint.canvas.width);portrait.position.copyFrom(rig.root.position);portrait.visible=fallback;rig.root.visible=!fallback;
 const row={id,runtime:readCreatureRigRuntimeDiagnostics(rig),parts:rig.parts.length,recordRecipeHash:record.recipeHash,card,mode:facingReview?'TWO RIGS + SOURCE HEAD VIEW — diagnostic':fallback?'WHOLE-PORTRAIT FALLBACK — parts shape gate failed':'PARTS RIG — motion review',maxContactErrorPx:0,maxUnconstrainedContactErrorPx:0,contactSamples:0,maxCompression:0};state.specimens.push(row);subjects.push({id,record,binding,master,alpha,paint,rig,portrait,holder,card,scale,box,shadow:groundShadow(),solver:createQuadrupedContactSolver(record),row});}
 const pl=await image('platypus.png'),keyed=keyAndDespill(pl.rgba,pl.canvas.width,pl.canvas.height);pl.canvas.getContext('2d').putImageData(new ImageData(keyed.rgba,pl.canvas.width,pl.canvas.height),0,0);const pb=bounds(keyed.rgba,pl.canvas.width,pl.canvas.height),opponent=new Sprite(tex(pl.canvas));opponent.anchor.set(.5,pb.y+pb.height);const ps=H*.252/(pb.height*pl.canvas.height);opponent.scale.set(-ps,ps);opponent.position.set(W*2/3,G);scene.addChild(opponent);const opponentShadow=groundShadow();
 let opponentRig=null,opponentRecord=null,opponentCard=null,opponentContact=null,opponentHolder=null,opponentScale=0,headView=null,headAttachments=null,attachmentSurfaces=null,opponentJoinState=null;
 if(facingReview){
  opponentRecord=await json('platypus.record.json');const binding=await json('platypus.binding.json'),paint=await image('platypus.keyed.png');
  opponentRig=await loadCreatureRigV1(opponentRecord,binding,new Uint8Array(await bytes('platypus.png')),Uint8Array.from({length:paint.canvas.width*paint.canvas.height},(_,i)=>paint.rgba[i*4+3]),new Uint8Array(await bytes('platypus.atlas.png')));
  const opponentAtlas=await image('platypus.atlas.png'),opponentProbe=createSourceJoinProbe({record:opponentRecord,binding,atlas:{rgba:opponentAtlas.rgba,width:opponentAtlas.canvas.width,height:opponentAtlas.canvas.height}});opponentJoinState={probe:opponentProbe,positions:new Map(opponentProbe.parts.map(p=>[p.id,opponentRig.parts.find(q=>q.id===p.id).display.children[0].geometry.getBuffer('aPosition').data]))};
  opponentCard=compileBodyCard(opponentRecord);if(opponentCard.bounds.legSlack&&Object.values(opponentCard.bounds.legSlack).some(v=>typeof v==='number'&&v<.03))throw Error('Platypus rest slack below 3%');
  opponentScale=H*.30/pb.height;opponentHolder=new Container();opponentHolder.addChild(opponentRig.root);opponentRig.root.scale.set(-opponentScale,opponentScale);opponentRig.root.position.set(opponentRecord.landmarks.root[0]*opponentScale,-opponentRecord.geometry.groundLineY*opponentScale);opponentHolder.position.set(W*2/3,G);scene.addChild(opponentHolder);opponent.visible=false;
  const civet=subjects.find(s=>s.id==='civet');headView=await createAuthoredHeadView({record:civet.record,rig:civet.rig,partsBinding:civet.binding,binding:await json('head-views.json'),sourceBytes:new Uint8Array(await bytes('head-source.png')),viewBytes:{profile:new Uint8Array(await bytes('head-profile.png')),front:new Uint8Array(await bytes('head-front.png'))}});
  const headBinding=await json('head-views.json');attachmentSurfaces=headView.attachmentSurfaces();for(const part of civet.binding.paintSkin.parts){const skin=civet.binding.paintSkin,mesh=civet.rig.parts.find(p=>p.id===part.id).display.children[0];attachmentSurfaces[part.id]={rest:Float32Array.from(part.vertices.flatMap(v=>v.triangle.reduce((a,k,i)=>[a[0]+skin.vertices[k].x*v.barycentric[i]/civet.record.geometry.width,a[1]+skin.vertices[k].y*v.barycentric[i]/civet.record.geometry.height],[0,0]))),indices:part.indices,positions:mesh.geometry.getBuffer('aPosition').data};}headAttachments=compileAttachmentCoverage(headBinding.attachments,attachmentSurfaces);
  state.facingReview={status:'VISUAL_REVIEW_REQUIRED',opponent:'hash-bound Platypus parts rig; three visible feet, hidden hind limb not painted',head:'existing turnaround profile; source master retained',bodyCard:opponentCard};
 }
 const impactFilters=new Map();if(facingReview){for(const s of subjects){const filter=new ColorMatrixFilter();filter.enabled=false;s.rig.root.filters=[filter];impactFilters.set(s.id,filter);}const filter=new ColorMatrixFilter();filter.enabled=false;opponentRig.root.filters=[filter];impactFilters.set('opponent',filter);}
 const applyImpact=(strengths)=>{for(const s of subjects){const f=impactFilters.get(s.id);if(f){const strength=s===selected?strengths.leftBrightness:1;f.enabled=strength!==1;if(f.enabled)f.brightness(strength,false);}}const f=impactFilters.get('opponent');if(f){f.enabled=strengths.rightBrightness!==1;if(f.enabled)f.brightness(strengths.rightBrightness,false);}};
 const visibleJoinProbes=new Map();if(facingReview)for(const s of subjects){const atlas=await image(s.id+'.atlas.png'),probe=createSourceJoinProbe({record:s.record,binding:s.binding,atlas:{rgba:atlas.rgba,width:atlas.canvas.width,height:atlas.canvas.height}}),hidden=s.id==='civet'?new Set((await json('head-views.json')).replaces):new Set(),excludedHidden=probe.joins.filter(j=>hidden.has(j.ancestorPart)||hidden.has(j.descendantPart)).map(j=>j.name);probe.joins=probe.joins.filter(j=>!hidden.has(j.ancestorPart)&&!hidden.has(j.descendantPart));if(!probe.joins.length)throw Error('No visible body attachment inventory');visibleJoinProbes.set(s.id,{probe,excludedHidden,positions:new Map(probe.parts.map(p=>[p.id,s.rig.parts.find(q=>q.id===p.id).display.children[0].geometry.getBuffer('aPosition').data]))});}
 const fxLayer=new Container();scene.addChild(fxLayer);const near=new Sprite(tex((await image('near.png')).canvas));near.width=W;near.height=H;scene.addChild(near);
 const effectTextures=[];for(const n of ['launch','travel','impact'])effectTextures.push(tex((await image(n+'.png')).canvas));
 const particleCanvas=new OffscreenCanvas(8,8),pc=particleCanvas.getContext('2d');pc.fillStyle='#8a6a42';pc.beginPath();pc.ellipse(4,4,3,1.5,-.5,0,Math.PI*2);pc.fill();const particleTexture=tex(particleCanvas);
 const flash=new Graphics().rect(0,0,W,H).fill(0xffffff);flash.alpha=0;scene.addChild(flash);const bar=new Graphics();scene.addChild(bar);const banner=label('',210,BASE+35,25),number=label('',630,BASE+200,28);
 const comparison=new Sprite(tex((await image('E.png')).canvas));comparison.position.set(920,130);comparison.width=600;comparison.height=337.5;app.stage.addChild(comparison);label((fallback?'FALLBACK: whole painted portrait\nNo articulated ears, tail or jaw\n':'Same template and Motion Kit curves\nNo per-creature clip edits\n')+'C3 pending; labelled battle/ability synth\nCreature voices skipped: no admitted sources',920,500);
 let selected,plans,effectPlayers=[],performances=[],frameTarget,rigUpdateMs=0,now=0,lastTime=0;
 const makePlan=(s,reverse,opponentCard=null,opponentScale=0,facingReview=false)=>buildTurnPlan({seed:arena.seed,attacker:{side:reverse?'right':'left',mass:reverse?(opponentCard?.massClass.multiplier??1):s.card.massClass.multiplier,card:reverse?opponentCard:s.card,seed:s.record.identity.seed,label:reverse?'Platypus':s.id},target:{side:reverse?'left':'right',mass:reverse?s.card.massClass.multiplier:(opponentCard?.massClass.multiplier??1),card:reverse?s.card:opponentCard,seed:s.record.identity.seed,label:reverse?s.id:'Platypus'},delivery:'melee',theme:'wild',outcome:'hit',damage:12,effect:reverse?null:anchors,arena:{groundLineY:.78,stands:{left:{x:1/3,y:.78},right:{x:2/3,y:.78}},halfWidths:{left:s.box.width*s.scale/W/2,right:pb.width*(facingReview?opponentScale:pl.canvas.width*ps)/W/2}},readyMs:1200,commandMs:260,idleTailMs:800});
 function clearEffects(){for(const p of effectPlayers)p.dispose();effectPlayers=[];fxLayer.removeChildren();}
 function resetEffects(){clearEffects();const plan=plans[0];if(plan.effect){const player=new EffectSequencePlayer({host:createPixiEffectHost({Sprite,Particle,ParticleContainer}),schedule:plan.effect.schedule,phaseTextures:effectTextures,particleTexture,particleTint:0x8a6a42,emitters:EMITTER_PRESETS,seed:arena.seed,arena:{width:W,height:H},clock:()=>now,startAtMs:plan.effect.startMs});effectPlayers.push(player);fxLayer.addChild(...player.sprites,player.particles);}}
 function select(id){
  for(const performance of performances)performance.dispose();performances=[];frameTarget?.dispose();turnSampler.dispose();turnSampler=createTurnPoseSampler(createGsapPlayer);
  selected=subjects.find(s=>s.id===id);if(!selected)throw Error('Unknown specimen '+id);for(const s of subjects){s.holder.visible=s===selected;s.shadow.visible=s===selected;}
  plans=[makePlan(selected,false,opponentCard,opponentScale,facingReview),makePlan(selected,true,opponentCard,opponentScale,facingReview)];if(facingReview)opponentContact=createTurnContactSampler({plans,motionSampler:turnSampler,solver:createQuadrupedContactSolver(opponentRecord),side:'right'});selected.turnContact=createTurnContactSampler({plans,motionSampler:turnSampler,solver:selected.solver});frameTarget=createCreatureRigFrameTarget(selected.rig);
  const bridge={recipeHash:selected.rig.recipeHash,templateId:selected.rig.templateId,applyPose(pose){const at=performance.now();frameTarget.sample(()=>{for(const[n,k]of Object.entries(pose))frameTarget.setJoint(n,k.rotation,k.dx??0,k.dy??0);});rigUpdateMs=performance.now()-at;}};
  performances=plans.map((plan,index)=>{const action={id:'turn',durationMs:Math.max(5000,plan.beats.end),loop:false,seek(ms,target){for(const[n,k]of Object.entries(selected.turnContact.sample(ms+index*5000)))target.setJoint(n,k.rotation,k.dx??0,k.dy??0);},dispose(){}};const performance=createCreatureRigPerformance(selected.record,bridge,[action]);performance.play('turn',0,0);return performance;});
  now=0;lastTime=0;resetEffects();return plans;
 }
 function contactError(s,pose){const m=poseMatrices(s.record,pose);let error=0;for(const id of ['hindFar','foreFar','hindNear','foreNear']){const p=s.record.landmarks[id+'Paw'],q=transformPoint(m[id+'Paw'],{x:p[0],y:p[1]});error=Math.max(error,Math.hypot(q.x-p[0],q.y-p[1])*s.scale);}return error;}
 function frame(ms){const begin=performance.now(),reverse=ms>=5000,t=reverse?ms-5000:ms,plan=plans[reverse?1:0],sample=sampleTurn(plan,t),s=selected;now=ms;if(ms<lastTime)resetEffects();lastTime=ms;
 let planted=reverse||t<plan.beats.commandEnd||t>=plan.beats.returnEnd;rigUpdateMs=0;const resolvedOpponent=facingReview?opponentContact.resolve(ms):null;
 let pose,resolved,creatureUpdateMs;try{({updateMs:creatureUpdateMs}=measureCreatureUpdate(()=>{
  if(fallback){pose=performances[reverse?1:0].sample(t);resolved={pose,compression:0};const compression=Math.max(-.04,Math.min(.08,pose.root?.dy??0)),sy=1-compression;s.portrait.scale.set(s.scale/s.portrait.texture.width/sy,s.scale/s.portrait.texture.height*sy);s.portrait.position.set(-s.record.landmarks.root[0]*s.scale/sy,-s.record.geometry.groundLineY*s.scale*sy+(planted?0:(pose.root?.dy??0)*s.scale));}
  else performances[reverse?1:0].update(t,input=>{pose=input;resolved=s.turnContact.resolve(ms,input);planted=resolved.planted;if(facingReview&&s.id==='civet'){const otherSide=reverse?sample.attacker:sample.target,ownSide=reverse?sample.target:sample.attacker,eye=transformPoint(poseMatrices(opponentRecord,resolvedOpponent.pose).head,{x:opponentRecord.landmarks.head[0],y:opponentRecord.landmarks.head[1]}),target={x:s.record.landmarks.root[0]+(W/3+(otherSide.displacementX-ownSide.displacementX)*W+(opponentRecord.landmarks.root[0]-eye.x)*opponentScale)/s.scale,y:s.record.geometry.groundLineY+(eye.y-opponentRecord.geometry.groundLineY)*opponentScale/s.scale+.015*Math.sin(ms*.0017)},aimed=headView.aim(resolved.pose,target);resolved={...resolved,pose:aimed.pose};s.row.gazeStatus=aimed.status;}return resolved.pose;});
 }));}catch(error){throw Error(s.id+' at '+ms+'ms ('+sample.phase+'): '+error.message,{cause:error});}
 if(facingReview){if(s.id==='civet')headView.apply(resolved.pose);else headView.restore();opponentRig.applyPose(resolvedOpponent.pose);state.facingReview.opponentPose=resolvedOpponent.pose;state.facingReview.opponentPlanted=resolvedOpponent.planted;}
 if(planted&&!fallback){const e=contactError(s,resolved.pose);s.row.maxContactErrorPx=Math.max(s.row.maxContactErrorPx,e);s.row.maxUnconstrainedContactErrorPx=Math.max(s.row.maxUnconstrainedContactErrorPx,contactError(s,pose));s.row.maxCompression=Math.max(s.row.maxCompression,resolved.compression);s.row.contactSamples++;if(e>.5)throw Error('Planted paw slipped '+e+' px');}
 const own=reverse?sample.target:sample.attacker,other=reverse?sample.attacker:sample.target;s.holder.x=W/3+own.displacementX*W;opponent.x=W*2/3+other.displacementX*W;opponent.y=G+(other.pose.root?.dy??0)*H*.15;opponent.rotation=other.pose.root?.rotation??0;if(opponentHolder)opponentHolder.x=opponent.x;
 const lift=Math.min(1,Math.max(0,-(resolved.pose.root?.dy??0))*8);s.shadow.position.set(s.holder.x+(s.box.x+s.box.width*.5-s.record.landmarks.root[0]+(resolved.pose.root?.dx??0)*s.card.bodyLength)*s.scale,G+3);s.shadow.width=s.box.width*s.scale*.64*(1-lift*.18);s.shadow.height=H*.037;s.shadow.alpha=1-lift*.45;
 opponentShadow.position.set(opponent.x,G+3);opponentShadow.width=pb.width*pl.canvas.width*ps*.72;opponentShadow.height=H*.032;opponentShadow.alpha=.85;
 const push=t>=plan.beats.commandEnd&&t<plan.beats.returnEnd?.025*Math.sin(Math.PI*(t-plan.beats.commandEnd)/(plan.beats.returnEnd-plan.beats.commandEnd)):0;scene.scale.set(1+push);scene.x=-W/2*push+sample.camera.shake.x;scene.y=BASE-H/2*push+sample.camera.shake.y;
 plates.forEach((p,i)=>p.x=-sample.runUpX*W*(i?.08:.025));near.x=-sample.runUpX*W*.16;
 if(facingReview){const impact=resolveImpactFocus({flash:sample.camera.flash,targetSide:reverse?'left':'right',outcome:plan.outcome});applyImpact(impact);flash.alpha=impact.sceneAlpha;}else flash.alpha=sample.camera.flash*.65;bar.clear().rect(16,12,(W-32)*sample.timingBar,6).fill(0x9fb6d6);banner.text=t>=plan.beats.commandEnd&&t<plan.beats.impactAt?'SAVAGE MAW':'';
 const n=sample.numbers[0];number.text=n?.visible?'−12':'';if(n){number.position.set(n.x*W,BASE+n.y*H);number.scale.set(n.scale);number.alpha=n.alpha;}
 for(const p of effectPlayers){p.tick();if(!reverse)sample.effect?.tracks.forEach((tr,i)=>{const sprite=p.spriteForTrack(i);if(sprite)sprite.alpha=tr.transform.alpha;});}
 title.text=s.id.toUpperCase()+(facingReview?' · FACING / TWO-RIG STUDY · '+sample.phase:'');if(!facingReview)title.text=s.id.toUpperCase()+(fallback?' · WHOLE-PORTRAIT FALLBACK · ':' · PARTS RIG · ')+sample.phase;caption.text='Civet/fox/procedural reuse • Ground line 0.78 • GSAP '+(ms/1000).toFixed(1)+' / 10 s\n'+(reverse?'Receiving hit: planted contacts':'Attacking Platypus: approach, strike, return');
 const updateMs=performance.now()-begin;app.renderer.render(app.stage);return {updateMs,creatureUpdateMs,rigUpdateMs,frameCpuMs:performance.now()-begin,phase:sample.phase,pose:resolved.pose,role:reverse?'target':'attacker'};}
 // Exercise all three actual timelines before any capture. This is a contact
 // gate; visual joint seams/spikes are judged from the retained extremes.
 state.partsDiagnostic=[];for(const s of subjects){select(s.id);let firstFailure=null,samples=0,maxCompressionBL=0;for(let ms=0;ms<=10000;ms+=1000/120){const reverse=ms>=5000,t=reverse?ms-5000:ms,plan=plans[reverse?1:0],planted=reverse||t<plan.beats.commandEnd||t>=plan.beats.returnEnd;try{const solved=s.turnContact.resolve(ms);maxCompressionBL=Math.max(maxCompressionBL,solved.compression/s.card.bodyLength);samples++;}catch(error){firstFailure={atMs:ms,phase:sampleTurn(plan,t).phase,reason:error.message};break;}}state.partsDiagnostic.push({id:s.id,samples,firstFailure,maxCompressionBL});if(firstFailure&&!fallback&&!repairGatesOnly)throw Error('Dense contact admission '+s.id+': '+JSON.stringify(firstFailure));if(!repairGatesOnly)for(const ms of [0,400,900,1300,1600,1800,2000,2200,2600,3000,4000,5000,6200,6700,6900,7200,8000,9500])frame(ms);if(!fallback&&!repairGatesOnly&&s.row.maxUnconstrainedContactErrorPx<=.5)throw Error('Unconstrained contact negative control did not fail: '+s.id);}
 // Still-frame qualification precedes any new ten-second capture. All pixels
 // are measured at native cut-out size, on a transparent target, without arena.
 let pairContext;
 async function pairGateStart(){
  select('civet');const s=selected,w=s.record.geometry.width,h=s.record.geometry.height,rt=RenderTexture.create({width:w,height:h,resolution:1});
  const oldBinding=await json('civet-old.binding.json'),old=await loadCreatureRigV1(s.record,oldBinding,s.master,s.alpha,new Uint8Array(await bytes('civet-old.atlas.png'))),declaration=await json('pairs.json');
  const pixels=node=>{app.renderer.render({container:node,target:rt,clear:true});return Uint8Array.from(app.renderer.extract.pixels({target:rt}).pixels);};
  const png=async rgba=>{const c=new OffscreenCanvas(w,h);c.getContext('2d').putImageData(new ImageData(Uint8ClampedArray.from(rgba),w,h),0,0);return b64(await(await c.convertToBlob({type:'image/png'})).arrayBuffer());};
  const oracle=pixels(new Sprite(tex(s.paint.canvas))),restDifferentChannels={},artifacts={};
  for(const [variant,rig]of [['disc-only',old],['bands',s.rig]]){rig.root.position.set(0,0);rig.root.scale.set(w,h);rig.applyPose({});const p=pixels(rig.root);let n=0;for(let i=0;i<p.length;i++)if(p[i]!==oracle[i])n++;restDifferentChannels[variant]=n;artifacts[variant+'-full-rest.png']=await png(p);}
  const stride=f=>plans[0].beats.commandEnd+(plans[0].beats.actionStart-plans[0].beats.commandEnd)*f*plans[0].clips.attacker.approach.timeline.bodyMs/plans[0].clips.attacker.approach.timeline.durationMs;
  const frames={rest:null,'hit-recoil':7400,strike:plans[0].beats.impactAt,'approach-quarter':stride(.25),'approach-three-quarter':stride(.75)},poses={};
  for(const [name,ms]of Object.entries(frames)){let pose={};if(ms!==null){const rev=ms>=5000,t=rev?ms-5000:ms,plan=plans[rev?1:0];pose=s.solver.resolve(motionPose(plan,t,rev),rev||t<plan.beats.commandEnd||t>=plan.beats.returnEnd).pose;}poses[name]={atMs:ms,pose};}
  pairContext={s,w,h,old,oldBinding,declaration,pixels,png,poses};return {cuts:declaration.cuts,restDifferentChannels,poses,artifacts};
 }
 async function renderPair(index,variant,frame){
  const c=pairContext,cut=c.declaration.cuts[index],pose=c.poses[frame].pose,matrices=poseMatrices(c.s.record,pose),group=new Container();group.scale.set(c.w,c.h);
  const attach=(texture,box,joint,layer,order)=>{const node=new Container(),sprite=new Sprite(texture);sprite.position.set(box.x/c.w,box.y/c.h);sprite.scale.set(box.width/c.w/texture.width,box.height/c.h/texture.height);node.addChild(sprite);node.setFromMatrix(new Matrix(...matrices[joint]));return {node,layer,order};};
  const nodes=[];let temporaryTexture;
  if(variant==='bands'){const im=await image('pair-'+index+'.png');temporaryTexture=tex(im.canvas);nodes.push(attach(temporaryTexture,cut.pairBand.cutout,cut.ancestorJoint,cut.layer,0));}
  const source=variant==='bands'?c.s.rig:c.old,binding=variant==='bands'?c.s.binding:c.oldBinding;
  for(const part of binding.parts){const base=part.id===cut.ancestor||part.id===cut.descendant,disc=variant==='disc-only'&&part.id==='patch-'+cut.descendantJoint.toLowerCase();if(!base&&!disc)continue;const entry=source.parts.find(p=>p.id===part.id),sprite=entry.display.children[0];nodes.push(attach(sprite.texture,part.cutout,part.joint,part.layer,disc?0:binding.parts.indexOf(part)+1));}
  nodes.sort((a,b)=>(a.layer==='far'?0:1)-(b.layer==='far'?0:1)||a.order-b.order);for(const n of nodes)group.addChild(n.node);
  const imageData=await c.png(c.pixels(group));group.destroy({children:true});temporaryTexture?.destroy(true);return {png:imageData,pair:{ancestor:cut.ancestor,descendant:cut.descendant},variant,frame};
 }
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
 const capture=async id=>{
  select(id);frame(0);
  const ac=new (window.AudioContext??window.webkitAudioContext)({sampleRate:48000}),tap=ac.createGain(),destination=ac.createMediaStreamDestination();tap.connect(ac.destination);tap.connect(destination);
  const context=new Proxy(ac,{get(target,key){if(key==='destination')return tap;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
  const owner=createTameGreetingAudioOwner({createContext:()=>context,nowMs:()=>performance.now(),readPolicy:()=>({soundOn:true,creatureVoicesOn:false,visible:!document.hidden,answerable:true,masterGain:.35,routeKey:'c2-proof/'+id}),verifyCounterpart:()=>false});
  const visibility=()=>owner.setHidden(document.hidden);document.addEventListener('visibilitychange',visibility);
  let silence,stream,recorder,turnAudio;const chunks=[];let result;
  try{
   if(!owner.armNativePilotGesture())throw Error('Accessible audio owner refused proof gesture');await ac.resume();
   if(owner.diagnostics().runtime.state!=='running')throw Error('Accessible audio owner did not activate');
   turnAudio=createProofTurnAudio({plans,owner,seed:arena.seed,buildTurnCuePlan,TurnCuePlayer,createTurnCueSink,synthesizeBattleCue});
   silence=ac.createBufferSource();silence.buffer=ac.createBuffer(1,128,ac.sampleRate);silence.loop=true;silence.connect(destination);silence.start();
   stream=app.canvas.captureStream(0);const track=stream.getVideoTracks()[0];if(destination)for(const t of destination.stream.getAudioTracks())stream.addTrack(t);
   recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:6500000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};let started=false,recordError=null;recorder.onstart=()=>{started=true;};recorder.onerror=e=>{recordError=e.error??Error('Recorder failed');};const stopped=new Promise(r=>recorder.onstop=r);recorder.start();
   await primeRecorder({started:()=>started,paint:()=>frame(0),requestFrame:()=>track.requestFrame(),schedule:requestAnimationFrame,now:()=>performance.now()});
   const updates=[],creatureUpdates=[],rigUpdates=[],frameCpu=[],deltas=[],motion=createMotionObservation(Object.keys(selected.record.landmarks));let start,previous;
   await new Promise((resolve,reject)=>{const tick=at=>{try{if(recordError)throw recordError;start??=at;const ms=Math.min(10000,at-start);if(previous!==undefined)deltas.push(at-previous);previous=at;const f=frame(ms);updates.push(f.updateMs);creatureUpdates.push(f.creatureUpdateMs);rigUpdates.push(f.rigUpdateMs);frameCpu.push(f.frameCpuMs);motion.observe({ms,...f});track.requestFrame();turnAudio.tick(ms);if(ms>=10000)resolve();else requestAnimationFrame(tick);}catch(e){reject(e);}};requestAnimationFrame(tick);});
   await new Promise(r=>setTimeout(r,120));track.requestFrame();recorder.stop();await stopped;if(recordError)throw recordError;
   let pacing={status:'OBSERVED',fps:deltas.length*1000/deltas.reduce((a,b)=>a+b,0),intervalP95Ms:percentile(deltas,.95),intervalMaxMs:Math.max(...deltas),creatureUpdateP95Ms:percentile(creatureUpdates,.95),rigUpdateP95Ms:percentile(rigUpdates,.95),timingScope:'producer sampling + contact solve + rig publication; rigUpdateP95Ms is publication only',frameCpuP95Ms:percentile(frameCpu,.95)},observed=null,admissionError=null;
   try{if(!fallback)pacing={...inspectFramePacing(deltas,creatureUpdates,frameCpu),rigUpdateP95Ms:percentile(rigUpdates,.95),rigTimingScope:'rig publication only'};observed=motion.finish();}catch(error){admissionError=String(error.message??error);}
   const blob=new Blob(chunks,{type:recorder.mimeType});
   result={id,admissionError,mode:selected.row.mode,frames:updates.length,fps:pacing.fps,pacing,motion:observed,timingFrames:{intervalMs:deltas,creatureMs:creatureUpdates,rigMs:rigUpdates,sceneMs:updates,frameCpuMs:frameCpu},timingScope:'producer sampling + contact solve + rig publication',updateMeanMs:creatureUpdates.reduce((a,b)=>a+b,0)/creatureUpdates.length,updateP95Ms:percentile(creatureUpdates,.95),updateMaxMs:Math.max(...creatureUpdates),rigUpdateP95Ms:percentile(rigUpdates,.95),sceneUpdateMeanMs:updates.reduce((a,b)=>a+b,0)/updates.length,audio:turnAudio.snapshot(),audioOwner:owner.diagnostics(),video:b64(await blob.arrayBuffer()),contact:selected.row};
   state.captures.push({...result,video:undefined});return result;
  }finally{
   if(recorder&&recorder.state!=='inactive')recorder.stop();silence?.stop();silence?.disconnect();stream?.getTracks().forEach(t=>t.stop());turnAudio?.dispose();document.removeEventListener('visibilitychange',visibility);tap.disconnect();destination.disconnect();await owner.dispose();for(const performance of performances)performance.reset();
  }
 };
 const seamGates=()=>runSeamGates({app,subjects,select,plans:()=>plans,motionPose,image,json,bytes,poseMatrices});
 async function impactWitness(){
  if(!facingReview)throw Error('Facing study only');select('civet');const rt=RenderTexture.create({width:1536,height:740,resolution:1}),rows=[],artifacts={};
  const pixels=()=>{app.renderer.render({container:app.stage,target:rt,clear:true});return Uint8Array.from(app.renderer.extract.pixels({target:rt}).pixels);};
  const png=async(name,rgba)=>{const c=new OffscreenCanvas(1536,740);c.getContext('2d').putImageData(new ImageData(Uint8ClampedArray.from(rgba),1536,740),0,0);artifacts[name]=b64(await(await c.convertToBlob({type:'image/png'})).arrayBuffer());};
  try{for(const reverse of [false,true]){const ms=(reverse?5000:0)+plans[reverse?1:0].beats.impactAt;frame(ms);const target=reverse?selected.rig.root:opponentRig.root,bounds=target.getBounds(),neutral={leftBrightness:1,rightBrightness:1};
   applyImpact(neutral);flash.alpha=0;const base=pixels();
   applyImpact(reverse?{leftBrightness:1.45,rightBrightness:1}:{leftBrightness:1,rightBrightness:1.45});const local=pixels();flash.alpha=.1;const focused=pixels();
   applyImpact(neutral);flash.alpha=.65;const old=pixels();
   flash.alpha=0;applyImpact(reverse?{leftBrightness:1,rightBrightness:1.45}:{leftBrightness:1.45,rightBrightness:1});const wrong=pixels();
   const changed=(rgba)=>{let pixels=0,outside=0;for(let i=0;i<1536*740;i++){if(![0,1,2,3].some(c=>rgba[i*4+c]!==base[i*4+c]))continue;pixels++;const x=i%1536,y=Math.floor(i/1536);if(x<bounds.x-2||x>bounds.x+bounds.width+2||y<bounds.y-2||y>bounds.y+bounds.height+2)outside++;}return{pixels,outside};};
   const skyDelta=rgba=>{let total=0,n=0;for(let y=90;y<220;y++)for(let x=20;x<870;x++)for(let c=0;c<3;c++){const i=(y*1536+x)*4+c;total+=Math.abs(rgba[i]-base[i]);n++;}return total/n;};
   const correct=changed(local),negative=changed(wrong),oldSky=skyDelta(old),newSky=skyDelta(focused),status=correct.pixels>100&&correct.outside===0&&negative.outside>100&&oldSky>10&&newSky<oldSky*.25?'PASS':'FAIL';
   rows.push({role:reverse?'civet-receives':'platypus-receives',atMs:ms,bounds:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height},localHighlight:correct,wrongActorControl:negative,oldSkyMeanChannelChange:oldSky,focusedSkyMeanChannelChange:newSky,status});
   const name=reverse?'civet-hit':'platypus-hit';await png(name+'-neutral.png',base);await png(name+'-focused.png',focused);await png(name+'-old-flash.png',old);
  }}finally{rt.destroy(true);frame(0);}
  return{status:rows.every(r=>r.status==='PASS')?'PASS':'FAIL',scope:'Actual rendered target-only exposure, wrong-actor negative control and arena contrast at both turn impacts. No pose or timing changes.',rows,artifacts};
 }
 async function attachmentCoverage(){
  if(!facingReview)throw Error('Facing study only');select('civet');const s=selected,w=s.record.geometry.width,h=s.record.geometry.height,cw=w*2,ch=h*2,rt=RenderTexture.create({width:cw,height:ch,resolution:1}),rows=[],artifacts={};
  const positions=Object.fromEntries(Object.entries(attachmentSurfaces).map(([id,p])=>[id,p.positions]));
  const old=await image('old-head-gap.png'),negative=measureAttachmentCoverage(old.rgba,w,h,[{id:'retained-visible-chin-notch',from:[1160,510],to:[1160,590],radiusPx:1}]);
  try{for(let i=0;i<=600;i++){const atMs=i*10000/600;frame(atMs);const scale={x:s.rig.root.scale.x,y:s.rig.root.scale.y},position={x:s.rig.root.x,y:s.rig.root.y};
   try{s.rig.root.position.set(w/2,h/2);s.rig.root.scale.set(w,h);app.renderer.render({container:s.rig.root,target:rt,clear:true});const rgba=app.renderer.extract.pixels({target:rt}).pixels,result=measureAttachmentCoverage(rgba,cw,ch,resolveAttachmentCoverage(headAttachments,positions,w,h).map(r=>({...r,from:[r.from[0]+w/2,r.from[1]+h/2],to:[r.to[0]+w/2,r.to[1]+h/2]})));rows.push({atMs,...result});
    if(result.status!=='PASS'||i%60===0){const canvas=new OffscreenCanvas(cw,ch);canvas.getContext('2d').putImageData(new ImageData(Uint8ClampedArray.from(rgba),cw,ch),0,0);artifacts['join-'+String(i).padStart(3,'0')+'.png']=b64(await(await canvas.convertToBlob({type:'image/png'})).arrayBuffer());}
    if(result.status!=='PASS')break;
   }finally{s.rig.root.scale.set(scale.x,scale.y);s.rig.root.position.set(position.x,position.y);}
  }}finally{rt.destroy(true);frame(0);}
  return{status:rows.length===601&&rows.every(r=>r.status==='PASS')&&negative.status==='FAIL'?'PASS':'FAIL',samples:rows.length,canvas:{width:cw,height:ch,origin:[w/2,h/2],nativeScale:1},negativeControl:negative,rows,artifacts};
 }
 async function facingCoverage(){
  if(!facingReview)throw Error('Facing study only');select('civet');const s=selected,w=s.record.geometry.width,h=s.record.geometry.height,rt=RenderTexture.create({width:w,height:h,resolution:1}),rows=[],artifacts={};
  const protectedParts=s.rig.parts.filter(p=>!['head','jaw','ear-far','ear-near'].includes(p.id)),neck=s.rig.parts.find(p=>p.id==='neck');
  const pixels=()=>{app.renderer.render({container:s.rig.root,target:rt,clear:true});return Uint8Array.from(app.renderer.extract.pixels({target:rt}).pixels);};
  const encode=async rgba=>{const canvas=new OffscreenCanvas(w,h);canvas.getContext('2d').putImageData(new ImageData(Uint8ClampedArray.from(rgba),w,h),0,0);return b64(await(await canvas.convertToBlob({type:'image/png'})).arrayBuffer());};
  try{for(const [name,ms]of [['idle',500],['anticipation',plans[0].beats.actionStart+60],['strike',plans[0].beats.impactAt],['impact-hold',plans[0].beats.hitstopEnd+170],['hit-recoil',7400],['return',plans[0].beats.returnEnd]]){
   frame(ms);const scale={x:s.rig.root.scale.x,y:s.rig.root.scale.y},position={x:s.rig.root.x,y:s.rig.root.y},visibility=s.rig.parts.map(p=>p.display.visible);
   try{s.rig.root.position.set(0,0);s.rig.root.scale.set(w,h);
    for(const part of s.rig.parts)part.display.visible=protectedParts.includes(part);headView.setVisible(false);const body=pixels();
    s.rig.parts.forEach((p,i)=>p.display.visible=visibility[i]);headView.setVisible(true);const actual=pixels();
    neck.display.visible=false;const old=pixels();neck.display.visible=true;
    let protectedPixels=0,missing=0,oldMissing=0;for(let i=3;i<body.length;i+=4)if(body[i]>=250){protectedPixels++;if(actual[i]<250)missing++;if(old[i]<250)oldMissing++;}
    if(protectedPixels<10000)throw Error('Empty/small body coverage oracle');rows.push({name,atMs:ms,protectedPixels,missingBodyPixels:missing,oldNeckHiddenMissingPixels:oldMissing});
    if(name==='idle'){artifacts['body-protected-idle.png']=await encode(body);artifacts['body-restored-idle.png']=await encode(actual);artifacts['body-old-neck-hidden-idle.png']=await encode(old);}
   }finally{s.rig.root.scale.set(scale.x,scale.y);s.rig.root.position.set(position.x,position.y);s.rig.parts.forEach((p,i)=>p.display.visible=visibility[i]);headView.setVisible(true);}
  }}finally{rt.destroy(true);frame(0);}
  const passed=rows.every(r=>r.missingBodyPixels===0)&&rows.some(r=>r.oldNeckHiddenMissingPixels>100);
  return{status:passed?'PASS':'FAIL',scope:'Native rendered opaque body/neck/chest coverage preserved beneath source head view; previous hidden-neck bug measured on same poses.',rows,artifacts};
 }
 function facingGate(){if(!facingReview)throw Error('Facing study only');const rows=[];for(const s of subjects){select(s.id);const extrema=new Map(),joinState=visibleJoinProbes.get(s.id);let maxJoinGapPx=0,maxOpponentJoinGapPx=0;for(let i=0;i<=600;i++){frame(i*10000/600);const joins=assessSourceJoinContinuity(joinState.probe,joinState.positions);if(joins.status!=='PASS')throw Error('Visible body attachment reopened: '+s.id+' at '+i*10000/600);maxJoinGapPx=Math.max(maxJoinGapPx,joins.maxGapPx);const opponentJoins=assessSourceJoinContinuity(opponentJoinState.probe,opponentJoinState.positions);if(opponentJoins.status!=='PASS')throw Error('Platypus attachment reopened: '+s.id+' at '+i*10000/600);maxOpponentJoinGapPx=Math.max(maxOpponentJoinGapPx,opponentJoins.maxGapPx);for(const [name,key]of Object.entries(state.facingReview.opponentPose)){const e=extrema.get(name)??[Infinity,-Infinity];e[0]=Math.min(e[0],key.rotation);e[1]=Math.max(e[1],key.rotation);extrema.set(name,e);}}const ranges=Object.fromEntries([...extrema].map(([n,[lo,hi]])=>[n,hi-lo]));if(['head','jaw','tail1','foreNearKnee'].some(n=>!(ranges[n]>.005)))throw Error('Opponent joint stayed static');rows.push({id:s.id,samples:601,opponentJointRanges:ranges,visibleSourceJoins:{count:joinState.probe.joins.length,maxGapPx:maxJoinGapPx,epsilonNativePx:joinState.probe.epsilonNativePx,replacedHeadJoins:joinState.excludedHidden},opponentSourceJoins:{count:opponentJoinState.probe.joins.length,maxGapPx:maxOpponentJoinGapPx,epsilonNativePx:opponentJoinState.probe.epsilonNativePx},status:'PASS'});}return {status:'PASS',scope:'Finite skin publication and no head triangle flips; real opponent articulation. Does not establish visual fit or head yaw coverage.',rows};}
 Object.assign(window.cfPartsMotion,{impactWitness,attachmentCoverage,facingCoverage,facingGate,select,frame,capture,repairGates,bandGates,pairGateStart,renderPair,seamGates,skinGates:()=>runSkinGates({app,subjects,select,plans:()=>plans,motionPose,image}),plans:()=>plans});select('civet');frame(0);state.status='READY';
}catch(e){state.status='FAIL';state.errors.push(String(e.stack??e));}
