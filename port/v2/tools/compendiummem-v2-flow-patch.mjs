/* V2 mixed-owner worker controls and topology-derived native keyboard entry. */
export function flowPatch({collector,contract}) {
 const once=(s,a,b)=>{if(s.split(a).length!==2)throw new Error('v2 flow edit drift: '+a.slice(0,90));return s.replace(a,b)};
 contract=once(contract,'paintedFindings, paintedSettlementFindings, compendiumResources','paintedFindings, paintedSettlementFindings, compendiumResources, paintedErrorRows');
 collector=`import { keyboardEntryExpression, keyboardEntryPlan } from './painted.mjs';\n`+collector;
 const from=collector.indexOf('    for (let tabs = 0; tabs < 4; tabs++) {'),to=collector.indexOf('    assert(await evaluate(sessionId,',from);
 if(from<0||to<from)throw new Error('native entry boundary absent');
 collector=collector.slice(0,from)+`    const entryInventory = await evaluate(sessionId, keyboardEntryExpression(), 'keyboard entry inventory');
    const entryPlan = keyboardEntryPlan(entryInventory, targets.first);
    for (const expected of entryPlan) {
      await key(sessionId, 'Tab', 'Tab');
      const observed = await evaluate(sessionId, keyboardEntryExpression(), 'keyboard entry step');
      assert(observed?.active === expected, profile + ': native Tab diverged from observed entry inventory');
    }
`+collector.slice(to);
 // Raw sibling evidence appears on pre-arm, publication and recovery carriers.
 collector=once(collector,'return `art:{cacheLimit:a.limits.cacheEntries,','return `paintedArt:d.paintedArt,art:{cacheLimit:a.limits.cacheEntries,');
 contract=once(contract,"'planetsideDistinctVisualKeys', 'cachedKeys', 'art',","'planetsideDistinctVisualKeys', 'cachedKeys', 'art', 'paintedArt',");
 contract=once(contract,"'stateCounts', 'rows', 'art',","'stateCounts', 'rows', 'art', 'paintedArt',");
 contract=once(contract,'|| observation.cachedKeys.length !== observation.art.cachedKeyCount) return false;','|| observation.cachedKeys.length !== observation.art.cachedKeyCount || paintedFindings(observation.paintedArt).length) return false;');
 contract=once(contract,'|| !validProducerErrorArtTelemetry(observation.art)) return false;','|| !validProducerErrorArtTelemetry(observation.art) || paintedFindings(observation.paintedArt).length) return false;');
 contract=once(contract,'&& observation.art.live.leases === observation.planetsideImageCount','&& observation.art.live.leases + (observation.paintedArt?.leases ?? 0) === observation.planetsideImageCount');
 contract=once(contract,".filter((key) => typeof key === 'string' && key.length > 0 && !cached.has(key))).size;",".filter((key) => typeof key === 'string' && key.length > 0 && !cached.has(key)\n      && !witness.publication.accepted.paintedArt?.keys.leasedThumbs.includes(key))).size;");
 const pub=contract.indexOf('function producerErrorPublicationWorkBound('),rec=contract.indexOf('function producerErrorRecoveryWorkBound('),end=contract.indexOf('export function producerErrorContained(',rec);
 let p=contract.slice(pub,rec),r=contract.slice(rec,end);
 p=once(p,'  const leaseAcquireDelta =',"  const painted = paintedErrorRows(publication); if (painted === null) return false;\n  const brokerRows = publication.mountedRowCount - painted.length;\n  const leaseAcquireDelta =");
 // Cardinalities constrain only this owner's actual job population.
 p=p.replaceAll('pre.art.live.leases + publication.mountedRowCount','pre.art.live.leases + brokerRows').replaceAll('=== publication.mountedRowCount','=== brokerRows');
 r=once(r,'  const leaseAcquireDelta =',"  const painted = paintedErrorRows(recovery); if (painted === null) return false;\n  const brokerRows = recovery.mountedRowCount - painted.length;\n  const leaseAcquireDelta =");
 r=r.replaceAll('pre.art.live.leases + recovery.mountedRowCount','pre.art.live.leases + brokerRows').replaceAll('>= recovery.mountedRowCount +','>= brokerRows +');
 contract=contract.slice(0,pub)+p+r+contract.slice(end);
 contract=once(contract,'&& row === publication.rows[0] && row.index === 0','&& row === publication.rows.find(item => !publication.paintedArt?.keys.leasedThumbs.includes(item.visualKey))');
 contract=once(contract,": item.thumbState === 'ready' && item.cached === true",": item.thumbState === 'ready' && (item.cached === true || paintedErrorRows(publication)?.includes(item))");
 contract=once(contract, '&& row.naturalWidth === 132 && row.naturalHeight === 132 && row.cached === true);', '&& row.naturalWidth === 132 && row.naturalHeight === 132 && (row.cached === true || paintedErrorRows(recovery)?.includes(row)));');
 contract=once(contract, '&& pre.art.live.leases === pre.planetsideImageCount', '&& pre.art.live.leases + (pre.paintedArt?.leases ?? 0) === pre.planetsideImageCount');
 contract=once(contract, '&& !pre.cachedKeys.includes(publication.rows[0]?.visualKey);', '&& !pre.cachedKeys.includes(publication.rows.find(row => !publication.paintedArt?.keys.leasedThumbs.includes(row.visualKey))?.visualKey);');
 // Dedupe is measured from actual cache/pending hits in both owners, separately.
 const dedupe='`window.__CF_SLICE__.api.compendiumDiagnostics().art.totals.dedupeHits`';
 if(collector.split(dedupe).length!==3)throw new Error('dedupe calls drift');
 collector=collector.replaceAll(dedupe,'`(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();return d.art.totals.dedupeHits+(d.paintedArt?.totals.dedupeHits??0)})()`');
 return {collector,contract};
}
