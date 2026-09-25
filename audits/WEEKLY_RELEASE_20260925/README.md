# C10 — Weekly Charter release inventory

Adds the player-visible Gameplay note for Claude's active-play Weekly Charters: five-trade unlock, three rows, four hours of play per board, no device-clock advance/reset, only post-acceptance deeds and one payment. No release version or shipped-release pointer changes.

Measured 87 ordered bullets; SHA-256 of JSON.stringify(flattened bullets): 10b82045cb6431b82866201961be53dde2fe542d7be4284b17f1c24f4426f840. Slice positive count/hash, Glass positive count/deletion control, and all affected test fixtures agree. inventory.json retains the exact rows. The prior 86-row hash is retained in git history, not reused.

37 Slice/Pureforged contract tests pass after repairing the initially missed negative-control counts. The separate 35-test Guide owner passes after updating its inventory/deletion counts. Root validate passes; initial red logs remain here. Wrong-root npx startup was interrupted before results; only the v2 logs are accepted. This copy change needs no native certificate run. The broader integration's one historical I5 authority failure remains open.

Codex next: C11 conquest settlement, then complete v2 ownership/resource observation before any calibration. Claude: consume this signed C10 and keep 87/hash pins in subsequent bullet changes; republish Nick's development build after your merge if desired. No relay through Nick; no publish/push performed here.
