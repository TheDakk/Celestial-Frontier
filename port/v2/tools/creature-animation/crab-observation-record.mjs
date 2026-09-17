/** Compile only the geometry emitted by crabBody. Never add lobster anatomy.
 * This is a hash-bound observed record, not a part-mask or visual acceptance. */
import {sealFamilyRecord,checkFamilyGeometry} from './family-record.mjs';
import {hashJSON} from './quadruped-template.mjs';
export async function compileCrabObservationRecord(topology,input){
 if(topology?.schema!=='cf.painter-topology/v1'||!['crabBody','resetCrabII:freshwaterCrab','resetCrabII:mudCrab','resetCrabII:ventCrab'].includes(topology.ownerId)||topology.family!=='brachyuran'||!Number.isFinite(topology.coordinateSize)||topology.coordinateSize<=0)throw Error('Crab observation: unsupported source');
 const size=topology.coordinateSize,seen=new Set(),landmarks={},surfaceAttachments=[];
 const frame=topology.rasterFrame??{width:size,height:size,origin:[0,0],scale:1};
 if(frame.width!==input.width||frame.height!==input.height||!Array.isArray(frame.origin)||frame.origin.length!==2||frame.origin.some(v=>!Number.isFinite(v))||!Number.isFinite(frame.scale)||frame.scale<=0)throw Error('Crab observation: raster frame mismatch');
 const project=p=>{if(p.length!==2||p.some(v=>!Number.isFinite(v)))throw Error('Crab observation: coordinates');const out=p.map((v,i)=>(v*frame.scale+frame.origin[i])/[frame.width,frame.height][i]);if(out.some(v=>v<0||v>1))throw Error('Crab observation: coordinates outside raster');return out;};
 const feature=(id,length)=>{const f=topology.features.find(f=>f.id===id);if(!f||f.points.length!==length||seen.has(id)||topology.features.filter(f=>f.id===id).length!==1)throw Error('Crab observation: missing/duplicate geometry '+id);seen.add(id);return f.points.map(project);};
 [landmarks.root,landmarks.carapace]=feature('carapace',2);
 for(const side of ['Far','Near']){
  for(let i=0;i<4;i++){
   const prefix='leg'+i+side,[root,knee,foot]=feature(prefix,3);landmarks[prefix+'Root']=root;landmarks[prefix+'Knee']=knee;landmarks[prefix+'Foot']=foot;
  }
  [landmarks['eye'+side+'Root'],landmarks['eye'+side+'Tip']]=feature('eye'+side,2);
  [landmarks['claw'+side+'Base'],landmarks['claw'+side+'Elbow'],landmarks['claw'+side+'Palm']]=feature('chela'+side,3);
  for(const [source,part]of[['fixedFinger','Fixed'],['dactyl','Dactyl']]){
   const [root,,tip]=feature(source+side,3);landmarks['claw'+side+part+'Root']=root;landmarks['claw'+side+part+'Tip']=tip;
  }
 }
 // Paddles are rigid surfaces attached to existing feet, not fabricated ninth/tenth legs.
 for(const side of ['Far','Near']){
  const id='leg3'+side+'Paddle',paddle=topology.features.find(f=>f.id===id);
  if(topology.ownerId==='resetCrabII:mudCrab'){
   const [center,pivot]=feature(id,2),joint='leg3'+side+'Foot';
   if(paddle.kind!=='body'||paddle.curve!=='ellipse'||paddle.widths?.length!==2||paddle.widths.some(v=>!Number.isFinite(v)||v<=0||v>size)||pivot.some((v,i)=>v!==landmarks[joint][i]))throw Error('Crab observation: invalid terminal paddle');
   surfaceAttachments.push({id,joint,center,pivot,diameters:paddle.widths.map((v,i)=>v*frame.scale/[frame.width,frame.height][i]),angle:Math.atan2(center[1]-pivot[1],center[0]-pivot[0]),layer:paddle.layer});
  }else if(paddle)throw Error('Crab observation: unexpected terminal paddle');
 }
 if(seen.size!==topology.features.length)throw Error('Crab observation: unrepresented source feature');
 if(input.identity?.ownerId!==topology.ownerId)throw Error('Crab observation: owner mismatch');
 const record={kind:'brachyuran',family:'brachyuran',identity:input.identity,template:{id:'brachyuran',version:1},geometry:{cutoutAssetHash:input.cutoutAssetHash,width:input.width,height:input.height,groundLineY:Math.max(...Object.entries(landmarks).filter(([j])=>/^leg.*Foot$/.test(j)).map(([,p])=>p[1])),depthLayers:[{id:'far',order:0},{id:'near',order:1}]},landmarks,surfaceAttachments,rasterFrame:frame,materials:topology.materials,clipSetId:'brachyuran-v1',observationHash:await hashJSON(topology),coverage:{scope:'Painter-observed geometry; not painted fit or visual acceptance',unproven:[...topology.unresolved,'skin binding, contact, full native motion and visual acceptance']}};
 checkFamilyGeometry(record);return sealFamilyRecord(record);
}
