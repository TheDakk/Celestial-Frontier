/** Compile only the geometry emitted by crabBody. Never add lobster anatomy.
 * This is a hash-bound observed record, not a part-mask or visual acceptance. */
import {sealFamilyRecord,checkFamilyGeometry} from './family-record.mjs';
import {hashJSON} from './quadruped-template.mjs';
export async function compileCrabObservationRecord(topology,input){
 if(topology?.schema!=='cf.painter-topology/v1'||topology.ownerId!=='crabBody'||topology.family!=='brachyuran'||!Number.isFinite(topology.coordinateSize)||topology.coordinateSize<=0)throw Error('Crab observation: unsupported source');
 const size=topology.coordinateSize,seen=new Set(),landmarks={};
 const feature=(id,length)=>{const f=topology.features.find(f=>f.id===id);if(!f||f.points.length!==length||seen.has(id)||topology.features.filter(f=>f.id===id).length!==1)throw Error('Crab observation: missing/duplicate geometry '+id);seen.add(id);return f.points.map(p=>{if(p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>size))throw Error('Crab observation: coordinates '+id);return p.map(v=>v/size);});};
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
 if(seen.size!==topology.features.length)throw Error('Crab observation: unrepresented source feature');
 if(input.identity?.ownerId!==topology.ownerId)throw Error('Crab observation: owner mismatch');
 const record={kind:'brachyuran',family:'brachyuran',identity:input.identity,template:{id:'brachyuran',version:1},geometry:{cutoutAssetHash:input.cutoutAssetHash,width:input.width,height:input.height,groundLineY:Math.max(...Object.entries(landmarks).filter(([j])=>/^leg.*Foot$/.test(j)).map(([,p])=>p[1])),depthLayers:[{id:'far',order:0},{id:'near',order:1}]},landmarks,materials:topology.materials,clipSetId:'brachyuran-v1',observationHash:await hashJSON(topology),coverage:{scope:'Painter-observed geometry; not painted fit or visual acceptance',unproven:[...topology.unresolved,'skin binding, contact, full native motion and visual acceptance']}};
 checkFamilyGeometry(record);return sealFamilyRecord(record);
}
