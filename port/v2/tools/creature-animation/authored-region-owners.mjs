/** One source owner per rig joint; retain every priority-painted region on the label raster. */
export function authoredRegionOwners(parts,remainderPart){
 const need=(v,m)=>{if(!v)throw Error('Authored region owners: '+m);};
 need(Array.isArray(parts)&&parts.length>0,'parts required');
 const ids=new Set(),groups=new Map();
 for(const p of parts){need(typeof p.id==='string'&&p.id&&!ids.has(p.id),'unique part ids');ids.add(p.id);need(typeof p.joint==='string'&&p.joint,'joint required');need(['near','far'].includes(p.layer),'layer required');if(!groups.has(p.joint))groups.set(p.joint,[]);groups.get(p.joint).push(p);}
 need(ids.has(remainderPart),'known remainder part');
 const jointOrder=[...groups.keys()],ownerParts=jointOrder.map(joint=>{const regions=groups.get(joint),chosen=regions.find(p=>p.id===remainderPart)??regions.find(p=>p.id===joint)??regions[0];return{id:chosen.id,joint,layer:regions.some(p=>p.layer==='near')?'near':'far'};});
 const ownerIndex=parts.map(p=>jointOrder.indexOf(p.joint));
 const regionOwnerMap=parts.map((p,i)=>({region:p.id,joint:p.joint,owner:ownerParts[ownerIndex[i]].id}));
 return{ownerParts,ownerIndex,regionOwnerMap,remainderOwner:regionOwnerMap.find(p=>p.region===remainderPart).owner,merged:ownerParts.length!==parts.length};
}
