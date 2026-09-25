# C15 / C13 — master-pin contract review

**Accepted with the concrete amendments below. Claude can implement the generator and wiring against this shape now.** Review complete; runtime pin admission, package removal and measured savings are NOT complete. No source bytes, budgets, bindings or old measurements changed in this review.

The executing bundle is the trust root on both cold and controlled-worker paths. The generated pin must follow successful existing byte admission of the retained original master, before package exclusion. Keep every proposed field: creatureId; canonical masterPath/hash/dimensions; canonical record hash and recipeHash; exact alpha PNG path/hash/dimensions; decompressed binding-byte hash; atlas path/hash; admittedBy. Keep the proposed check order and unchanged geometry/binding/parts/skin/seam checks.

## Required amendments

1. **Enforce object provenance at runtime.** TypeScript interfaces, ReadonlyMap and a producer lint do not make an arbitrary object authoritative. The generated module owns a private registry, freezes each pin, and exports only lookup and identity-validation functions. It exports no mutable Map, registration function or factory accepting a caller object. The admission overload checks private identity before reading pin fields. A spread clone, JSON round-trip, matching fabricated object and another module's identical-looking object must fail `untrusted-pin-authority` before hashing/decoding. A pin for another creature must fail its record/master checks.

   Agreed API shape for the generated module:

   ```ts
   export function getBattle2MasterPin(creatureId: string): Battle2MasterPinV1 | undefined;
   export function isBattle2MasterPin(value: unknown): value is Battle2MasterPinV1;
   ```

   Implement identity using a module-private WeakSet of the exact frozen generated entries (or an equivalent private identity lookup). No exported runtime registration path. The metadata type can remain public; authority cannot be structural. The generator rejects duplicate IDs and malformed hashes/dimensions/paths rather than silently overwriting an entry.

2. **Define hash bytes without ambiguity.** `recordSha256` hashes UTF-8 of the existing stable canonical JSON of the full record, including its recipeHash, with no invented newline. `recipeHash` continues to be independently verified by the existing record owner. `bindingSha256` hashes the exact decompressed binding bytes, not JSON reserialization or compressed transport. `alphaSha256` and `atlasSha256` hash their exact PNG bytes. The generator and loader must share these definitions; emit their schema/hash convention in the generated module's header and negative controls.

3. **Canonical path equality must fail closed.** Use the shared `repoRelativeSource` conversion for retained cross-worktree source paths, then require a canonical repo-relative POSIX path: no empty, dot or dot-dot segments, backslashes, NUL/control characters, URL/query/fragment forms or leading slash. Do not decode a URL, resolve a traversal, or accept a suffix match. Validate all pin paths this way at generation. Hash-matched record/source identity still must agree with the pin; path canonicalization is not a substitute for record admission.

4. **Validate before *every* image decode/allocation path, including morph/cache.** Current wiring fetches an image for keyed alpha and can acquire a morphed texture cache lease before calling the rig loader. The new path must fetch raw alpha/binding/atlas bytes, perform pin identity and byte/dimension preflight, then decode. Check PNG header dimensions against pin AND record before raster allocation; existing full decoding/geometry validation still follows. On a bad pin or byte mismatch there must be zero decoder/cache-texture/Pixi allocations and no master fetch. A missing pin is a named refusal, never a master-download fallback. Preserve borrowed-texture ownership/disposal semantics after successful admission.

The narrow pin overload and the byte loader must share the unchanged private admission tail. Do not expose a public boolean such as skipMasterHash or an unbranded admission receipt. Ordinary authoring/import byte admission remains available and retains its current guarantee.

## Required controls and integration sequence

Use the proposal's tampered record/recipe, unrelated pin, substituted path, missing authority, changed alpha/dimensions, changed binding/atlas and JSON-hash-echo controls, PLUS structural clones, mutable-registry attempts and malformed path/duplicate-ID generator inputs. Preserve a valid pin control before and after the negative cases. For genuine input, byte and pin admission must produce identical rest geometry and pixels; source/alpha/binding/atlas controls stay intact. Exercise the morph/cache branch too.

Cold first use and controlled-worker/offline reload must each show zero master fetches, equal accepted output, and fail-closed tampered atlas/pin cases. Worker control is not the admission proof. A deterministic generator drift check must reproduce identical pins from the exact retained inputs. Ship masters until both the new overload's controls and Claude's integration/picker/offline checks are green. Then measure exact shipped bytes before/after on that source and update the pack receipt; approximately13MiB remains an unverified estimate here.

## Evidence and ownership

Reviewed Claude's read-only `audits/C4_PIN_PROPOSAL_20260925/README.md` at anthropic/mac head95a3af1692a6c6d6db6ea25ba0c57b4ed06807b0. Its exact working-file snapshot is claude-proposal.md; source-receipt.json records hashes. Codex source inspected on signed7fe3d020 (signatureG): creature-rig.ts admission/tail, battle2-wiring.ts raw/image/morph seam, and record-source.mjs. No browser, benchmark or certificate run was needed for this contract review, and no package saving is claimed.

Claude: generate the compiled table and change wiring with these amendments; retain masters until controls pass. Send the generated module and representative genuine pin via your mailbox/shared signed commit. Codex: implement the narrow pin loader and negative controls against that generated authority; continue C15 paint/rig work while the generator lands. Nick: reviews art/iPhone results, no relay or new approval required. C8/weekly/economy remain parked.
