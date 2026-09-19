/** Read-only review inventory. A sourceKey identifies a plan slot; this tool does
 * not invent a generator taxonomy, compile a system card or grant art acceptance. */
import {readBoundFile,inspectMaster,sha256} from './contracts.mjs';
const need=(ok,why)=>{if(!ok)throw Error('Art batch: '+why);};
export function inspectArtBatch(root,batch){
 need(batch?.schema==='cf.art-review-batch/v1','batch schema');
 need(typeof batch.batchId==='string'&&/^[a-z0-9][a-z0-9-]{0,95}$/.test(batch.batchId),'batch identity');
 const planBytes=readBoundFile(root,batch.plan),plan=JSON.parse(planBytes);
 need(plan.schema==='cf.art-review-plan/v1'&&Array.isArray(plan.slots)&&plan.slots.length>0&&plan.slots.length<=12,'one to twelve planned masters');
 const keys=new Set();for(const slot of plan.slots){
  need(typeof slot.sourceKey==='string'&&slot.sourceKey.trim().length>0&&slot.sourceKey.length<=256&&!keys.has(slot.sourceKey),'unique source keys');keys.add(slot.sourceKey);
  need(['cutout','plate'].includes(slot.kind),'runtime size category');
 }
 need(Array.isArray(batch.masters)&&batch.masters.length===plan.slots.length,'complete planned inventory');
 const paths=new Set(),hashes=new Set(),rows=batch.masters.map((row,index)=>{
  const slot=plan.slots[index];need(row.sourceKey===slot.sourceKey&&row.kind===slot.kind,'generation order / planned identity at slot '+(index+1));
  need(!paths.has(row.path),'duplicate path');paths.add(row.path);
  need(!hashes.has(row.sha256),'same image assigned to different planned masters');hashes.add(row.sha256);
  const bytes=readBoundFile(root,row),facts=inspectMaster(bytes,row.kind);
  return {ordinal:index+1,sourceKey:row.sourceKey,path:row.path,kind:row.kind,...facts};
 });
 return {schema:'cf.art-review-batch-report/v1',batchId:batch.batchId,planSha256:sha256(planBytes),
  status:'TECHNICAL_READY_FOR_REVIEW',masters:rows,qualityAccepted:false,
  pending:['Nick reviews every image/sheet','subject and frozen-style conformance','key-edge intake where applicable'],
  scope:'Inventory, original byte hashes and runtime minima only; existing human approvals are neither inferred nor revoked.'};
}
