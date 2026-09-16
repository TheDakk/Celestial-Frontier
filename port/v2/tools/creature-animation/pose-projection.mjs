/** Convert canonical backward-pointing bird-wing rotations into the authored
 * image plane. This changes coordinate basis, never clip timing or anatomy. */
export function poseProjectionSigns(record){
 if(record.projection===undefined)return {};
 if(record.projection!=='frontal-wings'||record.template.id!=='biped-bird')throw Error('Pose projection: unsupported source view');
 const signs={};for(const side of['Near','Far']){const a=record.landmarks['wing'+side+'Root'],b=record.landmarks['wing'+side+'Tip'];if(!a||!b||Math.abs(b[0]-a[0])<.04)throw Error('Pose projection: wing has no lateral span');const sign=b[0]>a[0]?-1:1;signs['wing'+side+'Root']=sign;signs['wing'+side+'Tip']=sign;}
 if(signs.wingNearRoot===signs.wingFarRoot)throw Error('Pose projection: frontal wings must oppose');return signs;
}
export function projectTemplateLimits(template,record){const signs=poseProjectionSigns(record);return {...template,limitsDeg:Object.fromEntries(Object.entries(template.limitsDeg).map(([j,l])=>[j,signs[j]===-1?{min:-l.max,max:-l.min}:l]))};}
