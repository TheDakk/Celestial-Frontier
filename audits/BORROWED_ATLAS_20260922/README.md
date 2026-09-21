# Borrowed atlas ownership

Nick authorized an additive caller-owned atlas option for Claude's morph cache. loadCreatureRigV1 now accepts an optional seventh argument `{borrowedAtlas:true}` after the existing custom decoder. The decoder returns the cache's Texture. Omitted/false preserves default ownership. Admission hashes, dimensions, sampling guards, mesh/pose behavior and solver remain unchanged.

Ownership is captured at load. Rig disposal still releases containers, mesh geometry and per-part Texture wrappers; it does not destroy a borrowed atlas or its TextureSource. A decoded-dimension refusal also leaves a borrowed texture intact. The caller releases the shared texture/source only after all borrowing rigs are disposed. Do not set borrowedAtlas for a default decoder whose result the caller cannot retain. No cache or morph pipeline is implemented here.

```ts
const rig = await loadCreatureRigV1(record, binding, master, alpha, atlasBytes,
  async () => cachedAtlasTexture, {borrowedAtlas: true});
rig.dispose(); // cachedAtlasTexture and its source remain alive
// Cache eviction after every borrowing rig is disposed:
cachedAtlasTexture.destroy(true);
```

The single both-way unit control reproduced the old disposal bug before the patch (negative-before.log). After: ownership-control.log passes with two sharing rigs, caller cleanup, owned default cleanup, captured options and both dimension-refusal ownership modes. App typecheck passes (empty typecheck.log, exit 0). Root validation passes (validate.log). One ordered S2 sweep on signed producer `5b6f89c7b0d9a2e35f4bc5ed57df33b5eaf363ac` passes: all six complete receipts and decompressed support samples are byte-identical to the prior packet, with exact rest and presentation passing. [S2 ledger and hashes](S2_LEDGER.md). No repeated batteries or solver changes. Markings are in [their separate packet](../MORPH_CRAB_MARKINGS_20260922/README.md).

Signed and verified commits: marking packet `d8a1a8f9941df45241e3ac0bd459fbc1b85932e8`; loader producer `5b6f89c7b0d9a2e35f4bc5ed57df33b5eaf363ac`. [File and producer hashes](hashes.json) retain the completed evidence. Earlier signing refusals remain in the marking packet. No fetch/sync/push/PR/merge/release/deploy. Codex holds after this packet; Claude consumes the borrowed option for its morph texture cache and integrates the master-space marking masks; Nick reviews the six-mask sheet.
