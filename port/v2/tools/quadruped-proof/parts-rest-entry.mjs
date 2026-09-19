import {Application,Texture,Sprite,RenderTexture} from 'pixi.js';
import {loadCreatureRigV1} from '../../apps/game/src/creature-rig.ts';
const json=n=>fetch(n).then(r=>r.json()),bytes=n=>fetch(n).then(r=>r.arrayBuffer());
const app=new Application();await app.init({width:1254,height:1254,resolution:1,antialias:false,preference:'webgl',autoStart:false,backgroundAlpha:0});document.body.append(app.canvas);
window.cfPartsRest={status:'RUNNING'};
try{
 const [record,binding,master,atlas,keyedBytes]=await Promise.all([json('record.json'),json('binding.json'),bytes('master.png'),bytes('atlas.png'),bytes('keyed.png')]);
 const bitmap=await createImageBitmap(new Blob([keyedBytes])),canvas=new OffscreenCanvas(bitmap.width,bitmap.height);canvas.getContext('2d').drawImage(bitmap,0,0);const raw=canvas.getContext('2d').getImageData(0,0,bitmap.width,bitmap.height).data;
 const alpha=Uint8Array.from({length:bitmap.width*bitmap.height},(_,i)=>raw[i*4+3]);
 const rig=await loadCreatureRigV1(record,binding,new Uint8Array(master),alpha,new Uint8Array(atlas));rig.root.scale.set(bitmap.width,bitmap.height);
 const reference=new Sprite(Texture.from(bitmap)),target=RenderTexture.create({width:bitmap.width,height:bitmap.height,resolution:1});
 const pixels=node=>{app.renderer.render({container:node,target,clear:true});return app.renderer.extract.pixels({target}).pixels;};
 const oracle=pixels(reference),actual=pixels(rig.root),difference=(a,b)=>{let channels=0,max=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i]){channels++;max=Math.max(max,Math.abs(a[i]-b[i]));}return{channels,max};};
 const rest=difference(oracle,actual),head=rig.parts.find(p=>p.id==='head');head.display.visible=false;const missingHead=difference(oracle,pixels(rig.root));head.display.visible=true;
 const updates=[];for(let i=0;i<1200;i++){const t=performance.now();rig.applyPose({});if(i>=200)updates.push(performance.now()-t);}const mean=updates.reduce((a,b)=>a+b,0)/updates.length;
 app.stage.addChild(rig.root);app.renderer.render(app.stage);
 window.cfPartsRest={status:rest.channels===0&&missingHead.channels>1000?'PASS':'FAIL',rest,missingHeadNegativeControl:missingHead,parts:rig.parts.length,updateMeanMs:mean,renderer:app.renderer.name,scope:'native rest-pixel admission only; no motion, staging or animation acceptance'};
 target.destroy(true);reference.destroy({texture:true,textureSource:true});
}catch(error){window.cfPartsRest={status:'FAIL',error:String(error.stack??error)};}
