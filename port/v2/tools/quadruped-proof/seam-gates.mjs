/** Native pixels qualify the strips; geometry alone never grants acceptance. */
import {Container,Sprite,Texture,Mesh,MeshGeometry,Matrix,RenderTexture,Rectangle} from 'pixi.js';
import {loadCreatureRigV1} from '../../apps/game/src/creature-rig.ts';
import {createSeamGeometry,writeSeamPose} from '../creature-animation/seam-bridge.mjs';
import {ownershipJunctions,measureJunctions} from '../creature-animation/ownership-junctions.mjs';
import {sharedCutEdges,measureCutSeam,requireCutInventory} from '../creature-animation/cut-seam.mjs';
export async function runSeamGates({app,subjects,select,plans,motionPose,image,json,bytes,poseMatrices}){
 const rows=[],artifacts={};
 for(const s of subjects){
  select(s.id);const w=s.record.geometry.width,h=s.record.geometry.height,cw=w*2,ch=h*2,padx=w/2,pady=h/2,rt=RenderTexture.create({width:cw,height:ch,resolution:1});
  const padded=m=>[m[0],m[1],m[2],m[3],(m[4]+.5)/2,(m[5]+.5)/2];
  const pixels=node=>{const x=node.x,y=node.y;node.position.set(x+padx,y+pady);try{app.renderer.render({container:node,target:rt,clear:true});return Uint8Array.from(app.renderer.extract.pixels({target:rt}).pixels);}finally{node.position.set(x,y);}};
  const save=async(name,rgba)=>{const c=new OffscreenCanvas(cw,ch);c.getContext('2d').putImageData(new ImageData(Uint8ClampedArray.from(rgba),cw,ch),0,0);const b=new Uint8Array(await(await c.convertToBlob({type:'image/png'})).arrayBuffer());let raw='';for(let i=0;i<b.length;i+=8192)raw+=String.fromCharCode(...b.subarray(i,i+8192));artifacts[s.id+'-'+name+'.png']=btoa(raw);};
  const rigidBinding=await json(s.id+'-rigid.binding.json'),rigid=await loadCreatureRigV1(s.record,rigidBinding,s.master,s.alpha,new Uint8Array(await bytes(s.id+'.atlas.png')));
  const atlasImage=await image(s.id+'.atlas.png'),atlasTexture=s.rig.parts.find(p=>p.id===s.binding.seamBridges.groups[0].id).display.children[0].texture;
  const decl=await json(s.id+'.cuts.json'),poses={};
  const inventory=requireCutInventory(s.binding.seamBridges.groups,decl.cuts);
  if(s.id==='civet')Object.assign(poses,(await json('saved-poses.json')).pairGates.poses);
  else{const p=plans(),stride=f=>p[0].beats.commandEnd+(p[0].beats.actionStart-p[0].beats.commandEnd)*f*p[0].clips.attacker.approach.timeline.bodyMs/p[0].clips.attacker.approach.timeline.durationMs;
   for(const[name,ms]of [['rest',null],['hit-recoil',7400],['strike',p[0].beats.impactAt],['approach-quarter',stride(.25)],['approach-three-quarter',stride(.75)]]){
    let pose={};if(ms!==null){const rev=ms>=5000,t=rev?ms-5000:ms,plan=p[rev?1:0];pose=s.solver.resolve(motionPose(plan,t,rev),rev||t<plan.beats.commandEnd||t>=plan.beats.returnEnd).pose;}poses[name]={atMs:ms,pose};
   }
  }
  const reference=new Sprite(Texture.from(s.paint.canvas)),expected=pixels(reference),row={id:s.id,canvas:{width:cw,height:ch,origin:[padx,pady],nativeScale:1},poses,inventory,rest:{},pairs:[],updateP95Ms:null};
  for(const [name,rig]of [['rigid',rigid],['strips',s.rig]]){
   rig.root.position.set(0,0);rig.root.scale.set(w,h);rig.applyPose({});const rgba=pixels(rig.root);row.rest[name]=rgba.reduce((n,v,i)=>n+(v!==expected[i]),0);await save(name+'-rest',rgba);
  }
  if(Object.values(row.rest).some(n=>n!==0)){row.status='REST_FAIL';rows.push(row);rigid.dispose();rt.destroy(true);return{status:'FAIL',rows,artifacts};}
  const masks=new Map(),mask=id=>{if(masks.has(id))return masks.get(id);const p=s.binding.parts.find(p=>p.id===id),a=new Uint8Array(w*h),f=p.frame,b=p.cutout;
   for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++)if(atlasImage.rgba[((f.y+y)*atlasImage.canvas.width+f.x+x)*4+3]>8)a[(b.y+y)*w+b.x+x]=1;masks.set(id,a);return a;};
  const baseParts=s.binding.parts.filter(p=>p.kind==='part'),owner=new Uint8Array(w*h),junctionAlpha=new Uint8Array(w*h);
  baseParts.forEach((p,k)=>{const a=mask(p.id);for(let i=0;i<a.length;i++)if(a[i]){if(owner[i])throw Error('Junction base ownership overlaps');owner[i]=k+1;const x=i%w-p.cutout.x,y=Math.floor(i/w)-p.cutout.y;junctionAlpha[i]=atlasImage.rgba[((p.frame.y+y)*atlasImage.canvas.width+p.frame.x+x)*4+3];}});
  const junctions=ownershipJunctions(owner,baseParts,w,h,junctionAlpha),declared=s.binding.seamBridges.groups.flatMap(g=>g.junctions??[]);
  const order=a=>JSON.stringify([...a].sort((x,y)=>x.point[1]-y.point[1]||x.point[0]-y.point[0]));
  if(order(junctions)!==order(declared))throw Error('Missing or changed ownership junctions');
  row.junctions={count:junctions.length,frames:{}};
  for(const sourceGroup of s.binding.seamBridges.groups){
   const pairs=[...new Set(sourceGroup.edges.map(e=>e.ancestorPart+'--'+e.sourcePart))];
   for(const name of pairs){
    const subset=sourceGroup.edges.filter(e=>e.ancestorPart+'--'+e.sourcePart===name),g={...sourceGroup,edges:subset,junctions:[]},first=subset[0],cut=decl.cuts.find(c=>c.ancestor+'--'+c.descendant===name),ci=decl.cuts.indexOf(cut);
    const independent=sharedCutEdges(mask(first.ancestorPart),mask(first.sourcePart),w,h);
    if(JSON.stringify(independent)!==JSON.stringify(subset.map(e=>e.edge)))throw Error('Compiled cut omitted or changed ownership edges: '+name);
    const band=await image(s.id+'-pair-'+ci+'.png'),bandTexture=Texture.from(band.canvas),container=new Container();container.scale.set(w,h);
    const far=new Container(),near=new Container();container.addChild(far,near);const place=(node,layer)=>(layer==='far'?far:near).addChild(node);
    const bandNode=new Container(),bandSprite=new Sprite(bandTexture),b=cut.pairBand.cutout;bandSprite.position.set(b.x/w,b.y/h);bandSprite.scale.set(1/w,1/h);bandNode.addChild(bandSprite);place(bandNode,cut.layer);
    const bufs=createSeamGeometry(g,s.binding.parts,w,h,s.binding.atlasSize),geometry=new MeshGeometry({positions:bufs.positions,uvs:bufs.uvs,indices:bufs.indices.slice(6)}),mesh=new Mesh({geometry,texture:atlasTexture});place(mesh,cut.layer);
    const baseNodes=[first.ancestorPart,first.sourcePart].map(id=>{const p=s.binding.parts.find(p=>p.id===id),source=s.rig.parts.find(p=>p.id===id).display.children[0],sprite=new Sprite(source.texture),node=new Container();sprite.position.set(p.cutout.x/w,p.cutout.y/h);sprite.scale.set(1/w,1/h);node.addChild(sprite);place(node,p.layer);return{p,node};});
    const pair={name,frames:{}};
    for(const [frame,{pose}]of Object.entries(poses)){
     const m=poseMatrices(s.record,pose);bandNode.setFromMatrix(new Matrix(...m[g.ancestorJoint]));for(const{p,node}of baseNodes)node.setFromMatrix(new Matrix(...m[p.joint]));
     writeSeamPose(g,m,w,h,bufs.positions,s.binding.parts.find(p=>p.id===g.id).cutout);geometry.getBuffer('aPosition').update();
     const args={edges:independent,ancestorMatrix:padded(m[g.ancestorJoint]),descendantMatrix:padded(m[first.descendantJoint]),width:cw,height:ch};
     bandNode.visible=true;mesh.visible=false;const control=pixels(container),old=measureCutSeam({...args,rgba:control});bandNode.visible=g.rigidUnderlap!==false;mesh.visible=true;const actual=pixels(container),result=measureCutSeam({...args,rgba:actual});
     pair.frames[frame]={rigid:old,strips:result};
     if(name==='head--ear-far'||result.status!=='NO_GAP_AT_CUT'){await save(name+'-'+frame+'-rigid',control);await save(name+'-'+frame+'-strips',actual);}
    }
    row.pairs.push(pair);container.destroy({children:true});geometry.destroy();bandTexture.destroy(true);
    if(Object.values(pair.frames).some(f=>f.strips.status!=='NO_GAP_AT_CUT')){row.status='CUT_FAIL';rows.push(row);rigid.dispose();rt.destroy(true);return{status:'FAIL',rows,artifacts};}
   }
  }
  const times=[];for(let i=0;i<240;i++){const pose=Object.values(poses)[i%Object.keys(poses).length].pose,at=performance.now();s.rig.applyPose(pose);times.push(performance.now()-at);}times.sort((a,b)=>a-b);row.updateP95Ms=times[Math.floor(times.length*.95)];
  for(const[frame,{pose}]of Object.entries(poses)){s.rig.applyPose(pose);const rgba=pixels(s.rig.root);await save('full-'+frame,rgba);
   row.junctions.frames[frame]=measureJunctions(junctions,poseMatrices(s.record,pose),w,h,rgba,cw,ch,[padx,pady]);
  }
  if(Object.values(row.junctions.frames).some(f=>f.status!=='NO_GAP_AT_JUNCTION')){row.status='JUNCTION_FAIL';rows.push(row);rigid.dispose();rt.destroy(true);return{status:'FAIL',rows,artifacts};}
  row.status=row.updateP95Ms<2?'PASS':'UPDATE_BUDGET_FAIL';rows.push(row);rigid.dispose();rt.destroy(true);
  s.rig.root.position.set(-s.record.landmarks.root[0]*s.scale,-s.record.geometry.groundLineY*s.scale);s.rig.root.scale.set(s.scale);
  if(row.status!=='PASS')return{status:'FAIL',rows,artifacts};
 }
 return{status:'PASS',rows,artifacts,scope:'Rest pixels, native joint-cut coverage and CPU update; whole-shape and ten-second motion review still required'};
}
