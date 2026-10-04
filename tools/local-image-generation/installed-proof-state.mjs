/** Initial UI before its RAF is pending, not proof that an async install failed. */
export function installedProofState(text,started){
 if(text.includes('Model ready. Land to finish a painting.'))return 'ready';
 if(text.includes('Pause model preparation')||text.includes('Model downloading')||text.includes('Model verifying'))return 'working';
 return started?'failed':'pending';
}

/** Never accept the departing document as evidence of restoration after reload. */
export function retainedReloadReady(state,originalId,oldOrigin,currentOrigin){
 return Number.isFinite(oldOrigin)&&Number.isFinite(currentOrigin)&&currentOrigin!==oldOrigin
  &&state?.localAi?.originalId===originalId&&state.localAi.crossfading===false&&state.localAi.alpha===1;
}
