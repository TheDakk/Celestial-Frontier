/** Two-joint strips made from authored ownership edges. No new pigment or curves.
 * At rest both copies of an edge coincide: the strip has exactly zero area.
 * Under motion its two sides follow the two actual part transforms. */
import {GRAPH} from './quadruped-template.mjs';
const parent=new Map(GRAPH);
const need=(ok,why)=>{if(!ok)throw Error('Seam bridge: '+why);};
export function validateSeamBridges(groups,parts,width,height,atlasSize,joints){
 need(Array.isArray(groups)&&groups.length>0&&parts.length<=40&&groups.length<=parts.length,'group budget');
 const ids=new Set(),owners=new Map(parts.map(p=>[p.id,p]));let count=0;
 const jointOwners=new Map(parts.filter(p=>p.kind==='part').map(p=>[p.joint,p.id]));
 const nearestOwner=joint=>{for(let j=parent.get(joint);j;j=parent.get(j)){if(j==='root'||j==='pelvis')return 'torso';if(jointOwners.has(j))return jointOwners.get(j);}return null;};
 for(const g of groups){
  const patch=owners.get(g.id);
  need(typeof g.id==='string'&&!ids.has(g.id)&&patch?.kind==='joint-patch'&&patch.joint===g.ancestorJoint&&patch.layer===g.layer,'group identity');ids.add(g.id);
  need(joints.includes(g.ancestorJoint)&&['far','near'].includes(g.layer)&&Array.isArray(g.edges)&&g.edges.length>0,'group');
  for(const e of g.edges){
   need(++count<=20000,'edge budget');const source=owners.get(e.sourcePart),ancestor=owners.get(e.ancestorPart);
   need(source?.kind==='part'&&ancestor?.kind==='part'&&source.joint===e.descendantJoint&&ancestor.joint===g.ancestorJoint&&source.layer===g.layer,'source/ancestor ownership');
   need(nearestOwner(e.descendantJoint)===e.ancestorPart,'true joint required; rest overlap must not be stitched');
   need(source.frame.width===source.cutout.width&&source.frame.height===source.cutout.height,'native source pixels required');
   need(Array.isArray(e.edge)&&e.edge.length===2&&e.edge.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&p[0]>=0&&p[0]<=width&&p[1]>=0&&p[1]<=height),'edge coordinates');
   const [[ax,ay],[bx,by]]=e.edge;need(Math.abs(ax-bx)+Math.abs(ay-by)===1,'unit ownership edge');
   need(Array.isArray(e.sourcePixel)&&e.sourcePixel.length===2&&e.sourcePixel.every(Number.isInteger),'source pixel');
   const [x,y]=e.sourcePixel,b=source.cutout;
   need(x>=b.x&&y>=b.y&&x<b.x+b.width&&y<b.y+b.height,'source pixel bounds');
   need(ax===bx?((x===ax||x===ax-1)&&y===Math.min(ay,by)):((y===ay||y===ay-1)&&x===Math.min(ax,bx)),'source pixel touches edge');
   need(Number.isFinite(e.sourceDepthPx)&&e.sourceDepthPx>0&&e.sourceDepthPx<=Math.min(width/8,b.width/2,b.height/2)+1e-9,'unchanged depth cap');
  }
 }
 need(atlasSize.width>0&&atlasSize.height>0,'atlas size');return count;
}
export function createSeamGeometry(group,parts,width,height,atlasSize){
 const owners=new Map(parts.map(p=>[p.id,p])),n=group.edges.length+1,patch=owners.get(group.id);
 const positions=new Float32Array(n*8),pending=new Float32Array(n*8),uvs=new Float32Array(n*8),indices=new Uint32Array(n*6);
 const f=patch.frame;uvs.set([f.x/atlasSize.width,f.y/atlasSize.height,(f.x+f.width)/atlasSize.width,f.y/atlasSize.height,(f.x+f.width)/atlasSize.width,(f.y+f.height)/atlasSize.height,f.x/atlasSize.width,(f.y+f.height)/atlasSize.height]);
 indices.set([0,1,2,0,2,3]);
 group.edges.forEach((e,index)=>{const k=index+1;
  const p=owners.get(e.sourcePart),u=(p.frame.x+e.sourcePixel[0]-p.cutout.x+.5)/atlasSize.width,v=(p.frame.y+e.sourcePixel[1]-p.cutout.y+.5)/atlasSize.height;
  for(let j=0;j<4;j++){uvs[k*8+j*2]=u;uvs[k*8+j*2+1]=v;}
  indices.set([k*4,k*4+1,k*4+2,k*4,k*4+2,k*4+3],k*6);
 });
 return {positions,pending,uvs,indices};
}
export function writeSeamPose(group,matrices,width,height,output,staticBox){
 need(output.length===(group.edges.length+1)*8,'position buffer');
 const a=matrices[group.ancestorJoint];need(a?.length===6&&a.every(Number.isFinite),'ancestor matrix');
 const corners=[[staticBox.x,staticBox.y],[staticBox.x+staticBox.width,staticBox.y],[staticBox.x+staticBox.width,staticBox.y+staticBox.height],[staticBox.x,staticBox.y+staticBox.height]];
 corners.forEach(([px,py],i)=>{const x=px/width,y=py/height;output[i*2]=a[0]*x+a[2]*y+a[4];output[i*2+1]=a[1]*x+a[3]*y+a[5];});
 const checked=new Set();
 for(let k=0;k<group.edges.length;k++){
  const e=group.edges[k],d=matrices[e.descendantJoint];
  if(!checked.has(d)){need(d?.length===6&&d.every(Number.isFinite),'descendant matrix');checked.add(d);}
  const x0=e.edge[0][0]/width,y0=e.edge[0][1]/height,x1=e.edge[1][0]/width,y1=e.edge[1][1]/height;
  const ax0=a[0]*x0+a[2]*y0+a[4],ay0=a[1]*x0+a[3]*y0+a[5],ax1=a[0]*x1+a[2]*y1+a[4],ay1=a[1]*x1+a[3]*y1+a[5];
  const dx0=d[0]*x0+d[2]*y0+d[4],dy0=d[1]*x0+d[3]*y0+d[5],dx1=d[0]*x1+d[2]*y1+d[4],dy1=d[1]*x1+d[3]*y1+d[5];
  const span2=Math.max(((ax0-dx0)*width)**2+((ay0-dy0)*height)**2,((ax1-dx1)*width)**2+((ay1-dy1)*height)**2);
  need(Number.isFinite(span2),'nonfinite span');
  const o=(k+1)*8;output[o]=ax0;output[o+1]=ay0;output[o+2]=ax1;output[o+3]=ay1;output[o+4]=dx1;output[o+5]=dy1;output[o+6]=dx0;output[o+7]=dy0;
 }
 need(output.every(Number.isFinite),'position overflow');
}
