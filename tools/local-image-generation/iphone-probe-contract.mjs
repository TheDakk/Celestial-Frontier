/** Physical target admission; never silently fall back to Mac, iPad or simulator. */
export function admitPhysicalPhone(cap){
 if(cap?.platformName!=='iOS'||cap['safari:deviceType']!=='iPhone'||cap['safari:useSimulator']!==false||cap['safari:platformVersion']!=='26.6.2'||typeof cap['safari:deviceUDID']!=='string'||!cap['safari:deviceUDID'])throw Error('Wrong physical device');
 return cap;
}
