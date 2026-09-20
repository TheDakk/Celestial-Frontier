/** Candidate-only painter projection; original source and accepted masters stay unchanged. */
export function openGapeCandidate(source){
 const changes=[
  ['project(cw*.50*clawK,cw*.10*clawK),project(cw*.62*clawK,-cw*.02*clawK)','project(cw*.50*clawK,cw*.32*clawK),project(cw*.62*clawK,cw*.26*clawK)'],
  ['c.quadraticCurveTo(cw * 0.50 * clawK, cw * 0.10 * clawK, cw * 0.62 * clawK, -cw * 0.02 * clawK);','c.quadraticCurveTo(cw * 0.50 * clawK, cw * 0.32 * clawK, cw * 0.62 * clawK, cw * 0.26 * clawK);'],
 ];
 for(const [old,next]of changes){if(source.split(old).length!==2)throw Error('Q1 painter candidate source changed');source=source.replace(old,next);}return source;
}
