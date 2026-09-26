/** Template-declared motion units, distinct from legacy pose translation/body bounds. */
export const MOTION_SCALE_REFERENCES=Object.freeze({
 brachyuran:Object.freeze({kind:'span',axis:Object.freeze(['leg0FarRoot','leg0NearRoot'])}),
 'plant-woody':Object.freeze({kind:'longest-chain',origin:'root'}),
 'plant-herb':Object.freeze({kind:'longest-chain',origin:'root'}),
});
export function motionScaleReference(template){return MOTION_SCALE_REFERENCES[template.id]??{kind:'span',axis:template.bodyAxis??['pelvis','chest']};}
export function measureMotionScale(template,landmarks){
 const reference=motionScaleReference(template),distance=(a,b)=>{const p=landmarks[a],q=landmarks[b];if(!p||!q)throw Error('Motion scale: missing observed landmark');return Math.hypot(q[0]-p[0],q[1]-p[1]);};
 let length;
 if(reference.kind==='span')length=distance(...reference.axis);
 else{const lengths={[reference.origin]:0};for(const[j,p]of template.graph){if(lengths[p]===undefined)throw Error('Motion scale: parent order');lengths[j]=lengths[p]+distance(p,j);}length=Math.max(...Object.values(lengths));}
 if(!Number.isFinite(length)||length<=0)throw Error('Motion scale: invalid reference');
 if(template.id==='brachyuran'&&(length<.08||length>.9))throw Error('Motion scale: declared reference outside [0.08, 0.9]');
 return {reference,length};
}
