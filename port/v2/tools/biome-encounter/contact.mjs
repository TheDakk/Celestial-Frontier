/** These admitted masters face +X in source space. Mirroring changes the screen
 * transform, never which source end is the mouth. Use the published jaw mesh. */
export function mouthOffset(jaw,rootX,scale,direction){
 if(!jaw?.length||jaw.length%2||![rootX,scale,...jaw].every(Number.isFinite)||scale<=0||![-1,1].includes(direction))throw Error('Encounter: invalid mouth geometry');
 let x=-Infinity;for(let i=0;i<jaw.length;i+=2)x=Math.max(x,jaw[i]);
 return rootX+x*scale*direction;
}
/** Contact comes from the admitted weapon part, not every attack's head. */
export function partTip(vertices){
 if(!vertices?.length||vertices.length%2||!Array.from(vertices).every(Number.isFinite))throw Error('Encounter: absent painted weapon');
 let x=-Infinity,y=0;for(let i=0;i<vertices.length;i+=2)if(vertices[i]>x){x=vertices[i];y=vertices[i+1];}
 return{x,y};
}
