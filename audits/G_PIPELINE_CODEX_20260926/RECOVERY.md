# Parked gameplay preservation — 2026-09-26

No committed work was erased by the remote branch cleanup. The signed WIP commit
cf1b9a7843200ecc281c5113b4139909dc0e3a29 and documentation predecessor
5e45a9043f97f7fd99b8abd7009e9b592923a8dc remain in the shared object store, protected
by local tag archive/openai-parked-gameplay-20260904. Neither exact commit is an
ancestor of openai/mac; that is not equivalent to its features being absent.

The signed Batch4 recovery disposition (`audits/BATCH4_OVERNIGHT_REPORT_20260905.md`,
Signed WIP disposition) explicitly recovered Starter bioscan, descent/wave-offs,
Paragons, exact-instance progression and mature Atlas individually. It deliberately
left Weekly lifecycle, Forge Training and living portrait preview parked. Weekly
lifecycle has since been implemented (C10/C24); the current generated-creature pipeline
is the active graphics direction, not proof every old preview interaction was recovered.
Forge Training and any still-useful preview behavior need a named disposition later.
Do not apply the whole stale WIP over current code, imports, Guide or save policy.

`parked-file-inventory.json` inventories all87 WIP paths against the present working
tree:22 byte-identical,9 absent,56 changed. File absence alone does not prove feature
loss (descent was recovered under a different owner; Weekly tests moved).
The original roadmap was archived verbatim, not deleted, but the lean live handoff
omitted this parked-work pointer. That pointer is restored now.

The accompanying191KiB Git bundle preserves both original commits and their objects.
`git bundle verify` passed. It requires the shared ancestor53770697f6613da3ba469868dae24cf0edc3f58d,
which is already in the Mac lane's history. Recovery, if ever needed in a clone:

```sh
git bundle verify audits/G_PIPELINE_CODEX_20260926/parked-gameplay-recovery.bundle
git fetch audits/G_PIPELINE_CODEX_20260926/parked-gameplay-recovery.bundle refs/tags/archive/openai-parked-gameplay-20260904:refs/tags/archive/openai-parked-gameplay-20260904
```

This preserves recovery on the Mac branch without recreating a remote gameplay branch.
Bundle SHA256: a444b600721ca437243d18b87f20abede769804f0d04eed6d4eca65763d05286
