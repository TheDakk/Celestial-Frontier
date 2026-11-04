/** Read-only independent support probe. Keeps exact triangle LBS separate from
 * the exact support model and from ARAP/Float32 publication. */
export function sampleSupportResidual({mark,skin,matrices,current,target,width,height,prediction}){
 const transform=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]],lbs=[0,0];
 for(let k=0;k<3;k++){const v=skin.vertices[mark.vertex.triangle[k]],b=mark.vertex.barycentric[k];for(const [joint,w]of v.weights){const q=transform(matrices[joint],[v.x/width,v.y/height]);lbs[0]+=b*w*q[0];lbs[1]+=b*w*q[1];}}
 if(!Array.isArray(prediction)||prediction.length!==2||prediction.some(v=>!Number.isFinite(v)))throw Error('Support probe: explicit model prediction required');const model=prediction;
 const delta=(a,b)=>[(a[0]-b[0])*width,(a[1]-b[1])*height];
 return {joint:mark.joint,lbsPrediction:lbs,supportPrediction:model,published:current,
  kinematicResidualPx:target?delta(lbs,target):null,modelResidualPx:target?delta(model,target):null,
  arapResidualPx:delta(current,lbs),modelToTriangleResidualPx:delta(lbs,model),publishedResidualPx:target?delta(current,target):null};
}
