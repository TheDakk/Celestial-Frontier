/** Nonloop contact travel from the same compiled root keys as animation.
 * Key values are body lengths; outputs are normalized source coordinates.
 * Each authored interval owns one signed step, including zero-travel holds.
 * The contact owner chooses foot easing; body displacement stays linear. */
export interface ContactTravelKey {readonly ms:number;readonly value:number;}
export interface ContactTravelSample {readonly base:number;readonly stride:number;readonly progress:number;}
export function createContactTravel(keys:readonly ContactTravelKey[],bodyLength:number){
 if(!Number.isFinite(bodyLength)||bodyLength<=0||!keys.length)throw Error('Contact travel: invalid keys/body length');
 const path:{ms:number;value:number}[]=[{ms:0,value:0}];
 for(let i=0;i<keys.length;i++){
  const key=keys[i]!;
  if(!Number.isFinite(key.ms)||!Number.isFinite(key.value)||key.ms<0)throw Error('Contact travel: invalid key');
  if(i===0&&key.ms===0){if(key.value!==0)throw Error('Contact travel: nonzero rest');continue;}
  const previous=path[path.length-1]!,value=key.value*bodyLength;
  if(key.ms<=previous.ms||!Number.isFinite(value)||!Number.isFinite(value-previous.value))throw Error('Contact travel: invalid ordered displacement');
  path.push({ms:key.ms,value});
 }
 const last=path[path.length-1]!;
 return Object.freeze({sample(elapsedMs:number):ContactTravelSample{
  if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw Error('Contact travel: invalid time');
  for(let i=1;i<path.length;i++){
   const a=path[i-1]!,b=path[i]!;
   if(elapsedMs<b.ms)return {base:a.value,stride:b.value-a.value,progress:(elapsedMs-a.ms)/(b.ms-a.ms)};
  }
  // No modulo: secondary animation may continue after the final body key.
  return {base:last.value,stride:0,progress:1};
 }});
}
