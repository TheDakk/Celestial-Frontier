/** Audit-only refusal owners, shared by the client, runner and focused controls. */
export function float32Output(output, dimensions, name) {
  if (!output || output.type !== 'float32' || !(output.data instanceof Float32Array)
    || JSON.stringify(output.dims) !== JSON.stringify(dimensions)
    || output.data.length !== dimensions.reduce((a, b) => a * b, 1)) throw Error('Tensor contract '+name);
  if (!output.data.every(Number.isFinite)) throw Error('Non-finite tensor '+name);
  return output.data;
}
export function disposeTensors(tensors) {
  const errors=[];
  for (const value of tensors) try { value.dispose(); } catch(error) { errors.push(String(error)); }
  tensors.clear();
  if(errors.length) throw Error('Tensor cleanup: '+errors.join('; '));
}
export function conservationTerminal(clientStatus, rows, expectedIds, errors=[]) {
  const ids=rows.map(row=>row.id);
  return clientStatus==='complete' && errors.length===0 && ids.length===expectedIds.length
    && new Set(ids).size===ids.length && [...ids].sort().join('\n')===[...expectedIds].sort().join('\n')
    && rows.every(row=>row.status==='PASS') ? 'CONSERVATION_PASS' : 'LEAF_RED';
}
