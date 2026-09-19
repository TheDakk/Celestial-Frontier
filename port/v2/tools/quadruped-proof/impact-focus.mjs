/** Presentation-only impact exposure. The compiled turn owns all timing,
 * outcomes and body motion; this projection adds no clock or creature curves. */
export function resolveImpactFocus({flash,targetSide,outcome,reducedMotion=false}){
 if(!Number.isFinite(flash)||flash<0||flash>1||!['left','right'].includes(targetSide)||!['hit','miss','dodge'].includes(outcome)||typeof reducedMotion!=='boolean')throw Error('Invalid impact presentation');
 const strength=outcome==='hit'&&!reducedMotion?flash:0;
 return {sceneAlpha:strength*.10,leftBrightness:1+(targetSide==='left'?.45*strength:0),rightBrightness:1+(targetSide==='right'?.45*strength:0)};
}
