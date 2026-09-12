/** Initial UI before its RAF is pending, not proof that an async install failed. */
export function installedProofState(text,started){
 if(text.includes('Model ready. Land to finish a painting.'))return 'ready';
 if(text.includes('Pause model preparation')||text.includes('Model downloading')||text.includes('Model verifying'))return 'working';
 return started?'failed':'pending';
}
