/** Independent encoded-media duration admission, not the animation's own timer. */
export function requireTenSecondMedia(seconds){
  if(!Number.isFinite(seconds)||seconds<10||seconds>10.75)throw Error('Encoded capture must contain the complete ten-second timeline (up to 750ms recorder padding)');
  return seconds;
}

/** Supply live frames until the recorder acknowledges start. Waiting for its
 * start event before feeding the canvas can deadlock metadata acquisition. */
export function primeRecorder({started,paint,requestFrame,schedule,now,timeoutMs=5000}){
  const deadline=now()+timeoutMs;
  return new Promise((resolve,reject)=>{
    const tick=()=>{
      if(started()){resolve();return;}
      if(now()>=deadline){reject(Error('Recorder start deadline while feeding frames'));return;}
      paint();requestFrame();schedule(tick);
    };
    schedule(tick);
  });
}
