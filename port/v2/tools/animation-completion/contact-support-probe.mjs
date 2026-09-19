/** Read-only independent support probe. Keeps exact triangle LBS separate from
 * the barycentric-weight point model and from ARAP/Float32 publication. */
export function sampleSupportResidual({mark,skin,matrices,current,target,width,height}){
 const transform=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]],weights=new Map(),lbs=[0,0];
 for(let k=0;k<3;k++){const v=skin.vertices[mark.vertex.triangle[k]],b=mark.vertex.barycentric[k];for(const [joint,w]of v.weights){const q=transform(matrices[joint],[v.x/width,v.y/height]);lbs[0]+=b*w*q[0];lbs[1]+=b*w*q[1];weights.set(joint,(weights.get(joint)??0)+b*w);}}
 const model=[0,0];for(const [joint,w]of weights){const q=transform(matrices[joint],mark.xy);model[0]+=w*q[0];model[1]+=w*q[1];}
 const delta=(a,b)=>[(a[0]-b[0])*width,(a[1]-b[1])*height];
 return {joint:mark.joint,lbsPrediction:lbs,weightedPointPrediction:model,published:current,
  kinematicResidualPx:target?delta(lbs,target):null,weightedPointResidualPx:target?delta(model,target):null,
  arapResidualPx:delta(current,lbs),weightPositionCovariancePx:delta(lbs,model),publishedResidualPx:target?delta(current,target):null};
}
