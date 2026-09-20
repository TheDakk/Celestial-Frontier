/** Every declared action gets its full duration plus transition margins. The
 * ordered film inventory is explicit, including faint and all locomotion rows. */
export function createFullRowSchedule(timelines){let at=1000;const rows=[];for(const [id,tl]of Object.entries(timelines)){if(!id||!Number.isFinite(tl.durationMs)||tl.durationMs<=0)throw Error('Review schedule: invalid action');const duration=Math.max(600,tl.durationMs+280);rows.push({id,startMs:at,endMs:at+duration});at+=duration;}if(!rows.length)throw Error('Review schedule: empty');return{rows,durationMs:Math.max(10000,at+1000)};}
