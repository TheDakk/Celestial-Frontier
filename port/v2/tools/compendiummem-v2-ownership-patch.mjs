/* Counted v2 observation edits; v1 files/history remain immutable. */
export function ownershipPatch({ collector, contract, helperUrl }) {
  const once = (source, before, after) => {
    if (source.split(before).length !== 2) throw new Error('v2 ownership edit drift: ' + before.slice(0,80));
    return source.replace(before,after);
  };
  contract = `import { paintedFindings, paintedSettlementFindings, compendiumResources } from ${JSON.stringify(helperUrl)};\n` + contract;
  contract = once(contract, "'ownership', 'diagnostic', 'images', 'art', 'lazyArt', 'worker', 'broker', 'page',", "'ownership', 'diagnostic', 'images', 'art', 'lazyArt', 'worker', 'broker', 'page', 'paintedArt', 'ownerKeys',");
  contract = once(contract, "'srcPresent', 'complete', 'naturalWidth', 'naturalHeight',", "'srcPresent', 'complete', 'naturalWidth', 'naturalHeight', 'visualKey',");
  contract = once(contract, '  const shapeErrors = thumbSettlementObservationShapeErrors(observation);', '  const shapeErrors = thumbSettlementObservationShapeErrors(observation);\n  shapeErrors.push(...paintedFindings(observation?.paintedArt));');
  const begin = '  const allLeasedIndicesPresent = leasedIndices.every((index) =>';
  const end = '  images.forEach((image, index) => {';
  const from = contract.indexOf(begin), to = contract.indexOf(end,from);
  if (from < 0 || to < 0) throw new Error('ownership boundary absent');
  contract = contract.slice(0,from) + `  pending.push(...paintedSettlementFindings(observation));
  if (new Set(images.map(image => image.visualKey)).size !== images.length) pending.push('raw visual keys non-distinct');
` + contract.slice(to);
  contract = once(contract, 'function art(snapshot) { return snapshot?.diagnostics?.art || null; }', 'function art(snapshot) { return compendiumResources(snapshot); }');
  contract = once(contract, 'const expectedDecodedBytes = expectedDecodedPixels * 4;', 'const expectedDecodedBytes = expectedDecodedPixels * 4 + (a?.residentBytes ?? 0);');
  // Preserve actual broker arrays/indices; retain the painted sibling separately.
  collector = once(collector, 'diagnostic:{panelMode:text(d?.panel?.mode,32)', 'paintedArt:d?.paintedArt,ownerKeys:{brokerLeased:leasedKeys,brokerCached:cachedKeys},\n      diagnostic:{panelMode:text(d?.panel?.mode,32)');
  collector = once(collector, 'visualKeyLength:visualKey===null?null:count(visualKey.length),', 'visualKey,visualKeyLength:visualKey===null?null:count(visualKey.length),');
  // These lifecycle receipts measure total leases, without rewriting art.
  collector = once(collector, "&&observation.art.live.leases===observation.planetsideImageCount", "&&observation.art.live.leases+(d.paintedArt?.leases??0)===observation.planetsideImageCount");
  collector = once(collector, "const closeBefore = await evaluate(sessionId, `(()=>{const a=window.__CF_SLICE__.api.compendiumDiagnostics().art;\n      return {leases:a.live.leases,releases:a.totals.releases}})()`, 'pre-close ownership');", "const closeBefore = await evaluate(sessionId, `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics(),a=d.art;\n      return {leases:a.live.leases+(d.paintedArt?.leases??0),releases:a.totals.releases}})()`, 'pre-close ownership');");
  collector = once(collector, "const closeAfter = await evaluate(sessionId, `(()=>{const a=window.__CF_SLICE__.api.compendiumDiagnostics().art;\n      return {leases:a.live.leases,releases:a.totals.releases}})()`, 'post-close ownership');", "const closeAfter = await evaluate(sessionId, `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics(),a=d.art;\n      return {leases:a.live.leases+(d.paintedArt?.leases??0),releases:a.totals.releases}})()`, 'post-close ownership');");
  collector = once(collector, "display==='none'&&d.art.live.leases===0", "display==='none'&&d.art.live.leases===0&&(d.paintedArt?.leases??0)===0");
  collector = once(collector, 'liveLeases:d.art.live.leases,logicalIds:d.surfaces.planetside.logicalIds,', 'liveLeases:d.art.live.leases+(d.paintedArt?.leases??0),logicalIds:d.surfaces.planetside.logicalIds,');
  return { collector, contract };
}
