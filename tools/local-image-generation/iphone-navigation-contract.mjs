/** A WebDriver navigation return is not proof that the probe page committed. */
export function admitsIphoneProbePage(page,origin){
 return page?.url===origin+'/'&&page.secureContext===true&&page.crossOriginIsolated===true
  &&page.readyState==='complete'&&page.probeClient===true;
}
