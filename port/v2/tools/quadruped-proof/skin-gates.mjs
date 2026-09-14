/** Rest, native pose images and update budget for the continuous paint field.
 * Human whole-shape judgment is separate from these mechanical observations. */
import {Sprite,Texture,RenderTexture} from 'pixi.js';
export async function runSkinGates({app,subjects,json}){
 const saved=await json('skin-poses.json'),rows=[],artifacts={};
 for(const s of subjects){const w=s.record.geometry.width,h=s.record.geometry.height,cw=w*2,ch=h*2,rt=RenderTexture.create({width:cw,height:ch,resolution:1});
  const pixels=node=>{const x=node.x,y=node.y;node.position.set(x+w/2,y+h/2);try{app.renderer.render({container:node,target:rt,clear:true});return Uint8Array.from(app.renderer.extract.pixels({target:rt}).pixels);}finally{node.position.set(x,y);}};
  const save=async(name,rgba)=>{const c=new OffscreenCanvas(cw,ch);c.getContext('2d').putImageData(new ImageData(Uint8ClampedArray.from(rgba),cw,ch),0,0);const b=new Uint8Array(await(await c.convertToBlob({type:'image/png'})).arrayBuffer());let raw='';for(let i=0;i<b.length;i+=8192)raw+=String.fromCharCode(...b.subarray(i,i+8192));artifacts[s.id+'-'+name+'.png']=btoa(raw);};
  const reference=new Sprite(Texture.from(s.paint.canvas)),expected=pixels(reference),poses=saved.seamGates.rows.find(r=>r.id===s.id).poses;
  s.rig.root.position.set(0,0);s.rig.root.scale.set(w,h);s.rig.applyPose({});const rest=pixels(s.rig.root),restChangedChannels=rest.reduce((n,v,i)=>n+(v!==expected[i]),0);
  await save('rest',rest);const row={id:s.id,restChangedChannels,poses,canvas:{width:cw,height:ch,origin:[w/2,h/2],nativeScale:1},updateP95Ms:null,status:'RUNNING'};
  if(restChangedChannels){row.status='REST_FAIL';rows.push(row);rt.destroy(true);return{status:'FAIL',rows,artifacts};}
  for(const[name,{pose}]of Object.entries(poses)){s.rig.applyPose(pose);await save(name,pixels(s.rig.root));}
  const times=[];for(let i=0;i<240;i++){const pose=Object.values(poses)[i%Object.keys(poses).length].pose,t=performance.now();s.rig.applyPose(pose);times.push(performance.now()-t);}times.sort((a,b)=>a-b);row.updateP95Ms=times[Math.floor(times.length*.95)];row.status=row.updateP95Ms<2?'PASS':'UPDATE_BUDGET_FAIL';rows.push(row);rt.destroy(true);
  s.rig.root.position.set(-s.record.landmarks.root[0]*s.scale,-s.record.geometry.groundLineY*s.scale);s.rig.root.scale.set(s.scale);
  if(row.status!=='PASS')return{status:'FAIL',rows,artifacts};
 }
 return{status:'PASS',rows,artifacts,scope:'Native rest preservation and pose/update observations. Shape, animated joins and full battle capture acceptance remain separate.'};
}
