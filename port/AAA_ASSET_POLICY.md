# Audiovisual pilot — asset and source policy

Policy set **2026-09-04, before pilot rendering or measurement**. This is a campaign
delivery policy, not a claim that the current PWA enforces these limits.

## Offline ceilings

- One complete installed pack: **128 MiB = 134,217,728 bytes maximum**.
- Retained pack payload during an update: **256 MiB = 268,435,456 bytes maximum**,
  counting active, candidate, rollback and client-pinned builds together. No uncounted
  optional-media cache. The steady installed pack returns to the 128 MiB limit.
- Count the sum of actual uncompressed response-body bytes retained in game-owned
  Cache Storage: shell/JavaScript/CSS/fonts/icons/textures/audio/content, counting duplicated
  responses in different caches each time. Transfer compression is not this ruler.
  HTTP/browser metadata, browser-managed caches and IndexedDB saves are distinct; these
  payload ceilings are not a claim about all storage the OS attributes to the app.
- Decoded texture/audio memory and GPU allocations remain subject to the existing runtime
  budgets and are measured separately. A small download is not low decoded memory.
- The pilot reserves these ceilings now. Before shipping media, inspect existing asset/cache
  ownership and enforce admission with the smallest appropriate product change. If pinned
  clients plus an incoming pack would exceed 256 MiB, defer/refuse that update and explain it;
  never discard protected saves or assets required by active clients to meet the number.
- No global numeric-budget relaxation and no CI/budget-policy edits. Any failure of the proposed
  pack policy is reported; changing a ceiling requires Nick's explicit decision.

## Installed-PWA promise

Promise offline play **after installation and successful completion of the complete pack**,
while its data remains retained. Ordinary Safari browsing is not the offline acceptance target.
Installation does not guarantee permanent retention: storage pressure, eviction or user clearing
can remove cached content. Report offline readiness truthfully; recovery may require reconnecting
and downloading again. Never promise recovery of an unexported save after the browser deletes it.
The existing export/recovery protections remain required.

## Editable source storage

- `.blend`, `.rpp`, editable patches, source recordings and lossless WAV masters stay outside
  the public Git repository. Only optimized distributable assets plus small integration code,
  license records, asset/provenance indexes and documentation enter Git. **No Git LFS.**
- Maintain a SHA-256 manifest with relative paths, lengths, tool/plugin versions, render recipe
  and derivation links to each shipped output. Verify the working and backup bytes before calling
  a source backed up. Retain at least one separate backup copy; two folders on one disk are not
  an independent failure domain. Sync presence alone is not proof of remote recoverability.
  **Nick's 2026-09-05 cloud-backup rule:** after upload completes, force eviction/download of
  the destination copy and verify every restored file plus its archive against the frozen
  checksums. Retain timestamps/status evidence and a scratch-only truncated-file negative
  control. A secondary copy remains unverified until it completes the same proof.
- Local working root and backup destination must be recorded in the private source inventory.
  Cloud upload awaits Nick's selection/authorization of that destination. Until verified, sources
  are marked `backup-pending` and cannot be the sole basis of a completed deliverable.
- Do not publish private absolute paths, credentials or licensed editable assets into public
  manifests. Use logical source IDs and hashes; keep private location mappings outside Git.
- Preserve original masters, relative project dependencies and reproducible export scripts;
  never overwrite the only master with a compressed output.
- Confirm redistribution rights separately for game outputs and a public source repository.
  No purchases or third-party subscription is authorized.

## Scope boundary

Phase 0/1 Batches A–D only. Eight body plans at 132/300/440 in static and animated modes;
unfaithful families retain the protected static portrait and remain incomplete. Top bar/dock/rails
leads Phase 2 only after pilot approval. Claude owns CI/budget policy on `anthropic/windows`.
