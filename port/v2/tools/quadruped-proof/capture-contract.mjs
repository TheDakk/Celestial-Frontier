/** Independent encoded-media duration admission, not the animation's own timer. */
export function requireTenSecondMedia(seconds){
  if(!Number.isFinite(seconds)||seconds<10||seconds>10.75)throw Error('Encoded capture must contain the complete ten-second timeline (up to 750ms recorder padding)');
  return seconds;
}
